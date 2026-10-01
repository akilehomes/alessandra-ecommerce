const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const productsData = [
  {
    name: 'Vasos Cerâmica Artesanal',
    price: 850.00,
    category: 'Decoração',
    description: 'Set de 3 vasos em cerâmica artesanal com acabamento matte',
    image_url: 'https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?w=500',
    quantity: 15,
  },
  {
    name: 'Quadro Arte Moderna',
    price: 1800.00,
    category: 'Arte',
    description: 'Quadro abstrato em tela com moldura de madeira natural',
    image_url: 'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?w=500',
    quantity: 8,
  },
  {
    name: 'Tapete Persa Vintage',
    price: 4500.00,
    category: 'Tapetes',
    description: 'Tapete persa autentico 200x300cm com padrões tradicionais',
    image_url: 'https://images.pexels.com/photos/2095422/pexels-photo-2095422.jpeg?w=500',
    quantity: 3,
  },
  {
    name: 'Poltrona Veludo Cinza',
    price: 3200.00,
    category: 'Móveis',
    description: 'Poltrona estofada em veludo cinza com pés de madeira teca',
    image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?w=500',
    quantity: 5,
  },
  {
    name: 'Luminária Pendente Bronze',
    price: 1200.00,
    category: 'Iluminação',
    description: 'Luminária pendente em metal bronze com vidro fosco',
    image_url: 'https://images.pexels.com/photos/1092727/pexels-photo-1092727.jpeg?w=500',
    quantity: 12,
  },
  {
    name: 'Móvel Aparador Espelho',
    price: 2500.00,
    category: 'Móveis',
    description: 'Aparador madeira clara com espelho integrado e gavetas',
    image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?w=500',
    quantity: 4,
  },
];

const couponsData = [
  {
    code: 'TESTE10',
    discount_percentage: 10,
    max_uses: 100,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
    description: 'Cupom de teste 10% desconto',
  },
  {
    code: 'PRIMEIRACOMPRA',
    discount_percentage: 15,
    max_uses: 50,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    description: 'Primeira compra 15% desconto',
  },
  {
    code: 'FRETE5',
    discount_percentage: 5,
    max_uses: 200,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
    description: '5% desconto em frete',
  },
];

async function seed() {
  try {
    console.log('🌱 Iniciando seed de dados...\n');

    // Limpar dados existentes
    console.log('🗑️  Limpando dados antigos...');
    await pool.query('TRUNCATE TABLE products CASCADE');
    await pool.query('TRUNCATE TABLE coupons CASCADE');
    console.log('✅ Dados antigos removidos\n');

    // Inserir produtos
    console.log('📦 Inserindo produtos...');
    for (const product of productsData) {
      await pool.query(
        `INSERT INTO products (name, price, category, description, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [product.name, product.price, product.category, product.description, product.image_url]
      );
    }
    console.log(`✅ ${productsData.length} produtos inseridos\n`);

    // Inserir inventário
    console.log('📊 Inserindo inventário...');
    const products = await pool.query('SELECT id FROM products');
    for (let i = 0; i < products.rows.length; i++) {
      await pool.query(
        `INSERT INTO product_inventory (product_id, quantity, reserved)
         VALUES ($1, $2, 0)`,
        [products.rows[i].id, productsData[i].quantity]
      );
    }
    console.log(`✅ Inventário criado para ${products.rows.length} produtos\n`);

    // Inserir cupons
    console.log('🎟️  Inserindo cupons...');
    for (const coupon of couponsData) {
      await pool.query(
        `INSERT INTO coupons (code, discount_percentage, max_uses, used_count, expires_at, description)
         VALUES ($1, $2, $3, 0, $4, $5)`,
        [coupon.code, coupon.discount_percentage, coupon.max_uses, coupon.expires_at, coupon.description]
      );
    }
    console.log(`✅ ${couponsData.length} cupons criados\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!\n');
    console.log('📋 Dados de Teste:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🏪 PRODUTOS (6):');
    productsData.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - R$ ${p.price.toFixed(2)}`);
    });

    console.log('\n🎟️  CUPONS (3):');
    couponsData.forEach(c => {
      console.log(`  • ${c.code} - ${c.discount_percentage}% desconto`);
    });

    console.log('\n👤 DADOS DE TESTE PARA CHECKOUT:');
    console.log('  Nome: Flávio Ferreira');
    console.log('  Email: teste@alessandrazanetti.com');
    console.log('  Telefone: +55 11 98765-4321');
    console.log('  CEP: 01310-100 (São Paulo, BR)');
    console.log('  Rua: Avenida Paulista');
    console.log('  Número: 1000');

    console.log('\n💳 CARTÃO DE TESTE:');
    console.log('  Número: 4111 1111 1111 1111');
    console.log('  Validade: 12/25');
    console.log('  CVC: 123');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  }
}

seed();
