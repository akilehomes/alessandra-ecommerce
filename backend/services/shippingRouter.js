// Shipping Router - Roteia para o serviço correto (Brasil vs EU)

const melhorEnvio = require('./melhorEnvioService');
const easyPost = require('./easyPostService');

// Países brasileiros (Melhor Envio)
const BRAZIL_COUNTRIES = ['BR'];

// Países europeus + Portugal (EasyPost)
const EU_COUNTRIES = ['PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'CH', 'PL', 'GR', 'SE', 'DK', 'NO', 'FI', 'IE', 'GB'];

async function calculateShippingByCountry(country, zipCode, weight, dimensions = {}) {
  try {
    // Detectar qual serviço usar baseado no país
    if (BRAZIL_COUNTRIES.includes(country)) {
      console.log(`📦 Calculando frete Brasil com Melhor Envio - CEP: ${zipCode}`);
      return await melhorEnvio.calculateShipping(zipCode, weight, dimensions);
    } else if (EU_COUNTRIES.includes(country)) {
      console.log(`📦 Calculando frete EU com EasyPost - País: ${country}, CEP: ${zipCode}`);
      return await easyPost.calculateShipping(country, zipCode, weight, dimensions);
    } else {
      throw new Error(`País ${country} não suportado. Suportamos: BR, PT, ES, FR, DE, IT, etc`);
    }
  } catch (error) {
    console.error('❌ Shipping Router Error:', error.message);
    throw error;
  }
}

function getSupportedCountries() {
  return {
    brazil: BRAZIL_COUNTRIES,
    europe: EU_COUNTRIES,
  };
}

module.exports = {
  calculateShippingByCountry,
  getSupportedCountries,
};
