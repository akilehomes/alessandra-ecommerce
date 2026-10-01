import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ShippingSelector({ country = 'BR', cartWeight = 1, onShippingSelect, zipCode }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);

  useEffect(() => {
    if (zipCode && cartWeight > 0) {
      calculateShipping();
    }
  }, [zipCode, cartWeight, country]);

  const calculateShipping = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/shipping-integration/calculate`, {
        country: country.toUpperCase() || 'BR',
        zipCode: zipCode.replace(/\D/g, ''),
        weight: cartWeight,
        dimensions: {
          width: 20,
          height: 20,
          length: 30,
        },
      });

      setOptions(response.data.options || []);
      if (response.data.options && response.data.options.length > 0) {
        const firstOption = response.data.options[0];
        setSelectedShipping(firstOption);
        if (onShippingSelect) {
          onShippingSelect(firstOption);
        }
      }
    } catch (err) {
      console.error('Erro ao calcular frete:', err);
      setError(err.response?.data?.error || 'Erro ao calcular frete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedShipping(option);
    if (onShippingSelect) {
      onShippingSelect(option);
    }
  };

  if (!zipCode) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#999',
        fontFamily: 'Outfit, sans-serif',
      }}>
        Digite o CEP para calcular o frete
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#999',
        fontFamily: 'Outfit, sans-serif',
      }}>
        Calculando opções de frete...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fee',
        borderRadius: '8px',
        color: '#c33',
        fontFamily: 'Outfit, sans-serif',
      }}>
        ❌ {error}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#999',
        fontFamily: 'Outfit, sans-serif',
      }}>
        Nenhuma opção de frete disponível para esta localização
      </div>
    );
  }

  const formatPrice = (price) => {
    if (selectedShipping?.currency === 'EUR') {
      return `€ ${price.toFixed(2)}`;
    }
    return `R$ ${price.toFixed(2)}`;
  };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        Opções de Frete
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => handleSelectOption(option)}
            style={{
              padding: '12px 16px',
              border: selectedShipping?.id === option.id ? '2px solid #000' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: selectedShipping?.id === option.id ? '#f9f9f9' : '#fff',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  {option.service}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                  {option.carrier}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  {formatPrice(option.price)}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                  {option.delivery_time} dia{option.delivery_time > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {option.delivery_date && (
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999' }}>
                Entrega em: {new Date(option.delivery_date).toLocaleDateString('pt-BR')}
              </p>
            )}

            {selectedShipping?.id === option.id && (
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #eee',
                fontSize: '12px',
                color: '#000',
                fontWeight: '600',
              }}>
                ✓ Selecionado
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedShipping && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
        }}>
          <strong>Frete selecionado:</strong> {selectedShipping.service} - {formatPrice(selectedShipping.price)}
        </div>
      )}
    </div>
  );
}
