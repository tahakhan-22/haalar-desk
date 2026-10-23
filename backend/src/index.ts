import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';
import { authRouter } from './routes/auth';
import { deskRouter } from './routes/desk';
import { doctypeRouter } from './routes/doctype';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// System Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    app: 'Haalar Desk Engine',
    version: '15.0-defense',
    status: 'ONLINE',
    environment: 'On-Premise Isolated LAN'
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/desk', deskRouter);
app.use('/api/doctype', doctypeRouter);

app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`  HAALAR DESK - ERPNEXT-ALIGNED BACKEND READY`);
  console.log(`  Port: ${PORT}`);
  console.log(`=======================================================`);
  await initDatabase();
});
