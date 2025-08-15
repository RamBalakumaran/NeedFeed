const express = require('express');
const router = express.Router();
const db = require('../db');

// Post a new food donation
router.post('/donate', (req, res) => {
  console.log('Received data for donation:', req.body);
  const { foodName, quantity, expiry, location } = req.body;
  const query = 'INSERT INTO donations (foodName, quantity, expiry, location, status) VALUES (?, ?, ?, ?, ?)';
  const values = [foodName, quantity, expiry, location, 'available'];

  db.query(query, values, (err, result) => {
    // If there is an error from the database, this block will run
    if (err) {
      // THIS IS THE MOST IMPORTANT LINE FOR DEBUGGING
      console.error("DATABASE INSERTION ERROR:", err);

      return res.status(500).json({ message: 'Failed to create donation due to a database error.' });
    }

    // If successful, this runs
    res.status(201).json({ message: 'Donation created successfully', id: result.insertId });
  });
});

// Get all available food
router.get('/available', (req, res) => {
 // const query = "SELECT * FROM donations WHERE status = 'available' AND expiry > NOW()";
 // const query = "SELECT * FROM donations WHERE status = 'available' AND expiry BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 HOUR);";
 const query = "SELECT * FROM donations WHERE status = 'available'";
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Place an order (marks food as 'ordered')
router.post('/order/:id', (req, res) => {
    const { id } = req.params;
    const query = "UPDATE donations SET status = 'ordered' WHERE id = ?";

    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Food not found or already ordered' });
        }
        res.json({ message: 'Order placed successfully!' });
    });
});

module.exports = router;