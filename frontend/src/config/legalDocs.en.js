// English versions of the legal pages. Use {{field}} to insert data from config/company.js.
// NOTE: starting-point templates; have them reviewed by a lawyer before opening the store.

export const LEGAL_DOCS_EN = {
  termos: {
    title: 'Terms of use',
    updated: 'October 2026',
    sections: [
      { h: '1. Who we are', p: [
        'This website is operated by {{legalName}} ({{tradeName}}), registered under no. {{taxId}}, with its seat at {{address}}. Contact: {{email}}, {{phone}}.',
        'By browsing or buying at {{siteUrl}}, you agree to these terms. If you do not agree, please do not use the website.',
      ] },
      { h: '2. Account', p: [
        'To buy you need to create an account with true and up-to-date information. You are responsible for keeping your password confidential and for all activity on your account.',
        'We may suspend accounts with false information, misuse or signs of fraud.',
      ] },
      { h: '3. Products, prices and availability', p: [
        'Pieces are sold as described in the product description, photos and measurements. Because many pieces are handmade or hand-finished, small variations in colour, texture and size are natural.',
        'Prices are shown in Brazilian reais (R$) for Brazil and in euros (€) for Portugal and the other European Union countries. The order values (products, taxes, shipping and discounts) are calculated by our systems at the time of purchase and confirmed before payment.',
        'Products are subject to stock availability. If an item sells out after your order, we will contact you to offer a full refund or an alternative.',
      ] },
      { h: '4. Payment', p: [
        'Payments are processed by Stripe. We do not store your full card details. The order is only confirmed after the payment is approved.',
      ] },
      { h: '5. Delivery', p: ['Delivery times, prices and conditions are described in the Shipping policy page.'] },
      { h: '6. Returns, refunds and withdrawal', p: ['The conditions are described in the Returns and refunds page and respect the right of withdrawal provided by law.'] },
      { h: '7. Intellectual property', p: [
        'Texts, images, brand and design of this website belong to {{tradeName}} or are used with permission. Reproduction without written permission is prohibited.',
      ] },
      { h: '8. Limitation of liability', p: [
        'We make reasonable efforts to keep the website available and the information correct, but it may be unavailable or contain errors. This does not affect the rights the law gives you as a consumer.',
      ] },
      { h: '9. Governing law', p: [
        'For consumers in Brazil, the Consumer Protection Code and other Brazilian laws apply, with jurisdiction at the consumer’s domicile. For consumers in the European Union, the mandatory consumer protection rules of your country of residence also apply.',
      ] },
      { h: '10. Changes', p: ['We may update these terms. The current version is always the one published on this page, with its update date.'] },
    ],
  },

  privacidade: {
    title: 'Privacy policy',
    updated: 'October 2026',
    sections: [
      { h: '1. Who is responsible', p: [
        'The controller of your personal data (LGPD) and data controller (GDPR) is {{legalName}} ({{tradeName}}), no. {{taxId}}, {{address}}. Privacy contact: {{email}}.',
        'This policy complies with the Brazilian General Data Protection Law (LGPD) and the European Union General Data Protection Regulation (GDPR).',
      ] },
      { h: '2. What data we collect', p: [
        'Account data: name, email, phone, password (stored encrypted), country.',
        'Delivery and billing data: addresses and recipient.',
        'Tax data: CPF or CNPJ (Brazil); NIF or VAT number, when you provide them (Europe), to issue an invoice.',
        'Order data: items, amounts, shipping, tracking code and status history.',
        'Payment data: processed by Stripe; we only receive the confirmation and partial data (for example, the last digits of the card), never the full number.',
        'Technical data: IP address and browser information, used for security and fraud and abuse prevention.',
      ] },
      { h: '3. What we use it for and the legal basis', p: [
        'To carry out your purchase and deliver the order (performance of a contract).',
        'To issue invoices and meet tax and accounting obligations (legal obligation).',
        'To send emails about your order: confirmation, shipping, tracking, password recovery (performance of a contract).',
        'To prevent fraud and protect the website (legitimate interest).',
        'Marketing communications only if you consent; you can withdraw consent at any time (consent).',
      ] },
      { h: '4. Who we share it with', p: [
        'We share the minimum necessary with providers that operate the service: payment (Stripe), shipping and labels (Melhor Envio and carriers), email delivery (Mailgun), hosting and database (Railway and Neon) and, where applicable, invoice issuing.',
        'We may also share data with authorities when required by law.',
        'We do not sell your personal data.',
      ] },
      { h: '5. International transfers', p: [
        'Some providers may process data outside your country (for example, in the United States). In these cases we adopt the safeguards provided by the LGPD and the GDPR, such as standard contractual clauses.',
      ] },
      { h: '6. How long we keep it', p: [
        'Account data: while the account exists. Order and tax data: for the period required by the applicable tax and accounting law (generally several years). After that, they are deleted or anonymised.',
      ] },
      { h: '7. Your rights', p: [
        'You may request: confirmation that we process your data, access, correction, anonymisation, portability, deletion of data processed with consent, information about sharing and withdrawal of consent. In the European Union you may also object to processing and request restriction.',
        'To exercise any right, write to {{email}}. We reply within the legal deadline.',
        'You may also complain to the data protection authority: in Brazil, the ANPD; in the European Union, the authority of your country.',
      ] },
      { h: '8. Cookies and local storage', p: [
        'We use browser storage to keep your bag, your session and preferences (such as region, currency and language). These items are essential for the store to work. If we start using analytics or marketing cookies, we will ask for your consent first.',
      ] },
      { h: '9. Security', p: [
        'We adopt technical and organisational measures to protect data, such as encrypted connections (HTTPS), hashed passwords and access control. No system is completely free from failure; in case of a relevant incident, we will notify you and the authorities as required by law.',
      ] },
      { h: '10. Changes', p: ['We may update this policy. The current version is the one published on this page.'] },
    ],
  },

  trocas: {
    title: 'Returns and refunds',
    updated: 'October 2026',
    sections: [
      { h: '1. Right of withdrawal', p: [
        'Brazil: you may withdraw from the purchase within 7 (seven) calendar days from receiving the product, without giving a reason (article 49 of the Consumer Protection Code). The amounts paid, including shipping, will be refunded.',
        'European Union (including Portugal): you may withdraw from the purchase within 14 (fourteen) calendar days from receiving the product, without giving a reason.',
        'To exercise this right, write to {{email}} with your order number.',
      ] },
      { h: '2. How to return', p: [
        'After your request, we will send the return instructions. The product must be returned unused, with the original protective packaging where possible.',
        'In Brazil, return costs in case of withdrawal are borne by the store. In the European Union, the direct costs of return are borne by the customer, unless we inform you otherwise at the time of purchase.',
      ] },
      { h: '3. Refund', p: [
        'The refund is made using the same payment method, after we receive and check the product, within 14 days of the notice of withdrawal (European Union) or immediately after the return is confirmed (Brazil).',
      ] },
      { h: '4. Defective or wrong product', p: [
        'If the product arrives damaged, defective or different from what you bought, let us know within 7 days of receipt, with photos, at {{email}}. We will arrange a replacement, repair or refund, as required by law, at no cost to you.',
        'Please check the package on delivery and, if there is visible damage, note it at that moment and tell us.',
      ] },
      { h: '5. Made-to-measure or personalised products', p: [
        'Pieces made to measure or personalised to your specifications follow the conditions agreed in the quote and the applicable law. We will tell you these conditions before the order is confirmed.',
      ] },
      { h: '6. Order cancelled before shipping', p: ['You may ask to cancel before dispatch; in that case the amount is refunded in full.'] },
    ],
  },

  envio: {
    title: 'Shipping policy',
    updated: 'October 2026',
    sections: [
      { h: '1. Where we deliver', p: [
        'We deliver throughout Brazil and to Portugal and the other European Union countries listed at checkout.',
      ] },
      { h: '2. How shipping is calculated', p: [
        'Brazil: shipping is calculated in the bag and at checkout from the CEP (postal code), the weight and the packaging dimensions of each product. You choose among the available carriers and services, with price and delivery time.',
        'Europe: shipping is a fixed rate shown at checkout before payment.',
      ] },
      { h: '3. Delivery times', p: [
        'The delivery time shown at checkout is the carrier’s and starts after dispatch. Before dispatch we prepare and pack the piece; we state the preparation time on the product page when it differs from the standard.',
      ] },
      { h: '4. Large pieces and shipping on request', p: [
        'Bulky or very heavy pieces may not have automatic shipping. In these cases, you request a shipping quote and we reply with the best option.',
      ] },
      { h: '5. Tracking', p: [
        'As soon as the order is dispatched, you receive an email with the carrier and the tracking code. You can also follow it on the "Track order" page with the order number and your email.',
      ] },
      { h: '6. Taxes and fees in Europe', p: [
        'For deliveries within the European Union, the consumption tax (VAT) is shown in the order summary. Additional fees may apply depending on the country and carrier; we will tell you before payment whenever they are known.',
      ] },
      { h: '7. Address and receiving the order', p: [
        'Please check the address before completing the order. If the carrier cannot deliver because of an incorrect address or the recipient’s absence, re-shipping costs may be charged.',
      ] },
    ],
  },
};
