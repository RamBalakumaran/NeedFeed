// backend/routes/user.js


const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken'); // We still use JWT for session tokens

// === USER REGISTRATION ===
router.post('/register', (req, res) => {
  const { email, password } = req.body;

  // 1. Check if user already exists
  const userCheckQuery = 'SELECT email FROM users WHERE email = ?';
  db.query(userCheckQuery, [email], (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    
    // 2.Insert the user's plain text password directly into the database.
    const insertUserQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(insertUserQuery, [email, password], (err, result) => {
      if (err) {
        console.error("Database error during registration:", err);
        return res.status(500).json({ message: "Database error during registration." });
      }
      res.status(201).json({ message: "User registered successfully!" });
    });
  });
});


// === USER LOGIN  ===
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], (err, results) => {
    // Check if user exists
    if (err || results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare the submitted plain text password with the stored plain text password.
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If passwords match, create a JWT to manage the login session
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' }); // Use a real secret in a .env file!

    res.json({
      message: 'Login Successful',
      token: token
    });
  });
});

module.exports = router;