const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const upload = multer({ dest: "uploads/" });

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 1️⃣ Create donation
router.post("/donate", authenticateJWT, upload.single("photo"), async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      foodName, quantity, expiry, location, latitude, longitude,
      packagingDetails, foodTemperature, preparationDate,
      ingredientsAllergens, storageCondition, instructions,
      foodType, needVolunteer
    } = req.body;

    if (!foodName || !quantity || !expiry) return res.status(400).json({ message: "Food name, quantity, and expiry are required" });

    const photoPath = req.file ? req.file.filename : null;

    const query = `
      INSERT INTO donations (
        user_id, foodName, quantity, expiry, location, latitude, longitude,
        packagingDetails, foodTemperature, preparationDate, ingredientsAllergens,
        storageCondition, instructions, foodType, photo, status, needVolunteer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user_id, foodName, quantity, expiry, location || null, latitude || null, longitude || null,
      packagingDetails || null, foodTemperature || null, preparationDate || null,
      ingredientsAllergens || null, storageCondition || null, instructions || null,
      foodType || null, photoPath, "available", needVolunteer ? 1 : 0
    ];

    const [result] = await db.query(query, values);
    res.status(201).json({ message: "Donation created successfully", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error creating donation" });
  }
});

// 2️⃣ Get available donations
router.get("/available", async (req, res) => {
  try {
    const { location, foodType, storageCondition, quantity, expiryTime, donor, foodName, userLat, userLng, radiusKm } = req.query;

    let query = `SELECT d.*, u.name AS donor_name, u.email AS donor_email, u.city AS donor_city`;
    const values = [];

    if (userLat && userLng) {
      query += `, (6371 * acos(
        cos(radians(?)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(?))
        + sin(radians(?)) * sin(radians(d.latitude))
      )) AS distance_km`;
      values.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
    }

    query += ` FROM donations d JOIN users u ON d.user_id = u.id WHERE d.status = 'available'`;

    if (location) { query += " AND u.city = ?"; values.push(location); }
    if (foodType) { query += " AND d.foodType = ?"; values.push(foodType); }
    if (storageCondition) { query += " AND d.storageCondition = ?"; values.push(storageCondition); }
    if (quantity) { query += " AND d.quantity >= ?"; values.push(quantity); }
    if (expiryTime && !isNaN(parseInt(expiryTime, 10))) {
      query += " AND d.expiry <= DATE_ADD(NOW(), INTERVAL ? HOUR)";
      values.push(parseInt(expiryTime, 10));
    }
    if (donor) { query += " AND u.name LIKE ?"; values.push(`%${donor}%`); }
    if (foodName) { query += " AND d.foodName LIKE ?"; values.push(`%${foodName}%`); }

    if (userLat && userLng && radiusKm) {
      query += " HAVING distance_km <= ? ORDER BY distance_km ASC";
      values.push(parseFloat(radiusKm));
    } else {
      query += " ORDER BY d.created_at DESC";
    }

    const [results] = await db.query(query, values);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching donations" });
  }
});

// 3️⃣ Place NGO request
router.post("/order/:id", authenticateJWT, async (req, res) => {
  try {
    const donationId = req.params.id;
    const userId = req.user.id;

    const [ngoResults] = await db.query("SELECT id FROM ngos WHERE user_id = ?", [userId]);
    if (!ngoResults.length) return res.status(403).json({ message: "NGO not registered" });

    const ngoId = ngoResults[0].id;
    const [insertResult] = await db.query("INSERT INTO requests (ngoId, donationId, status) VALUES (?, ?, 'Pending')", [ngoId, donationId]);
    const [updateResult] = await db.query("UPDATE donations SET status='ordered' WHERE id=? AND status='available'", [donationId]);

    if (updateResult.affectedRows === 0) return res.status(404).json({ message: "Donation not available or already ordered" });

    res.json({ message: "Request placed successfully", requestId: insertResult.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error placing request" });
  }
});

// 4️⃣ Update donation status
router.put("/status/:id", authenticateJWT, async (req, res) => {
  try {
    const donationId = req.params.id;
    const { status } = req.body;
    const validStatuses = ["requested","accepted","ready","out_for_delivery","delivered","expired"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const [result] = await db.query("UPDATE donations SET status=? WHERE id=?", [status, donationId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Donation not found" });

    res.json({ message: `Status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error updating status" });
  }
});

// 5️⃣ Mark donation need volunteer
router.post("/request/:id/need-volunteer", authenticateJWT, async (req, res) => {
  try {
    const donationId = req.params.id;
    const [result] = await db.query("UPDATE donations SET needVolunteer=1 WHERE id=?", [donationId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Donation not found" });
    res.json({ message: "Volunteer requirement updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error updating needVolunteer" });
  }
});

// 6️⃣ Fetch nearby volunteers
router.get("/request/:id/volunteers", authenticateJWT, async (req, res) => {
  try {
    const donationId = req.params.id;
    const radiusKm = parseFloat(req.query.radius) || 20;

    const [donationResults] = await db.query("SELECT latitude, longitude FROM donations WHERE id=?", [donationId]);
    if (!donationResults.length) return res.status(404).json({ message: "Donation not found" });

    const { latitude: donationLat, longitude: donationLng } = donationResults[0];
    const [volunteers] = await db.query(`
      SELECT id AS volunteerId, name, email, latitude, longitude,
        (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))) AS distanceKm
      FROM users
      WHERE role='volunteer'
      HAVING distanceKm <= ?
      ORDER BY distanceKm ASC
    `, [donationLat, donationLng, donationLat, radiusKm]);

    res.json({ volunteers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching volunteers" });
  }
});

// 7️⃣ Get NGO requests
router.get("/my-requests", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const [ngoResults] = await db.query("SELECT id FROM ngos WHERE user_id=?", [userId]);
    if (!ngoResults.length) return res.status(403).json({ message: "NGO not registered" });

    const ngoId = ngoResults[0].id;
    const [requests] = await db.query(`
      SELECT r.id AS requestId, r.status AS requestStatus, r.createdAt AS requestCreatedAt,
             d.id AS donationId, d.foodName, d.quantity, d.expiry, d.location, d.foodType, d.status AS donationStatus,
             u.name AS donorName, u.email AS donorEmail
      FROM requests r
      LEFT JOIN donations d ON r.donationId = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE r.ngoId=?
      ORDER BY r.createdAt DESC
    `, [ngoId]);

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching NGO requests" });
  }
});

// 8️⃣ Request details by ID
router.get("/request-details/:id", authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const [rows] = await db.query(`
      SELECT r.id AS requestId, r.status AS requestStatus, 
             d.id AS donationId, d.foodName, d.quantity, d.expiry, d.location, d.foodType, d.needVolunteer,
             u.name AS donorName, u.email AS donorEmail, u.city AS donorCity
      FROM requests r
      JOIN donations d ON r.donationId = d.id
      JOIN users u ON d.user_id = u.id
      WHERE r.id=?
    `, [requestId]);

    if (!rows.length) return res.status(404).json({ message: "Request not found" });

    const row = rows[0];
    res.json({
      requestId: row.requestId,
      requestStatus: row.requestStatus,
      donor: { name: row.donorName, email: row.donorEmail, city: row.donorCity },
      food: { id: row.donationId, foodName: row.foodName, quantity: row.quantity, expiry: row.expiry, location: row.location, foodType: row.foodType, needVolunteer: row.needVolunteer }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching request details" });
  }
});

// 9️⃣ Donor donations
router.get("/mydonations", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const [donations] = await db.query("SELECT id, foodName, quantity, expiry, preparationDate, location, status, photo FROM donations WHERE user_id=? ORDER BY id DESC", [userId]);
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching donations" });
  }
});

// 10️⃣ Book request / assign volunteer
router.post("/book-request/:id", authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { volunteerId } = req.body;

    const [existing] = await db.query("SELECT * FROM deliveries WHERE requestId=?", [requestId]);
    if (existing.length) {
      if (volunteerId) {
        await db.query("UPDATE deliveries SET volunteerId=? WHERE requestId=?", [volunteerId, requestId]);
        await db.query("UPDATE requests SET status='Volunteer Assigned' WHERE id=?", [requestId]);
        return res.json({ message: "Volunteer updated and request status updated" });
      }
      return res.json({ message: "Delivery already exists, no volunteer assigned" });
    }

    await db.query("INSERT INTO deliveries (requestId, volunteerId, status) VALUES (?, ?, 'Assigned')", [requestId, volunteerId || null]);
    if (volunteerId) await db.query("UPDATE requests SET status='Volunteer Assigned' WHERE id=?", [requestId]);
    res.json({ message: "Delivery created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error booking request" });
  }
});

// 11️⃣ Donor requests
router.get("/donor-requests", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const [results] = await db.query(`
      SELECT r.id AS requestId, r.status, r.createdAt, d.foodName, d.photo, d.quantity, d.location, n.name AS ngo_name, n.email AS ngo_email
      FROM requests r
      JOIN donations d ON r.donationId = d.id
      JOIN users n ON r.ngoId = n.id
      WHERE d.user_id=? AND r.status='Pending'
      ORDER BY r.id DESC
    `, [userId]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching donor requests" });
  }
});

// 12️⃣ Donor approve/reject NGO request
router.put("/donor/request/:id", authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;
    if (!["Accepted","Rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const donationStatus = status === "Accepted" ? "ordered" : "available";
await db.query("UPDATE requests SET status=? WHERE id=?", [status, requestId]);
await db.query("UPDATE donations SET status=? WHERE id=(SELECT donationId FROM requests WHERE id=?)", [donationStatus, requestId]);

    res.json({ message: `Request ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error updating request" });
  }
});

// 13️⃣ Update delivery status
router.put("/delivery/:id/status", authenticateJWT, async (req, res) => {
  try {
    const deliveryId = req.params.id;
    const { status } = req.body;
    const validStatuses = ["picked_up","out_for_delivery","delivered"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    await db.query(`
      UPDATE deliveries d
      JOIN requests r ON d.requestId=r.id
      JOIN donations dn ON r.donationId=dn.id
      SET d.status=?, dn.status=?
      WHERE d.id=?
    `, [status, status, deliveryId]);

    res.json({ message: `Status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error updating delivery status" });
  }
});

// 14️⃣ Confirm received donation
router.put("/confirm-received/:id", authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    await db.query(`
      UPDATE requests r
      JOIN donations d ON r.donationId=d.id
      LEFT JOIN deliveries v ON v.requestId=r.id
      SET r.status='Completed', d.status='delivered',
          v.status=IF(v.id IS NOT NULL,'Completed',v.status)
      WHERE r.id=?
    `, [requestId]);

    res.json({ message: "Food receipt confirmed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error confirming receipt" });
  }
});

module.exports = router;
