// Cria (ou redefine a senha de) um administrador. A senha NUNCA fica no codigo.
// Uso:
//   DATABASE_URL=... ADMIN_EMAIL=voce@exemplo.com ADMIN_NAME="Seu Nome" ADMIN_PASSWORD=... node database/create-admin.js
// Sem ADMIN_PASSWORD, a senha e pedida no terminal (oculta). Minimo de 8 caracteres.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); }; // nao ecoa a digitacao
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || '').trim();
  if (!url) throw new Error('DATABASE_URL nao definido');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL invalido');
  if (!name) throw new Error('ADMIN_NAME e obrigatorio');

  const password = process.env.ADMIN_PASSWORD || (await askHidden('Senha do admin (min. 8 caracteres): '));
  if (!password || password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres');

  console.log(`Alvo: ${new URL(url).host}`);
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name,
           is_active = true, updated_at = NOW()
     RETURNING (xmax = 0) AS criado`,
    [email, hash, name]
  );
  console.log(result.rows[0].criado ? `✓ Admin criado: ${email}` : `✓ Senha do admin atualizada: ${email}`);
  await pool.end();
}

main().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
