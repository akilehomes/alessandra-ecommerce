// Paises atendidos e regras de endereco. E a unica fonte de verdade: o site consulta via GET /api/geo/countries.
// Aliquotas de imposto NAO ficam aqui (dependem de regime fiscal; ver TAX_RATE_BY_REGION em routes/orders.js).

const BR_STATES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

// [codigo, nome em portugues, regex do codigo postal (sem ancoras), exemplo]
const EU_COUNTRIES = [
  ['AT', 'Áustria', '\\d{4}', '1010'],
  ['BE', 'Bélgica', '\\d{4}', '1000'],
  ['BG', 'Bulgária', '\\d{4}', '1000'],
  ['HR', 'Croácia', '\\d{5}', '10000'],
  ['CY', 'Chipre', '\\d{4}', '1010'],
  ['CZ', 'Chéquia', '\\d{3} ?\\d{2}', '110 00'],
  ['DK', 'Dinamarca', '\\d{4}', '1050'],
  ['EE', 'Estônia', '\\d{5}', '10111'],
  ['FI', 'Finlândia', '\\d{5}', '00100'],
  ['FR', 'França', '\\d{5}', '75001'],
  ['DE', 'Alemanha', '\\d{5}', '10115'],
  ['GR', 'Grécia', '\\d{3} ?\\d{2}', '105 57'],
  ['HU', 'Hungria', '\\d{4}', '1011'],
  ['IE', 'Irlanda', '[A-Za-z0-9]{3} ?[A-Za-z0-9]{4}', 'D02 X285'],
  ['IT', 'Itália', '\\d{5}', '00100'],
  ['LV', 'Letônia', '(LV-)?\\d{4}', 'LV-1010'],
  ['LT', 'Lituânia', '(LT-)?\\d{5}', 'LT-01100'],
  ['LU', 'Luxemburgo', '\\d{4}', '1009'],
  ['MT', 'Malta', '[A-Za-z]{3} ?\\d{2,4}', 'VLT 1117'],
  ['NL', 'Países Baixos', '\\d{4} ?[A-Za-z]{2}', '1012 AB'],
  ['PL', 'Polônia', '\\d{2}-\\d{3}', '00-001'],
  ['PT', 'Portugal', '\\d{4}-\\d{3}', '1000-001'],
  ['RO', 'Romênia', '\\d{6}', '010011'],
  ['SK', 'Eslováquia', '\\d{3} ?\\d{2}', '811 01'],
  ['SI', 'Eslovênia', '\\d{4}', '1000'],
  ['ES', 'Espanha', '\\d{5}', '28001'],
  ['SE', 'Suécia', '\\d{3} ?\\d{2}', '111 22'],
];

const COUNTRIES = {
  BR: {
    code: 'BR',
    name: 'Brasil',
    region: 'BR',
    currency: 'BRL',
    postalLabel: 'CEP',
    postalPattern: '\\d{5}-?\\d{3}',
    postalExample: '01310-100',
    stateLabel: 'Estado',
    states: BR_STATES,
    requiresDistrict: true,
    phoneCode: '+55',
  },
};
for (const [code, name, pattern, example] of EU_COUNTRIES) {
  COUNTRIES[code] = {
    code,
    name,
    region: code === 'PT' ? 'PT' : 'EU',
    currency: 'EUR',
    postalLabel: 'Código postal',
    postalPattern: pattern,
    postalExample: example,
    stateLabel: 'Região / Distrito',
    states: null, // texto livre e opcional
    requiresDistrict: false,
  };
}

const getCountry = (code) => COUNTRIES[String(code || '').toUpperCase()] || null;

module.exports = { COUNTRIES, getCountry, BR_STATES };
