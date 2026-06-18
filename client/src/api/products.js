import client from './client';

export const productsApi = {
  list: (params) => client.get('/products', { params }).then((r) => r.data),
  get: (id) => client.get(`/products/${id}`).then((r) => r.data),
  categories: () => client.get('/categories').then((r) => r.data),
  settings: () => client.get('/settings').then((r) => r.data),
  stats: () => client.get('/stats').then((r) => r.data),
};
