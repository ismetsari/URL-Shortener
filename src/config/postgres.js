const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  // Connection pooling settings
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is idle before being closed
  connectionTimeoutMillis: 2000 // How long to wait before timeout
});

const connectToPostgres = async () => {
  try {
    // Test the connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully');
    client.release();
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

// Query method with built-in error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

module.exports = {
  connectToPostgres,
  pool,
  query
}; 