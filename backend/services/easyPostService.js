// EasyPost Service - Portugal / EU
// Integração com API EasyPost (mockado até ter chave real)

const ORIGIN_ADDRESS = {
  name: 'Alessandra Zanetti',
  street1: 'Rua Fictícia, 100',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01047912',
  country: 'BR',
};

async function calculateShipping(destCountry, destZipCode, weight, dimensions = {}) {
  try {
    const isMock = !process.env.EASYPOST_API_KEY;

    if (isMock) {
      return generateMockShippingOptions(destCountry, destZipCode, weight);
    }

    // Aqui irá a integração real com EasyPost
    const options = await callEasyPostAPI(destCountry, destZipCode, weight, dimensions);
    return options;
  } catch (error) {
    console.error('❌ EasyPost Error:', error.message);
    throw error;
  }
}

function generateMockShippingOptions(destCountry, destZipCode, weight) {
  const carriers = {
    PT: [
      { carrier: 'CTT', name: 'CTT Standard', days: 5, basePrice: 18, currency: 'EUR' },
      { carrier: 'CTT', name: 'CTT Expresso', days: 2, basePrice: 35, currency: 'EUR' },
      { carrier: 'DHL', name: 'DHL Express', days: 1, basePrice: 45, currency: 'EUR' },
    ],
    ES: [
      { carrier: 'Correos', name: 'Correos Standard', days: 4, basePrice: 16, currency: 'EUR' },
      { carrier: 'DHL', name: 'DHL Express', days: 1, basePrice: 40, currency: 'EUR' },
      { carrier: 'UPS', name: 'UPS Express', days: 2, basePrice: 50, currency: 'EUR' },
    ],
    FR: [
      { carrier: 'La Poste', name: 'La Poste Standard', days: 4, basePrice: 15, currency: 'EUR' },
      { carrier: 'DHL', name: 'DHL Express', days: 1, basePrice: 38, currency: 'EUR' },
      { carrier: 'Chronopost', name: 'Chronopost Express', days: 2, basePrice: 45, currency: 'EUR' },
    ],
    DE: [
      { carrier: 'Deutsche Post', name: 'Deutsche Post Standard', days: 3, basePrice: 14, currency: 'EUR' },
      { carrier: 'DHL', name: 'DHL Express', days: 1, basePrice: 35, currency: 'EUR' },
      { carrier: 'UPS', name: 'UPS Express', days: 2, basePrice: 48, currency: 'EUR' },
    ],
    IT: [
      { carrier: 'Poste Italiane', name: 'Poste Standard', days: 5, basePrice: 17, currency: 'EUR' },
      { carrier: 'DHL', name: 'DHL Express', days: 1, basePrice: 42, currency: 'EUR' },
      { carrier: 'UPS', name: 'UPS Express', days: 2, basePrice: 52, currency: 'EUR' },
    ],
  };

  const countryCarriers = carriers[destCountry] || carriers['PT'];
  const weightFactor = weight * 3; // EU é mais caro que Brasil

  return countryCarriers.map((carrier, idx) => ({
    id: `easypost-${destCountry}-${idx}`,
    carrier: carrier.carrier,
    service: carrier.name,
    price: carrier.basePrice + weightFactor,
    delivery_time: carrier.days,
    delivery_date: getDeliveryDate(carrier.days),
    currency: carrier.currency,
  }));
}

async function callEasyPostAPI(destCountry, destZipCode, weight, dimensions) {
  // Implementar quando tiver chave
  // const response = await fetch('https://api.easypost.com/v2/shipments', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.EASYPOST_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     shipment: {
  //       from_address: ORIGIN_ADDRESS,
  //       to_address: {
  //         postal_code: destZipCode,
  //         country: destCountry,
  //       },
  //       parcel: {
  //         weight,
  //         width: dimensions.width || 10,
  //         height: dimensions.height || 10,
  //         length: dimensions.length || 20,
  //       }
  //     }
  //   })
  // });
  // return await response.json();
}

function getDeliveryDate(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

module.exports = {
  calculateShipping,
};
