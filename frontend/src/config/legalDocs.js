// Textos das paginas legais. Use {{campo}} para inserir dados de config/company.js.
// ATENCAO: sao modelos de partida; revise com advogado/contador antes de abrir a loja.

export const LEGAL_DOCS = {
  termos: {
    title: 'Termos de uso',
    updated: 'Outubro de 2026',
    sections: [
      { h: '1. Quem somos', p: [
        'Este site é operado por {{legalName}} ({{tradeName}}), inscrita sob o nº {{taxId}}, com sede em {{address}}. Contato: {{email}}, {{phone}}.',
        'Ao navegar ou comprar em {{siteUrl}}, você concorda com estes termos. Se não concordar, não utilize o site.',
      ] },
      { h: '2. Cadastro e conta', p: [
        'Para comprar é necessário criar uma conta com dados verdadeiros e atualizados. Você é responsável pela confidencialidade da sua senha e por toda atividade feita na sua conta.',
        'Podemos suspender contas com dados falsos, uso indevido ou indícios de fraude.',
      ] },
      { h: '3. Produtos, preços e disponibilidade', p: [
        'As peças são vendidas conforme descrição, fotos e medidas informadas na página do produto. Por serem, em muitos casos, peças artesanais ou de acabamento manual, pequenas variações de cor, textura e tamanho são naturais.',
        'Os preços são exibidos em reais (R$) para o Brasil e em euros (€) para Portugal e demais países da União Europeia. Os valores do pedido (produtos, impostos, frete e descontos) são calculados por nossos sistemas no momento da compra e confirmados antes do pagamento.',
        'Produtos sujeitos à disponibilidade de estoque. Se um item se esgotar após o pedido, entraremos em contato para oferecer reembolso integral ou alternativa.',
      ] },
      { h: '4. Pagamento', p: [
        'Os pagamentos são processados pela Stripe. Não armazenamos os dados completos do seu cartão. O pedido só é confirmado após a aprovação do pagamento.',
      ] },
      { h: '5. Entrega', p: ['Prazos, valores e condições de envio estão descritos na página Política de envio.'] },
      { h: '6. Trocas, devoluções e arrependimento', p: ['As condições estão descritas na página Trocas e devoluções e respeitam o direito de arrependimento previsto em lei.'] },
      { h: '7. Propriedade intelectual', p: [
        'Textos, imagens, marca e design do site pertencem a {{tradeName}} ou são usados com autorização. É proibida a reprodução sem permissão por escrito.',
      ] },
      { h: '8. Limitação de responsabilidade', p: [
        'Empregamos esforços razoáveis para manter o site disponível e as informações corretas, mas ele pode ficar indisponível ou conter erros. Isso não afeta os direitos que a lei garante a você como consumidor.',
      ] },
      { h: '9. Lei aplicável e foro', p: [
        'Para consumidores no Brasil, aplicam-se o Código de Defesa do Consumidor e demais leis brasileiras, com foro no domicílio do consumidor. Para consumidores na União Europeia, aplicam-se também as normas imperativas de proteção ao consumidor do seu país de residência.',
      ] },
      { h: '10. Alterações', p: ['Podemos atualizar estes termos. A versão vigente é sempre a publicada nesta página, com a data de atualização.'] },
    ],
  },

  privacidade: {
    title: 'Política de privacidade',
    updated: 'Outubro de 2026',
    sections: [
      { h: '1. Quem é o responsável', p: [
        'O responsável pelo tratamento dos seus dados pessoais (controlador, na LGPD; responsável pelo tratamento, no RGPD) é {{legalName}} ({{tradeName}}), nº {{taxId}}, {{address}}. Contato para assuntos de privacidade: {{email}}.',
        'Esta política atende à Lei Geral de Proteção de Dados (Brasil, LGPD) e ao Regulamento Geral sobre a Proteção de Dados (União Europeia, RGPD).',
      ] },
      { h: '2. Quais dados coletamos', p: [
        'Dados de cadastro: nome, e-mail, telefone, senha (guardada de forma criptografada), país.',
        'Dados de entrega e faturamento: endereços e destinatário.',
        'Dados fiscais: CPF ou CNPJ (Brasil); NIF ou número de IVA/VAT, quando você os informa (Europa), para emissão de nota fiscal ou fatura.',
        'Dados do pedido: itens, valores, frete, código de rastreio e histórico de status.',
        'Dados de pagamento: processados pela Stripe; nós recebemos apenas a confirmação e dados parciais (por exemplo, final do cartão), nunca o número completo.',
        'Dados técnicos: endereço IP e informações do navegador, usados para segurança e prevenção de fraude e abusos.',
      ] },
      { h: '3. Para que usamos e em que base legal', p: [
        'Executar sua compra e entregar o pedido (execução de contrato).',
        'Emitir nota fiscal ou fatura e cumprir obrigações fiscais e contábeis (obrigação legal).',
        'Enviar e-mails sobre o seu pedido: confirmação, envio, rastreio, recuperação de senha (execução de contrato).',
        'Prevenir fraudes e proteger o site (legítimo interesse).',
        'Comunicações de marketing apenas se você consentir; você pode retirar o consentimento a qualquer momento (consentimento).',
      ] },
      { h: '4. Com quem compartilhamos', p: [
        'Compartilhamos o mínimo necessário com prestadores que operam o serviço: pagamento (Stripe), envio e etiquetas (Melhor Envio e transportadoras), envio de e-mails (Mailgun), hospedagem e banco de dados (Railway e Neon) e, quando aplicável, emissão de notas fiscais.',
        'Também podemos compartilhar dados com autoridades quando a lei exigir.',
        'Não vendemos seus dados pessoais.',
      ] },
      { h: '5. Transferência internacional', p: [
        'Alguns prestadores podem tratar dados fora do seu país (por exemplo, nos Estados Unidos). Nesses casos, adotamos as salvaguardas previstas na LGPD e no RGPD, como cláusulas contratuais padrão.',
      ] },
      { h: '6. Por quanto tempo guardamos', p: [
        'Dados de conta: enquanto a conta existir. Dados de pedidos e fiscais: pelo prazo exigido pela legislação fiscal e contábil aplicável (em geral, vários anos). Depois disso, são excluídos ou anonimizados.',
      ] },
      { h: '7. Seus direitos', p: [
        'Você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização, portabilidade, eliminação dos dados tratados com consentimento, informações sobre compartilhamento e a revogação do consentimento. Na União Europeia, também pode se opor ao tratamento e pedir sua limitação.',
        'Para exercer qualquer direito, escreva para {{email}}. Respondemos no prazo legal.',
        'Você também pode reclamar à autoridade de proteção de dados: no Brasil, a ANPD; na União Europeia, a autoridade do seu país.',
      ] },
      { h: '8. Cookies e armazenamento local', p: [
        'Usamos armazenamento do navegador para manter sua sacola, sua sessão e preferências (como região e moeda). São itens essenciais ao funcionamento da loja. Se passarmos a usar cookies de análise ou marketing, pediremos o seu consentimento antes.',
      ] },
      { h: '9. Segurança', p: [
        'Adotamos medidas técnicas e organizacionais para proteger os dados, como conexão criptografada (HTTPS), senhas protegidas por hash e controle de acesso. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante, comunicaremos você e as autoridades conforme a lei.',
      ] },
      { h: '10. Alterações', p: ['Podemos atualizar esta política. A versão vigente é a publicada nesta página.'] },
    ],
  },

  trocas: {
    title: 'Trocas e devoluções',
    updated: 'Outubro de 2026',
    sections: [
      { h: '1. Direito de arrependimento', p: [
        'Brasil: você pode desistir da compra em até 7 (sete) dias corridos, contados do recebimento do produto, sem precisar justificar (art. 49 do Código de Defesa do Consumidor). Os valores pagos, inclusive o frete, serão devolvidos.',
        'União Europeia (incluindo Portugal): você pode desistir da compra em até 14 (catorze) dias corridos, contados do recebimento do produto, sem precisar justificar.',
        'Para exercer o direito, escreva para {{email}} informando o número do pedido.',
      ] },
      { h: '2. Como devolver', p: [
        'Depois da sua solicitação, enviaremos as instruções de devolução. O produto deve voltar sem sinais de uso, com a embalagem protetora original, quando possível.',
        'No Brasil, os custos da devolução em caso de arrependimento ficam a cargo da loja. Na União Europeia, os custos diretos de devolução ficam a cargo do cliente, salvo se informarmos o contrário no momento da compra.',
      ] },
      { h: '3. Reembolso', p: [
        'O reembolso é feito pelo mesmo meio de pagamento utilizado, após o recebimento e a conferência do produto, no prazo de até 14 dias da comunicação da desistência (União Europeia) ou de forma imediata após a confirmação da devolução (Brasil).',
      ] },
      { h: '4. Produto com defeito ou diferente do pedido', p: [
        'Se o produto chegar danificado, com defeito ou diferente do que foi comprado, avise-nos em até 7 dias após o recebimento, com fotos, para {{email}}. Providenciaremos a troca, o reparo ou o reembolso, conforme a lei, sem custo para você.',
        'Confira o pacote na entrega e, se houver avaria visível, registre na hora e nos avise.',
      ] },
      { h: '5. Produtos sob medida ou personalizados', p: [
        'Peças feitas sob medida ou personalizadas conforme as suas especificações seguem as condições combinadas no orçamento e a lei aplicável. Informaremos essas condições antes da confirmação do pedido.',
      ] },
      { h: '6. Pedido cancelado antes do envio', p: ['Você pode pedir o cancelamento antes da postagem; nesse caso, o valor é reembolsado integralmente.'] },
    ],
  },

  envio: {
    title: 'Política de envio',
    updated: 'Outubro de 2026',
    sections: [
      { h: '1. Para onde entregamos', p: [
        'Entregamos em todo o Brasil e em Portugal e demais países da União Europeia listados no checkout.',
      ] },
      { h: '2. Como o frete é calculado', p: [
        'Brasil: o frete é calculado na sacola e no checkout a partir do CEP, do peso e das medidas da embalagem de cada produto. Você escolhe entre as transportadoras e serviços disponíveis, com prazo e valor.',
        'Europa: o frete é uma tarifa fixa informada no checkout antes do pagamento.',
      ] },
      { h: '3. Prazos', p: [
        'O prazo exibido no checkout é o da transportadora e começa a contar depois da postagem. Antes da postagem, preparamos e embalamos a peça; informamos o prazo de preparo na página do produto, quando for diferente do padrão.',
      ] },
      { h: '4. Peças grandes e frete sob consulta', p: [
        'Peças volumosas ou muito pesadas podem não ter frete automático. Nesses casos, você solicita um orçamento de frete e nós respondemos com a melhor opção.',
      ] },
      { h: '5. Rastreio', p: [
        'Assim que o pedido é postado, você recebe um e-mail com a transportadora e o código de rastreio. Você também pode acompanhar na página "Acompanhar pedido" com o número do pedido e o e-mail.',
      ] },
      { h: '6. Impostos e taxas na Europa', p: [
        'Para entregas na União Europeia, o imposto sobre o consumo (IVA) é mostrado no resumo do pedido. Podem existir taxas adicionais, conforme o país e a transportadora; informaremos antes do pagamento sempre que forem conhecidas.',
      ] },
      { h: '7. Endereço e recebimento', p: [
        'Confira o endereço antes de concluir o pedido. Se a transportadora não conseguir entregar por endereço incorreto ou ausência do destinatário, custos de reenvio podem ser cobrados.',
      ] },
    ],
  },
};
