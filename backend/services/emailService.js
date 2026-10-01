const Mailgun = require('mailgun.js');
const FormData = require('form-data');

const mailgun = new Mailgun(FormData);
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

console.log('[Mailgun] Domain:', MAILGUN_DOMAIN);
console.log('[Mailgun] Key exists:', !!MAILGUN_API_KEY);

const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
});

const FROM_EMAIL = process.env.FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`;

function formatAddress(addr) {
  if (!addr) return 'Não informado';
  const a = typeof addr === 'string' ? JSON.parse(addr) : addr;
  const esc = (v) => String(v ?? '').replace(/[<>&]/g, '');
  const line1 = [esc(a.street), esc(a.number)].filter(Boolean).join(', ') + (a.complement ? ' - ' + esc(a.complement) : '');
  const line2 = [esc(a.city), esc(a.state)].filter(Boolean).join(' - ') + (a.cep ? ' · CEP ' + esc(a.cep) : '');
  return line1 + '<br>' + line2;
}

async function sendOrderConfirmation(order, customerEmail) {
  try {
    const trackingUrl = `${process.env.FRONTEND_URL}/track/${order.id}`;
    const itemsList = (order.items || [])
      .map(item => `${item.name} x${item.quantity} - R$ ${(parseFloat(item.price) * item.quantity).toFixed(2)}`)
      .join('\n');

    // Converter valores do banco (strings) para números
    const subtotal = parseFloat(order.subtotal) || 0;
    const shippingCost = parseFloat(order.shipping_cost) || 0;
    const taxAmount = parseFloat(order.tax) || 0;
    const total = parseFloat(order.total) || 0;

    const html = `
      <html>
        <body style="font-family: Outfit, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="border-top: 3px solid #000; padding-top: 20px;">
            <h1 style="font-size: 24px; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px;">
              Pedido Confirmado
            </h1>
            <p style="font-size: 14px; color: #666;">Obrigado pela sua compra!</p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: 700;">Número do Pedido:</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; color: #000;">#${order.order_number}</p>

            <p style="margin: 0 0 10px 0; font-weight: 700;">Itens:</p>
            <p style="margin: 0 0 20px 0; white-space: pre-wrap; font-size: 13px; line-height: 1.8;">${itemsList}</p>

            <p style="margin: 0 0 10px 0; font-weight: 700;">Resumo:</p>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 5px 0;">R$ ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Frete:</td>
                <td style="text-align: right; padding: 5px 0;">R$ ${shippingCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Impostos:</td>
                <td style="text-align: right; padding: 5px 0;">R$ ${taxAmount.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 1px solid #ccc; font-weight: 700; padding-top: 10px;">
                <td style="padding: 10px 0;">Total:</td>
                <td style="text-align: right; padding: 10px 0;">R$ ${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #000; border-radius: 4px;">
            <p style="margin: 0 0 15px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
              Rastrear seu Pedido
            </p>
            <p style="margin: 0 0 15px 0; font-size: 13px;">
              Acompanhe o status do seu pedido em tempo real:
            </p>
            <a href="${trackingUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              Rastrear Pedido
            </a>
          </div>

          <div style="margin: 30px 0; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999;">
            <p style="margin: 10px 0;">
              <strong>Endereço de Entrega:</strong><br>
              ${formatAddress(order.shipping_address)}
            </p>
            <p style="margin: 10px 0;">
              Entrega prevista: 5-7 dias úteis
            </p>
            <p style="margin: 20px 0 0 0; color: #ccc;">
              Este é um email automático. Não responda este email.
            </p>
          </div>
        </body>
      </html>
    `;

    const messageData = {
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Pedido Confirmado - #${order.id} - Alessandra Zanetti`,
      html,
    };

    const response = await mg.messages.create(MAILGUN_DOMAIN, messageData);
    console.log(`Email sent to ${customerEmail}:`, response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendShippingNotification(order, trackingNumber) {
  try {
    const trackingUrl = `${process.env.FRONTEND_URL}/track/${order.id}`;

    const html = `
      <html>
        <body style="font-family: Outfit, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="border-top: 3px solid #000; padding-top: 20px;">
            <h1 style="font-size: 24px; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px;">
              Seu Pedido foi Despachado
            </h1>
            <p style="font-size: 14px; color: #666;">Seu pedido está a caminho!</p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: 700;">Número do Rastreamento:</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; color: #000; font-family: monospace;">${trackingNumber}</p>

            <a href="${trackingUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700;">
              Acompanhar Entrega
            </a>
          </div>
        </body>
      </html>
    `;

    const messageData = {
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Seu Pedido foi Despachado - #${order.id}`,
      html,
    };

    const response = await mg.messages.create(MAILGUN_DOMAIN, messageData);
    console.log(`Shipping notification sent to ${order.customer_email}:`, response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending shipping notification:', error);
    return { success: false, error: error.message };
  }
}

async function sendPasswordReset(email, name, resetUrl) {
  const safeName = String(name || '').replace(/[<>&]/g, '');
  const html = `
    <html>
      <body style="font-family: Outfit, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="border-top: 3px solid #000; padding-top: 20px;">
          <h1 style="font-size: 24px; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px;">
            Redefinir senha
          </h1>
          <p style="font-size: 14px; color: #666;">Olá${safeName ? ', ' + safeName : ''}. Recebemos um pedido para redefinir a senha da sua conta.</p>
        </div>
        <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
          <a href="${resetUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700;">
            Criar nova senha
          </a>
          <p style="font-size: 12px; color: #999; margin: 20px 0 0 0;">Este link vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: email,
      subject: 'Redefinir sua senha',
      html,
    });
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
}

// Avisa a loja de um novo pedido de orcamento (destino em SHOP_NOTIFY_EMAIL; sem a variavel, so grava no painel)
async function sendQuotationNotification(q) {
  const to = process.env.SHOP_NOTIFY_EMAIL;
  if (!to) return { success: false, skipped: true };
  const esc = (v) => String(v ?? '').replace(/[<>&]/g, '');
  const html = `
    <html>
      <body style="font-family: Outfit, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Novo pedido de orçamento</h1>
        <p><strong>${esc(q.customer_name)}</strong><br>
        E-mail: ${esc(q.customer_email)}<br>
        Telefone: ${esc(q.customer_phone) || 'não informado'}</p>
        <p style="white-space: pre-wrap; background: #f5f5f5; padding: 14px;">${esc(q.custom_description)}</p>
        <p style="font-size: 12px; color: #999;">Responda ao cliente e registre o valor em Admin → Orçamentos.</p>
      </body>
    </html>
  `;
  try {
    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to,
      'h:Reply-To': q.customer_email,
      subject: `Orçamento de frete — ${esc(q.customer_name)}`,
      html,
    });
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending quotation notification:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOrderConfirmation,
  sendShippingNotification,
  sendPasswordReset,
  sendQuotationNotification,
};
