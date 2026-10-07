// Baixa o estoque dos produtos de um pedido recem-pago.
// Produtos sem controle de estoque (stock_quantity NULL) nao sao alterados.
async function decrementStockForOrder(pool, orderId) {
  try {
    await pool.query(
      `UPDATE products p
       SET stock_quantity = GREATEST(p.stock_quantity - oi.qty, 0), updated_at = NOW()
       FROM (
         SELECT product_id, SUM(quantity)::int AS qty
         FROM order_items WHERE order_id = $1 GROUP BY product_id
       ) oi
       WHERE p.id = oi.product_id AND p.stock_quantity IS NOT NULL`,
      [orderId]
    );
  } catch (err) {
    console.error('Stock decrement failed for order', orderId, err.message);
  }
}

module.exports = { decrementStockForOrder };
