import client from './client';

export const ordersApi = {
  create: (data) => client.post('/orders', data).then((r) => r.data),
  list: () => client.get('/orders').then((r) => r.data),
  get: (id) => client.get(`/orders/${id}`).then((r) => r.data),
  verify: (id) => client.post(`/orders/${id}/verify`).then((r) => r.data),
};

export const paymentsApi = {
  methods: () => client.get('/payments/methods').then((r) => r.data),
  verifyStripe: (sessionId, orderId) =>
    client.post('/payments/stripe/verify', { sessionId, orderId }).then((r) => r.data),
  submitBankProof: (data) => client.post('/payments/bank-proof', data).then((r) => r.data),
  validateCoupon: (code, total) =>
    client.post('/payments/validate-coupon', { code, total }).then((r) => r.data),
};
