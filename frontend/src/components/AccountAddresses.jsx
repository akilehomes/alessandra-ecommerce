import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCountries, emptyAddress, formatAddress } from '../utils/geo';
import { ptError } from '../utils/errors';
import AddressForm from './AddressForm';
import './Forms.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const KIND_LABEL = { shipping: 'Entrega', billing: 'Faturamento' };

// Aba "Endereços": enderecos de entrega e de faturamento salvos na conta
export default function AccountAddresses() {
  const { user, getAuthHeader } = useAuthStore();
  const countries = useCountries();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = lista; objeto = formulario
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/addresses`, { headers: getAuthHeader() });
      setList(data);
    } catch (e) {
      setMsg({ ok: false, text: 'Não foi possível carregar seus endereços.' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => { load(); }, [load]);

  const startNew = (kind) => setEditing({ kind, label: '', is_default: list.every((a) => a.kind !== kind), ...emptyAddress(user.country || 'BR'), recipient_name: user.name || '' });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const body = { ...editing };
      if (editing.id) await axios.put(`${API_URL}/addresses/${editing.id}`, body, { headers: getAuthHeader() });
      else await axios.post(`${API_URL}/addresses`, body, { headers: getAuthHeader() });
      setEditing(null);
      setMsg({ ok: true, text: 'Endereço salvo.' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: ptError(err) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Remover este endereço?')) return;
    try {
      await axios.delete(`${API_URL}/addresses/${a.id}`, { headers: getAuthHeader() });
      setMsg({ ok: true, text: 'Endereço removido.' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: ptError(err) });
    }
  };

  const makeDefault = async (a) => {
    try {
      await axios.put(`${API_URL}/addresses/${a.id}`, { ...a, is_default: true }, { headers: getAuthHeader() });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: ptError(err) });
    }
  };

  if (editing) {
    return (
      <form onSubmit={save} style={{ maxWidth: 620 }}>
        <h2>{editing.id ? 'Editar endereço' : `Novo endereço de ${KIND_LABEL[editing.kind].toLowerCase()}`}</h2>
        {msg && <div className={`fx-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
        <div className="fx-grid" style={{ marginBottom: 14 }}>
          <div className="fx-field">
            <label htmlFor="ad-kind">Tipo</label>
            <select id="ad-kind" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
              <option value="shipping">Entrega</option>
              <option value="billing">Faturamento</option>
            </select>
          </div>
          <div className="fx-field">
            <label htmlFor="ad-label">Apelido (opcional)</label>
            <input id="ad-label" value={editing.label || ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Casa, Trabalho…" maxLength={60} />
          </div>
        </div>
        <AddressForm value={editing} onChange={(v) => setEditing({ ...editing, ...v })} idPrefix="ad" />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0', fontSize: 14 }}>
          <input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
          Usar como endereço padrão de {KIND_LABEL[editing.kind].toLowerCase()}
        </label>
        <div className="fx-actions">
          <button type="submit" className="fx-btn" disabled={saving}>{saving ? 'Salvando…' : 'Salvar endereço'}</button>
          <button type="button" className="fx-btn ghost" onClick={() => { setEditing(null); setMsg(null); }}>Cancelar</button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>Meus endereços</h2>
      {msg && <div className={`fx-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      <div className="fx-actions" style={{ marginBottom: 20 }}>
        <button type="button" className="fx-btn" onClick={() => startNew('shipping')}>+ Endereço de entrega</button>
        <button type="button" className="fx-btn ghost" onClick={() => startNew('billing')}>+ Endereço de faturamento</button>
      </div>
      {loading ? <p>Carregando…</p> : list.length === 0 ? (
        <p className="fx-hint">Você ainda não salvou nenhum endereço. Salve um para finalizar as compras mais rápido.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((a) => (
            <div key={a.id} className="fx-card">
              <div style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                {a.label || KIND_LABEL[a.kind]}
                <span className="fx-badge" style={{ background: '#6b7280' }}>{KIND_LABEL[a.kind]}</span>
                {a.is_default && <span className="fx-badge">Padrão</span>}
              </div>
              <div style={{ margin: '6px 0 2px', fontSize: 14 }}>{a.recipient_name}</div>
              <div style={{ fontSize: 14, color: '#374151' }}>{formatAddress(a, countries)}</div>
              {a.phone && <div style={{ fontSize: 13, color: '#6b7280' }}>{a.phone}</div>}
              <div className="fx-actions" style={{ marginTop: 10 }}>
                <button type="button" className="fx-btn ghost" onClick={() => { setMsg(null); setEditing({ ...a }); }}>Editar</button>
                {!a.is_default && <button type="button" className="fx-btn ghost" onClick={() => makeDefault(a)}>Tornar padrão</button>}
                <button type="button" className="fx-btn danger" onClick={() => remove(a)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
