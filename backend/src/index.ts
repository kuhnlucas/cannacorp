import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, authenticateToken } from './middleware';

import authRoutes from './routes/auth';
import tenantsRoutes from './routes/tenants';
import labsRoutes from './routes/labs';
import geneticsRoutes from './routes/genetics';
import batchesRoutes from './routes/batches';
import operationsRoutes from './routes/operations';
import monitoringRoutes from './routes/monitoring';
import pulseGrowRoutes from './routes/pulseGrow';
import tuyaRoutes from './routes/tuya';
import tuyaMultiTenantRoutes from './routes/tuyaMultiTenant';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3000'
  ],
  credentials: true,
}));

// Aplicar rate limit solo a login
app.use('/api/auth/login', authLimiter);

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

app.use('/api/monitoring', monitoringRoutes);
app.use('/api/sensors/pulsegrow', pulseGrowRoutes);
app.use('/api/integrations/tuya', tuyaRoutes); // Legacy endpoint (sin multi-tenant)
app.use('/api/tuya', tuyaMultiTenantRoutes); // New multi-tenant endpoints

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
