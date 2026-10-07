import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../components/PasswordInput';
import { useI18n } from '../i18n';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ResetPassword({ admin = false }) {
  const { t } = useI18n();
  const base = admin ? '/admin' : '/auth';
  const loginPath = admin ? '/admin/login' : '/login';
  const forgotPath = admin ? '/admin/forgot-password' : '/forgot-password';
  const minLen = admin ? 8 : 6;
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < minLen) {
      setError(t('auth.passwordMin', { n: minLen }));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}${base}/reset-password`, { token, password });
      setDone(true);
    } catch (err) {
      setError(
        err.response?.status === 400
          ? t('auth.resetExpired')
          : t('auth.resetFail')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h1>{t('auth.resetTitle')}</h1>
          <div className="error-message">{t('auth.resetInvalidLink')}</div>
          <div className="auth-footer">
            <p><Link to={forgotPath}>{t('auth.requestNewLink')}</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{t('auth.resetTitle')}</h1>

        {done ? (
          <>
            <div className="success-message">{t('auth.resetDone')}</div>
            <Link to={loginPath} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              {t('auth.loginTitle')}
            </Link>
          </>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">{t('auth.newPassword')}</label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={minLen}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm">{t('auth.confirmPassword')}</label>
                <PasswordInput
                  id="confirm"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={minLen}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? t('common.saving') : t('auth.saveNewPassword')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
