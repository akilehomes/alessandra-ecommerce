import React, { useEffect } from 'react';
import { formatAddress, useCountries, emptyAddress } from '../utils/geo';
import AddressForm from './AddressForm';
import './Forms.css';

// Escolhe um endereco salvo (cartoes) ou digita um novo.
// saved: enderecos da conta do tipo certo; selectedId: id salvo ou 'new'; value: endereco em edicao
export default function AddressPicker({ saved, selectedId, onSelect, value, onChange, idPrefix, showRecipient = true, showPhone = true, defaultCountry = 'BR' }) {
  const countries = useCountries();

  // Ao trocar de cartao, o formulario passa a refletir o endereco escolhido
  const pick = (id) => {
    onSelect(id);
    if (id === 'new') onChange(emptyAddress(defaultCountry));
    else {
      const a = saved.find((s) => s.id === id);
      if (a) onChange({ ...a });
    }
  };

  // Seleciona o padrao automaticamente na primeira vez
  useEffect(() => {
    if (selectedId === undefined && saved.length > 0) pick((saved.find((s) => s.is_default) || saved[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.length]);

  return (
    <div>
      {saved.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          {saved.map((a) => (
            <label key={a.id} className={`fx-card ${selectedId === a.id ? 'selected' : ''}`} style={{ cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="radio" name={`${idPrefix}-saved`} checked={selectedId === a.id} onChange={() => pick(a.id)} style={{ marginTop: 4 }} />
              <span style={{ fontSize: 14 }}>
                <strong>{a.label || a.recipient_name}</strong>{a.is_default && <span className="fx-badge">Padrão</span>}
                <br />{a.recipient_name}<br />
                <span style={{ color: '#4b5563' }}>{formatAddress(a, countries)}</span>
              </span>
            </label>
          ))}
          <label className={`fx-card ${selectedId === 'new' ? 'selected' : ''}`} style={{ cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="radio" name={`${idPrefix}-saved`} checked={selectedId === 'new'} onChange={() => pick('new')} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Usar outro endereço</span>
          </label>
        </div>
      )}
      {(saved.length === 0 || selectedId === 'new') && (
        <AddressForm value={value} onChange={onChange} idPrefix={idPrefix} showRecipient={showRecipient} showPhone={showPhone} />
      )}
    </div>
  );
}
