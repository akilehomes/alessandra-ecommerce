import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCountries, emptyAddress, formatAddress } from '../utils/geo';
import { ptError } from '../utils/errors';
import { useI18n } from '../i18n';
import AddressForm from './AddressForm';
import './Forms.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Aba "Endereços": enderecos de entrega e de faturamento salvos na conta
export default function AccountAddresses() {
  const { user, getAuthHeader } = useAuthStore();
  const countries = useCountries();
  const { t, countryName } = useI18n();
  const kindLabel = (k) => (k === 'billing' ? t('addresses.kindBilling') : t('addresses.kindShipping'));
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
      setMsg({ ok: false, text: t('addresses.loadError') });
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
      setMsg({ ok: true, text: t('addresses.saved') });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: ptError(err) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(t('addresses.confirmRemove'))) return;
    try {
      await axios.delete(`${API_URL}/addresses/${a.id}`, { headers: getAuthHeader() });
      setMsg({ ok: true, text: t('addresses.removed') });
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
        <h2>{editing.id ? t('addresses.editTitle') : (editing.kind === 'billing' ? t('addresses.newTitleBilling') : t('addresses.newTitleShipping'))}</h2>
        {msg && <div className={`fx-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
        <div className="fx-grid" style={{ marginBottom: 14 }}>
          <div className="fx-field">
            <label htmlFor="ad-kind">{t('addresses.type')}</label>
            <select id="ad-kind" value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
              <option value="shipping">{t('addresses.kindShipping')}</option>
              <option value="billing">{t('addresses.kindBilling')}</option>
            </select>
          </div>
          <div className="fx-field">
            <label htmlFor="ad-label">{t('addresses.label')}</label>
            <input id="ad-label" value={editing.label || ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder={t('addresses.labelPh')} maxLength={60} />
          </div>
        </div>
        <AddressForm value={editing} onChange={(v) => setEditing({ ...editing, ...v })} idPrefix="ad" />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0', fontSize: 14 }}>
          <input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
          {editing.kind === 'billing' ? t('addresses.makeDefaultBilling') : t('addresses.makeDefaultShipping')}
        </label>
        <div className="fx-actions">
          <button type="submit" className="fx-btn" disabled={saving}>{saving ? t('common.saving') : t('addresses.saveBtn')}</button>
          <button type="button" className="fx-btn ghost" onClick={() => { setEditing(null); setMsg(null); }}>{t('common.cancel')}</button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>{t('addresses.title')}</h2>
      {msg && <div className={`fx-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      <div className="fx-actions" style={{ marginBottom: 20 }}>
        <button type="button" className="fx-btn" onClick={() => startNew('shipping')}>{t('addresses.newShipping')}</button>
        <button type="button" className="fx-btn ghost" onClick={() => startNew('billing')}>{t('addresses.newBilling')}</button>
      </div>
      {loading ? <p>{t('common.loading')}</p> : list.length === 0 ? (
        <p className="fx-hint">{t('addresses.empty')}</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((a) => (
            <div key={a.id} className="fx-card">
              <div style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                {a.label || kindLabel(a.kind)}
                <span className="fx-badge" style={{ background: '#6b7280' }}>{kindLabel(a.kind)}</span>
                {a.is_default && <span className="fx-badge">{t('common.default')}</span>}
              </div>
              <div style={{ margin: '6px 0 2px', fontSize: 14 }}>{a.recipient_name}</div>
              <div style={{ fontSize: 14, color: '#374151' }}>{formatAddress(a, countries, countryName)}</div>
              {a.phone && <div style={{ fontSize: 13, color: '#6b7280' }}>{a.phone}</div>}
              <div className="fx-actions" style={{ marginTop: 10 }}>
                <button type="button" className="fx-btn ghost" onClick={() => { setMsg(null); setEditing({ ...a }); }}>{t('common.edit')}</button>
                {!a.is_default && <button type="button" className="fx-btn ghost" onClick={() => makeDefault(a)}>{t('addresses.makeDefault')}</button>}
                <button type="button" className="fx-btn danger" onClick={() => remove(a)}>{t('common.remove')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
