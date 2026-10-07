import React, { useState } from 'react';
import { useCountries, maskCep, lookupCep, onlyDigits } from '../utils/geo';
import './Forms.css';

// Formulario de endereco que muda conforme o pais (CEP/UF/bairro no Brasil; codigo postal e regiao na Europa).
// value: { recipient_name, phone, country, postal_code, street, number, complement, district, city, state }
export default function AddressForm({ value, onChange, idPrefix = 'addr', showRecipient = true, showPhone = true }) {
  const countries = useCountries();
  const [cepStatus, setCepStatus] = useState('');
  const country = countries.find((c) => c.code === value.country);
  const isBR = value.country === 'BR';

  const set = (patch) => onChange({ ...value, ...patch });
  const field = (name) => ({
    id: `${idPrefix}-${name}`,
    value: value[name] || '',
    onChange: (e) => set({ [name]: e.target.value }),
  });

  const changeCountry = (code) => {
    setCepStatus('');
    // Troca de pais: limpa o que depende dele
    onChange({ ...value, country: code, postal_code: '', state: '', district: '' });
  };

  const changeCep = async (raw) => {
    const masked = isBR ? maskCep(raw) : raw.toUpperCase();
    if (!isBR) return set({ postal_code: masked });
    set({ postal_code: masked });
    if (onlyDigits(masked).length === 8) {
      setCepStatus('Buscando endereço…');
      const found = await lookupCep(masked);
      if (found) {
        // Preenche so o que veio; o cliente continua podendo editar
        onChange({ ...value, postal_code: masked, street: found.street || value.street, district: found.district || value.district, city: found.city || value.city, state: found.state || value.state });
        setCepStatus('');
      } else {
        setCepStatus('CEP não encontrado. Preencha o endereço manualmente.');
      }
    } else {
      setCepStatus('');
    }
  };

  if (countries.length === 0) return <p className="fx-hint">Carregando…</p>;

  return (
    <div className="fx-grid">
      <div className="fx-field full">
        <label htmlFor={`${idPrefix}-country`}>País</label>
        <select id={`${idPrefix}-country`} value={value.country} onChange={(e) => changeCountry(e.target.value)}>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      {showRecipient && (
        <div className="fx-field full">
          <label htmlFor={`${idPrefix}-recipient`}>Nome de quem recebe</label>
          <input id={`${idPrefix}-recipient`} autoComplete="name" value={value.recipient_name || ''} onChange={(e) => set({ recipient_name: e.target.value })} />
        </div>
      )}

      <div className="fx-field">
        <label htmlFor={`${idPrefix}-postal`}>{country ? country.postalLabel : 'Código postal'}</label>
        <input
          id={`${idPrefix}-postal`}
          autoComplete="postal-code"
          inputMode={isBR ? 'numeric' : 'text'}
          value={value.postal_code || ''}
          onChange={(e) => changeCep(e.target.value)}
          placeholder={country ? country.postalExample : ''}
        />
        {cepStatus && <span className="fx-hint">{cepStatus}</span>}
      </div>

      {showPhone ? (
        <div className="fx-field">
          <label htmlFor={`${idPrefix}-phone`}>Telefone de contato</label>
          <input id={`${idPrefix}-phone`} type="tel" autoComplete="tel" value={value.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder={isBR ? '(11) 99999-9999' : '+351 912 345 678'} />
        </div>
      ) : <div />}

      <div className="fx-field full">
        <label htmlFor={`${idPrefix}-street`}>{isBR ? 'Rua / Avenida' : 'Morada (rua e número)'}</label>
        <input autoComplete="address-line1" {...field('street')} />
      </div>

      <div className="fx-field">
        <label htmlFor={`${idPrefix}-number`}>{isBR ? 'Número' : 'Número / Porta (se não constar na morada)'}</label>
        <input {...field('number')} />
      </div>
      <div className="fx-field">
        <label htmlFor={`${idPrefix}-complement`}>Complemento (opcional)</label>
        <input autoComplete="address-line2" {...field('complement')} placeholder={isBR ? 'Apto, bloco, casa…' : 'Andar, esquerdo, escada…'} />
      </div>

      {isBR && (
        <div className="fx-field">
          <label htmlFor={`${idPrefix}-district`}>Bairro</label>
          <input {...field('district')} />
        </div>
      )}

      <div className="fx-field">
        <label htmlFor={`${idPrefix}-city`}>Cidade</label>
        <input autoComplete="address-level2" {...field('city')} />
      </div>

      <div className="fx-field">
        <label htmlFor={`${idPrefix}-state`}>{isBR ? 'Estado' : 'Região / Distrito (opcional)'}</label>
        {isBR && country && country.states ? (
          <select id={`${idPrefix}-state`} value={value.state || ''} onChange={(e) => set({ state: e.target.value })}>
            <option value="">Selecione</option>
            {Object.entries(country.states).map(([uf, name]) => <option key={uf} value={uf}>{uf} — {name}</option>)}
          </select>
        ) : (
          <input autoComplete="address-level1" {...field('state')} />
        )}
      </div>
    </div>
  );
}
