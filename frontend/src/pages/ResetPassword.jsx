import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ResetPassword({ admin = false }) {
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
      setError(`A senha deve ter pelo menos ${minLen} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}${base}/reset-password`, { token, password });
      setDone(true);
    } catch (err) {
      setError(
        err.response?.status === 400
          ? 'Este link é inválido ou já expirou. Peça um novo.'
          : 'Não foi possível redefinir a senha agora. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h1>Nova senha</h1>
          <div className="error-message">Link inválido.</div>
          <div className="auth-footer">
            <p><Link to={forgotPath}>Pedir um novo link</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Nova senha</h1>

        {done ? (
          <>
            <div className="success-message">Senha atualizada com sucesso.</div>
            <Link to={loginPath} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Entrar
            </Link>
          </>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">Nova senha</label>
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
                <label htmlFor="confirm">Confirmar senha</label>
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
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
