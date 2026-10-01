// Melhor Envio Service - Brasil
// Integração com API Melhor Envio (mockado até ter chave real)

const ORIGIN_CEP = (process.env.SHIPPING_ORIGIN_CEP || '01047912').replace(/\D/g, ''); // Alessandra - São Paulo
const ORIGIN_STATE = 'SP';

// Cotacao a partir de uma lista de produtos reais:
// [{ id, weight (kg), width, height, length (cm), insurance_value (R$ por unidade), quantity }]
async function calculateShippingForProducts(destZipCode, products) {
  const totalWeight = products.reduce((sum, p) => sum + p.weight * p.quantity, 0);
  try {
    // TODO: Quando tiver chave, remover esta verificacao mock
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return generateMockShippingOptions(destZipCode, totalWeight);
    }
    return await callMelhorEnvioAPI(destZipCode, products);
  } catch (error) {
    console.error('❌ Melhor Envio Error:', error.message);
    // Fallback simulado somente em dev (ALLOW_SHIPPING_MOCK=true); em producao o erro sobe
    if (process.env.ALLOW_SHIPPING_MOCK === 'true') {
      console.warn('⚠️ Usando frete simulado (ALLOW_SHIPPING_MOCK)');
      return generateMockShippingOptions(destZipCode, totalWeight);
    }
    throw error;
  }
}

// Compatibilidade: cotacao de um unico volume
async function calculateShipping(destZipCode, weight, dimensions = {}) {
  return calculateShippingForProducts(destZipCode, [{
    id: '1',
    weight,
    width: dimensions.width || 10,
    height: dimensions.height || 10,
    length: dimensions.length || 20,
    insurance_value: 0,
    quantity: 1,
  }]);
}

function generateMockShippingOptions(destZipCode, weight) {
  const basePrice = 20;
  const weightFactor = weight * 2;

  return [
    {
      id: `melhor-envio-1`,
      carrier: 'PAC',
      service: 'PAC',
      price: basePrice + weightFactor + 10,
      delivery_time: 8,
      delivery_date: getDeliveryDate(8),
      currency: 'BRL',
    },
    {
      id: `melhor-envio-2`,
      carrier: 'Sedex',
      service: 'Sedex',
      price: basePrice + weightFactor + 40,
      delivery_time: 2,
      delivery_date: getDeliveryDate(2),
      currency: 'BRL',
    },
    {
      id: `melhor-envio-3`,
      carrier: 'Loggi',
      service: 'Loggi Express',
      price: basePrice + weightFactor + 25,
      delivery_time: 2,
      delivery_date: getDeliveryDate(2),
      currency: 'BRL',
    },
  ];
}

// Producao: https://melhorenvio.com.br/api/v2/me/shipment/calculate
// Sandbox:  https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate (token do sandbox)
const MELHOR_ENVIO_URL =
  process.env.MELHOR_ENVIO_URL || 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

// Minimos aceitos pelas transportadoras (evita recusa da API por medidas muito pequenas)
const MIN_WIDTH = 11;
const MIN_HEIGHT = 2;
const MIN_LENGTH = 16;

async function callMelhorEnvioAPI(destZipCode, products) {
  const response = await fetch(MELHOR_ENVIO_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': `Alessandra Zanetti (${process.env.FROM_EMAIL || 'contato@alessandrazanetti.com'})`,
    },
    body: JSON.stringify({
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: String(destZipCode).replace(/\D/g, '') },
      products: products.map((p) => ({
        id: String(p.id),
        weight: Math.max(0.1, Number(p.weight) || 0.1),
        width: Math.max(MIN_WIDTH, Math.ceil(Number(p.width) || 0)),
        height: Math.max(MIN_HEIGHT, Math.ceil(Number(p.height) || 0)),
        length: Math.max(MIN_LENGTH, Math.ceil(Number(p.length) || 0)),
        insurance_value: Math.max(0, Number(p.insurance_value) || 0),
        quantity: Math.max(1, Math.floor(Number(p.quantity) || 1)),
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Melhor Envio API Error: ${response.status} ${response.statusText}`);
  }

  const services = await response.json();
  const options = (Array.isArray(services) ? services : [])
    .filter((svc) => !svc.error && Number(svc.custom_price || svc.price) > 0)
    .map((svc) => ({
      id: `melhor-envio-${svc.id}`,
      carrier: svc.company?.name || svc.name,
      service: svc.name,
      price: Number(svc.custom_price || svc.price),
      delivery_time: svc.custom_delivery_time || svc.delivery_time,
      delivery_date: getDeliveryDate(svc.custom_delivery_time || svc.delivery_time || 0),
      currency: 'BRL',
    }));

  if (options.length === 0) {
    throw new Error('Melhor Envio returned no shipping options');
  }
  return options;
}

function getDeliveryDate(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

module.exports = {
  calculateShipping,
  calculateShippingForProducts,
};
