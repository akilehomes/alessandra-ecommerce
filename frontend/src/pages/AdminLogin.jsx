import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email e senha são obrigatórios');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/admin/login`, {
        email,
        password,
      });

      const { token, admin } = response.data;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', paddingTop: '64px'}}>
      <div style={{width: '100%', maxWidth: '400px', padding: '24px'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase'}}>
            Admin
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', color: '#666'}}>
            Painel de Administração Alessandra Zanetti
          </p>
        </div>

        <form onSubmit={handleLogin} style={{background: '#fff', border: '1px solid #e5e7eb', padding: '32px', borderRadius: '8px'}}>
          {error && (
            <div style={{background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px'}}>
              {error}
            </div>
          )}

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase'}}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase'}}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#d1d5db' : '#000',
              color: '#fff',
              border: '1px solid #000',
              borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
