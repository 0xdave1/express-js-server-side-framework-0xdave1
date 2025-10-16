// server.js - Week 2 Express.js Assignment

const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Middleware: JSON parser
app.use(bodyParser.json());

// Middleware: Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} @ ${new Date().toISOString()}`);
  next();
});

// Middleware: Authentication
const authenticate = (req, res, next) => {
  if (req.headers['x-api-key'] === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Sample in-memory products database
let products = [
  { id: '1', name: 'Laptop', description: '16GB RAM', price: 1200, category: 'electronics', inStock: true },
  { id: '2', name: 'Smartphone', description: '128GB storage', price: 800, category: 'electronics', inStock: true },
  { id: '3', name: 'Coffee Maker', description: 'Timer', price: 50, category: 'kitchen', inStock: false }
];

// Root route -Task 1
app.get('/', (req, res) => {
  res.send('Hello World');
});

// GET /api/products - List all products (with filtering & pagination)
app.get('/api/products', authenticate, (req, res) => {
  let result = [...products];

  // Filtering
  if (req.query.category) {
    result = result.filter(p => p.category === req.query.category);
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || result.length;
  const start = (page - 1) * limit;
  result = result.slice(start, start + limit);

  res.json(result);
});

// GET /api/products/search?name=term
app.get('/api/products/search', authenticate, (req, res) => {
  const term = req.query.name?.toLowerCase();
  const result = products.filter(p => p.name.toLowerCase().includes(term));
  res.json(result);
});

// GET /api/products/stats - Count by category
app.get('/api/products/stats', authenticate, (req, res) => {
  const stats = {};
  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });
  res.json(stats);
});

// GET /api/products/:id
app.get('/api/products/:id', authenticate, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products
app.post('/api/products', authenticate, (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || !price || !category || typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }
  const newProduct = { id: uuidv4(), name, description, price, category, inStock };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id
app.put('/api/products/:id', authenticate, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  const updated = { ...products[index], ...req.body };
  products[index] = updated;
  res.json(updated);
});

// DELETE /api/products/:id
app.delete('/api/products/:id', authenticate, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  products.splice(index, 1);
  res.status(204).send();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
