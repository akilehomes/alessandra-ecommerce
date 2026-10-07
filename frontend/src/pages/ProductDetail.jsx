import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';
import ReviewRating from '../components/ReviewRating';
import ReviewStats from '../components/ReviewStats';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import WishlistButton from '../components/WishlistButton';
import { useI18n } from '../i18n';
import { currencyOfRegion, unitPriceFor } from '../utils/pricing';
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
  const { t, money } = useI18n();

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

  // stock_quantity vazio = sem controle de estoque
  const stock = product && product.stock_quantity != null ? Number(product.stock_quantity) : null;
  const outOfStock = stock !== null && stock <= 0;
  const maxQuantity = stock !== null ? Math.max(stock, 1) : Infinity;

  const unit = product ? unitPriceFor(product, currencyOfRegion(region)) : null;

  const handleAddToCart = () => {
    if (product && !outOfStock && unit !== null) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: parseInt(quantity),
        stock,
        price_eur: product.price_eur == null ? null : Number(product.price_eur),
      });
      setAddedItem({
        name: product.name,
        price: unit,
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
        {t('product.loading')}
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
        {t('product.notFound')}
      </div>
    );
  }

  // Preco na moeda da regiao (euro usa price_eur; sem preco em euro = nao vendido la)
  const currencyCode = currencyOfRegion(region);
  const currency = currencyCode === 'EUR' ? '€' : 'R$';

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
          ← {t('product.back')}
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
                {t('wishlist.noImage')}
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
                {unit === null ? t('product.unavailableRegion') : money(unit, currencyCode)}
              </p>
              <WishlistButton productId={product.id} size="lg" />
            </div>

            {/* Quantity & Add to Cart */}
            <div style={{ marginBottom: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '24px' }}>
                {/* Quantity Input */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, Math.min(quantity, maxQuantity) - 1))}
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
                    onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    max={stock !== null ? stock : undefined}
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
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
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

              {outOfStock && (
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#dc2626', fontWeight: '600', margin: '0 0 12px' }}>
                  {t('product.soldOutNow')}
                </p>
              )}
              {stock !== null && stock > 0 && stock <= 5 && (
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#d97706', margin: '0 0 12px' }}>
                  {stock === 1 ? t('product.lastUnit') : t('product.fewUnits', { n: stock })}
                </p>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || unit === null}
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '16px 24px',
                  width: '100%',
                  border: '1px solid #000',
                  background: outOfStock ? '#d1d5db' : '#000',
                  color: '#fff',
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { if (!outOfStock) e.target.style.background = '#333'; }}
                onMouseLeave={(e) => { if (!outOfStock) e.target.style.background = '#000'; }}
              >
                {outOfStock ? t('product.soldOut') : unit === null ? t('product.unavailableRegion') : t('product.add')}
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
                  <span>{t('product.description')}</span>
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
                    <span>{t('product.dimensions')}</span>
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
                      {product.weight > 0 && <p>{t('product.weight', { v: product.weight })}</p>}
                      {product.height > 0 && <p>{t('product.height', { v: product.height })}</p>}
                      {product.width > 0 && <p>{t('product.width', { v: product.width })}</p>}
                      {product.depth > 0 && <p>{t('product.depth', { v: product.depth })}</p>}
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
                  <span>{t('product.shippingReturns')}</span>
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
                    {t('product.shippingText')}{' '}
                    <Link to="/legal/envio" style={{ color: '#000' }}>{t('product.shippingLinks')}</Link> · <Link to="/legal/trocas" style={{ color: '#000' }}>{t('product.returnsLink')}</Link>
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
                  {t('product.reviews')}
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
