const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// GET /api/search - Advanced product search with filters
router.get('/', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      sortBy, 
      page = 1, 
      limit = 12,
      minRating = 0
    } = req.query;

    let query = 'SELECT p.* FROM products p';
    let countQuery = 'SELECT COUNT(*) FROM products p';
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Text search
    if (q && q.trim()) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    // Category filter
    if (category && category !== 'all') {
      whereConditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Price range filter
    if (minPrice !== undefined && minPrice !== '') {
      whereConditions.push(`p.price >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      whereConditions.push(`p.price <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // Build WHERE clause
    let whereClause = '';
    if (whereConditions.length > 0) {
      whereClause = ' WHERE ' + whereConditions.join(' AND ');
    }

    // Add WHERE to both queries
    query += whereClause;
    countQuery += whereClause;

    // Sorting
    let orderBy = 'p.created_at DESC';
    if (sortBy === 'price-asc') {
      orderBy = 'p.price ASC';
    } else if (sortBy === 'price-desc') {
      orderBy = 'p.price DESC';
    } else if (sortBy === 'name') {
      orderBy = 'p.name ASC';
    } else if (sortBy === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    query += ` ORDER BY ${orderBy}`;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * pageSize;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    // Execute both queries
    const [productsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const totalProducts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalProducts / pageSize);

    res.json({
      data: productsResult.rows,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalProducts,
        totalPages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// GET /api/search/categories - Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
    );

    const categories = result.rows.map(row => row.category);
    res.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/search/price-range - Get min/max prices
router.get('/price-range', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT MIN(price) as min_price, MAX(price) as max_price FROM products'
    );

    const { min_price, max_price } = result.rows[0];
    res.json({
      minPrice: parseFloat(min_price) || 0,
      maxPrice: parseFloat(max_price) || 1000
    });
  } catch (error) {
    console.error('Price range error:', error);
    res.status(500).json({ error: 'Failed to fetch price range' });
  }
});

module.exports = router;
