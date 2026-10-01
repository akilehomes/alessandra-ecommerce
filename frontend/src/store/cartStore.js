import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useCartStore = create((set, get) => ({
  cartId: null,
  items: [],
  total: 0,
  loading: false,

  // Inicializar carrinho
  initializeCart: async () => {
    try {
      set({ loading: true });
      const response = await axios.post(`${API_URL}/cart/init`);
      set({ cartId: response.data.cartId });

      // Carrega itens do localStorage
      const savedItems = localStorage.getItem('cartItems');
      if (savedItems) {
        const items = JSON.parse(savedItems);
        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        set({ items, total });
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Adicionar item ao carrinho
  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.productId === item.productId
      );

      let newItems;
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...state.items, item];
      }

      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      // Salvar no localStorage
      localStorage.setItem('cartItems', JSON.stringify(newItems));

      return { items: newItems, total: newTotal };
    });
  },

  // Remover item
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.productId !== productId);
      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return { items: newItems, total: newTotal };
    });
  },

  // Atualizar quantidade
  updateQuantity: (productId, quantity) => {
    set((state) => {
      let newItems = state.items;
      if (quantity <= 0) {
        newItems = newItems.filter((i) => i.productId !== productId);
      } else {
        newItems = newItems.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
      }

      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return { items: newItems, total: newTotal };
    });
  },

  // Limpar carrinho
  clearCart: () => {
    set({ items: [], total: 0 });
    localStorage.removeItem('cartItems');
  },

  // Aplicar cupom
  applyCoupon: async (couponCode) => {
    try {
      const { cartId } = get();
      const response = await axios.post(`${API_URL}/cart/${cartId}/coupon`, {
        couponCode,
        subtotal: get().total,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Cupom inválido';
    }
  },
}));
