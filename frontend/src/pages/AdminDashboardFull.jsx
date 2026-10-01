import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const REGIONS = { BR: 'Brasil', PT: 'Portugal', EU: 'Europa' };
const CURRENCIES = { BRL: 'R$ (Real)', EUR: '€ (Euro)', USD: '$ (Dólar)' };

export default function AdminDashboardFull() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [productForm, setProductForm] = useState({ 
    name: '', price: '', category: '', description: '',
    weight: '', width: '', height: '', depth: '',
    location: 'BR', currency: 'BRL', sku: ''
  });
  const [couponForm, setCouponForm] = useState({ code: '', discount_percentage: '', discount_amount: '', max_uses: '' });

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      loadAllData(storedToken);
    }
  }, []);

  const loadAllData = async (adminToken) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [pRes, oRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/orders`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/coupons`, { headers }).catch(() => ({ data: [] }))
      ]);
      setProducts(pRes.data?.data || []);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      setCoupons(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (error) {
      console.error('Erro:', error);
    }
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      alert('Preencha nome e preço');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, productForm, { headers });
      } else {
        await axios.post(`${API_URL}/products`, productForm, { headers });
      }
      setShowProductModal(false);
      setProductForm({ name: '', price: '', category: '', description: '', weight: '', width: '', height: '', depth: '', location: 'BR', currency: 'BRL', sku: '' });
      setEditingProduct(null);
      loadAllData(token);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Deletar produto?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadAllData(token);
    } catch (error) {
      alert('Erro ao deletar');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category || '',
      description: product.description || '',
      weight: product.weight || '',
      width: product.width || '',
      height: product.height || '',
      depth: product.depth || '',
      location: product.location || 'BR',
      currency: product.currency || 'BRL',
      sku: product.sku || ''
    });
    setShowProductModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code) {
      alert('Código obrigatório');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingCoupon) {
        await axios.put(`${API_URL}/coupons/${editingCoupon.id}`, couponForm, { headers });
      } else {
        await axios.post(`${API_URL}/coupons`, couponForm, { headers });
      }
      setShowCouponModal(false);
      setCouponForm({ code: '', discount_percentage: '', discount_amount: '', max_uses: '' });
      setEditingCoupon(null);
      loadAllData(token);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Deletar cupom?')) return;
    try {
      await axios.delete(`${API_URL}/coupons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadAllData(token);
    } catch (error) {
      alert('Erro ao deletar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const tabStyle = (tab) => ({
    padding: '12px 16px',
    backgroundColor: activeTab === tab ? '#000' : 'transparent',
    color: activeTab === tab ? '#fff' : '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingTop: '80px' }}>
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Admin Alessandra</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Sair</button>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', padding: '20px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'products', label: '📦 Produtos' },
              { id: 'orders', label: '📋 Pedidos' },
              { id: 'reviews', label: '⭐ Reviews' },
              { id: 'coupons', label: '🎟️ Cupons' },
              { id: 'shipping', label: '🚚 Frete' },
              { id: 'taxes', label: '💰 Impostos' },
              { id: 'variants', label: '🎨 Variações' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>{tab.label}</button>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1, padding: '24px' }}>
          {loading ? <p>Carregando...</p> : (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>Overview</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    {[{ label: 'Produtos', value: products.length, color: '#3b82f6' }, { label: 'Pedidos', value: orders.length, color: '#10b981' }, { label: 'Cupons', value: coupons.length, color: '#f59e0b' }].map((stat, i) => (
                      <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>{stat.label}</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: stat.color, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0 }}>Produtos ({products.length})</h2>
                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', category: '', description: '', weight: '', width: '', height: '', depth: '', location: 'BR', currency: 'BRL', sku: '' }); setShowProductModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Novo Produto</button>
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Nome</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Preço</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Local</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Peso</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>SKU</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>{p.name}</td>
                            <td style={{ padding: '12px' }}>{p.currency} {parseFloat(p.price).toFixed(2)}</td>
                            <td style={{ padding: '12px' }}>{REGIONS[p.location] || p.location}</td>
                            <td style={{ padding: '12px' }}>{p.weight || '-'} kg</td>
                            <td style={{ padding: '12px' }}>{p.sku || '-'}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => handleEditProduct(p)} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Deletar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Pedidos ({orders.length})</h2>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px', color: '#666', fontFamily: 'Outfit, sans-serif' }}>
                    {orders.length === 0 ? 'Nenhum pedido' : (
                      <table style={{ width: '100%', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Pedido</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Cliente</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Total</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Região</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px' }}>{o.order_number}</td>
                              <td style={{ padding: '12px' }}>{o.customer_name}</td>
                              <td style={{ padding: '12px' }}>R$ {parseFloat(o.total).toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>{o.status}</td>
                              <td style={{ padding: '12px' }}>{REGIONS[o.region] || o.region}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && <div><h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Moderação de Reviews</h2><div style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', color: '#999', fontFamily: 'Outfit, sans-serif' }}>Em produção</div></div>}

              {activeTab === 'coupons' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0 }}>Cupons ({coupons.length})</h2>
                    <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discount_percentage: '', discount_amount: '', max_uses: '' }); setShowCouponModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Novo Cupom</button>
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Código</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Desconto</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Uso</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{c.code}</td>
                            <td style={{ padding: '12px' }}>{c.discount_percentage ? `${c.discount_percentage}%` : `R$ ${parseFloat(c.discount_amount).toFixed(2)}`}</td>
                            <td style={{ padding: '12px' }}>{c.used_count}/{c.max_uses || '∞'}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => { setEditingCoupon(c); setCouponForm({ code: c.code, discount_percentage: c.discount_percentage || '', discount_amount: c.discount_amount || '', max_uses: c.max_uses || '' }); setShowCouponModal(true); }} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                              <button onClick={() => handleDeleteCoupon(c.id)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Deletar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'shipping' && <div><h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Tarifas de Frete</h2><div style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', color: '#999', fontFamily: 'Outfit, sans-serif' }}>Gerenciar tarifas por região e peso</div></div>}

              {activeTab === 'taxes' && <div><h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Impostos por Região</h2><div style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', color: '#999', fontFamily: 'Outfit, sans-serif' }}>ICMS (BR), IVA (PT), VAT (EU)</div></div>}

              {activeTab === 'variants' && <div><h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Variações de Produtos</h2><div style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', color: '#999', fontFamily: 'Outfit, sans-serif' }}>Cores, tamanhos e opções</div></div>}
            </>
          )}
        </div>
      </div>

      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <input type="text" placeholder="Nome" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Outfit, sans-serif', gridColumn: '1 / -1' }} />
              <input type="number" placeholder="Preço" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Outfit, sans-serif' }} />
              <select value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Outfit, sans-serif' }}>
                {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="Categoria" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', gridColumn: '1 / -1' }} />
              <input type="text" placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <select value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="Peso (kg)" step="0.01" value={productForm.weight} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Largura (cm)" step="0.01" value={productForm.width} onChange={(e) => setProductForm({ ...productForm, width: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Altura (cm)" step="0.01" value={productForm.height} onChange={(e) => setProductForm({ ...productForm, height: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Profundidade (cm)" step="0.01" value={productForm.depth} onChange={(e) => setProductForm({ ...productForm, depth: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <textarea placeholder="Descrição" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px', gridColumn: '1 / -1' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveProduct} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>{editingCoupon ? 'Editar' : 'Novo'} Cupom</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <input type="text" placeholder="Código" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Desconto %" value={couponForm.discount_percentage} onChange={(e) => setCouponForm({ ...couponForm, discount_percentage: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Desconto (valor fixo)" value={couponForm.discount_amount} onChange={(e) => setCouponForm({ ...couponForm, discount_amount: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="number" placeholder="Limite de usos" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveCoupon} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowCouponModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
