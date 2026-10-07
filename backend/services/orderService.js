// Anexa ao pedido os itens (nome, quantidade, preco) para uso em e-mails.
async function attachItems(pool, order) {
  try {
    const { rows } = await pool.query(
      'SELECT product_name AS name, quantity, price FROM order_items WHERE order_id = $1 ORDER BY id',
      [order.id]
    );
    return { ...order, items: rows };
  } catch (err) {
    console.error('Could not load order items for e-mail:', err.message);
    return { ...order, items: order.items || [] };
  }
}

module.exports = { attachItems };
