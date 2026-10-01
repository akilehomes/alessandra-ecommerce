import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import ReviewRating from '../components/ReviewRating';
import ReviewStats from '../components/ReviewStats';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import WishlistButton from '../components/WishlistButton';
import AddedToCartModal from '../components/AddedToCartModal';
import ShippingCalculator from '../components/ShippingCalculator';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addedItem, setAddedItem] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [token, setToken] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewsRefresh, setReviewsRefresh] = useState(0);
  const { addItem } = useCartStore();
  const { region } = useRegionStore();

  useEffect(() => {
    fetchProduct();
    checkAuthAndPurchase();
  }, [id]);

  const checkAuthAndPurchase = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Here you would verify purchase, but for now we'll enable review form for authenticated users
      setCanReview(true);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: parseInt(quantity),
      });
      setAddedItem({
        name: product.name,
        price: region === 'portugal' ? Number(product.price) * 0.20 : Number(product.price),
        image_url: product.image_url,
        quantity: parseInt(quantity),
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        paddingTop: '160px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#666'
      }}>
        Carregando...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        paddingTop: '160px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#666'
      }}>
        Produto não encontrado
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const displayPrice = region === 'portugal'
    ? (price * 0.20).toFixed(2)
    : price.toFixed(2);
  const currency = region === 'portugal' ? '€' : 'R$';

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/shop')}
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12px',
            color: '#999',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '60px',
            textDecoration: 'underline'
          }}
        >
          ← VOLTAR
        </button>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          {/* Image Gallery */}
          <div style={{ position: 'sticky', top: '100px' }}>
            {/* Main Image */}
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImageIndex]?.url}
                alt={product.name}
                style={{ width: '100%', display: 'block', marginBottom: '20px' }}
              />
            ) : product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{ width: '100%', display: 'block', marginBottom: '20px' }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                marginBottom: '20px'
              }}>
                Sem imagem
              </div>
            )}

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      cursor: 'pointer',
                      border: selectedImageIndex === idx ? '2px solid #000' : '1px solid #d1d5db',
                      padding: '0',
                      background: 'none',
                      aspectRatio: '1'
                    }}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            {/* Title */}
            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '40px',
              lineHeight: '1.2'
            }}>
              {product.name}
            </h1>

            {/* Category */}
            {product.category && (
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '24px'
              }}>
                {product.category}
              </p>
            )}

            {/* Price and Wishlist */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '20px',
                fontWeight: '400',
                color: '#000'
              }}>
                {currency} {displayPrice}
              </p>
              <WishlistButton productId={parseInt(id)} size="lg" />
            </div>

            {/* Quantity & Add to Cart */}
            <div style={{ marginBottom: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '24px' }}>
                {/* Quantity Input */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '16px',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '14px',
                      padding: '12px 16px',
                      width: '60px',
                      textAlign: 'center',
                      border: 'none',
                      borderLeft: '1px solid #d1d5db',
                      borderRight: '1px solid #d1d5db'
                    }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '16px',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '16px 24px',
                  width: '100%',
                  border: '1px solid #000',
                  background: '#000',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#333'}
                onMouseLeave={(e) => e.target.style.background = '#000'}
              >
                Adicionar ao Carrinho
              </button>

              {region === 'BR' && (
                <ShippingCalculator items={[{ productId: product.id, quantity: parseInt(quantity) || 1, name: product.name }]} />
              )}
            </div>

            {/* Expandable Sections */}
            <div style={{ borderTop: '1px solid #e5e7eb' }}>
              {/* Description */}
              <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'description' ? null : 'description')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    fontFamily: 'Crimson Text, serif',
                    fontSize: '18px',
                    fontStyle: 'italic',
                    color: '#000'
                  }}
                >
                  <span>Description</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
                    {expandedSection === 'description' ? '−' : '+'}
                  </span>
                </button>
                {expandedSection === 'description' && product.description && (
                  <p style={{
                    fontFamily: 'Crimson Text, serif',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#333',
                    marginTop: '20px'
                  }}>
                    {product.description}
                  </p>
                )}
              </div>

              {/* Dimensions */}
              {(product.weight || product.height || product.width || product.depth) && (
                <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'dimensions' ? null : 'dimensions')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontFamily: 'Crimson Text, serif',
                      fontSize: '18px',
                      fontStyle: 'italic',
                      color: '#000'
                    }}
                  >
                    <span>Dimensions</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
                      {expandedSection === 'dimensions' ? '−' : '+'}
                    </span>
                  </button>
                  {expandedSection === 'dimensions' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                      marginTop: '20px',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '14px'
                    }}>
                      {product.weight > 0 && <p>Peso: {product.weight} kg</p>}
                      {product.height > 0 && <p>Altura: {product.height} cm</p>}
                      {product.width > 0 && <p>Largura: {product.width} cm</p>}
                      {product.depth > 0 && <p>Profundidade: {product.depth} cm</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping */}
              <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    fontFamily: 'Crimson Text, serif',
                    fontSize: '18px',
                    fontStyle: 'italic',
                    color: '#000'
                  }}
                >
                  <span>Shipping & Returns</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
                    {expandedSection === 'shipping' ? '−' : '+'}
                  </span>
                </button>
                {expandedSection === 'shipping' && (
                  <p style={{
                    fontFamily: 'Crimson Text, serif',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#333',
                    marginTop: '20px'
                  }}>
                    Free shipping on orders over R$ 500 (or € 100). Returns accepted within 30 days of purchase.
                  </p>
                )}
              </div>

              {/* Reviews Section */}
              <div style={{ paddingTop: '24px', paddingBottom: '24px', borderTop: '1px solid #eee' }}>
                <h2 style={{
                  fontFamily: 'Crimson Text, serif',
                  fontSize: '32px',
                  fontStyle: 'italic',
                  marginTop: 0,
                  marginBottom: '24px'
                }}>
                  Avaliações dos Clientes
                </h2>

                {/* Review Stats */}
                <ReviewStats productId={id} />

                {/* Review Form */}
                <ReviewForm
                  productId={id}
                  onReviewCreated={() => setReviewsRefresh(r => r + 1)}
                  canReview={canReview}
                  token={token}
                />

                {/* Reviews List */}
                <ReviewsList
                  productId={id}
                  token={token}
                  refresh={reviewsRefresh}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddedToCartModal
        item={addedItem}
        symbol={currency}
        onContinue={() => setAddedItem(null)}
        onGoToCart={() => navigate('/cart')}
      />
    </div>
  );
}
