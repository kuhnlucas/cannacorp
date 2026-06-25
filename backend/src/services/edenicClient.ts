/**
 * Edenic Integration Client
 *
 * Documentation source: Edenic public API (https://api.edenic.io)
 * Auth scheme: `Authorization: <EDENIC_API_KEY>` header (API key only — no secret required)
 *
 * - Reads ALL config from config/index.ts (never directly from process.env).
 * - Credentials are NEVER logged.
 * - Fails at call time if configuration is missing, not at module import.
 * - Lazy axios instance: backend starts normally when Edenic is not configured.
 *
 * Rate limits (per Edenic API docs):
 *   - Telemetry endpoints: 1 call/minute per device.
 *   - History: max 500 points per call, minimum interval 60 000 ms (1 min).
 * TODO: Add a per-device request queue/throttle if polling in production.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EdenicTelemetryKey =
  | 'ph'
  | 'electrical_conductivity'
  | 'temperature';

export type EdenicTelemetryAgg =
  | 'AVG'
  | 'COUNT'
  | 'MAX'
  | 'MIN'
  | 'NONE'
  | 'SUM';

export type EdenicOrderBy = 'ASC' | 'DESC';

export interface EdenicDevice {
  id: string;
  name: string;
  label?: string;
  gateway?: boolean;
  sortOrder?: number;
  deviceTypeId?: string;
  organisationId?: string;
  deleted?: boolean;
  additionalInfo?: Record<string, unknown>;
}

export interface EdenicTelemetryPoint {
  ts: number;
  value: string;
}

export type EdenicTelemetryResponse = Partial<
  Record<EdenicTelemetryKey, EdenicTelemetryPoint[]>
>;

export interface EdenicGetLatestTelemetryOptions {
  keys?: EdenicTelemetryKey[];
}

export interface EdenicGetHistoryOptions {
  keys: EdenicTelemetryKey[];
  startTs: number;
  endTs: number;
  interval?: number;
  agg?: EdenicTelemetryAgg;
  orderBy?: EdenicOrderBy;
}

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

export interface EdenicError {
  type: 'config' | 'validation' | 'http' | 'timeout' | 'network' | 'unknown';
  message: string;
  status?: number;
}

/**
 * Normalizes any error from an Edenic call into a safe EdenicError.
 * Never exposes API key, headers, or stack traces.
 */
export function normalizeEdenicError(error: unknown): EdenicError {
  if (error instanceof Error) {
    // Config errors thrown by this module
    if (
      error.message.includes('EDENIC_BASE_URL') ||
      error.message.includes('EDENIC_API_KEY') ||
      error.message.includes('EDENIC_ORGANIZATION_ID') ||
      error.message.includes('not configured')
    ) {
      return { type: 'config', message: error.message };
    }

    // Validation errors thrown by domain functions
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('must not be') ||
      error.message.includes('must be a non-empty') ||
      error.message.includes('at least')
    ) {
      return { type: 'validation', message: error.message };
    }

    const axiosErr = error as AxiosError;
    if (axiosErr.isAxiosError) {
      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
        return { type: 'timeout', message: 'Edenic API request timed out' };
      }
      if (!axiosErr.response) {
        return { type: 'network', message: 'Edenic API is unreachable' };
      }
      return {
        type: 'http',
        message: `Edenic API returned status ${axiosErr.response.status}`,
        status: axiosErr.response.status,
      };
    }
  }

  return { type: 'unknown', message: 'Unexpected error calling Edenic API' };
}

// ---------------------------------------------------------------------------
// Internal: lazy client factory
// ---------------------------------------------------------------------------

let _client: AxiosInstance | null = null;

/**
 * Returns a configured axios instance.
 * Throws if EDENIC_BASE_URL is not set — no default URL.
 * @internal — use domain functions, not this directly in routes.
 */
function getClient(): AxiosInstance {
  if (!_client) {
    const baseURL = config.edenicBaseUrl;
    if (!baseURL) {
      throw new Error(
        'Edenic not configured: EDENIC_BASE_URL is required. Set it in your environment.',
      );
    }
    _client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
    });
  }
  return _client;
}

/**
 * Builds the Authorization header from config.
 * Throws if EDENIC_API_KEY is absent.
 * The returned object is NEVER logged.
 */
export function buildAuthHeaders(): Record<string, string> {
  const apiKey = config.edenicApiKey;
  if (!apiKey) {
    throw new Error(
      'Edenic credentials not configured. Set EDENIC_API_KEY.',
    );
  }
  return { Authorization: apiKey };
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if EDENIC_BASE_URL, EDENIC_API_KEY and EDENIC_ORGANIZATION_ID
 * are all present in config. Safe for conditional feature checks.
 * No HTTP request is made.
 */
export function isConfigured(): boolean {
  return !!(config.edenicBaseUrl && config.edenicApiKey && config.edenicOrganizationId);
}

/**
 * Validates all required Edenic config values.
 * Returns a structured result with a clear message.
 * No HTTP request is made — pure config check.
 */
export function validateConfiguration(): {
  valid: boolean;
  missing: string[];
  message: string;
} {
  const missing: string[] = [];
  if (!config.edenicBaseUrl) missing.push('EDENIC_BASE_URL');
  if (!config.edenicApiKey) missing.push('EDENIC_API_KEY');
  if (!config.edenicOrganizationId) missing.push('EDENIC_ORGANIZATION_ID');

  if (missing.length === 0) {
    return { valid: true, missing: [], message: 'Edenic configuration is complete' };
  }
  return {
    valid: false,
    missing,
    message: `Edenic configuration incomplete. Missing: ${missing.join(', ')}`,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Throws if EDENIC_ORGANIZATION_ID is absent. */
function requireOrganizationId(): string {
  const orgId = config.edenicOrganizationId;
  if (!orgId) {
    throw new Error('Edenic not configured: EDENIC_ORGANIZATION_ID is required.');
  }
  return orgId;
}

// ---------------------------------------------------------------------------
// Domain functions
// ---------------------------------------------------------------------------

/**
 * Lists all devices for the configured organization.
 * Endpoint: GET /api/v1/device/{organizationId}
 */
export async function getDevices(): Promise<EdenicDevice[]> {
  const orgId = requireOrganizationId();
  const client = getClient();
  const response = await client.get<EdenicDevice[]>(`/api/v1/device/${orgId}`);
  return response.data;
}

/**
 * Returns the latest telemetry reading for a device.
 * Endpoint: GET /api/v1/telemetry/{deviceId}
 *
 * NOTE: Edenic rate-limits this to 1 call/minute per device.
 * TODO: Add per-device throttle before using in polling scenarios.
 *
 * @param options.keys  Optional subset of telemetry keys to retrieve.
 */
export async function getLatestTelemetry(
  deviceId: string,
  options?: EdenicGetLatestTelemetryOptions,
): Promise<EdenicTelemetryResponse> {
  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
    throw new Error('deviceId is required and must be a non-empty string');
  }
  const client = getClient();
  const params: Record<string, string> = {};
  if (options?.keys && options.keys.length > 0) {
    params.keys = options.keys.join(',');
  }
  const response = await client.get<EdenicTelemetryResponse>(
    `/api/v1/telemetry/${deviceId}`,
    { params },
  );
  return response.data;
}

/**
 * Returns historical telemetry for a device within a time range.
 * Endpoint: GET /api/v1/telemetry/{deviceId}
 *
 * Edenic limits: max 500 points per call, minimum interval 60 000 ms (1 min).
 * NOTE: Edenic rate-limits this to 1 call/minute per device.
 * TODO: Add per-device throttle before using in polling scenarios.
 *
 * @param options.keys      Required telemetry keys.
 * @param options.startTs   Start timestamp in Unix milliseconds.
 * @param options.endTs     End timestamp in Unix milliseconds.
 * @param options.interval  Aggregation interval in ms (min 60 000).
 * @param options.agg       Aggregation function.
 * @param options.orderBy   Result sort order.
 */
export async function getTelemetryHistory(
  deviceId: string,
  options: EdenicGetHistoryOptions,
): Promise<EdenicTelemetryResponse> {
  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
    throw new Error('deviceId is required and must be a non-empty string');
  }
  if (!options.keys || options.keys.length === 0) {
    throw new Error('keys is required and must not be empty for telemetry history');
  }
  if (options.startTs === undefined || options.endTs === undefined) {
    throw new Error('startTs and endTs are required for telemetry history');
  }
  if (options.endTs <= options.startTs) {
    throw new Error('endTs must be greater than startTs');
  }
  if (options.interval !== undefined && options.interval < 60_000) {
    throw new Error('interval must be at least 60000 ms (1 minute) per Edenic API limits');
  }

  const client = getClient();
  const params: Record<string, string | number> = {
    keys: options.keys.join(','),
    startTs: options.startTs,
    endTs: options.endTs,
  };
  if (options.interval !== undefined) params.interval = options.interval;
  if (options.agg) params.agg = options.agg;
  if (options.orderBy) params.orderBy = options.orderBy;

  const response = await client.get<EdenicTelemetryResponse>(
    `/api/v1/telemetry/${deviceId}`,
    { params },
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Exposed for testing only
// ---------------------------------------------------------------------------

export { getClient as _getClient };

/**
 * Resets the internal axios instance.
 * Use in tests that need to mock axios without module-level side effects.
 * @internal
 */
export function _resetClientForTesting(): void {
  _client = null;
}

