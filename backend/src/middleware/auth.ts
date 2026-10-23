import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserSession {
  username: string;
  email: string;
  fullName: string;
  role: 'CEO' | 'Supervisor' | 'Logistics Admin' | 'Employee';
  securityClearance: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

const JWT_SECRET = process.env.JWT_SECRET || 'haalar_desk_secret_token_defense_grade_2026';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
}
