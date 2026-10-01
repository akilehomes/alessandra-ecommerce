import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FinancialDashboard from '../components/FinancialDashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [additionalImageFile, setAdditionalImageFile] = useState(null);
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

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products?limit=100`);
      setProducts(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await axios.post(`${API_URL}/upload/product`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({...formData, image_url: response.data.imageUrl});
      alert('Imagem enviada com sucesso!');
    } catch (error) {
      alert('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditProduct = async (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      image_url: product.image_url || '',
      category: product.category || '',
      weight: product.weight || '',
      height: product.height || '',
      width: product.width || '',
      depth: product.depth || '',
    });
    // Carregar imagens do produto
    try {
      const response = await axios.get(`${API_URL}/admin/products/${product.id}/images`);
      setProductImages({ ...productImages, [product.id]: response.data });
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Preencha pelo menos nome e preço');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_URL}/admin/products/${editingId}`, {
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          image_url: formData.image_url,
          category: formData.category,
          weight: formData.weight ? Number(formData.weight) : 0,
          height: formData.height ? Number(formData.height) : 0,
          width: formData.width ? Number(formData.width) : 0,
          depth: formData.depth ? Number(formData.depth) : 0,
        });
        alert('Produto atualizado com sucesso!');
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/admin/products`, {
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          image_url: formData.image_url,
          category: formData.category,
          weight: formData.weight ? Number(formData.weight) : 0,
          height: formData.height ? Number(formData.height) : 0,
          width: formData.width ? Number(formData.width) : 0,
          depth: formData.depth ? Number(formData.depth) : 0,
        });
        alert('Produto adicionado com sucesso!');
      }
      setFormData({ name: '', price: '', description: '', image_url: '', category: '', weight: '', height: '', width: '', depth: '' });
      fetchProducts();
    } catch (error) {
      alert('Erro ao salvar produto: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', image_url: '', category: '', weight: '', height: '', width: '', depth: '' });
    setAdditionalImageFile(null);
  };

  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await axios.post(`${API_URL}/upload/product`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAdditionalImageFile({ url: response.data.imageUrl, file: file });
      alert('Imagem carregada! Clique em "Adicionar Imagem" para confirmar.');
    } catch (error) {
      alert('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddAdditionalImage = async () => {
    if (!additionalImageFile || !editingId) {
      alert('Selecione uma imagem primeiro');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/admin/products/${editingId}/images`, {
        image_url: additionalImageFile.url,
        is_primary: false
      });

      const images = productImages[editingId] || [];
      setProductImages({ ...productImages, [editingId]: [...images, response.data] });
      setAdditionalImageFile(null);
      alert('Imagem adicionada com sucesso!');
    } catch (error) {
      alert('Erro ao adicionar imagem: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteProductImage = async (productId, imageId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta imagem?')) return;
    try {
      await axios.delete(`${API_URL}/admin/products/${productId}/images/${imageId}`);
      const images = productImages[productId]?.filter(img => img.id !== imageId) || [];
      setProductImages({ ...productImages, [productId]: images });
      alert('Imagem deletada!');
    } catch (error) {
      alert('Erro ao deletar imagem');
    }
  };

  const handleMoveImage = async (productId, index, direction) => {
    const images = [...(productImages[productId] || [])];
    if (direction === 'up' && index > 0) {
      [images[index], images[index - 1]] = [images[index - 1], images[index]];
    } else if (direction === 'down' && index < images.length - 1) {
      [images[index], images[index + 1]] = [images[index + 1], images[index]];
    }

    setProductImages({ ...productImages, [productId]: images });

    // Salvar ordem no banco de dados
    try {
      for (let i = 0; i < images.length; i++) {
        const isPrimary = i === 0;
        await axios.put(`${API_URL}/admin/products/${productId}/images/${images[i].id}`, {
          is_primary: isPrimary,
          position: i
        });
      }
      console.log('✓ Ordem das imagens atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      alert('Erro ao salvar ordem: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este produto?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        alert('Produto deletado com sucesso!');
        fetchProducts();
      } catch (error) {
        alert('Erro ao deletar produto');
      }
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-12">
          <h1 style={{fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase'}}>
            Admin Panel
          </h1>
          <p style={{fontFamily: 'Crimson Text, serif', fontSize: '14px', fontStyle: 'italic', color: '#666'}}>
            Gerenciamento de produtos, pedidos e configurações
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px'}}>
          {['dashboard', 'products', 'orders', 'financial', 'settings'].map((tab) => (
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
              }}
            >
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'products' && 'Produtos'}
              {tab === 'orders' && 'Pedidos'}
              {tab === 'financial' && 'Financeiro'}
              {tab === 'settings' && 'Configurações'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Total Produtos</p>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>{products.length}</p>
            </div>
            <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Total Pedidos</p>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>{orders.length}</p>
            </div>
            <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Faturamento</p>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '700'}}>R$ 0,00</p>
            </div>
            <div style={{border: '1px solid #000', padding: '24px', textAlign: 'center'}}>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase'}}>Status</p>
              <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700', color: '#10b981'}}>Online</p>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div style={{marginBottom: '32px', border: '1px solid #e5e7eb', padding: '24px'}}>
              <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase'}}>
                {editingId ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome do Produto"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                />
                <input
                  type="text"
                  placeholder="Categoria"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                />

                {/* Upload de Imagem */}
                <div style={{gridColumn: 'span 2'}}>
                  <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', display: 'block', marginBottom: '8px', color: '#666', textTransform: 'uppercase'}}>
                    Upload de Imagem Principal
                  </label>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1}}
                    />
                    {uploading && <span style={{fontSize: '12px', color: '#999'}}>Enviando...</span>}
                    {formData.image_url && <span style={{fontSize: '12px', color: '#10b981'}}>✓ Enviada</span>}
                  </div>

                  {/* Upload de Imagens Adicionais */}
                  {editingId && (
                    <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb'}}>
                      <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', display: 'block', marginBottom: '8px', color: '#666', textTransform: 'uppercase'}}>
                        Adicionar Imagens Adicionais (até 6)
                      </label>
                      <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px'}}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAdditionalImageUpload}
                          disabled={uploading}
                          style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', flex: 1}}
                        />
                        <button
                          onClick={handleAddAdditionalImage}
                          disabled={!additionalImageFile || loading}
                          style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            padding: '8px 16px',
                            border: '1px solid #10b981',
                            background: additionalImageFile ? '#10b981' : '#f3f4f6',
                            color: additionalImageFile ? '#fff' : '#d1d5db',
                            cursor: additionalImageFile ? 'pointer' : 'not-allowed',
                            textTransform: 'uppercase',
                            borderRadius: '4px'
                          }}
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Galeria de imagens do produto editando */}
                  {editingId && productImages[editingId] && productImages[editingId].length > 0 && (
                    <div style={{marginTop: '20px'}}>
                      <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '12px'}}>
                        Imagens adicionais ({productImages[editingId].length})
                      </p>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px'}}>
                        {productImages[editingId].map((img, idx) => (
                          <div key={img.id} style={{position: 'relative'}}>
                            <div style={{position: 'relative'}}>
                              <img
                                src={img.image_url}
                                alt="Product"
                                style={{width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', border: idx === 0 ? '2px solid #10b981' : 'none'}}
                              />
                              {idx === 0 && (
                                <span style={{position: 'absolute', top: '4px', left: '4px', background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold'}}>
                                  PRINCIPAL
                                </span>
                              )}
                            </div>
                            <div style={{display: 'flex', gap: '4px', marginTop: '4px'}}>
                              {idx > 0 && (
                                <button
                                  onClick={() => handleMoveImage(editingId, idx, 'up')}
                                  style={{flex: 1, padding: '4px', fontSize: '10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '2px', cursor: 'pointer'}}
                                  title="Mover para cima"
                                >
                                  ↑
                                </button>
                              )}
                              {idx < productImages[editingId].length - 1 && (
                                <button
                                  onClick={() => handleMoveImage(editingId, idx, 'down')}
                                  style={{flex: 1, padding: '4px', fontSize: '10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '2px', cursor: 'pointer'}}
                                  title="Mover para baixo"
                                >
                                  ↓
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteProductImage(editingId, img.id)}
                                style={{flex: 1, padding: '4px', fontSize: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer'}}
                                title="Deletar"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <textarea
                  placeholder="Descrição"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', gridColumn: 'span 2', minHeight: '80px'}}
                />

                {/* Peso e Medidas */}
                <div style={{gridColumn: 'span 2'}}>
                  <p style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', marginBottom: '12px', color: '#666', textTransform: 'uppercase'}}>Peso e Medidas (para cálculo de frete)</p>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Peso (kg)"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                    <input
                      type="number"
                      placeholder="Altura (cm)"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                    <input
                      type="number"
                      placeholder="Largura (cm)"
                      step="0.1"
                      value={formData.width}
                      onChange={(e) => setFormData({...formData, width: e.target.value})}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                    <input
                      type="number"
                      placeholder="Profundidade (cm)"
                      step="0.1"
                      value={formData.depth}
                      onChange={(e) => setFormData({...formData, depth: e.target.value})}
                      style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
                <button
                  onClick={handleSaveProduct}
                  disabled={loading}
                  style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
                >
                  {loading ? 'Salvando...' : (editingId ? 'Atualizar Produto' : 'Adicionar Produto')}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 24px', border: '1px solid #d1d5db', background: '#fff', color: '#666', cursor: 'pointer', textTransform: 'uppercase'}}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
                Produtos ({products.length})
              </h2>
              {loading ? (
                <p style={{textAlign: 'center', padding: '32px'}}>Carregando...</p>
              ) : products.length === 0 ? (
                <p style={{textAlign: 'center', padding: '32px', color: '#999'}}>Nenhum produto cadastrado</p>
              ) : (
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
                            <button
                              onClick={() => handleEditProduct(product)}
                              style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none'}}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              style={{fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none'}}
                            >
                              Deletar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase'}}>
              Pedidos ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p style={{textAlign: 'center', padding: '32px', color: '#999'}}>Nenhum pedido registrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                      <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>ID</th>
                      <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Cliente</th>
                      <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Total</th>
                      <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Status</th>
                      <th style={{textAlign: 'left', padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'}}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                        <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{order.id?.slice(0, 8)}</td>
                        <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{order.customer_name || '-'}</td>
                        <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>R$ {Number(order.total || 0).toFixed(2)}</td>
                        <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: order.status === 'paid' ? '#10b981' : '#f59e0b'}}>{order.status || 'pending'}</td>
                        <td style={{padding: '12px', fontFamily: 'Outfit, sans-serif', fontSize: '12px'}}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div>
            <FinancialDashboard orders={orders} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{border: '1px solid #e5e7eb', padding: '24px'}}>
            <h2 style={{fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', marginBottom: '20px', textTransform: 'uppercase'}}>
              Configurações Regionais
            </h2>
            <div className="space-y-8">
              <div>
                <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '12px'}}>Brasil (BRL)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Taxa de Imposto (%)</label>
                    <input type="number" defaultValue="18" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px'}} />
                  </div>
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Moeda</label>
                    <input type="text" defaultValue="R$" disabled style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px', background: '#f3f4f6'}} />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '12px'}}>Portugal (EUR)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Taxa de Imposto (%)</label>
                    <input type="number" defaultValue="23" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px'}} />
                  </div>
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Moeda</label>
                    <input type="text" defaultValue="€" disabled style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px', background: '#f3f4f6'}} />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '700', marginBottom: '12px'}}>Europa (EUR)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Taxa de Imposto (%)</label>
                    <input type="number" defaultValue="21" style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px'}} />
                  </div>
                  <div>
                    <label style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', display: 'block', marginBottom: '4px'}}>Moeda</label>
                    <input type="text" defaultValue="€" disabled style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', padding: '8px', border: '1px solid #d1d5db', width: '100%', borderRadius: '4px', background: '#f3f4f6'}} />
                  </div>
                </div>
              </div>

              <button
                style={{fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', padding: '12px 24px', border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', textTransform: 'uppercase'}}
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
