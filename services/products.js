/**
 * PLAYBEAT — PRODUCT SERVICE
 * JSON file store with stock management
 */

const path = require('path');
const fs   = require('fs');

const DATA_FILE = path.join(__dirname, '..', 'data', 'products.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (_) {
    return { products: [], categories: [], settings: {} };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function findProduct(id) {
  const data = readData();
  return data.products.find(p => p.id === id) || null;
}

function decrementStock(id, qty) {
  const data = readData();
  const product = data.products.find(p => p.id === id);
  if (product) {
    product.stock = Math.max(0, product.stock - qty);
    writeData(data);
  }
}

function incrementStock(id, qty) {
  const data = readData();
  const product = data.products.find(p => p.id === id);
  if (product) {
    product.stock += qty;
    writeData(data);
  }
}

module.exports = { readData, writeData, findProduct, decrementStock, incrementStock };
