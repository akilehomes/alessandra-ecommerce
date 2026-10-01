import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ReviewForm({ productId, onReviewCreated, canReview = false, token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canReview) {
      setError('Você precisa ter comprado este produto para avaliar.');
      return;
    }

    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        `${API_URL}/reviews/${productId}/reviews`,
        { rating: parseInt(rating), title: title.trim(), comment: comment.trim() || null },
        { headers }
      );

      setRating(5);
      setTitle('');
      setComment('');
      setIsOpen(false);

      if (onReviewCreated) {
        onReviewCreated(response.data);
      }

      alert('Avaliação criada com sucesso! Obrigado pela sua avaliação.');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao criar avaliação';
      setError(errorMessage);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!canReview && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '24px'
        }}
      >
        Deixar Avaliação
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      padding: '24px',
      borderRadius: '8px',
      marginBottom: '24px',
      maxWidth: '600px',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '600' }}>
        Deixar Avaliação
      </h3>

      {error && (
        <div style={{
          backgroundColor: '#FFE6E6',
          color: '#CC0000',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {!canReview && (
        <div style={{
          backgroundColor: '#FFF3CD',
          color: '#856404',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          Você precisa comprar este produto para deixar uma avaliação.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Avaliação (1-5 estrelas)
          </label>
          <div style={{ display: 'flex', gap: '8px', fontSize: '28px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '28px',
                  color: star <= rating ? '#FFB81C' : '#ddd',
                  padding: '0',
                  transition: 'color 0.2s'
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Exemplo: Produto excelente!"
            maxLength={255}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={loading || !canReview}
          />
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Comentário (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Compartilhe sua experiência com este produto..."
            maxLength={5000}
            rows={5}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            disabled={loading || !canReview}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            {comment.length}/5000
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {isOpen && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError('');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: '600'
              }}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              opacity: loading || !canReview ? 0.6 : 1
            }}
            disabled={loading || !canReview}
          >
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </form>
    </div>
  );
}
