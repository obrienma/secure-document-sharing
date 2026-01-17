import fs from 'fs';
import path from 'path';
import pool from './database';

export async function initializeDatabase() {
  try {
    console.log('📊 Initializing database schema...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✓ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}
