// Mensagens do servidor (em ingles) -> portugues para o cliente
const RULES = [
  [/CPF is required/i, 'Informe o CPF.'],
  [/Invalid CPF/i, 'CPF inválido. Confira os números.'],
  [/Invalid CNPJ/i, 'CNPJ inválido. Confira os números.'],
  [/CNPJ is required/i, 'Informe o CNPJ.'],
  [/Invalid NIF/i, 'NIF inválido. Confira os números.'],
  [/IVA \/ VAT is required|VAT.*required/i, 'Informe o número de IVA / VAT da empresa.'],
  [/Invalid Número de IVA|Invalid .*VAT/i, 'Número de IVA / VAT inválido. Exemplo: PT123456789.'],
  [/Invalid Número de contribuinte/i, 'Número de contribuinte inválido.'],
  [/Company name is required/i, 'Informe a razão social da empresa.'],
  [/Invalid CEP/i, 'CEP inválido.'],
  [/Invalid postal code/i, 'Código postal inválido para este país.'],
  [/Invalid state/i, 'Selecione o estado.'],
  [/District is required/i, 'Informe o bairro.'],
  [/Number is required/i, 'Informe o número.'],
  [/Recipient name is required/i, 'Informe o nome de quem recebe.'],
  [/Street, city and postal code are required/i, 'Preencha rua, cidade e CEP / código postal.'],
  [/Country is not supported/i, 'Ainda não entregamos neste país.'],
  [/up to \d+ addresses/i, 'Você já tem o máximo de endereços salvos. Remova algum para adicionar outro.'],
  [/Name is required/i, 'Informe o nome.'],
  [/not available for sale in this country/i, 'Algum produto do carrinho ainda não está à venda neste país.'],
  [/Shipping to this country is not available/i, 'Ainda não calculamos frete para este país. Fale conosco para um orçamento.'],
  [/out of stock/i, 'Um dos produtos acabou de esgotar.'],
  [/available$/i, 'A quantidade pedida passa do estoque disponível.'],
  [/special shipping/i, 'Este pedido precisa de frete especial. Solicite um orçamento.'],
  [/shipping option is not available/i, 'A opção de frete escolhida não está mais disponível. Escolha novamente.'],
];

export function ptError(error, fallback = 'Algo deu errado. Tente novamente.') {
  const raw = (error && error.response && error.response.data && error.response.data.error) || (typeof error === 'string' ? error : '');
  if (!raw) return fallback;
  const rule = RULES.find(([re]) => re.test(raw));
  return rule ? rule[1] : raw;
}
