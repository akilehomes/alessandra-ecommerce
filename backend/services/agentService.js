const axios = require('axios');
const { sendOrderConfirmation } = require('./emailService');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class SalesAgent {
  async processOrder(order) {
    try {
      // Enviar confirmação
      await sendOrderConfirmation(order, order.customer_email);

      // Verificar se precisa de alerta (venda grande)
      if (order.total > 5000) {
        await this.sendHighValueAlert(order);
      }

      // Gerar análise automática
      const analysis = await this.generateSalesAnalysis(order);

      return { success: true, analysis };
    } catch (error) {
      console.error('Agent error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendHighValueAlert(order) {
    const message = `🎉 VENDA DE ALTO VALOR
    Pedido: ${order.order_number}
    Cliente: ${order.customer_name}
    Valor: R$ ${order.total.toFixed(2)}
    Hora: ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log(message);
    // TODO: Integrar com Slack/WhatsApp
  }

  async generateSalesAnalysis(order) {
    try {
      const prompt = `Analise este pedido de e-commerce e gere um resumo executivo breve:
      - Cliente: ${order.customer_name}
      - Total: R$ ${order.total}
      - Região: ${order.shipping_address?.state || 'N/A'}
      - Items: ${order.items?.length || 0}

      Forneça em 1-2 linhas: tendência de vendas e recomendação.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        },
        { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error.message);
      return 'Análise indisponível';
    }
  }

  async generateDailyReport() {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_orders,
          SUM(total) as revenue,
          AVG(total) as avg_order_value,
          DATE(created_at) as date
         FROM orders
         WHERE status = 'paid' AND DATE(created_at) = CURRENT_DATE
         GROUP BY DATE(created_at)`
      );

      const stats = result.rows[0] || {};

      return {
        date: new Date().toLocaleDateString('pt-BR'),
        totalOrders: stats.total_orders || 0,
        revenue: stats.revenue || 0,
        avgOrderValue: stats.avg_order_value || 0,
      };
    } catch (error) {
      console.error('Report error:', error);
      return null;
    }
  }
}

module.exports = new SalesAgent();
