import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const REGIONS = { BR: 'Brasil', PT: 'Portugal', EU: 'Europa' };
const PRODUCT_STATUS = {
  active: { label: 'Ativo', color: '#16a34a' },
  draft: { label: 'Rascunho', color: '#d97706' },
  archived: { label: 'Arquivado', color: '#6b7280' },
};
const MAX_PRODUCT_IMAGES = 10;
const EMPTY_PRODUCT = {
  name: '', price: '', category: '', description: '',
  weight: '', width: '', height: '', depth: '',
  location: 'BR', currency: 'BRL', sku: '',
  status: 'active', stock_quantity: '', images: [],
};
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

const ORDER_STATUS = {
  pending: { label: 'Aguardando pagamento', color: '#d97706' },
  payment_processing: { label: 'Processando pagamento', color: '#d97706' },
  paid: { label: 'Pago · enviar', color: '#2563eb' },
  shipped: { label: 'Enviado', color: '#7c3aed' },
  delivered: { label: 'Entregue', color: '#16a34a' },
  cancelled: { label: 'Cancelado', color: '#6b7280' },
  refunded: { label: 'Reembolsado', color: '#6b7280' },
};

const ORDER_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'paid', label: 'A enviar' },
  { id: 'shipped', label: 'Enviados' },
  { id: 'delivered', label: 'Entregues' },
  { id: 'pending', label: 'Aguardando pagamento' },
];

const money = (v) => `R$ ${(Number(v) || 0).toFixed(2)}`;

const formatOrderAddress = (addr) => {
  if (!addr) return '';
  const a = typeof addr === 'string' ? (() => { try { return JSON.parse(addr); } catch (e) { return null; } })() : addr;
  if (!a || typeof a !== 'object') return String(addr);
  const line1 = [a.street, a.number].filter(Boolean).join(', ') + (a.complement ? ` - ${a.complement}` : '');
  const line2 = [a.city, a.state].filter(Boolean).join(' - ') + (a.cep ? ` · CEP ${a.cep}` : '');
  return [line1, line2].filter(Boolean).join('\n');
};

export default function AdminDashboardComplete() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [ordersFilter, setOrdersFilter] = useState('paid'); // abre nos pedidos a enviar
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null); // { type, text }
  const [shipForm, setShipForm] = useState({ carrier: '', trackingNumber: '' });
  const [quotePrices, setQuotePrices] = useState({}); // valor digitado por orcamento
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
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
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
        axios.get(`${API_URL}/admin/products`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/orders?limit=500`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/coupons`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/quotations`, { headers }).catch(() => ({ data: [] })),
      ]);
      setProducts(Array.isArray(responses[0].data) ? responses[0].data : []);
      setOrders(Array.isArray(responses[1].data) ? responses[1].data : []);
      setCoupons(Array.isArray(responses[2].data) ? responses[2].data : []);
      setQuotations(Array.isArray(responses[3].data) ? responses[3].data : []);
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
      setProductForm(EMPTY_PRODUCT);
      setEditingProduct(null);
      loadAllData(token);
    } catch (error) {
      alert('Erro: ' + (error.response?.data?.error || error.message));
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

  // A primeira foto da lista e a principal (aparece na loja e nas listagens)
  const makeImagePrimary = (index) =>
    setProductForm((form) => ({ ...form, images: [form.images[index], ...form.images.filter((_, i) => i !== index)] }));
  const removeImage = (index) =>
    setProductForm((form) => ({ ...form, images: form.images.filter((_, i) => i !== index) }));

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
      setProductForm((form) => ({ ...form, images: [...form.images, response.data.imageUrl].slice(0, MAX_PRODUCT_IMAGES) }));
    } catch (error) {
      alert('Erro ao enviar a foto: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const openOrder = async (orderId, { keepMessage = false } = {}) => {
    if (!keepMessage) setOrderMessage(null);
    setOrderBusy(true);
    try {
      const response = await axios.get(`${API_URL}/admin/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      const order = response.data;
      setOrderDetail(order);
      setShipForm({
        carrier: order.tracking?.carrier || [order.shipping_carrier, order.shipping_service].filter(Boolean).filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i).join(' '),
        trackingNumber: order.tracking?.tracking_number || '',
      });
    } catch (error) {
      alert('Não foi possível abrir o pedido: ' + (error.response?.data?.error || error.message));
    } finally {
      setOrderBusy(false);
    }
  };

  const handleShipOrder = async () => {
    setOrderBusy(true);
    setOrderMessage(null);
    try {
      const response = await axios.post(
        `${API_URL}/admin/orders/${orderDetail.id}/ship`,
        { carrier: shipForm.carrier, trackingNumber: shipForm.trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrderMessage({
        type: response.data.emailSent ? 'ok' : 'warn',
        text: response.data.emailSent
          ? 'Pedido marcado como enviado e o cliente foi avisado por e-mail.'
          : 'Pedido marcado como enviado, mas o e-mail ao cliente não saiu. Avise o cliente por outro canal.',
      });
      await openOrder(orderDetail.id, { keepMessage: true });
      loadAllData(token);
    } catch (error) {
      const reasons = {
        'Invalid tracking code': 'Código de rastreio inválido (use de 4 a 60 letras ou números).',
        'Carrier is required': 'Informe a transportadora.',
        'Only paid orders can be shipped': 'Só é possível enviar pedidos já pagos.',
      };
      setOrderMessage({ type: 'error', text: reasons[error.response?.data?.error] || 'Não foi possível salvar o envio.' });
    } finally {
      setOrderBusy(false);
    }
  };

  const handleDeliverOrder = async () => {
    setOrderBusy(true);
    setOrderMessage(null);
    try {
      await axios.post(`${API_URL}/admin/orders/${orderDetail.id}/deliver`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setOrderMessage({ type: 'ok', text: 'Pedido marcado como entregue.' });
      await openOrder(orderDetail.id, { keepMessage: true });
      loadAllData(token);
    } catch (error) {
      setOrderMessage({ type: 'error', text: 'Não foi possível marcar como entregue.' });
    } finally {
      setOrderBusy(false);
    }
  };

  const handleUpdateQuotation = async (quotation, changes) => {
    try {
      await axios.put(`${API_URL}/admin/quotations/${quotation.id}`, changes, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAllData(token);
    } catch (error) {
      alert('Erro ao atualizar o orçamento: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, price: product.price, category: product.category || '', description: product.description || '',
      weight: product.weight || '', width: product.width || '', height: product.height || '', depth: product.depth || '',
      location: product.location || 'BR', currency: product.currency || 'BRL', sku: product.sku || '',
      status: product.status || 'active',
      stock_quantity: product.stock_quantity ?? '',
      images: (product.images && product.images.length) ? product.images : (product.image_url ? [product.image_url] : []),
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
              { id: 'quotations', label: `✉️ Orçamentos${quotations.filter(q => q.status === 'pending').length ? ` (${quotations.filter(q => q.status === 'pending').length})` : ''}` },
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
                    <button onClick={() => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowProductModal(true); }} style={{ padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>+ Novo Produto</button>
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Nome</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Preço</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontWeight: '600' }}>Estoque</th>
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
                            <td style={{ padding: '12px' }}>
                              <span style={{ color: (PRODUCT_STATUS[p.status] || PRODUCT_STATUS.active).color, fontWeight: '600' }}>
                                {(PRODUCT_STATUS[p.status] || PRODUCT_STATUS.active).label}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              {p.stock_quantity === null || p.stock_quantity === undefined
                                ? <span style={{ color: '#9ca3af' }}>Sem controle</span>
                                : <span style={{ color: p.stock_quantity === 0 ? '#dc2626' : (p.stock_quantity <= 3 ? '#d97706' : 'inherit'), fontWeight: p.stock_quantity <= 3 ? '600' : '400' }}>
                                    {p.stock_quantity === 0 ? 'Esgotado' : p.stock_quantity}
                                  </span>}
                            </td>
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
                <div style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <h2 style={{ marginTop: 0 }}>Pedidos ({orders.length})</h2>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {ORDER_FILTERS.map((f) => {
                      const count = f.id === 'all' ? orders.length : orders.filter((o) => o.status === f.id).length;
                      const active = ordersFilter === f.id;
                      return (
                        <button key={f.id} onClick={() => setOrdersFilter(f.id)} style={{ padding: '8px 14px', borderRadius: '999px', border: '1px solid #000', cursor: 'pointer', background: active ? '#000' : '#fff', color: active ? '#fff' : '#000', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}>
                          {f.label} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
                    {(() => {
                      const list = ordersFilter === 'all' ? orders : orders.filter((o) => o.status === ordersFilter);
                      if (list.length === 0) return <p style={{ padding: '20px', color: '#666', margin: 0 }}>Nenhum pedido nesta situação.</p>;
                      return (
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                              <th style={{ padding: '12px' }}>Pedido</th>
                              <th style={{ padding: '12px' }}>Data</th>
                              <th style={{ padding: '12px' }}>Cliente</th>
                              <th style={{ padding: '12px' }}>Frete escolhido</th>
                              <th style={{ padding: '12px' }}>Total</th>
                              <th style={{ padding: '12px' }}>Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((o) => {
                              const st = ORDER_STATUS[o.status] || { label: o.status, color: '#6b7280' };
                              return (
                                <tr key={o.id} onClick={() => openOrder(o.id)} style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}>
                                  <td style={{ padding: '12px', fontWeight: 600 }}>{o.order_number}</td>
                                  <td style={{ padding: '12px' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : ''}</td>
                                  <td style={{ padding: '12px' }}>{o.customer_name}</td>
                                  <td style={{ padding: '12px' }}>{[o.shipping_carrier, o.shipping_service].filter(Boolean).filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i).join(' ') || '-'}</td>
                                  <td style={{ padding: '12px' }}>{money(o.total)}</td>
                                  <td style={{ padding: '12px' }}><span style={{ color: st.color, fontWeight: 700 }}>{st.label}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'quotations' && (
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', marginTop: 0 }}>Orçamentos de frete ({quotations.length})</h2>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#6b7280', marginTop: 0 }}>
                    Pedidos de clientes cujo item não tem frete automático. Fale com o cliente (e-mail ou WhatsApp), combine o valor e registre aqui.
                  </p>
                  {quotations.length === 0 ? (
                    <p style={{ fontFamily: 'Outfit, sans-serif', color: '#6b7280' }}>Nenhum pedido de orçamento ainda.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {quotations.map((q) => {
                        const phoneDigits = String(q.customer_phone || '').replace(/\D/g, '');
                        const whatsapp = phoneDigits.length >= 10 ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}` : null;
                        const statusLabel = { pending: 'Pendente', sent: 'Respondido', closed: 'Encerrado' }[q.status] || q.status;
                        const statusColor = { pending: '#d97706', sent: '#2563eb', closed: '#6b7280' }[q.status] || '#6b7280';
                        return (
                          <div key={q.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', fontFamily: 'Outfit, sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <div>
                                <strong>{q.customer_name}</strong>
                                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                  <a href={`mailto:${q.customer_email}`}>{q.customer_email}</a>
                                  {q.customer_phone && <> · {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">{q.customer_phone} (WhatsApp)</a> : q.customer_phone}</>}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                                <span style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                                <div>{q.requested_at ? new Date(q.requested_at).toLocaleString('pt-BR') : ''}</div>
                              </div>
                            </div>
                            {q.product_name && <div style={{ fontSize: '13px', marginTop: '10px' }}>Produto: <strong>{q.product_name}</strong>{q.quantity > 1 ? ` × ${q.quantity}` : ''}</div>}
                            {q.custom_description && <pre style={{ fontFamily: 'inherit', fontSize: '13px', whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>{q.custom_description}</pre>}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="number" min="0" step="0.01" placeholder="Valor do frete (R$)"
                                value={quotePrices[q.id] !== undefined ? quotePrices[q.id] : (q.quote_price ?? '')}
                                onChange={(e) => setQuotePrices({ ...quotePrices, [q.id]: e.target.value })}
                                style={{ ...inputStyle, width: '180px' }}
                              />
                              <button
                                onClick={() => handleUpdateQuotation(q, { quote_price: quotePrices[q.id] !== undefined ? quotePrices[q.id] : q.quote_price, status: 'sent' })}
                                style={{ padding: '8px 14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Registrar valor e marcar respondido
                              </button>
                              {q.status !== 'closed' && (
                                <button
                                  onClick={() => handleUpdateQuotation(q, { status: 'closed' })}
                                  style={{ padding: '8px 14px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Encerrar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
      {orderDetail && (
        <div onClick={() => setOrderDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 12px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '720px', padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Pedido {orderDetail.order_number}</h2>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {orderDetail.created_at ? new Date(orderDetail.created_at).toLocaleString('pt-BR') : ''} ·{' '}
                  <strong style={{ color: (ORDER_STATUS[orderDetail.status] || {}).color }}>{(ORDER_STATUS[orderDetail.status] || {}).label || orderDetail.status}</strong>
                </div>
              </div>
              <button onClick={() => setOrderDetail(null)} aria-label="Fechar" style={{ border: 'none', background: 'none', fontSize: '26px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '20px 0' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Cliente</div>
                <div><strong>{orderDetail.customer_name}</strong></div>
                <div style={{ fontSize: '13px' }}><a href={`mailto:${orderDetail.customer_email}`}>{orderDetail.customer_email}</a></div>
                {orderDetail.customer_phone && (() => {
                  const d = String(orderDetail.customer_phone).replace(/\D/g, '');
                  return <div style={{ fontSize: '13px' }}>{d.length >= 10 ? <a href={`https://wa.me/${d.startsWith('55') ? d : '55' + d}`} target="_blank" rel="noopener noreferrer">{orderDetail.customer_phone} (WhatsApp)</a> : orderDetail.customer_phone}</div>;
                })()}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Endereço de entrega</div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '14px' }}>{formatOrderAddress(orderDetail.shipping_address) || 'Não informado'}</div>
              </div>
            </div>

            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Item</th><th>Qtd</th><th>Peso</th><th style={{ textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {(orderDetail.items || []).map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 0' }}>{it.product_name}{it.sku ? <span style={{ color: '#9ca3af' }}> · {it.sku}</span> : null}</td>
                    <td>{it.quantity}</td>
                    <td>{it.weight ? `${Number(it.weight)} kg` : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{money(Number(it.price) * Number(it.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px', maxWidth: '320px', marginLeft: 'auto' }}>
              <span>Subtotal</span><span style={{ textAlign: 'right' }}>{money(orderDetail.subtotal)}</span>
              {Number(orderDetail.discount) > 0 && <><span>Desconto{orderDetail.coupon_code ? ` (${orderDetail.coupon_code})` : ''}</span><span style={{ textAlign: 'right' }}>-{money(orderDetail.discount)}</span></>}
              <span>Impostos</span><span style={{ textAlign: 'right' }}>{money(orderDetail.tax)}</span>
              <span>Frete</span><span style={{ textAlign: 'right' }}>{money(orderDetail.shipping_cost)}</span>
              <strong>Total</strong><strong style={{ textAlign: 'right' }}>{money(orderDetail.total)}</strong>
            </div>

            <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', margin: '20px 0 0', fontSize: '13px' }}>
              <strong>Frete contratado pelo cliente:</strong>{' '}
              {orderDetail.shipping_carrier || orderDetail.shipping_service
                ? `${[orderDetail.shipping_carrier, orderDetail.shipping_service].filter(Boolean).filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i).join(' ')}${orderDetail.shipping_days ? ` · prazo ${orderDetail.shipping_days} dias úteis` : ''} (${money(orderDetail.shipping_cost)})`
                : 'não registrado'}
              {orderDetail.payment_id && <div style={{ color: '#6b7280', marginTop: '4px' }}>Pagamento: {orderDetail.payment_id}</div>}
            </div>

            {['paid', 'shipped'].includes(orderDetail.status) && (
              <div style={{ border: '1px solid #000', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
                <div style={{ fontWeight: 700, marginBottom: '10px' }}>{orderDetail.status === 'shipped' ? 'Rastreio do envio' : 'Despachar pedido'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <label style={{ fontSize: '12px' }}>Transportadora
                    <input value={shipForm.carrier} onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })} style={{ ...inputStyle, marginTop: '4px' }} placeholder="Ex.: Correios SEDEX" />
                  </label>
                  <label style={{ fontSize: '12px' }}>Código de rastreio
                    <input value={shipForm.trackingNumber} onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })} style={{ ...inputStyle, marginTop: '4px' }} placeholder="Ex.: AA123456789BR" />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleShipOrder} disabled={orderBusy} style={{ padding: '10px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: orderBusy ? 'wait' : 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                    {orderDetail.status === 'shipped' ? 'Atualizar rastreio e reenviar aviso' : 'Marcar como enviado e avisar o cliente'}
                  </button>
                  {orderDetail.status === 'shipped' && (
                    <button onClick={handleDeliverOrder} disabled={orderBusy} style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: orderBusy ? 'wait' : 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                      Marcar como entregue
                    </button>
                  )}
                </div>
              </div>
            )}

            {orderDetail.status === 'delivered' && orderDetail.tracking && (
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Entregue · {orderDetail.tracking.carrier} · {orderDetail.tracking.tracking_number}</p>
            )}

            {orderMessage && (
              <p role="status" style={{ marginTop: '12px', fontSize: '13px', padding: '10px 12px', borderRadius: '4px', background: orderMessage.type === 'ok' ? '#eef6ee' : orderMessage.type === 'warn' ? '#fff7e6' : '#fdecea', color: orderMessage.type === 'ok' ? '#2a6b2a' : orderMessage.type === 'warn' ? '#8a5a00' : '#b00020' }}>
                {orderMessage.text}
              </p>
            )}
          </div>
        </div>
      )}

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
              <FormGroup label="Status" helper="Rascunho e Arquivado não aparecem na loja nem podem ser comprados.">
                <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} style={inputStyle}>
                  {Object.entries(PRODUCT_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Estoque (unidades)" helper="Deixe vazio para não controlar. Com 0, o produto aparece como esgotado.">
                <input type="number" min="0" step="1" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} style={inputStyle} placeholder="Sem controle" />
              </FormGroup>
              <FormGroup label={`Fotos (${productForm.images.length}/${MAX_PRODUCT_IMAGES})`} helper="A primeira é a foto principal. JPG, PNG ou WebP; cada imagem é reduzida automaticamente antes de enviar." style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
                  {productForm.images.map((url, index) => (
                    <div key={url + index} style={{ width: '96px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={url} alt={`Foto ${index + 1}`} style={{ width: '96px', height: '96px', objectFit: 'cover', border: index === 0 ? '2px solid #000' : '1px solid #e5e7eb', background: '#f3f4f6', display: 'block' }} />
                        {index === 0 && <span style={{ position: 'absolute', left: 0, bottom: 0, background: '#000', color: '#fff', fontSize: '10px', padding: '2px 6px', fontWeight: '700' }}>PRINCIPAL</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {index !== 0 && <button type="button" onClick={() => makeImagePrimary(index)} style={{ flex: 1, fontSize: '11px', padding: '3px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Principal</button>}
                        <button type="button" onClick={() => removeImage(index)} style={{ flex: 1, fontSize: '11px', padding: '3px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Remover</button>
                      </div>
                    </div>
                  ))}
                  {productForm.images.length < MAX_PRODUCT_IMAGES && (
                    <label style={{ width: '96px', height: '96px', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: '600', cursor: uploadingImage ? 'wait' : 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
                      {uploadingImage ? 'Enviando…' : '+ Adicionar foto'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelected} disabled={uploadingImage} style={{ display: 'none' }} />
                    </label>
                  )}
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
