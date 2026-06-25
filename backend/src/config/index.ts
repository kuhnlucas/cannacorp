// Central configuration module for backend
// Reads environment variables, validates required ones and exposes a typed config object.

type OptionalString = string | undefined;

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  (NODE_ENV === 'production' ? undefined : 'file:./dev.db');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID;
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const TUYA_REGION = process.env.TUYA_REGION || 'us';
const TUYA_BASE_URL = process.env.TUYA_BASE_URL;

const PULSE_GROW_API_URL = process.env.PULSE_GROW_API_URL || 'https://api.pulsegrow.com';
const PULSE_GROW_API_KEY = process.env.PULSE_GROW_API_KEY;

const EDENIC_BASE_URL = process.env.EDENIC_BASE_URL;
const EDENIC_API_KEY = process.env.EDENIC_API_KEY;
const EDENIC_API_SECRET = process.env.EDENIC_API_SECRET;

// Fail-fast for truly required secrets
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Set JWT_SECRET in your environment.');
}

if (NODE_ENV === 'production' && !DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production.');
}

export const config = {
  // Core
  jwtSecret: JWT_SECRET as string,
  databaseUrl: DATABASE_URL,
  nodeEnv: NODE_ENV,
  port: PORT,

  // Tuya
  tuyaClientId: TUYA_CLIENT_ID,
  tuyaClientSecret: TUYA_CLIENT_SECRET,
  tuyaRegion: TUYA_REGION,
  tuyaBaseUrl: TUYA_BASE_URL,

  // Pulse Grow
  pulseGrowApiUrl: PULSE_GROW_API_URL,
  pulseGrowApiKey: PULSE_GROW_API_KEY,

  // Edenic (prepared but not used yet)
  edenicBaseUrl: EDENIC_BASE_URL,
  edenicApiKey: EDENIC_API_KEY,
  edenicApiSecret: EDENIC_API_SECRET,

  // Helpers
  isTuyaConfigured(): boolean {
    return !!(this.tuyaClientId && this.tuyaClientSecret);
  },
  isPulseConfigured(): boolean {
    return !!this.pulseGrowApiKey;
  },
  isEdenicConfigured(): boolean {
    return !!(this.edenicApiKey && this.edenicApiSecret);
  },
};

export type Config = typeof config;

export default config;
