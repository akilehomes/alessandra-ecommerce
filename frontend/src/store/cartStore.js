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

  // Confere cada item com a loja: atualiza o estoque, limita a quantidade e remove o que saiu de venda
  syncStock: async () => {
    const { items } = get();
    if (items.length === 0) return;
    const synced = await Promise.all(items.map(async (i) => {
      try {
        const { data } = await axios.get(`${API_URL}/products/${i.productId}`);
        const stock = data.stock_quantity === null || data.stock_quantity === undefined ? null : Number(data.stock_quantity);
        if (stock === 0) return null;
        const quantity = stock === null ? i.quantity : Math.min(i.quantity, stock);
        const price = Number(data.price);
        return { ...i, stock, quantity, price: Number.isFinite(price) ? price : i.price, price_eur: data.price_eur == null ? null : Number(data.price_eur) };
      } catch (error) {
        // 404: produto arquivado ou removido. Outros erros (rede): mantem o item como esta.
        return error.response && error.response.status === 404 ? null : i;
      }
    }));
    const newItems = synced.filter(Boolean);
    const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    localStorage.setItem('cartItems', JSON.stringify(newItems));
    set({ items: newItems, total: newTotal });
  },

  // Adicionar item ao carrinho (stock = unidades disponiveis; null/undefined = sem limite)
  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.productId === item.productId
      );

      const stock = item.stock ?? existingItem?.stock ?? null;
      const cap = (q) => (stock === null ? q : Math.min(q, stock));

      let newItems;
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, stock, quantity: cap(i.quantity + item.quantity) }
            : i
        );
      } else {
        newItems = [...state.items, { ...item, stock, quantity: cap(item.quantity) }];
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
          i.productId === productId
            ? { ...i, quantity: i.stock == null ? quantity : Math.min(quantity, i.stock) }
            : i
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
