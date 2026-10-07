import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import AccountProfile from '../components/AccountProfile';
import AccountAddresses from '../components/AccountAddresses';
import { useI18n } from '../i18n';
import './Account.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function Account() {
  const navigate = useNavigate();
  const { t, formatDate, money } = useI18n();
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
    return <div className="account-container">{t('common.loading')}</div>;
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
          <h1>{t('account.title')}</h1>
          <p>{t('account.welcome', { name: user.name })}</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          {t('account.logout')}
        </button>
      </div>

      <div className="account-tabs">
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          {t('account.tabOrders')}
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('account.tabProfile')}
        </button>
        <button
          className={`tab ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          {t('account.tabAddresses')}
        </button>
      </div>

      <div className="account-content">
        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>{t('account.orderHistory')}</h2>
            {isLoading ? (
              <div className="loading">{t('common.loading')}</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <p>{t('account.noOrders')}</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-number">
                        <strong>{t('account.order', { number: order.order_number })}</strong>
                        <span className={`status-badge ${getStatusBadge(order.status)}`}>
                          {t(`account.status.${order.status}`) === `account.status.${order.status}` ? order.status : t(`account.status.${order.status}`)}
                        </span>
                      </div>
                      <div className="order-date">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="order-details">
                      <div className="detail">
                        <span>{t('account.total')}</span>
                        <strong>{money(order.total, order.region === 'EUR' ? 'EUR' : 'BRL')}</strong>
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
