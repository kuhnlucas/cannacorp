/**
 * Edenic Integration Client
 *
 * - Reads ALL config from config/index.ts (never directly from process.env).
 * - Credentials and base URL are NEVER logged.
 * - Fails at call time if configuration is missing, not at module import.
 * - Uses a lazily created axios instance with explicit baseURL and timeout.
 *
 * STATUS: No Edenic API endpoints are documented in this repo.
 * No HTTP requests are made by this module until official docs are available.
 * Add domain functions (sensors, devices, etc.) once endpoints are confirmed.
 */

import axios, { AxiosInstance } from 'axios';
import config from '../config';

// Lazily created singleton — no axios.create() at import time
let _client: AxiosInstance | null = null;

/**
 * Returns a configured axios instance.
 * Throws if EDENIC_BASE_URL is not set — no invented default URL.
 * Called lazily so the backend starts normally when Edenic is not configured.
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return _client;
}

/**
 * Builds auth headers from config.
 * Throws if credentials are absent — callers must handle this.
 * The returned object is NEVER logged.
 */
export function buildAuthHeaders(): Record<string, string> {
  const apiKey = config.edenicApiKey;
  const apiSecret = config.edenicApiSecret;

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Edenic credentials not configured. Set EDENIC_API_KEY and EDENIC_API_SECRET.',
    );
  }

  return {
    'x-api-key': apiKey,
    'x-api-secret': apiSecret,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if EDENIC_BASE_URL, EDENIC_API_KEY and EDENIC_API_SECRET
 * are all present in config. Safe for conditional feature checks.
 * No HTTP request is made.
 */
export function isConfigured(): boolean {
  return !!config.edenicBaseUrl && config.isEdenicConfigured();
}

/**
 * Validates that all required Edenic config values are present.
 * Returns a structured result with a clear message for each missing field.
 * No HTTP request is made — pure config check.
 *
 * Use this in health-check routes or startup diagnostics once Edenic
 * integration is enabled.
 */
export function validateConfiguration(): {
  valid: boolean;
  missing: string[];
  message: string;
} {
  const missing: string[] = [];

  if (!config.edenicBaseUrl) missing.push('EDENIC_BASE_URL');
  if (!config.edenicApiKey) missing.push('EDENIC_API_KEY');
  if (!config.edenicApiSecret) missing.push('EDENIC_API_SECRET');

  if (missing.length === 0) {
    return { valid: true, missing: [], message: 'Edenic configuration is complete' };
  }

  return {
    valid: false,
    missing,
    message: `Edenic configuration incomplete. Missing: ${missing.join(', ')}`,
  };
}

/**
 * Exposes the lazily created axios instance for use in future domain functions.
 * Throws if EDENIC_BASE_URL is not configured.
 * @internal — consume via domain functions, not directly in routes.
 */
export { getClient as _getClient };

/**
 * Resets the internal axios instance.
 * Useful in tests that need to mock axios without module-level side effects.
 * @internal
 */
export function _resetClientForTesting(): void {
  _client = null;
}
