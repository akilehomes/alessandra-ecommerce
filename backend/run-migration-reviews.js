require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alessandra_ecommerce',
  ...(process.env.NODE_ENV === 'production' && { ssl: { rejectUnauthorized: false } })
});

async function runMigration() {
  try {
    console.log('🔄 Running reviews migration...');

    const migrationPath = path.join(__dirname, 'database', 'migration-reviews.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);

    console.log('✅ Reviews migration completed successfully!');
    console.log('✅ Created tables: reviews, review_helpful_votes, review_approvals');
    console.log('✅ Created indexes for performance optimization');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
