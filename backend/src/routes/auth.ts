import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { erpStore } from '../services/store';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'haalar_desk_secret_token_defense_grade_2026';

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Please provide both username and password.' });
    return;
  }

  const user = erpStore.tables.tab_user.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid username or password.' });
    return;
  }

  // Verify password with bcrypt (or allow 'admin' / 'Haalar@2026!' fallback)
  const isMatch = await bcrypt.compare(password, user.password_hash) || password === 'admin' || password === 'Haalar@2026!';
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid username or password.' });
    return;
  }

  const sessionPayload = {
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    securityClearance: user.security_clearance
  };

  const token = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: '12h' });

  res.json({
    success: true,
    message: 'Welcome to Haalar Desk.',
    token,
    user: sessionPayload
  });
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user
  });
});
