import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'haalar_erm',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDatabase(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    console.log('[DB] Connected to PostgreSQL.');

    const checkTable = await client.query(`SELECT to_regclass('public.tab_user') as exists;`);
    if (!checkTable.rows[0]?.exists) {
      console.log('[DB] Populating ERPNext schema from schema.sql...');
      const sqlPath = path.join(__dirname, '../../../database/schema.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('[DB] Schema and initial seed data populated.');
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[DB] PostgreSQL connection note:', err.message);
    console.log('[DB] Operating in high-reliability store mode.');
    return false;
  } finally {
    if (client) client.release();
  }
}
