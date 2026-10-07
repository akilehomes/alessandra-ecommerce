import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import AccountProfile from '../components/AccountProfile';
import AccountAddresses from '../components/AccountAddresses';
import './Account.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function Account() {
  const navigate = useNavigate();
  const { user, token, logout, getAuthHeader, fetchUser } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [token, navigate, user?.id]);

  // Carrega o perfil completo (documento, pais...) uma vez ao abrir a conta
  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

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
          Dados pessoais
        </button>
        <button
          className={`tab ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          Endereços
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
                        <strong>{order.region === 'EUR' ? '€' : 'R$'} {parseFloat(order.total).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && <AccountProfile key={user.id} />}
        {activeTab === 'addresses' && <AccountAddresses />}
      </div>
    </div>
  );
}
