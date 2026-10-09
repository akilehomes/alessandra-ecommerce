// Apresentacao dos formularios por pais (exemplos, nomes locais). Os textos traduziveis ficam em i18n/*/forms.js.
const FORMAT = {
  BR: { phonePh: '(11) 99999-9999', streetPh: 'Av. Paulista' },
  PT: { phonePh: '+351 912 345 678', streetPh: 'Rua Augusta, 100', stateKey: 'addr.state.PT', taxPh: '123456789' },
  ES: { phonePh: '+34 612 345 678', streetPh: 'Calle Mayor, 12', stateKey: 'addr.state.ES', taxLabel: 'NIF / NIE', taxPh: 'X1234567L' },
  FR: { phonePh: '+33 6 12 34 56 78', streetPh: '12 rue de Rivoli', stateKey: 'addr.state.FR', taxLabel: 'Numéro fiscal (SPI)', taxPh: '1234567890123' },
  IT: { phonePh: '+39 312 345 6789', streetPh: 'Via Roma, 10', stateKey: 'addr.state.IT', postalLocal: 'CAP', taxLabel: 'Codice fiscale', taxPh: 'RSSMRA80A01H501U' },
  DE: { phonePh: '+49 151 23456789', streetPh: 'Hauptstraße 12', stateKey: 'addr.state.DE', postalLocal: 'PLZ', taxLabel: 'Steuer-ID', taxPh: '12345678901' },
  AT: { phonePh: '+43 664 1234567', streetPh: 'Mariahilfer Straße 12', postalLocal: 'PLZ' },
  NL: { phonePh: '+31 6 12345678', streetPh: 'Keizersgracht 12' },
  BE: { phonePh: '+32 470 12 34 56', streetPh: 'Rue Neuve 12' },
  IE: { phonePh: '+353 85 123 4567', streetPh: '12 Grafton Street', postalLocal: 'Eircode' },
};

export const countryFormat = (code) => FORMAT[code] || {};
