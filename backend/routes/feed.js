const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// ✅ Use same secret as user.js
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const upload = multer({ dest: "uploads/" }); // store uploaded photos

// === Middleware to verify token ===
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded payload { id, email, role }
    next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// === Post a new food donation ===
router.post('/donate', authenticateJWT, upload.single('photo'), (req, res) => {
  const user_id = req.user.id; // ✅ always from JWT

  const {
    foodName,
    quantity,
    expiry,
    location,
    packagingDetails,
    foodTemperature,
    preparationDate,
    ingredientsAllergens,
    storageCondition,
    instructions
  } = req.body;

  const photoPath = req.file ? req.file.filename : null;

  if (!foodName || !quantity || !expiry) {
    return res.status(400).json({ message: 'Food name, quantity, and expiry date are required' });
  }

  const query = `
    INSERT INTO donations
      (user_id, foodName, quantity, expiry, location, packagingDetails, foodTemperature, preparationDate, ingredientsAllergens, storageCondition, instructions, photo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    user_id,
    foodName,
    quantity,
    expiry,
    location || null,
    packagingDetails || null,
    foodTemperature || null,
    preparationDate || null,
    ingredientsAllergens || null,
    storageCondition || null,
    instructions || null,
    photoPath,
    'available'
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("DATABASE INSERTION ERROR:", err);
      return res.status(500).json({ message: 'Failed to create donation due to a database error.' });
    }
    res.status(201).json({ message: 'Donation created successfully', id: result.insertId });
  });
});

// === Get all available food donations ===
router.get('/available', (req, res) => {
  const query = `
    SELECT d.*, u.name AS donor_name, u.email AS donor_email, u.phone AS donor_phone
    FROM donations d
    JOIN users u ON d.user_id = u.id
    WHERE d.status = 'available'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("DATABASE QUERY ERROR:", err);
      return res.status(500).json({ message: 'Failed to fetch donations.' });
    }
    res.json(results);
  });
});

// === Place an order ===
router.post('/order/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const query = "UPDATE donations SET status = 'ordered' WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("DATABASE UPDATE ERROR:", err);
      return res.status(500).json({ message: 'Failed to place order.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Food not found or already ordered' });
    }
    res.json({ message: 'Order placed successfully!' });
  });
});

module.exports = router;
