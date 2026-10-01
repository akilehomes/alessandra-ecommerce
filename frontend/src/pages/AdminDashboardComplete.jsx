import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const REGIONS = { BR: 'Brasil', PT: 'Portugal', EU: 'Europa' };
const CURRENCIES = { BRL: 'R$ (Real)', EUR: '€ (Euro)', USD: '$ (Dólar)' };
const TAX_TYPES = { ICMS: 'ICMS (Brasil)', IVA: 'IVA (Portugal)', VAT: 'VAT (Europa)', GST: 'GST (Canadá)' };

const Label = ({ children, required }) => (
  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', fontFamily: 'Outfit, sans-serif', color: '#333' }}>
    {children} {required && <span style={{ color: '#dc2626' }}>*</span>}
  </label>
);

const Helper = ({ children }) => (
  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666', fontFamily: 'Outfit, sans-serif', fontStyle: 'italic' }}>{children}</p>
);

const FormGroup = ({ label, helper, required, children }) => (
  <div style={{ marginBottom: '12px' }}>
    {label && <Label required={required}>{label}</Label>}
    {children}
    {helper && <Helper>{helper}</Helper>}
  </div>
);

export default function AdminDashboardComplete() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [editingShipping, setEditingShipping] = useState(null);
  const [editingTax, setEditingTax] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({ 
    name: '', price: '', category: '', description: '',
    weight: '', width: '', height: '', depth: '',
    location: 'BR', currency: 'BRL', sku: '', image_url: ''
  });
  const [couponForm, setCouponForm] = useState({ code: '', discount_percentage: '', discount_amount: '', max_uses: '' });
  const [shippingForm, setShippingForm] = useState({ region: 'BR', zone: '', min_weight: '', max_weight: '', base_rate: '', per_kg_rate: '' });
  const [taxForm, setTaxForm] = useState({ region: 'BR', tax_type: 'ICMS', rate: '' });

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
      const responses = await Promise.all([
        axios.get(`${API_URL}/products?limit=100`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/orders`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/coupons`, { headers }).catch(() => ({ data: [] })),
      ]);
      setProducts(responses[0].data?.data || []);
      setOrders(Array.isArray(responses[1].data) ? responses[1].data : []);
      setCoupons(Array.isArray(responses[2].data) ? responses[2].data : []);
      setShippingRates([
        { id: '1', region: 'BR', zone: 'São Paulo', min_weight: 0, max_weight: 5, base_rate: 25, per_kg_rate: 5 },
        { id: '2', region: 'BR', zone: 'Rio de Janeiro', min_weight: 0, max_weight: 5, base_rate: 30, per_kg_rate: 6 },
      ]);
      setTaxRates([
        { id: '1', region: 'BR', tax_type: 'ICMS', rate: 18, description: 'ICMS padrão' },
        { id: '2', region: 'PT', tax_type: 'IVA', rate: 23, description: 'IVA Portugal' },
      ]);
      setReviews([
        { id: '1', product_id: products[0]?.id, user_name: 'João Silva', rating: 5, title: 'Excelente!', comment: 'Muito bom', status: 'approved' },
      ]);
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
        await axios.put(`${API_URL}/admin/products/${editingProduct.id}`, productForm, { headers });
      } else {
        await axios.post(`${API_URL}/admin/products`, productForm, { headers });
      }
      setShowProductModal(false);
      setProductForm({ name: '', price: '', category: '', description: '', weight: '', width: '', height: '', depth: '', location: 'BR', currency: 'BRL', sku: '', image_url: '' });
      setEditingProduct(null);
      loadAllData(token);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Deletar produto?')) return;
    try {
      await axios.delete(`${API_URL}/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadAllData(token);
    } catch (error) {
      alert('Erro ao deletar');
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  // Reduz a foto no navegador (maior lado 1600px, JPEG) antes de enviar: fotos de celular tem varios MB
  const resizeImage = async (file, maxSize = 1600) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG com fundo transparente vira branco no JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('resize failed'))), 'image/jpeg', 0.85)
    );
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      alert('Use uma imagem JPG, PNG ou WebP.');
      return;
    }
    setUploadingImage(true);
    try {
      const blob = await resizeImage(file);
      const body = new FormData();
      body.append('image', blob, 'produto.jpg');
      const response = await axios.post(`${API_URL}/upload/product`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductForm((form) => ({ ...form, image_url: response.data.imageUrl }));
    } catch (error) {
      alert('Erro ao enviar a foto: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, price: product.price, category: product.category || '', description: product.description || '',
      weight: product.weight || '', width: product.width || '', height: product.height || '', depth: product.depth || '',
      location: product.location || 'BR', currency: product.currency || 'BRL', sku: product.sku || '', image_url: product.image_url || ''
    });
    setShowProductModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code) { alert('Código obrigatório'); return; }
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

  const handleSaveShipping = () => {
    if (!shippingForm.region || !shippingForm.zone || !shippingForm.base_rate) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const newRate = { id: Date.now().toString(), ...shippingForm };
    if (editingShipping) {
      setShippingRates(shippingRates.map(r => r.id === editingShipping.id ? newRate : r));
    } else {
      setShippingRates([...shippingRates, newRate]);
    }
    setShowShippingModal(false);
    setShippingForm({ region: 'BR', zone: '', min_weight: '', max_weight: '', base_rate: '', per_kg_rate: '' });
    setEditingShipping(null);
  };

  const handleSaveTax = () => {
    if (!taxForm.region || !taxForm.tax_type || !taxForm.rate) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const newTax = { id: Date.now().toString(), ...taxForm, description: `${TAX_TYPES[taxForm.tax_type]}` };
    if (editingTax) {
      setTaxRates(taxRates.map(t => t.id === editingTax.id ? newTax : t));
    } else {
      setTaxRates([...taxRates, newTax]);
    }
    setShowTaxModal(false);
    setTaxForm({ region: 'BR', tax_type: 'ICMS', rate: '' });
    setEditingTax(null);
  };

  const handleApproveReview = (reviewId) => {
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: 'approved' } : r));
  };

  const handleRejectReview = (reviewId) => {
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: 'rejected' } : r));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const inputStyle = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Outfit, sans-serif', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
  const tabStyle = (tab) => ({
    padding: '12px 16px', backgroundColor: activeTab === tab ? '#000' : 'transparent',
    color: activeTab === tab ? '#fff' : '#000', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '500', textAlign: 'left'
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
                    {[
                      { label: 'Produtos', value: products.length, color: '#3b82f6' },
                      { label: 'Pedidos', value: orders.length, color: '#10b981' },
                      { label: 'Cupons', value: coupons.length, color: '#f59e0b' },
                      { label: 'Tarifas Frete', value: shippingRates.length, color: '#8b5cf6' },
                      { label: 'Impostos', value: taxRates.length, color: '#ec4899' },
                      { label: 'Reviews', value: reviews.length, color: '#f97316' }
                    ].map((stat, i) => (
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
                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', category: '', description: '', weight: '', width: '', height: '', depth: '', location: 'BR', currency: 'BRL', sku: '', image_url: '' }); setShowProductModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Novo Produto</button>
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
                              <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{o.status}</span></td>
                              <td style={{ padding: '12px' }}>{REGIONS[o.region] || o.region}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Moderação de Reviews ({reviews.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map(review => (
                      <div key={review.id} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontFamily: 'Outfit, sans-serif' }}>{review.title}</p>
                            <p style={{ margin: '0 0 8px 0', color: '#666', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>⭐ {review.rating}/5 - {review.user_name}</p>
                            <p style={{ margin: '0', fontFamily: 'Outfit, sans-serif', fontSize: '13px' }}>{review.comment}</p>
                          </div>
                          <div>
                            <span style={{ backgroundColor: review.status === 'approved' ? '#dcfce7' : review.status === 'rejected' ? '#fee2e2' : '#fef3c7', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{review.status}</span>
                          </div>
                        </div>
                        {review.status === 'pending' && (
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleApproveReview(review.id)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>Aprovar</button>
                            <button onClick={() => handleRejectReview(review.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>Rejeitar</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {activeTab === 'shipping' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0 }}>Tarifas de Frete ({shippingRates.length})</h2>
                    <button onClick={() => { setEditingShipping(null); setShippingForm({ region: 'BR', zone: '', min_weight: '', max_weight: '', base_rate: '', per_kg_rate: '' }); setShowShippingModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Nova Tarifa</button>
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Região</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Zona</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Peso</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Base</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Por kg</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shippingRates.map(rate => (
                          <tr key={rate.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>{REGIONS[rate.region]}</td>
                            <td style={{ padding: '12px' }}>{rate.zone}</td>
                            <td style={{ padding: '12px' }}>{rate.min_weight}-{rate.max_weight} kg</td>
                            <td style={{ padding: '12px' }}>R$ {parseFloat(rate.base_rate).toFixed(2)}</td>
                            <td style={{ padding: '12px' }}>R$ {parseFloat(rate.per_kg_rate || 0).toFixed(2)}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => { setEditingShipping(rate); setShippingForm(rate); setShowShippingModal(true); }} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'taxes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0 }}>Impostos por Região ({taxRates.length})</h2>
                    <button onClick={() => { setEditingTax(null); setTaxForm({ region: 'BR', tax_type: 'ICMS', rate: '' }); setShowTaxModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Nova Alíquota</button>
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Região</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Tipo</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Alíquota</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Descrição</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxRates.map(tax => (
                          <tr key={tax.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px' }}>{REGIONS[tax.region]}</td>
                            <td style={{ padding: '12px' }}>{tax.tax_type}</td>
                            <td style={{ padding: '12px' }}>{tax.rate}%</td>
                            <td style={{ padding: '12px' }}>{tax.description}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => { setEditingTax(tax); setTaxForm(tax); setShowTaxModal(true); }} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'variants' && (
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Variações de Produtos</h2>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', color: '#999', fontFamily: 'Outfit, sans-serif' }}>
                    <p>Gerenciar cores, tamanhos, opções de produtos</p>
                    <p style={{ fontSize: '12px', color: '#ccc' }}>Selecione um produto para editar suas variações</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <FormGroup label="Nome do Produto" required>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
              </FormGroup>
              <FormGroup label="Preço" required helper="Preço base do produto">
                <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} style={inputStyle} />
              </FormGroup>
              <FormGroup label="Moeda" required>
                <select value={productForm.currency} onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })} style={inputStyle}>
                  {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Categoria" helper="Ex: Home, Decoração, etc">
                <input type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
              </FormGroup>
              <FormGroup label="SKU" helper="Código único para controle de estoque">
                <input type="text" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} style={inputStyle} />
              </FormGroup>
              <FormGroup label="Localização" required helper="País ou região onde o produto se encontra">
                <select value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} style={inputStyle}>
                  {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Peso" helper="Em kilogramas (kg), para cálculo de frete">
                <input type="number" step="0.01" value={productForm.weight} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} style={inputStyle} placeholder="0.50" />
              </FormGroup>
              <FormGroup label="Largura" helper="Em centímetros (cm)">
                <input type="number" step="0.01" value={productForm.width} onChange={(e) => setProductForm({ ...productForm, width: e.target.value })} style={inputStyle} placeholder="10" />
              </FormGroup>
              <FormGroup label="Altura" helper="Em centímetros (cm)">
                <input type="number" step="0.01" value={productForm.height} onChange={(e) => setProductForm({ ...productForm, height: e.target.value })} style={inputStyle} placeholder="15" />
              </FormGroup>
              <FormGroup label="Profundidade" helper="Em centímetros (cm)">
                <input type="number" step="0.01" value={productForm.depth} onChange={(e) => setProductForm({ ...productForm, depth: e.target.value })} style={inputStyle} placeholder="5" />
              </FormGroup>
              <FormGroup label="Foto do produto" helper="JPG, PNG ou WebP. A imagem é reduzida automaticamente antes de enviar." style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {productForm.image_url ? (
                    <img src={productForm.image_url} alt="Pré-visualização" style={{ width: '88px', height: '88px', objectFit: 'cover', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
                  ) : (
                    <div style={{ width: '88px', height: '88px', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Sem foto</div>
                  )}
                  <label style={{ padding: '8px 14px', border: '1px solid #000', borderRadius: '4px', cursor: uploadingImage ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600', fontSize: '13px', opacity: uploadingImage ? 0.6 : 1 }}>
                    {uploadingImage ? 'Enviando…' : (productForm.image_url ? 'Trocar foto' : 'Escolher foto')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelected} disabled={uploadingImage} style={{ display: 'none' }} />
                  </label>
                </div>
              </FormGroup>
              <FormGroup label="Descrição" helper="Descrição detalhada do produto" style={{ gridColumn: '1 / -1' }}>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px', gridColumn: '1 / -1' }} />
              </FormGroup>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveProduct} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>{editingCoupon ? 'Editar' : 'Novo'} Cupom</h3>
            <FormGroup label="Código do Cupom" required helper="Ex: DESCONTO10, BLACKFRIDAY">
              <input type="text" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} style={inputStyle} />
            </FormGroup>
            <FormGroup label="Desconto em %" helper="Deixe em branco se usar valor fixo">
              <input type="number" value={couponForm.discount_percentage} onChange={(e) => setCouponForm({ ...couponForm, discount_percentage: e.target.value })} style={inputStyle} placeholder="10" />
            </FormGroup>
            <FormGroup label="Desconto em Valor Fixo (R$)" helper="Deixe em branco se usar percentual">
              <input type="number" value={couponForm.discount_amount} onChange={(e) => setCouponForm({ ...couponForm, discount_amount: e.target.value })} style={inputStyle} placeholder="50.00" />
            </FormGroup>
            <FormGroup label="Limite de Usos" helper="Deixe vazio para ilimitado">
              <input type="number" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })} style={inputStyle} placeholder="100" />
            </FormGroup>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveCoupon} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowCouponModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* SHIPPING MODAL */}
      {showShippingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>Tarifa de Frete</h3>
            <FormGroup label="Região" required>
              <select value={shippingForm.region} onChange={(e) => setShippingForm({ ...shippingForm, region: e.target.value })} style={inputStyle}>
                {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Zona/Cidade" required helper="Ex: São Paulo, Rio de Janeiro">
              <input type="text" value={shippingForm.zone} onChange={(e) => setShippingForm({ ...shippingForm, zone: e.target.value })} style={inputStyle} />
            </FormGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <FormGroup label="Peso Mínimo (kg)" helper="Limite inferior da faixa">
                <input type="number" step="0.01" value={shippingForm.min_weight} onChange={(e) => setShippingForm({ ...shippingForm, min_weight: e.target.value })} style={inputStyle} placeholder="0" />
              </FormGroup>
              <FormGroup label="Peso Máximo (kg)" helper="Limite superior da faixa">
                <input type="number" step="0.01" value={shippingForm.max_weight} onChange={(e) => setShippingForm({ ...shippingForm, max_weight: e.target.value })} style={inputStyle} placeholder="5" />
              </FormGroup>
            </div>
            <FormGroup label="Tarifa Base (R$)" required helper="Valor fixo independente do peso">
              <input type="number" step="0.01" value={shippingForm.base_rate} onChange={(e) => setShippingForm({ ...shippingForm, base_rate: e.target.value })} style={inputStyle} placeholder="25.00" />
            </FormGroup>
            <FormGroup label="Por kg (R$)" helper="Valor adicional por cada kg acima da base">
              <input type="number" step="0.01" value={shippingForm.per_kg_rate} onChange={(e) => setShippingForm({ ...shippingForm, per_kg_rate: e.target.value })} style={inputStyle} placeholder="5.00" />
            </FormGroup>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveShipping} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowShippingModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* TAX MODAL */}
      {showTaxModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>Alíquota de Imposto</h3>
            <FormGroup label="Região" required>
              <select value={taxForm.region} onChange={(e) => setTaxForm({ ...taxForm, region: e.target.value })} style={inputStyle}>
                {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Tipo de Imposto" required helper="ICMS: Brasil | IVA: Portugal | VAT: Europa">
              <select value={taxForm.tax_type} onChange={(e) => setTaxForm({ ...taxForm, tax_type: e.target.value })} style={inputStyle}>
                {Object.entries(TAX_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Alíquota (%)" required helper="Taxa de imposto a ser aplicada">
              <input type="number" step="0.01" value={taxForm.rate} onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })} style={inputStyle} placeholder="18.00" />
            </FormGroup>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveTax} style={{ flex: 1, padding: '8px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Salvar</button>
              <button onClick={() => setShowTaxModal(false)} style={{ flex: 1, padding: '8px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
