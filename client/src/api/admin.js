import client from './client';

export const adminApi = {
  // Auth (legacy session-based admin login)
  login: (password) => client.post('/admin/login', { password }).then((r) => r.data),
  logout: () => client.post('/admin/logout').then((r) => r.data),
  check: () => client.get('/admin/check').then((r) => r.data),
  changePassword: (currentPassword, newPassword) =>
    client.post('/admin/change-password', { currentPassword, newPassword }).then((r) => r.data),
  systemInfo: () => client.get('/admin/system-info').then((r) => r.data),

  // Dashboard
  dashboard: () => client.get('/admin/dashboard').then((r) => r.data),

  // Products
  createProduct: (data) => client.post('/admin/products', data).then((r) => r.data),
  updateProduct: (id, data) => client.put(`/admin/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id) => client.delete(`/admin/products/${id}`).then((r) => r.data),
  bulkProducts: (ids, action, value) =>
    client.post('/admin/products/bulk', { ids, action, value }).then((r) => r.data),

  // Categories
  createCategory: (data) => client.post('/admin/categories', data).then((r) => r.data),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`).then((r) => r.data),

  // Settings
  getSettings: () => client.get('/admin/settings').then((r) => r.data),
  updateSettings: (data) => client.put('/admin/settings', data).then((r) => r.data),

  // Gateways
  getGateways: () => client.get('/admin/gateways').then((r) => r.data),
  updateGateway: (gateway, data) => client.put(`/admin/gateways/${gateway}`, data).then((r) => r.data),
  testGateway: (gateway) => client.post(`/admin/gateways/${gateway}/test`).then((r) => r.data),

  // Orders
  listOrders: (params) => client.get('/admin/orders', { params }).then((r) => r.data),
  getOrder: (id) => client.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status, note) =>
    client.put(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),
  deliverOrder: (id, items) => client.post(`/admin/orders/${id}/deliver`, { items }).then((r) => r.data),
  refundOrder: (id, amount, reason) =>
    client.post(`/admin/orders/${id}/refund`, { amount, reason }).then((r) => r.data),

  // Transactions
  listTransactions: (params) => client.get('/admin/transactions', { params }).then((r) => r.data),

  // Coupons
  listCoupons: () => client.get('/admin/coupons').then((r) => r.data),
  createCoupon: (data) => client.post('/admin/coupons', data).then((r) => r.data),
  updateCoupon: (id, data) => client.put(`/admin/coupons/${id}`, data).then((r) => r.data),
  deleteCoupon: (id) => client.delete(`/admin/coupons/${id}`).then((r) => r.data),

  // Customers
  listCustomers: (params) => client.get('/admin/customers', { params }).then((r) => r.data),
};
