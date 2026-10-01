import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminUser, setAdminUser] = useState(null);

  // Dashboard
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [currencyRates, setCurrencyRates] = useState([]);

  // Product form
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image_url: '',
    category: '',
    weight: '',
    height: '',
    width: '',
    depth: '',
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    setAdminUser(JSON.parse(user));
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboardStats();
    else if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'shipping') fetchShippingRates();
    else if (activeTab === 'taxes') fetchTaxRates();
    else if (activeTab === 'currency') fetchCurrencyRates();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: getAuthHeader()
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/products`, {
        headers: getAuthHeader()
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: getAuthHeader()
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/shipping-rates`, {
        headers: getAuthHeader()
      });
      setShippingRates(response.data);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/tax-rates`, {
        headers: getAuthHeader()
      });
      setTaxRates(response.data);
    } catch (error) {
      console.error('Erro ao carregar impostos:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/currency-rates`, {
        headers: getAuthHeader()
      });
      setCurrencyRates(response.data);
    } catch (error) {
      console.error('Erro ao carregar câmbio:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Preencha nome e preço');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_URL}/admin/products/${editingId}`, formData, {
          headers: getAuthHeader()
        });
        alert('Produto atualizado!');
      } else {
        await axios.post(`${API_URL}/admin/products`, formData, {
          headers: getAuthHeader()
        });
        alert('Produto criado!');
      }
      setFormData({name: '', price: '', description: '', image_url: '', category: '', weight: '', height: '', width: '', depth: ''});
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      alert('Erro ao salvar: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: getAuthHeader()
      });
      alert('Deletado!');
      fetchProducts();
    } catch (error) {
      alert('Erro ao deletar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}`, { status: newStatus }, {
        headers: getAuthHeader()
      });
      fetchOrders();
    } catch (error) {
      alert('Erro ao atualizar pedido');
    }
  };

  const handleUpdateShippingRate = async (id, basePrice, pricePerKg) => {
    try {
      await axios.put(`${API_URL}/admin/shipping-rates/${id}`,
        { base_price: basePrice, price_per_kg: pricePerKg },
        { headers: getAuthHeader() }
      );
      fetchShippingRates();
    } catch (error) {
      alert('Erro ao atualizar frete');
    }
  };

  const handleUpdateTaxRate = async (id, taxRate) => {
    try {
      await axios.put(`${API_URL}/admin/tax-rates/${id}`,
        { tax_rate: taxRate },
        { headers: getAuthHeader() }
      );
      fetchTaxRates();
    } catch (error) {
      alert('Erro ao atualizar imposto');
    }
  };

  const handleUpdateCurrencyRate = async (id, rate) => {
    try {
      await axios.put(`${API_URL}/admin/currency-rates/${id}`,
        { rate },
        { headers: getAuthHeader() }
      );
      fetchCurrencyRates();
    } catch (error) {
      alert('Erro ao atualizar câmbio');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (!adminUser) {
    return <div style={{paddingTop: '64px', textAlign: 'center', padding: '32px'}}>Verificando autenticação...</div>;
  }

  return (
    <div style={{minHeight: '100vh', background: '#f9fafb', paddingTop: '64px'}}>
      {/* Navbar */}
      <div style={{background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '64px', zIndex: '40'}}>
        <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: '700'}}>Admin Panel</h1>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <span style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{adminUser.full_name}</span>
          <button
            onClick={logout}
            style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Sair
          </button>
        </div>
      </div>

      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 24px'}}>
        {/* Navigation Tabs */}
        <div style={{display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', overflowX: 'auto'}}>
          {['dashboard', 'products', 'orders', 'shipping', 'taxes', 'currency'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: activeTab === tab ? '700' : '400',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: activeTab === tab ? '2px solid #000' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'products' && 'Produtos'}
              {tab === 'orders' && 'Pedidos'}
              {tab === 'shipping' && 'Frete'}
              {tab === 'taxes' && 'Impostos'}
              {tab === 'currency' && 'Câmbio'}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsLoading ? (
              <p>Carregando...</p>
            ) : dashboardStats ? (
              <>
                <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Produtos</p>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>{dashboardStats.totalProducts}</p>
                </div>
                <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Pedidos</p>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>{dashboardStats.totalOrders}</p>
                </div>
                <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Faturamento</p>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>R$ {dashboardStats.totalRevenue.toFixed(2)}</p>
                </div>
                <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Pendentes</p>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700', color: '#f59e0b'}}>{dashboardStats.pendingOrders}</p>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div style={{marginBottom: '32px', border: '1px solid #e5e7eb', padding: '24px'}}>
              <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase'}}>
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="number" placeholder="Preço" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="text" placeholder="Categoria" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="text" placeholder="URL da Imagem" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <textarea placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', gridColumn: 'span 2', minHeight: '80px'}} />
                <input type="number" placeholder="Peso (kg)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="number" placeholder="Altura (cm)" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="number" placeholder="Largura (cm)" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                <input type="number" placeholder="Profundidade (cm)" value={formData.depth} onChange={(e) => setFormData({...formData, depth: e.target.value})} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
              </div>
              <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
                <button onClick={handleSaveProduct} disabled={loading} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}>
                  {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Criar')}
                </button>
                {editingId && <button onClick={() => {setEditingId(null); setFormData({name: '', price: '', description: '', image_url: '', category: '', weight: '', height: '', width: '', depth: ''});}} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 24px', border: '1px solid #d1d5db', background: '#fff', color: '#666', cursor: 'pointer', textTransform: 'uppercase'}}>Cancelar</button>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Nome</th>
                    <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Preço</th>
                    <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Categoria</th>
                    <th style={{textAlign: 'center', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                      <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{product.name}</td>
                      <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>R$ {Number(product.price).toFixed(2)}</td>
                      <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{product.category || '-'}</td>
                      <td style={{padding: '12px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center'}}>
                        <button onClick={() => {setEditingId(product.id); setFormData({name: product.name, price: product.price, description: product.description || '', image_url: product.image_url || '', category: product.category || '', weight: product.weight || '', height: product.height || '', width: product.width || '', depth: product.depth || ''});}} style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none'}}>Editar</button>
                        <button onClick={() => handleDeleteProduct(product.id)} style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none'}}>Deletar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>ID</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Cliente</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Total</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Status</th>
                  <th style={{textAlign: 'center', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{order.id?.slice(0, 8)}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{order.customer_name || '-'}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>R$ {Number(order.total || 0).toFixed(2)}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>
                      <select value={order.status || 'pending'} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px'}}>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="processing">Processando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SHIPPING RATES TAB */}
        {activeTab === 'shipping' && (
          <div className="overflow-x-auto">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Origem</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Região</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Base (R$)</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Por kg (R$)</th>
                  <th style={{textAlign: 'center', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {shippingRates.map((rate) => (
                  <tr key={rate.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.origin_city}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.dest_region}</td>
                    <td style={{padding: '12px'}}><input type="number" step="0.01" defaultValue={rate.base_price} onBlur={(e) => handleUpdateShippingRate(rate.id, parseFloat(e.target.value), rate.price_per_kg)} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px'}} /></td>
                    <td style={{padding: '12px'}}><input type="number" step="0.01" defaultValue={rate.price_per_kg} onBlur={(e) => handleUpdateShippingRate(rate.id, rate.base_price, parseFloat(e.target.value))} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAX RATES TAB */}
        {activeTab === 'taxes' && (
          <div className="overflow-x-auto">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>País</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Tipo</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Alíquota (%)</th>
                  <th style={{textAlign: 'center', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((rate) => (
                  <tr key={rate.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.country}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.tax_type}</td>
                    <td style={{padding: '12px'}}><input type="number" step="0.01" defaultValue={rate.tax_rate} onBlur={(e) => handleUpdateTaxRate(rate.id, parseFloat(e.target.value))} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CURRENCY RATES TAB */}
        {activeTab === 'currency' && (
          <div className="overflow-x-auto">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>De</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Para</th>
                  <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Taxa</th>
                  <th style={{textAlign: 'center', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {currencyRates.map((rate) => (
                  <tr key={rate.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.from_currency}</td>
                    <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{rate.to_currency}</td>
                    <td style={{padding: '12px'}}><input type="number" step="0.01" defaultValue={rate.rate} onBlur={(e) => handleUpdateCurrencyRate(rate.id, parseFloat(e.target.value))} style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
