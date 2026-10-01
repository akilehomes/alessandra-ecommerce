require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_kY8FswnQt1Xq@ep-noisy-moon-b5pya3n8-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const products = [
  {
    name: 'Móvel Aparador Espelho',
    slug: 'movel-aparador-espelho',
    description: 'Aparador em madeira clara com espelho decorativo. Dimensões: 140x80cm',
    price: 2500.00,
    cost: 1200.00,
    image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Móveis',
    is_featured: true
  },
  {
    name: 'Luminária Pendente Bronze',
    slug: 'luminaria-pendente-bronze',
    description: 'Luminária pendente em bronze natural. Ideal para salas de estar elegantes.',
    price: 1200.00,
    cost: 500.00,
    image_url: 'https://images.pexels.com/photos/3591945/pexels-photo-3591945.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Iluminação',
    is_featured: true
  },
  {
    name: 'Poltrona Veludo Cinza',
    slug: 'poltrona-veludo-cinza',
    description: 'Poltrona em veludo cinza com estrutura de madeira de lei. Conforto premium.',
    price: 3200.00,
    cost: 1500.00,
    image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Móveis',
    is_featured: true
  },
  {
    name: 'Tapete Persa Vintage',
    slug: 'tapete-persa-vintage',
    description: 'Tapete persa original, tons quentes. 3m x 2m. Peça única.',
    price: 4500.00,
    cost: 2000.00,
    image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Tapetes',
    is_featured: false
  },
  {
    name: 'Quadro Arte Moderna',
    slug: 'quadro-arte-moderna',
    description: 'Quadro abstrato em cores neutras. Moldura em latão. 120x80cm',
    price: 1800.00,
    cost: 700.00,
    image_url: 'https://images.pexels.com/photos/1866519/pexels-photo-1866519.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Arte',
    is_featured: false
  },
  {
    name: 'Vasos Cerâmica Artesanal',
    slug: 'vasos-ceramica-artesanal',
    description: 'Conjunto de 3 vasos em cerâmica feitos à mão. Tons naturais.',
    price: 850.00,
    cost: 350.00,
    image_url: 'https://images.pexels.com/photos/2866070/pexels-photo-2866070.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',
    category: 'Decoração',
    is_featured: false
  }
];

async function seedProducts() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Limpando produtos antigos...');
    await client.query('DELETE FROM products');
    console.log('✓ Limpeza concluída\n');

    console.log('🌱 Inserindo produtos de teste...\n');

    for (const product of products) {
      await client.query(
        'INSERT INTO products (name, slug, description, price, cost, image_url, category, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [product.name, product.slug, product.description, product.price, product.cost, product.image_url, product.category, product.is_featured]
      );
      console.log(`✓ ${product.name}`);
    }

    console.log('\n✅ Produtos inseridos com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts();
