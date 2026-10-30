import express, { Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from '../backend/src/routes/auth';
import { deskRouter } from '../backend/src/routes/desk';
import { doctypeRouter } from '../backend/src/routes/doctype';
import { monthlyReportRouter } from '../backend/src/routes/monthlyReport';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const healthHandler = (req: Request, res: Response) => {
  res.json({
    app: 'Haalar Desk Engine',
    version: '15.0-defense',
    status: 'ONLINE',
    environment: 'Vercel Serverless Production'
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Dual mount for both with and without /api prefix
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/desk', deskRouter);
app.use('/desk', deskRouter);
app.use('/api/doctype', doctypeRouter);
app.use('/doctype', doctypeRouter);
app.use('/api/monthly-reports', monthlyReportRouter);
app.use('/monthly-reports', monthlyReportRouter);

export default app;
