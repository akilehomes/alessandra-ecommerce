// Documentos fiscais: CPF/CNPJ (Brasil), NIF (Portugal), VAT/IVA (empresas na UE) e identificador generico.
const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

function isValidCpf(value) {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(d[len])) return false;
  }
  return true;
}

function isValidCnpj(value) {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

// NIF portugues: 9 digitos, digito de controle modulo 11
function isValidNifPt(value) {
  const d = onlyDigits(value);
  if (d.length !== 9) return false;
  const sum = d.slice(0, 8).split('').reduce((acc, c, i) => acc + Number(c) * (9 - i), 0);
  const check = 11 - (sum % 11);
  return (check >= 10 ? 0 : check) === Number(d[8]);
}

// Numero de IVA/VAT intracomunitario: prefixo do pais + 2 a 12 caracteres (a conferencia oficial no VIES e feita a parte)
const normalizeVat = (value) => String(value ?? '').toUpperCase().replace(/[\s.\-]/g, '');
const isValidVat = (value) => /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(normalizeVat(value));

const normalizeTaxId = (value) => String(value ?? '').toUpperCase().replace(/[\s.\-/]/g, '');
const isValidTaxId = (value) => /^[A-Z0-9]{5,20}$/.test(normalizeTaxId(value));

// Tipos aceitos por pais e tipo de pessoa; "required" diz se o documento e obrigatorio na compra.
function documentRules(country, personType) {
  const company = personType === 'company';
  if (country === 'BR') {
    return company
      ? { types: ['cnpj'], required: true, label: 'CNPJ' }
      : { types: ['cpf'], required: true, label: 'CPF' };
  }
  if (company) return { types: ['vat'], required: true, label: 'Número de IVA / VAT' };
  if (country === 'PT') return { types: ['nif'], required: false, label: 'NIF (opcional)' };
  return { types: ['tax_id'], required: false, label: 'Número de contribuinte (opcional)' };
}

const VALIDATORS = {
  cpf: [isValidCpf, onlyDigits],
  cnpj: [isValidCnpj, onlyDigits],
  nif: [isValidNifPt, onlyDigits],
  vat: [isValidVat, normalizeVat],
  tax_id: [isValidTaxId, normalizeTaxId],
};

// Valida e normaliza o documento do cliente. Retorna { ok, type, number } ou { ok: false, error }.
function validateDocument({ country, personType, type, number }) {
  const person = personType === 'company' ? 'company' : 'individual';
  const rules = documentRules(country, person);
  const empty = number === undefined || number === null || String(number).trim() === '';
  if (empty) {
    return rules.required
      ? { ok: false, error: `${rules.label} is required` }
      : { ok: true, type: null, number: null, personType: person };
  }
  const docType = type || rules.types[0];
  if (!rules.types.includes(docType)) return { ok: false, error: 'Invalid document type for this country' };
  const [isValid, normalize] = VALIDATORS[docType];
  if (!isValid(number)) return { ok: false, error: `Invalid ${rules.label.replace(' (opcional)', '')}` };
  return { ok: true, type: docType, number: normalize(number), personType: person };
}

module.exports = { isValidCpf, isValidCnpj, isValidNifPt, isValidVat, documentRules, validateDocument };
