const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alessandra_ecommerce',
});

async function runMigrations() {
  try {
    console.log('📦 Executando migrações...\n');

    const migrationPath = path.join(__dirname, 'database', 'migration-admin-users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    await pool.query(migrationSQL);
    console.log('✅ Migração admin-users concluída\n');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  }
}

async function seedAdminUser() {
  try {
    console.log('🔐 Criando usuário admin padrão...\n');

    const email = 'admin@alessandra.com';
    const password = 'Admin123!';
    const fullName = 'Alessandra Admin';

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Usuário admin já existe. Pulando seed.\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, hashedPassword, fullName, 'admin', true]
    );

    console.log('✅ Usuário admin criado com sucesso!\n');
    console.log('📋 Credenciais do Admin:');
    console.log('   Email: ' + email);
    console.log('   Senha: ' + password);
    console.log('\n⚠️  IMPORTANTE: Mude esta senha após o primeiro login!\n');

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('='.repeat(50));
    console.log('   Admin Dashboard Setup');
    console.log('='.repeat(50) + '\n');

    await runMigrations();
    await seedAdminUser();

    console.log('='.repeat(50));
    console.log('✅ Setup concluído com sucesso!');
    console.log('='.repeat(50) + '\n');

    console.log('Próximos passos:');
    console.log('1. npm run dev (para iniciar o backend)');
    console.log('2. Acesse http://localhost:3000/admin/login');
    console.log('3. Use as credenciais acima\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
