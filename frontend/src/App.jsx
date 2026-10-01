import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Projects from './pages/Projects';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDashboardComplete from "./pages/AdminDashboardComplete";
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import AdvancedSearch from './pages/AdvancedSearch';
import Wishlist from './pages/Wishlist';
import { useCartStore } from './store/cartStore';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';

function App() {
  const initializeCart = useCartStore((state) => state.initializeCart);
  const authInitialize = useAuthStore((state) => state.initialize);
  const initializeWishlist = useWishlistStore((state) => state.initializeWishlist);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const { token } = useAuthStore();

  useEffect(() => {
    initializeCart();
    authInitialize();
    initializeWishlist();
  }, []);

  useEffect(() => {
    if (token) {
      fetchWishlist(token);
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        {/* Admin routes - no navbar/footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboardComplete />} />

        {/* Public routes - with navbar/footer */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main className="min-h-screen pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/search" element={<AdvancedSearch />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<OrderSuccess />} />
                  <Route path="/track/:orderId" element={<OrderTracking />} />
                  <Route path="/track" element={<OrderTracking />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/account/orders" element={<Account />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
