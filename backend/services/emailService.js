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

const COUNTRY_NAMES = { BR: 'Brasil', PT: 'Portugal' };
const SITE_URL = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const esc = (v) => String(v ?? '').replace(/[<>&]/g, '');
// O pedido guarda a moeda na coluna "region" (BRL/EUR)
const currencySymbol = (order) => (order && order.region === 'EUR' ? '€' : 'R$');

function formatAddress(addr) {
  if (!addr) return 'Não informado';
  const a = typeof addr === 'string' ? JSON.parse(addr) : addr;
  const isBR = !a.country || a.country === 'BR';
  const postal = a.postal_code || a.cep;
  const lines = [
    esc(a.recipient_name),
    [esc(a.street), esc(a.number)].filter(Boolean).join(', ') + (a.complement ? ' - ' + esc(a.complement) : ''),
    esc(a.district),
    [esc(a.city), esc(a.state)].filter(Boolean).join(isBR ? ' - ' : ', ') + (postal ? (isBR ? ' · CEP ' : ' · ') + esc(postal) : ''),
    !isBR ? esc(COUNTRY_NAMES[a.country] || a.country) : '',
  ];
  return lines.filter((l) => l && l.trim()).join('<br>');
}

// Cabecalho e rodape comuns dos e-mails da loja
const emailShell = (title, subtitle, content) => `
  <html>
    <body style="font-family: Outfit, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; padding: 8px 0 18px; font-size: 13px; letter-spacing: 3px; font-weight: 700; text-transform: uppercase;">Alessandra Zanetti</div>
      <div style="border-top: 3px solid #000; padding-top: 20px;">
        <h1 style="font-size: 24px; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 1px;">${title}</h1>
        ${subtitle ? `<p style="font-size: 14px; color: #666; margin: 0;">${subtitle}</p>` : ''}
      </div>
      ${content}
      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; text-align: center;">
        <a href="${SITE_URL}" style="color: #999;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </body>
  </html>
`;

// Linha "Entrega": transportadora e prazo reais do pedido, quando existirem
function deliveryLine(order) {
  const service = [order.shipping_carrier, order.shipping_service].filter(Boolean).filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i).join(' ');
  if (!service) return '';
  return `${esc(service)}${order.shipping_days ? ` · prazo de ${esc(order.shipping_days)} dias úteis após a postagem` : ''}`;
}

async function sendOrderConfirmation(order, customerEmail) {
  try {
    const sym = currencySymbol(order);
    const trackingUrl = `${SITE_URL}/track/${order.id}`;
    const rows = (order.items || [])
      .map((item) => `
        <tr>
          <td style="padding: 6px 0;">${esc(item.name)} × ${esc(item.quantity)}</td>
          <td style="padding: 6px 0; text-align: right;">${sym} ${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`)
      .join('');

    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount) || 0;
    const shippingCost = parseFloat(order.shipping_cost) || 0;
    const taxAmount = parseFloat(order.tax) || 0;
    const total = parseFloat(order.total) || 0;
    const delivery = deliveryLine(order);

    const content = `
      <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-weight: 700;">Número do pedido</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #000;">#${esc(order.order_number)}</p>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          ${rows}
          <tr><td colspan="2" style="border-top: 1px solid #ddd; padding-top: 8px;"></td></tr>
          <tr><td style="padding: 4px 0;">Subtotal</td><td style="text-align: right;">${sym} ${subtotal.toFixed(2)}</td></tr>
          ${discount > 0 ? `<tr><td style="padding: 4px 0;">Desconto${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}</td><td style="text-align: right;">-${sym} ${discount.toFixed(2)}</td></tr>` : ''}
          <tr><td style="padding: 4px 0;">Impostos</td><td style="text-align: right;">${sym} ${taxAmount.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0;">Frete</td><td style="text-align: right;">${sym} ${shippingCost.toFixed(2)}</td></tr>
          <tr style="font-weight: 700; font-size: 15px;"><td style="padding: 12px 0 0;">Total</td><td style="text-align: right; padding-top: 12px;">${sym} ${total.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="margin: 24px 0; font-size: 13px; line-height: 1.6;">
        <p style="margin: 0 0 4px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Entrega</p>
        <p style="margin: 0 0 12px 0;">${formatAddress(order.shipping_address)}</p>
        ${delivery ? `<p style="margin: 0; color: #666;">Envio: ${delivery}</p>` : ''}
      </div>

      <div style="margin: 24px 0; padding: 20px; background: #f9f9f9; border-left: 3px solid #000; border-radius: 4px;">
        <p style="margin: 0 0 14px 0; font-size: 13px;">Você receberá outro e-mail com o código de rastreio assim que o pedido for enviado. Para acompanhar o status:</p>
        <a href="${trackingUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Acompanhar pedido</a>
      </div>`;

    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Pedido confirmado #${order.order_number} · Alessandra Zanetti`,
      html: emailShell('Pedido confirmado', 'Obrigado pela sua compra!', content),
    });
    console.log(`Email sent to ${customerEmail}:`, response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendShippingNotification(order, trackingNumber, carrier) {
  try {
    const trackingUrl = `${SITE_URL}/track/${order.id}`;
    const content = `
      <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
        ${carrier ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #666;">Transportadora: <strong>${esc(carrier)}</strong></p>` : ''}
        <p style="margin: 0 0 10px 0; font-weight: 700;">Código de rastreio</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #000; font-family: monospace;">${esc(trackingNumber)}</p>
        <a href="${trackingUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700;">Acompanhar entrega</a>
      </div>
      <div style="font-size: 13px; line-height: 1.6;">
        <p style="margin: 0 0 4px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Endereço de entrega</p>
        <p style="margin: 0;">${formatAddress(order.shipping_address)}</p>
      </div>`;

    const response = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Seu pedido foi enviado · ${esc(order.order_number)}`,
      html: emailShell('Seu pedido foi enviado', `Pedido #${esc(order.order_number)}: está a caminho!`, content),
    });
    console.log(`Shipping notification sent for ${order.order_number}:`, response.id);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending shipping notification:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendPasswordReset(email, name, resetUrl) {
  const safeName = esc(name);
  const html = emailShell(
    'Redefinir senha',
    `Olá${safeName ? ', ' + safeName : ''}. Recebemos um pedido para redefinir a senha da sua conta.`,
    `<div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 4px;">
      <a href="${resetUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 700;">Criar nova senha</a>
      <p style="font-size: 12px; color: #999; margin: 20px 0 0 0;">Este link vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
    </div>`
  );

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
