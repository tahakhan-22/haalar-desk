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
const healthHandler = (req: Request, res: Response) => {
  res.json({
    app: 'Haalar Desk Engine',
    version: '15.0-defense',
    status: 'ONLINE',
    environment: 'Production Vercel Service'
  });
};

app.get('/', healthHandler);
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Routes (Dual mounted with and without /api prefix for flexible reverse proxying)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/desk', deskRouter);
app.use('/desk', deskRouter);
app.use('/api/doctype', doctypeRouter);
app.use('/doctype', doctypeRouter);

// Export app for serverless / service integration
export default app;
export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`  HAALAR DESK - ERPNEXT-ALIGNED BACKEND READY`);
    console.log(`  Port: ${PORT}`);
    console.log(`=======================================================`);
    await initDatabase();
  });
}
