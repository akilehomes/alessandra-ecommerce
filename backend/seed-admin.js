const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alessandra_ecommerce',
});

async function seedAdminUser() {
  try {
    const email = 'admin@alessandra.com';
    const password = 'Admin123!';
    const fullName = 'Alessandra Admin';

    console.log('🔐 Creating default admin user...');

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Admin user already exists. Skipping seed.');
      await pool.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [email, hashedPassword, fullName, 'admin', true]
    );

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Email: ' + email);
    console.log('   Password: ' + password);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedAdminUser();
