import { create } from 'zustand';

const STORAGE_KEY = 'appliedCoupon';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch (e) {
    return null;
  }
};

const save = (coupon) => {
  try {
    if (coupon) localStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* sem armazenamento: o cupom vale so nesta pagina */
  }
};

// Mesma regra do servidor: percentual ou valor fixo, nunca acima do subtotal
export const computeDiscount = (coupon, subtotal) => {
  if (!coupon || !(subtotal > 0)) return 0;
  let discount = 0;
  if (Number(coupon.discount_percentage) > 0) discount = (subtotal * Number(coupon.discount_percentage)) / 100;
  else if (Number(coupon.discount_amount) > 0) discount = Number(coupon.discount_amount);
  return Math.round(Math.min(Math.max(0, discount), subtotal) * 100) / 100;
};

// O desconto real e sempre recalculado e confirmado pelo servidor ao criar o pedido
export const useCouponStore = create((set, get) => ({
  appliedCoupon: load(), // { code, discount_percentage, discount_amount }

  applyCoupon: (coupon) => {
    const rules = {
      code: coupon.code,
      discount_percentage: coupon.discount_percentage || null,
      discount_amount: coupon.discount_amount || null,
    };
    save(rules);
    set({ appliedCoupon: rules });
  },

  removeCoupon: () => {
    save(null);
    set({ appliedCoupon: null });
  },

  getDiscountFor: (subtotal) => computeDiscount(get().appliedCoupon, subtotal),
  getCouponCode: () => (get().appliedCoupon ? get().appliedCoupon.code : null),
}));
