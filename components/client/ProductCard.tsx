import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onUpdate: (delta: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, quantity, onUpdate }) => {
  return (
    <div className="flex flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
      <div className="flex flex-row items-center flex-1">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-16 h-16 rounded-md object-cover bg-gray-200"
        />
        <div className="ml-3">
          <h3 className="text-gray-900 font-medium text-lg leading-tight">{product.name}</h3>
          <p className="text-gray-500 text-sm mt-1">${product.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="ml-4 flex items-center">
        {quantity === 0 ? (
          <button
            onClick={() => onUpdate(1)}
            className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
          >
            ¿Querés?
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => onUpdate(-1)}
              className="text-xs font-medium text-gray-600 px-2 py-2 hover:bg-gray-200 rounded transition-colors"
            >
              Quiero menos
            </button>
            
            <span className="font-bold text-lg w-6 text-center text-black">
              {quantity >= 2 ? quantity : '1'}
            </span>
            
            <button
              onClick={() => onUpdate(1)}
              className="text-xs font-medium text-gray-900 px-2 py-2 hover:bg-gray-200 rounded transition-colors"
            >
              Quiero más
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
