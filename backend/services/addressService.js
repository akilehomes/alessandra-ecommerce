// Validacao e normalizacao de enderecos (entrega e faturamento) conforme o pais.
const { getCountry } = require('./countries');

const clean = (v, max = 200) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

// Retorna { address } normalizado ou { error }
function normalizeAddress(input, { requireRecipient = false } = {}) {
  if (!input || typeof input !== 'object') return { error: 'Address is required' };

  const country = getCountry(input.country || 'BR');
  if (!country) return { error: 'Country is not supported' };

  const postalRaw = clean(input.postal_code ?? input.postalCode ?? input.cep, 20);
  const street = clean(input.street);
  const city = clean(input.city);
  const number = clean(input.number, 30);
  const complement = clean(input.complement);
  const district = clean(input.district, 100);
  let state = clean(input.state, 100);
  const recipient = clean(input.recipient_name ?? input.recipientName);

  if (!street || !city || !postalRaw) return { error: 'Street, city and postal code are required' };
  if (requireRecipient && !recipient) return { error: 'Recipient name is required' };
  if (country.requiresDistrict && !number) return { error: 'Number is required' };

  let postal = postalRaw;
  if (country.code === 'BR') {
    postal = postalRaw.replace(/\D/g, '');
    if (postal.length !== 8) return { error: 'Invalid CEP' };
    state = state.toUpperCase();
    if (!country.states[state]) return { error: 'Invalid state' };
    if (!district) return { error: 'District is required' };
  } else {
    if (!new RegExp(`^(${country.postalPattern})$`).test(postalRaw)) return { error: 'Invalid postal code' };
    postal = postalRaw.toUpperCase();
  }

  const address = {
    recipient_name: recipient || null,
    country: country.code,
    postal_code: postal,
    street,
    number,
    complement,
    district,
    city,
    state,
    phone: clean(input.phone, 25) || null,
  };
  // Compatibilidade: o restante do sistema (frete, e-mails, pedidos antigos) le "cep"
  if (country.code === 'BR') address.cep = postal;
  return { address };
}

module.exports = { normalizeAddress };
