import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './db/database';
import { initializeDatabase } from './db/init';
import authRoutes from './auth/auth.routes';
import documentsRoutes from './documents/documents.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      db_time: result.rows[0].now
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'DocShare API v1.0' });
});

// Database stats endpoint
app.get('/db/stats', async (req, res) => {
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const docCount = await pool.query('SELECT COUNT(*) FROM documents');
    const linkCount = await pool.query('SELECT COUNT(*) FROM shared_links');

    res.json({
      users: parseInt(userCount.rows[0].count),
      documents: parseInt(docCount.rows[0].count),
      shared_links: parseInt(linkCount.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Database initialized and connected`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
