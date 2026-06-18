import client from './client';

export const authApi = {
  register: (data) => client.post('/auth/register', data).then((r) => r.data),
  login: (data) => client.post('/auth/login', data).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
  resendVerification: () => client.post('/auth/resend-verification').then((r) => r.data),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) =>
    client.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data),
  updateProfile: (data) => client.put('/auth/profile', data).then((r) => r.data),
  toggleWishlist: (productId) =>
    client.post(`/auth/wishlist/${productId}`).then((r) => r.data),
};
