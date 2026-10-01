import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewRating from './ReviewRating';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ReviewsList({ productId, token, refresh = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState(null);
  const [userHelpful, setUserHelpful] = useState(new Set());
  const [markingHelpful, setMarkingHelpful] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [page, selectedRating, productId, refresh]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/reviews/${productId}/reviews?page=${page}&limit=10`;
      if (selectedRating) {
        url += `&rating=${selectedRating}`;
      }

      const response = await axios.get(url);
      setReviews(response.data.data || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId, isHelpful) => {
    if (!token) {
      alert('Você precisa estar logado para marcar como útil');
      return;
    }

    try {
      setMarkingHelpful(reviewId);
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_URL}/reviews/${reviewId}/helpful`, {}, { headers });

      // Update UI
      const newUserHelpful = new Set(userHelpful);
      if (isHelpful) {
        newUserHelpful.delete(reviewId);
      } else {
        newUserHelpful.add(reviewId);
      }
      setUserHelpful(newUserHelpful);

      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Erro ao marcar como útil:', error);
      alert('Erro ao marcar como útil');
    } finally {
      setMarkingHelpful(null);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#999',
        fontFamily: 'Outfit, sans-serif'
      }}>
        Carregando avaliações...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#999',
        fontFamily: 'Outfit, sans-serif'
      }}>
        Nenhuma avaliação disponível ainda. Seja o primeiro a avaliar!
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Rating Filter */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #eee'
      }}>
        <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', marginTop: 0 }}>
          Filtrar por avaliação:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setSelectedRating(null);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: !selectedRating ? '#000' : '#f0f0f0',
              color: !selectedRating ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                setSelectedRating(rating);
                setPage(1);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedRating === rating ? '#000' : '#f0f0f0',
                color: selectedRating === rating ? '#fff' : '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {rating}★
            </button>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              paddingBottom: '20px',
              marginBottom: '20px',
              borderBottom: '1px solid #eee'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <ReviewRating rating={review.rating} size="medium" />
                  {review.verified_purchase && (
                    <span style={{
                      backgroundColor: '#F0F0F0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      ✓ Compra Verificada
                    </span>
                  )}
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#000' }}>
                  {review.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  por <strong>{review.user_name}</strong> em{' '}
                  {new Date(review.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p style={{
                margin: '12px 0',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#333'
              }}>
                {review.comment}
              </p>
            )}

            {/* Helpful Section */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <button
                onClick={() => handleHelpful(review.id, userHelpful.has(review.id))}
                disabled={markingHelpful === review.id}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: markingHelpful === review.id ? 'wait' : 'pointer',
                  fontSize: '13px',
                  color: userHelpful.has(review.id) ? '#000' : '#999',
                  fontWeight: userHelpful.has(review.id) ? '600' : '400',
                  opacity: markingHelpful === review.id ? 0.6 : 1
                }}
              >
                {userHelpful.has(review.id) ? '👍' : '👍🏻'} Útil ({review.helpful_count})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              backgroundColor: page === 1 ? '#f0f0f0' : '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: page === 1 ? 'default' : 'pointer',
              fontSize: '14px',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 12px',
                backgroundColor: p === page ? '#000' : '#f0f0f0',
                color: p === page ? '#fff' : '#000',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: p === page ? '600' : '400'
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 12px',
              backgroundColor: page === totalPages ? '#f0f0f0' : '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: page === totalPages ? 'default' : 'pointer',
              fontSize: '14px',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
