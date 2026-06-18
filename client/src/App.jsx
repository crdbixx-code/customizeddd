import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';

import StorefrontLayout from './layouts/StorefrontLayout';
import AccountLayout from './layouts/AccountLayout';
import AdminLayout from './layouts/AdminLayout';
import { RequireAuth, RequireAdmin } from './components/RouteGuards';

import Home from './pages/storefront/Home';
import CategoryPage from './pages/storefront/CategoryPage';
import ProductDetail from './pages/storefront/ProductDetail';
import Login from './pages/storefront/Login';
import Register from './pages/storefront/Register';
import ForgotPassword from './pages/storefront/ForgotPassword';
import ResetPassword from './pages/storefront/ResetPassword';
import Checkout from './pages/storefront/Checkout';
import CheckoutReturn from './pages/storefront/CheckoutReturn';
import AccountOverview from './pages/storefront/AccountOverview';
import AccountOrders from './pages/storefront/AccountOrders';
import AccountOrderDetail from './pages/storefront/AccountOrderDetail';
import AccountWishlist from './pages/storefront/AccountWishlist';
import NotFound from './pages/NotFound';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#101e34',
                  color: '#eaf3ff',
                  border: '1px solid rgba(120,170,220,0.2)',
                  fontSize: '13px',
                },
              }}
            />
            <Routes>
              {/* Storefront */}
              <Route element={<StorefrontLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/search" element={<CategoryPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route
                  path="/checkout"
                  element={
                    <RequireAuth>
                      <Checkout />
                    </RequireAuth>
                  }
                />
                <Route path="/checkout/return" element={<CheckoutReturn />} />

                <Route
                  path="/account"
                  element={
                    <RequireAuth>
                      <AccountLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<AccountOverview />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="orders/:id" element={<AccountOrderDetail />} />
                  <Route path="wishlist" element={<AccountWishlist />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
