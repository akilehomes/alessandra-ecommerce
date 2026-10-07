import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useI18n } from '../i18n';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ForgotPassword({ admin = false }) {
  const { t, lang } = useI18n();
  const base = admin ? '/admin' : '/auth';
  const loginPath = admin ? '/admin/login' : '/login';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}${base}/forgot-password`, { email, language: lang });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? t('auth.forgotTooMany')
          : t('auth.forgotFail')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{t('auth.forgotTitle')}</h1>

        {sent ? (
          <>
            <div className="success-message">
              {t('auth.forgotSent')}
            </div>
            <div className="auth-footer">
              <p><Link to={loginPath}>{t('auth.backToLogin')}</Link></p>
            </div>
          </>
        ) : (
          <>
            <p className="auth-hint">{t('auth.forgotHint')}</p>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">{t('auth.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? t('auth.sending') : t('auth.sendLink')}
              </button>
            </form>
            <div className="auth-footer">
              <p><Link to={loginPath}>{t('auth.backToLogin')}</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
