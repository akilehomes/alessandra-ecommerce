import { tNow } from '../i18n';

// Mensagens do servidor (em ingles) -> chave de texto traduzida
const RULES = [
  [/CPF is required/i, 'err.cpfRequired'],
  [/Invalid CPF/i, 'err.cpfInvalid'],
  [/Invalid CNPJ/i, 'err.cnpjInvalid'],
  [/CNPJ is required/i, 'err.cnpjRequired'],
  [/Invalid NIF/i, 'err.nifInvalid'],
  [/IVA \/ VAT is required|VAT.*required/i, 'err.vatRequired'],
  [/Invalid Número de IVA|Invalid .*VAT/i, 'err.vatInvalid'],
  [/Invalid Número de contribuinte/i, 'err.taxIdInvalid'],
  [/Company name is required/i, 'err.companyRequired'],
  [/Invalid CEP/i, 'err.cepInvalid'],
  [/Invalid postal code/i, 'err.postalInvalid'],
  [/Invalid state/i, 'err.stateInvalid'],
  [/District is required/i, 'err.districtRequired'],
  [/Number is required/i, 'err.numberRequired'],
  [/Recipient name is required/i, 'err.recipientRequired'],
  [/Street, city and postal code are required/i, 'err.addressIncomplete'],
  [/Country is not supported/i, 'err.countryUnsupported'],
  [/up to \d+ addresses/i, 'err.maxAddresses'],
  [/Name is required/i, 'err.nameRequired'],
  [/not available for sale in this country/i, 'err.notAvailableCountry'],
  [/Shipping to this country is not available/i, 'err.shippingUnavailable'],
  [/out of stock/i, 'err.outOfStock'],
  [/available$/i, 'err.overStock'],
  [/special shipping/i, 'err.specialShipping'],
  [/shipping option is not available/i, 'err.shippingOptionGone'],
  [/Invalid credentials/i, 'autherr.invalidCredentials'],
  [/already registered/i, 'autherr.emailTaken'],
  [/Too many/i, 'autherr.tooMany'],
  [/Invalid email/i, 'autherr.invalidEmail'],
  [/at least 6 characters/i, 'autherr.passwordShort'],
  [/Session expired/i, 'autherr.session'],
  [/locked/i, 'autherr.locked'],
];

// Aceita um erro do axios ou um texto; devolve a mensagem no idioma atual
export function ptError(error, fallback) {
  const raw = (error && error.response && error.response.data && error.response.data.error) || (typeof error === 'string' ? error : '');
  const rule = raw ? RULES.find(([re]) => re.test(raw)) : null;
  if (rule) return tNow(rule[1]);
  return raw || fallback || tNow('common.tryAgain');
}
export { ptError as translateError };
