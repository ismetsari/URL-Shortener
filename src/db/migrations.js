require('dotenv').config();
const { pool } = require('../config/postgres');

const createTables = async () => {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    console.log('Creating tables...');
    
    // Create urls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        original_url TEXT NOT NULL,
        short_code VARCHAR(${process.env.SHORTCODE_LENGTH || 7}) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        click_count INTEGER DEFAULT 0
      )
    `);
    
    // Create clicks table for analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
        clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        referrer TEXT,
        user_agent TEXT,
        ip_address TEXT
      )
    `);
    
    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)
    `);
    
    console.log('Tables created successfully');
    client.release();
    
    // Exit the script
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

// Run the migration
createTables(); 