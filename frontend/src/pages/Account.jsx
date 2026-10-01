import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './Account.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function Account() {
  const navigate = useNavigate();
  const { user, token, logout, getAuthHeader } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchOrders();
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [token, navigate, user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeader();
      const response = await axios.get(`${API_URL}/orders/user/${user?.id}`, { headers });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    // Implementation for updating profile would go here
    alert('Profile update feature coming soon');
  };

  if (!user) {
    return <div className="account-container">Loading...</div>;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-yellow',
      payment_processing: 'bg-blue',
      paid: 'bg-green',
      shipped: 'bg-purple',
      delivered: 'bg-green',
      cancelled: 'bg-red',
    };
    return statusMap[status] || 'bg-gray';
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <div className="account-title">
          <h1>Minha Conta</h1>
          <p>Bem-vindo, {user.name}!</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>

      <div className="account-tabs">
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Meus Pedidos
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Perfil
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>Histórico de Pedidos</h2>
            {isLoading ? (
              <div className="loading">Carregando...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <p>Você ainda não fez nenhum pedido</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-number">
                        <strong>Pedido #{order.order_number}</strong>
                        <span className={`status-badge ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-date">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="order-details">
                      <div className="detail">
                        <span>Total:</span>
                        <strong>R$ {parseFloat(order.total).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Informações Pessoais</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" value={user.email} disabled />
              </div>

              <div className="form-group">
                <label htmlFor="name">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleProfileChange}
                />
              </div>

              <button type="submit" className="btn-primary">
                Atualizar Perfil
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
