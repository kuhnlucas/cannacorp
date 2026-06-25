import 'dotenv/config';
import express from 'express';
// Using a lightweight custom CORS middleware to avoid library behavior
// that turns disallowed origins into internal errors.
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, authenticateToken } from './middleware';
import config from './config';

import authRoutes from './routes/auth';
import tenantsRoutes from './routes/tenants';
import labsRoutes from './routes/labs';
import geneticsRoutes from './routes/genetics';
import batchesRoutes from './routes/batches';
import operationsRoutes from './routes/operations';
import monitoringRoutes from './routes/monitoring';
import dashboardRoutes from './routes/dashboard';
import sensorsRoutes from './routes/sensors';
import pulseGrowRoutes from './routes/pulseGrow';
import tuyaRoutes from './routes/tuya';
import tuyaMultiTenantRoutes from './routes/tuyaMultiTenant';
import edenicRoutes from './routes/edenic';

const app = express();
const PORT = config.port;

// Seguridad básica
app.set('trust proxy', 1); // respeta IP real detrás de proxies
app.use(helmet());

// Rate limit específico para login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, try again later.',
});

// Rate limit específico para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts, try again later.',
});

app.use(express.json());

// CORS configuration driven by config.allowedOrigins and NODE_ENV
const localDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:3000',
];

// Simple CORS middleware: sets CORS headers only when origin is allowed.
const allowed = config.allowedOrigins || [];
const isProduction = config.nodeEnv === 'production';
const originList = isProduction ? allowed : Array.from(new Set([...localDevOrigins, ...allowed]));

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  // Allow requests with no origin (curl, healthchecks, server-to-server)
  if (!origin) return next();

  const allowedHere = originList;
  if (!allowedHere || allowedHere.length === 0) {
    // In production an empty list means deny all origins — do nothing
    return next();
  }

  if (allowedHere.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      // Handle preflight: allow common methods and headers
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      const reqHeaders = req.headers['access-control-request-headers'];
      if (reqHeaders) {
        res.setHeader('Access-Control-Allow-Headers', String(reqHeaders));
        res.setHeader('Vary', 'Access-Control-Request-Headers');
      }
      res.statusCode = 204;
      return res.end();
    }
  }

  return next();
});

// Aplicar rate limit solo a login
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/genetics', geneticsRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sensors', sensorsRoutes);

app.use('/api/monitoring', monitoringRoutes);
app.use('/api/sensors/pulsegrow', pulseGrowRoutes);
// Disable legacy Tuya integration endpoints for safety and force use of multi-tenant routes
app.use('/api/integrations/tuya', (req, res) => {
  return res.status(410).json({ error: 'Legacy Tuya endpoint disabled. Use /api/tuya instead.' });
});
app.use('/api/tuya', tuyaMultiTenantRoutes); // New multi-tenant endpoints
app.use('/api/integrations/edenic', edenicRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
