/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           PLAYBEAT — PUBLIC PRODUCTS ROUTES              ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const router = require('express').Router();
const productSvc = require('../services/products');

// Get all products (with filters)
router.get('/products', (req, res) => {
  const data = productSvc.readData();
  let products = [...data.products];
  const { category, search, sort, featured, trending, limit } = req.query;

  if (category && category !== 'all')
    products = products.filter(p => p.category === category);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  if (featured === 'true') products = products.filter(p => p.featured);
  if (trending === 'true') products = products.filter(p => p.trending);

  switch (sort) {
    case 'price-asc':  products.sort((a,b) => a.price - b.price);   break;
    case 'price-desc': products.sort((a,b) => b.price - a.price);   break;
    case 'rating':     products.sort((a,b) => b.rating - a.rating); break;
    case 'sales':      products.sort((a,b) => b.sales - a.sales);   break;
    case 'newest':     products.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    default:           products.sort((a,b) => (b.trending?1:0) - (a.trending?1:0)); break;
  }

  if (limit) products = products.slice(0, parseInt(limit));
  res.json({ products, total: products.length });
});

// Single product
router.get('/products/:id', (req, res) => {
  const data    = productSvc.readData();
  const product = data.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// Categories
router.get('/categories', (req, res) => {
  const data = productSvc.readData();
  const cats = data.categories.map(c => ({
    ...c,
    count: data.products.filter(p => p.category === c.id).length,
  }));
  res.json(cats);
});

// Public settings
router.get('/settings', (req, res) => {
  const { settings } = productSvc.readData();
  const { siteName, heroHeadline, heroSubtitle, heroBadge, announcementBar, currency, whatsapp, telegram, email, cartEnabled, wishlistEnabled, maintenanceMode } = settings;
  res.json({ siteName, heroHeadline, heroSubtitle, heroBadge, announcementBar, currency, whatsapp, telegram, email, cartEnabled, wishlistEnabled, maintenanceMode });
});

// Public stats
router.get('/stats', (req, res) => {
  const data       = productSvc.readData();
  const totalSales = data.products.reduce((s, p) => s + (p.sales || 0), 0);
  res.json({
    totalProducts:   data.products.length,
    totalSales,
    totalCategories: data.categories.length,
    happyCustomers:  50000 + totalSales,
  });
});

module.exports = router;
