import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface TokenPayload {
  id: string;
  email?: string;
  name?: string;
}

// Middleware de autenticación: valida JWT y adjunta req.user y req.userId
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('❌ requireAuth: faltó token en Authorization');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as any).user = { id: decoded.id, email: decoded.email };
    (req as any).userId = decoded.id; // compatibilidad con middleware antiguo
    next();
  } catch (err) {
    console.error('❌ requireAuth: token inválido', err instanceof Error ? err.message : err);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export default requireAuth;