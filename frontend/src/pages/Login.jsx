import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n';
import { ptError } from '../utils/errors';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/account/orders');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{t('auth.loginTitle')}</h1>
        {error && <div className="error-message">{ptError(error)}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <Link to="/forgot-password" className="forgot-link">{t('auth.forgot')}</Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? t('auth.loggingIn') : t('auth.loginTitle')}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t('auth.noAccount')} <Link to="/register">{t('auth.createAccount')}</Link></p>
        </div>
      </div>
    </div>
  );
}
