// Melhor Envio Service - Brasil
// Integração com API Melhor Envio (mockado até ter chave real)

const ORIGIN_CEP = '01047912'; // Alessandra - São Paulo
const ORIGIN_STATE = 'SP';

async function calculateShipping(destZipCode, weight, dimensions = {}) {
  try {
    // TODO: Quando tiver chave, remover esta verificação mock
    const isMock = !process.env.MELHOR_ENVIO_TOKEN;

    if (isMock) {
      return generateMockShippingOptions(destZipCode, weight);
    }

    // Aqui irá a integração real com Melhor Envio
    const options = await callMelhorEnvioAPI(destZipCode, weight, dimensions);
    return options;
  } catch (error) {
    console.error('❌ Melhor Envio Error:', error.message);
    throw error;
  }
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

async function callMelhorEnvioAPI(destZipCode, weight, dimensions) {
  const response = await fetch('https://api.melhorenvio.com.br/v2/shipment/calculate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { postal_code: ORIGIN_CEP, state: ORIGIN_STATE },
      to: { postal_code: destZipCode },
      products: [{
        weight,
        width: dimensions.width || 10,
        height: dimensions.height || 10,
        length: dimensions.length || 20,
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Melhor Envio API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function getDeliveryDate(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

module.exports = {
  calculateShipping,
};
