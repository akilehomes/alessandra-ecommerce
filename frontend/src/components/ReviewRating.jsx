import React from 'react';

export default function ReviewRating({ rating, count, size = 'large' }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('⯨');
    } else {
      stars.push('☆');
    }
  }

  const fontSize = size === 'small' ? '14px' : size === 'medium' ? '16px' : '24px';
  const textSize = size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontSize,
        color: '#FFB81C',
        fontWeight: 'bold',
        letterSpacing: '2px'
      }}>
        {stars.join('')}
      </span>
      {rating > 0 && (
        <span style={{
          fontSize: textSize,
          color: '#666',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {rating.toFixed(1)}
          {count !== undefined && (
            <span style={{ fontSize: textSize, color: '#999' }}>
              ({count})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
