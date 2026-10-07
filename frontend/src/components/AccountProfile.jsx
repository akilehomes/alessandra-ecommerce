import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCountries } from '../utils/geo';
import { ptError } from '../utils/errors';
import { useI18n } from '../i18n';
import DocumentFields from './DocumentFields';
import './Forms.css';

// Aba "Dados pessoais": nome, telefone, pais e documento fiscal (usados no checkout e na nota fiscal)
export default function AccountProfile() {
  const { user, updateProfile } = useAuthStore();
  const countries = useCountries();
  const { t, countryName } = useI18n();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    country: user.country || 'BR',
    person_type: user.person_type || 'individual',
    company_name: user.company_name || '',
    document_number: user.document_number || '',
  });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const result = await updateProfile({ ...form, document_type: undefined });
      setMsg(result.success ? { ok: true, text: t('profile.saved') } : { ok: false, text: ptError(result.error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="profile-section" style={{ maxWidth: 620 }}>
      <h2>{t('profile.title')}</h2>
      {msg && <div className={`fx-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      <div className="fx-grid">
        <div className="fx-field full">
          <label htmlFor="pf-email">{t('profile.email')}</label>
          <input id="pf-email" value={user.email} disabled />
        </div>
        <div className="fx-field">
          <label htmlFor="pf-name">{t('profile.name')}</label>
          <input id="pf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
        </div>
        <div className="fx-field">
          <label htmlFor="pf-phone">{t('profile.phone')}</label>
          <input id="pf-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" placeholder="+55 11 99999-9999" />
        </div>
        <div className="fx-field full">
          <label htmlFor="pf-country">{t('profile.country')}</label>
          <select id="pf-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, document_number: '' })}>
            {countries.map((c) => <option key={c.code} value={c.code}>{countryName(c.code)}</option>)}
          </select>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 12px', fontFamily: 'Outfit, sans-serif' }}>{t('profile.fiscal')}</h3>
      <DocumentFields country={form.country} value={form} onChange={(v) => setForm({ ...form, ...v })} idPrefix="pf" />

      <div className="fx-actions" style={{ marginTop: 20 }}>
        <button type="submit" className="fx-btn" disabled={saving}>{saving ? t('common.saving') : t('profile.save')}</button>
      </div>
    </form>
  );
}
