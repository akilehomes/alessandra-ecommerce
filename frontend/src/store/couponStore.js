import { create } from 'zustand';

export const useCouponStore = create((set, get) => ({
  appliedCoupon: null,
  discountAmount: 0,

  applyCoupon: (coupon) => {
    set({
      appliedCoupon: coupon,
      discountAmount: coupon.calculated_discount || 0
    });
  },

  removeCoupon: () => {
    set({
      appliedCoupon: null,
      discountAmount: 0
    });
  },

  getDiscountAmount: () => {
    return get().discountAmount;
  },

  getCouponCode: () => {
    const coupon = get().appliedCoupon;
    return coupon ? coupon.code : null;
  }
}));
