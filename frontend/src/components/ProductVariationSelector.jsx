import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function ProductVariationSelector({ productId, onVariationSelect }) {
  const [variants, setVariants] = useState([]);
  const [options, setOptions] = useState({});
  const [selectedValues, setSelectedValues] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      const response = await axios.get(`${API_URL}/variants/${productId}`);
      setVariants(response.data.variants || []);
      setOptions(response.data.options || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setLoading(false);
    }
  };

  const handleOptionChange = (attribute, value) => {
    const newSelection = { ...selectedValues, [attribute]: value };
    setSelectedValues(newSelection);

    // Find matching variant
    const match = variants.find(v => {
      let matches = true;
      for (const [key, val] of Object.entries(newSelection)) {
        if (v[key.toLowerCase()] !== val) {
          matches = false;
          break;
        }
      }
      return matches;
    });

    setSelectedVariant(match || null);
    if (match && onVariationSelect) {
      onVariationSelect(match);
    }
  };

  if (loading) {
    return <div style={{ padding: '12px', color: '#666', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>Carregando variações...</div>;
  }

  if (variants.length === 0) {
    return null; // No variants, product has no variations
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'Outfit, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px',
        color: '#000'
      }}>
        Escolha uma opção
      </h4>

      {Object.entries(options).map(([attribute, values]) => (
        <div key={attribute} style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Outfit, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            marginBottom: '8px',
            color: '#666'
          }}>
            {attribute}
          </label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
            gap: '8px'
          }}>
            {values.map(value => (
              <button
                key={value}
                onClick={() => handleOptionChange(attribute, value)}
                style={{
                  padding: '8px 12px',
                  border: selectedValues[attribute] === value ? '2px solid #000' : '1px solid #d1d5db',
                  backgroundColor: selectedValues[attribute] === value ? '#000' : '#fff',
                  color: selectedValues[attribute] === value ? '#fff' : '#000',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '16px',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif',
          color: '#166534'
        }}>
          ✓ SKU: {selectedVariant.sku} | Estoque: {selectedVariant.stock}
          {selectedVariant.price && ` | R$ ${parseFloat(selectedVariant.price).toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
