import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n';
import { ptError } from '../utils/errors';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { register, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      alert(t('auth.passwordMin', { n: 6 }));
      return;
    }

    const result = await register(formData.email, formData.password, formData.name, formData.phone);
    if (result.success) {
      navigate('/account/orders');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>{t('auth.registerTitle')}</h1>
        {error && <div className="error-message">{ptError(error)}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.fullName')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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
            <label htmlFor="phone">{t('auth.phoneOptional')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength="6"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? t('auth.creating') : t('auth.registerTitle')}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t('auth.haveAccount')} <Link to="/login">{t('auth.loginTitle')}</Link></p>
        </div>
      </div>
    </div>
  );
}
