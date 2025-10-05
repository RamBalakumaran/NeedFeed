const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ========================
// JWT AUTH MIDDLEWARE
// ========================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ========================
// GET DELIVERIES ASSIGNED TO VOLUNTEER
// ========================
router.get('/my-deliveries', authenticateJWT, async (req, res) => {
  try {
    const volunteerId = req.user.id;

    const query = `
      SELECT
        d.id AS deliveryId,
        d.status,
        r.id AS requestId,
        don.foodName,
        don.quantity,
        don.expiry,
        donor.name AS donorName,
        donor.address AS donorAddress,
        ngo_user.name AS ngoName,
        ngo_user.address AS ngoAddress
      FROM deliveries d
      JOIN requests r ON d.requestId = r.id
      JOIN donations don ON r.donationId = don.id
      JOIN users donor ON don.user_id = donor.id
      JOIN ngos n ON r.ngoId = n.id
      JOIN users ngo_user ON n.user_id = ngo_user.id
      WHERE d.volunteerId = ?
      ORDER BY FIELD(d.status, 'Assigned', 'PickedUp', 'Delivered'), d.updatedAt DESC
    `;

    const [results] = await db.query(query, [volunteerId]);
    res.json({ deliveries: results });
  } catch (err) {
    console.error('DB MY-DELIVERIES ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch deliveries.' });
  }
});

// ========================
// UPDATE DELIVERY STATUS
// ========================
router.post('/delivery/:id/update-status', authenticateJWT, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const volunteerId = req.user.id;
    const { status } = req.body;

    if (!['PickedUp', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const [result] = await db.query(
      'UPDATE deliveries SET status=? WHERE id=? AND volunteerId=?',
      [status, deliveryId, volunteerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delivery not found or not authorized.' });
    }

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (err) {
    console.error('UPDATE DELIVERY ERROR:', err);
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

// ========================
// ACCEPT AN UNASSIGNED REQUEST
// ========================
router.post('/accept-request/:id', authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const volunteerId = req.user.id;

    const [existing] = await db.query('SELECT id FROM deliveries WHERE requestId = ?', [requestId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'This request has already been accepted by another volunteer.' });
    }

    await db.query(
      "INSERT INTO deliveries (requestId, volunteerId, status) VALUES (?, ?, 'Assigned')",
      [requestId, volunteerId]
    );

    res.status(201).json({ message: 'Request accepted successfully! Added to your deliveries.' });
  } catch (err) {
    console.error('ACCEPT REQUEST ERROR:', err);
    res.status(500).json({ message: 'Failed to accept the request.' });
  }
});

// ========================
// GET ALL UNASSIGNED REQUESTS
// ========================
router.get('/unassigned-requests', authenticateJWT, async (req, res) => {
  try {
    const query = `
      SELECT
        r.id AS requestId,
        don.foodName,
        don.quantity,
        don.expiry,
        donor.name AS donorName,
        donor.address AS donorAddress
      FROM requests r
      JOIN donations don ON r.donationId = don.id
      JOIN users donor ON don.user_id = donor.id
      LEFT JOIN deliveries d ON r.id = d.requestId
      WHERE d.id IS NULL
      ORDER BY r.id DESC
    `;

    const [results] = await db.query(query);
    res.json({ requests: results });
  } catch (err) {
    console.error('DB UNASSIGNED REQUESTS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch unassigned requests.' });
  }
});

module.exports = router;
