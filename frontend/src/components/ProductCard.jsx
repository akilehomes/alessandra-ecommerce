import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useRegionStore } from '../store/regionStore';

const REGION_CONFIG = {
  BR: { name: 'Brasil', symbol: 'R$', tax: 0.18 },
  PT: { name: 'Portugal', symbol: '€', tax: 0.23 },
  EU: { name: 'Europa', symbol: '€', tax: 0.21 },
};

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);
  const { region } = useRegionStore();
  const regionConfig = REGION_CONFIG[region];

  const inStock = product.inventory?.quantity - product.inventory?.reserved > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity: 1,
    });
    alert('Produto adicionado ao carrinho!');
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="group cursor-pointer">
        <div
          className="aspect-square overflow-hidden mb-4 bg-gray-100 relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Add to Cart Button on Hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <button
                onClick={handleAddToCart}
                className="bg-white text-black px-6 py-2 text-sm font-semibold tracking-widest hover:bg-gray-100 transition"
                disabled={!inStock}
              >
                {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
              </button>
            </div>
          )}

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs uppercase font-semibold">
              Out of Stock
            </div>
          )}
        </div>

        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{regionConfig.symbol} {Number(product.price).toFixed(2)}</p>

        {/* Notify Me Button if out of stock */}
        {!inStock && (
          <button
            onClick={(e) => {
              e.preventDefault();
              // TODO: Open notify modal
              alert('Avise-me quando chegar em breve');
            }}
            className="text-xs text-gray-500 hover:text-gray-900 underline mt-2"
          >
            Avise-me quando chegar
          </button>
        )}
      </div>
    </Link>
  );
}
