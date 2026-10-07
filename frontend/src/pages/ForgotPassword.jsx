import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ForgotPassword({ admin = false }) {
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
      await axios.post(`${API_URL}${base}/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Muitas tentativas. Tente novamente em alguns minutos.'
          : 'Não foi possível enviar agora. Verifique o e-mail e tente de novo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Recuperar senha</h1>

        {sent ? (
          <>
            <div className="success-message">
              Se esse e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Ele vale por 1 hora.
              Confira também a caixa de spam.
            </div>
            <div className="auth-footer">
              <p><Link to={loginPath}>Voltar para o login</Link></p>
            </div>
          </>
        ) : (
          <>
            <p className="auth-hint">Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.</p>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
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
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
            <div className="auth-footer">
              <p><Link to={loginPath}>Voltar para o login</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
