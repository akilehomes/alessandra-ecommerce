import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function AdminReviewsManager({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [page, status]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${API_URL}/admin/reviews?page=${page}&limit=20&status=${status}`,
        { headers }
      );
      setReviews(response.data.data || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/admin/reviews/${reviewId}/approve`,
        {},
        { headers }
      );
      fetchReviews();
      alert('Review aprovado com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar review: ' + error.response?.data?.error);
    }
  };

  const handleReject = async (reviewId) => {
    if (!rejectReason.trim()) {
      alert('Motivo da rejeição é obrigatório');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/admin/reviews/${reviewId}/reject`,
        { reason: rejectReason },
        { headers }
      );
      fetchReviews();
      setRejectingId(null);
      setRejectReason('');
      alert('Review rejeitado com sucesso!');
    } catch (error) {
      alert('Erro ao rejeitar review: ' + error.response?.data?.error);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Tem certeza que deseja deletar este review?')) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(
        `${API_URL}/admin/reviews/${reviewId}`,
        { headers }
      );
      fetchReviews();
      alert('Review deletado com sucesso!');
    } catch (error) {
      alert('Erro ao deletar review: ' + error.response?.data?.error);
    }
  };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        Gerenciar Avaliações
      </h2>

      {/* Status Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: status === s ? '#000' : '#f0f0f0',
              color: status === s ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}
          >
            {s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovados' : 'Rejeitados'}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Carregando...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Nenhuma avaliação encontrada
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Produto
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Usuário
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                  Rating
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                  Título
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <React.Fragment key={review.id}>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {review.product_name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {review.user_name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {'★'.repeat(review.rating)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <button
                        onClick={() => setSelectedReview(selectedReview?.id === review.id ? null : review)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0066cc',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {review.title}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {review.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(review.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#4CAF50',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => setRejectingId(review.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#FF9800',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Review Details */}
                  {selectedReview?.id === review.id && (
                    <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                      <td colSpan="5" style={{ padding: '16px' }}>
                        <div>
                          <h4 style={{ marginTop: 0, marginBottom: '8px' }}>{review.title}</h4>
                          <p style={{ marginBottom: '12px', whiteSpace: 'pre-wrap', color: '#333' }}>
                            {review.comment}
                          </p>
                          <div style={{ fontSize: '13px', color: '#999' }}>
                            <p>Compra Verificada: {review.verified_purchase ? 'Sim ✓' : 'Não'}</p>
                            <p>Útil: {review.helpful_count} pessoas</p>
                            <p>Data: {new Date(review.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Reject Form */}
                  {rejectingId === review.id && (
                    <tr style={{ backgroundColor: '#FFF3CD', borderBottom: '1px solid #eee' }}>
                      <td colSpan="5" style={{ padding: '16px' }}>
                        <div>
                          <p style={{ marginTop: 0, marginBottom: '12px', fontWeight: '600' }}>
                            Motivo da Rejeição:
                          </p>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Descreva o motivo da rejeição..."
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontFamily: 'Outfit, sans-serif',
                              fontSize: '14px',
                              marginBottom: '12px',
                              boxSizing: 'border-box'
                            }}
                            rows={3}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleReject(review.id)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#FF9800',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Confirmar Rejeição
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#f0f0f0',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px'
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
                cursor: 'pointer'
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
