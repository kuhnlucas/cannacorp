import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 authenticateToken:', { 
    hasAuthHeader: !!authHeader, 
    hasToken: !!token,
    token: token ? `${token.substring(0, 30)}...` : 'NO TOKEN',
    jwtSecret: JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'NO SECRET'
  });

  if (!token) {
    console.error('❌ No token provided in Authorization header');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.id;
    console.log('✅ Token válido. Usuario:', decoded.email, 'ID:', decoded.id);
    next();
  } catch (err) {
    console.error('❌ Token inválido:', err instanceof Error ? err.message : err);
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};
