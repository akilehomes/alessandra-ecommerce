import React, { useState } from 'react';
import axios from 'axios';
import './ShippingCalculator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const savedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser')) || {};
  } catch (e) {
    return {};
  }
};

// Formulario "pedir orcamento de frete" para itens que as transportadoras automaticas nao atendem
//   items: [{ productId, quantity, name }]   specialProducts: ids dos itens sem frete automatico
export default function SpecialShippingRequest({ items, specialProducts = [], cep }) {
  const user = savedUser();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const special = items.filter((i) => specialProducts.includes(i.productId));
    const main = special[0] || items[0];
    const list = items
      .map((i) => `- ${i.name || i.productId} x ${i.quantity}${specialProducts.includes(i.productId) ? '  (frete especial)' : ''}`)
      .join('\n');
    const description = [`Orçamento de frete`, `CEP de entrega: ${cep || 'não informado'}`, `Itens:`, list, form.message ? `\nObservação: ${form.message}` : '']
      .join('\n')
      .trim();

    try {
      await axios.post(`${API_URL}/products/quotation/request`, {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        product_id: main.productId,
        quantity: main.quantity,
        custom_description: description,
      });
      setDone(true);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Você já enviou alguns pedidos. Aguarde um pouco e tente de novo.'
          : 'Não foi possível enviar agora. Confira os dados e tente novamente.'
      );
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <p className="psc-success" role="status">
        Recebemos seu pedido! Vamos responder por e-mail com o valor do frete.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="psc-button psc-button--wide" onClick={() => setOpen(true)}>
        Pedir orçamento de frete
      </button>
    );
  }

  return (
    <form className="psc-quote" onSubmit={handleSubmit}>
      <label className="psc-field">
        <span>Nome</span>
        <input className="psc-input" value={form.name} onChange={set('name')} required minLength={2} maxLength={120} autoComplete="name" />
      </label>
      <label className="psc-field">
        <span>E-mail</span>
        <input className="psc-input" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
      </label>
      <label className="psc-field">
        <span>Telefone / WhatsApp (opcional)</span>
        <input className="psc-input" type="tel" value={form.phone} onChange={set('phone')} maxLength={30} autoComplete="tel" />
      </label>
      <label className="psc-field">
        <span>Observação (opcional)</span>
        <textarea className="psc-input psc-textarea" value={form.message} onChange={set('message')} maxLength={600} rows={3} />
      </label>
      {error && <p className="psc-error">{error}</p>}
      <button type="submit" className="psc-button psc-button--wide" disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar pedido de orçamento'}
      </button>
    </form>
  );
}
