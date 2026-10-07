import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,
  fetchedFor: null, // token da conta cuja lista ja foi carregada do servidor
  error: null,

  // Initialize from localStorage on mount
  initializeWishlist: () => {
    try {
      const stored = localStorage.getItem('wishlist_items');
      if (stored) {
        set({ items: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load wishlist from storage:', error);
    }
  },

  // Fetch wishlist from API
  fetchWishlist: async (token) => {
    if (!token || get().loading) return;

    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ items: response.data, loading: false, fetchedFor: token, error: null });
      localStorage.setItem('wishlist_items', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Add to wishlist
  addToWishlist: async (productId, token) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/wishlist/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add to local state
      set(state => ({
        items: [...state.items, response.data.item || { product_id: productId }]
      }));

      // Update localStorage
      const updated = get().items;
      localStorage.setItem('wishlist_items', JSON.stringify(updated));

      return true;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (productId, token) => {
    if (!token) return;

    try {
      await axios.delete(
        `${API_URL}/wishlist/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      set(state => ({
        items: state.items.filter(item => item.product_id !== productId)
      }));

      // Update localStorage
      const updated = get().items;
      localStorage.setItem('wishlist_items', JSON.stringify(updated));

      return true;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Toggle wishlist item
  toggleWishlist: async (productId, token) => {
    const isInWishlist = get().items.some(item => item.product_id === productId);

    if (isInWishlist) {
      return await get().removeFromWishlist(productId, token);
    } else {
      return await get().addToWishlist(productId, token);
    }
  },

  // Check if product is in wishlist
  isInWishlist: (productId) => {
    return get().items.some(item => item.product_id === productId);
  },

  // Get wishlist count
  getWishlistCount: () => {
    return get().items.length;
  },

  // Clear wishlist
  clearWishlist: () => {
    set({ items: [] });
    localStorage.removeItem('wishlist_items');
  }
}));
