const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// === Middleware to verify JWT token (can be moved to a shared middleware file) ===
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


// GET DELIVERIES ASSIGNED TO THE LOGGED-IN VOLUNTEER
router.get("/my-deliveries", authenticateJWT, (req, res) => {
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
    ORDER BY FIELD(d.status, 'Assigned', 'Picked Up', 'Delivered'), d.updatedAt DESC
  `;

  db.query(query, [volunteerId], (err, results) => {
    if (err) {
      console.error("DB MY-DELIVERIES ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch deliveries." });
    }
    res.json({ deliveries: results });
  });
});

// UPDATE THE STATUS OF A DELIVERY (e.g., to 'Delivered')
router.post("/delivery/:id/update-status", authenticateJWT, (req, res) => {
  const deliveryId = req.params.id;
  const volunteerId = req.user.id;
  const { status } = req.body;

  if (!['Picked Up', 'Delivered'].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  // Ensure the volunteer owns this delivery before updating
  const query = "UPDATE deliveries SET status = ? WHERE id = ? AND volunteerId = ?";
  
  db.query(query, [status, deliveryId, volunteerId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to update status." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Delivery not found or you are not authorized." });
    }
    res.json({ message: `Delivery status updated to ${status}` });
  });
});

// ACCEPT AN UNASSIGNED REQUEST
router.post("/accept-request/:id", authenticateJWT, (req, res) => {
  const requestId = req.params.id;
  const volunteerId = req.user.id;

  // First, check if a delivery for this request already exists to prevent race conditions
  const checkQuery = "SELECT id FROM deliveries WHERE requestId = ?";
  db.query(checkQuery, [requestId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    if (results.length > 0) {
      return res.status(409).json({ message: "This request has already been accepted by another volunteer." });
    }

    // If not accepted, create the new delivery record
    const insertQuery = "INSERT INTO deliveries (requestId, volunteerId, status) VALUES (?, ?, 'Assigned')";
    db.query(insertQuery, [requestId, volunteerId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to accept the request." });
      }
      res.status(201).json({ message: "Request accepted successfully! It has been added to your deliveries." });
    });
  });
});

module.exports = router;