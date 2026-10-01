import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewRating from './ReviewRating';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ReviewStats({ productId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [productId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/reviews/${productId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
        fontFamily: 'Outfit, sans-serif',
        color: '#999',
        fontSize: '14px'
      }}>
        Nenhuma avaliação disponível
      </div>
    );
  }

  const distribution = stats.distribution || {};

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      fontFamily: 'Outfit, sans-serif',
      marginBottom: '24px'
    }}>
      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '14px', color: '#999', fontWeight: '500' }}>
            Avaliação Média
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.average_rating?.toFixed(1) || 'N/A'}
          </div>
          <ReviewRating rating={stats.average_rating || 0} size="small" />
        </div>

        <div>
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '14px', color: '#999', fontWeight: '500' }}>
            Total de Avaliações
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {stats.total_reviews}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
          Distribuição de Avaliações
        </h4>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[`${rating}_star`] || 0;
          const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;

          return (
            <div key={rating} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', minWidth: '30px' }}>
                  {rating}★
                </span>
                <div style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: '#FFB81C',
                    width: `${percentage}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: '#999', minWidth: '50px', textAlign: 'right' }}>
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
