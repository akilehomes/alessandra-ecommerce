const PDFDocument = require('pdfkit');
const { sendOrderConfirmation } = require('./emailService');

const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('FATURA', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text('Canario Diafano', { align: 'center' });
      doc.text('CNPJ: 00.000.000/0000-00', { align: 'center' });
      doc.text('www.alessandrazanetti.com', { align: 'center' });
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Invoice details
      doc.fontSize(11).font('Helvetica-Bold').text('Número da Fatura:', 50, doc.y);
      doc.font('Helvetica').text(order.order_number || order.id, 200, doc.y - 15);

      doc.font('Helvetica-Bold').text('Data:', 50, doc.y + 20);
      doc.font('Helvetica').text(new Date(order.created_at).toLocaleDateString('pt-BR'), 200, doc.y - 15);

      doc.moveDown(2);

      // Customer info
      doc.fontSize(11).font('Helvetica-Bold').text('Dados do Cliente:');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nome: ${order.customer_name}`);
      doc.text(`Email: ${order.customer_email}`);
      doc.text(`Telefone: ${order.customer_phone}`);
      doc.moveDown();

      // Shipping address
      doc.font('Helvetica-Bold').fontSize(11).text('Endereço de Entrega:');
      const addr = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;
      doc.font('Helvetica').fontSize(10);
      doc.text(`${addr.street}, ${addr.number}`);
      doc.text(`${addr.city}, ${addr.state} ${addr.cep}`);
      doc.moveDown();

      // Items table
      const tableTop = doc.y;
      const col1 = 50, col2 = 300, col3 = 450;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Item', col1, tableTop);
      doc.text('Qtd', col2, tableTop);
      doc.text('Valor', col3, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Parse items
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      let yPosition = tableTop + 25;

      doc.font('Helvetica').fontSize(10);
      items.forEach(item => {
        doc.text(item.name || 'Produto', col1, yPosition);
        doc.text(item.quantity.toString(), col2, yPosition);
        doc.text(`R$ ${(item.price * item.quantity).toFixed(2)}`, col3, yPosition);
        yPosition += 20;
      });

      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;

      // Totals
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Subtotal:', col2, yPosition);
      doc.text(`R$ ${order.subtotal.toFixed(2)}`, col3, yPosition);

      yPosition += 25;
      doc.text('Impostos:', col2, yPosition);
      doc.text(`R$ ${order.tax_amount.toFixed(2)}`, col3, yPosition);

      yPosition += 25;
      doc.text('Frete:', col2, yPosition);
      doc.text(`R$ ${order.shipping_cost.toFixed(2)}`, col3, yPosition);

      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();

      yPosition += 25;
      doc.fontSize(13).text('Total:', col2, yPosition);
      doc.text(`R$ ${order.total.toFixed(2)}`, col3, yPosition);

      yPosition += 40;
      doc.fontSize(10).font('Helvetica').text('Obrigado pela compra!', { align: 'center' });
      doc.text('www.alessandrazanetti.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
