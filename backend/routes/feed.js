const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const upload = multer({ dest: "uploads/" });

// === Middleware to verify JWT token ===
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

// 1. Post a new food donation

router.post("/donate", authenticateJWT, upload.single("photo"), (req, res) => {
  const user_id = req.user.id;

  const {
    foodName,
    quantity,
    expiry,
    location,
    latitude,     
    longitude,    
    packagingDetails,
    foodTemperature,
    preparationDate,
    ingredientsAllergens,
    storageCondition,
    instructions,
    foodType,
  } = req.body;

  const photoPath = req.file ? req.file.filename : null;

  if (!foodName || !quantity || !expiry) {
    return res.status(400).json({
      message: "Food name, quantity, and expiry date are required",
    });
  }

  const query = `
    INSERT INTO donations (
      user_id, foodName, quantity, expiry, location, latitude, longitude, 
      packagingDetails, foodTemperature, preparationDate, ingredientsAllergens, 
      storageCondition, instructions, foodType, photo, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    user_id,
    foodName,
    quantity,
    expiry,
    location || null,
    latitude || null,
    longitude || null,
    packagingDetails || null,
    foodTemperature || null,
    preparationDate || null,
    ingredientsAllergens || null,
    storageCondition || null,
    instructions || null,
    foodType || null,
    photoPath,
    "available",
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("DB INSERT ERROR:", err);
      return res
        .status(500)
        .json({ message: "Failed to create donation due to DB error." });
    }
    res.status(201).json({
      message: "Donation created successfully",
      id: result.insertId,
    });
  });
});


// 2. Get available food donations (browse)
router.get("/available", (req, res) => {
  const { location, foodType, storageCondition, quantity, expiryTime, donor, foodName, userLat, userLng, radiusKm } = req.query;

  let query = `
    SELECT d.*, u.name AS donor_name, u.email AS donor_email, u.city AS donor_city
  `;
  const values = [];

  if (userLat && userLng) {
    query += `,
      (6371 * acos(
        cos(radians(?)) * cos(radians(d.latitude)) * cos(radians(d.longitude) - radians(?))
        + sin(radians(?)) * sin(radians(d.latitude))
      )) AS distance_km
    `;
    values.push(parseFloat(userLat), parseFloat(userLng), parseFloat(userLat));
  }

  query += `
    FROM donations d
    JOIN users u ON d.user_id = u.id
    WHERE d.status = 'available'
  `;

  if (location) {
    query += " AND u.city = ?";
    values.push(location);
  }
  if (foodType) {
    query += " AND d.foodType = ?";
    values.push(foodType);
  }
  if (storageCondition) {
    query += " AND d.storageCondition = ?";
    values.push(storageCondition);
  }
  if (quantity) {
    query += " AND d.quantity >= ?";
    values.push(quantity);
  }
  if (expiryTime && !isNaN(parseInt(expiryTime, 10))) {
    query += " AND d.expiry <= DATE_ADD(NOW(), INTERVAL ? HOUR)";
    values.push(parseInt(expiryTime, 10));
  }
  if (donor) {
    query += " AND u.name LIKE ?";
    values.push(`%${donor}%`);
  }
  if (foodName) {
    query += " AND d.foodName LIKE ?";
    values.push(`%${foodName}%`);
  }

  if (userLat && userLng && radiusKm) {
    query += " HAVING distance_km <= ?";
    values.push(parseFloat(radiusKm));
    query += " ORDER BY distance_km ASC";
  } else {
    query += " ORDER BY d.created_at DESC";
  }

  db.query(query, values, (err, results) => {
    if (err) {
      console.error("DB QUERY ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch donations." });
    }
    res.json(results);
  });
});

// 3. Place an order (needy requests donation)
router.post("/order/:id", authenticateJWT, async (req, res) => {
  const ngoId = req.user.id; // assuming `req.user` has the NGO's user ID
  const donationId = req.params.id;

  try {
    // 1. Insert request into `requests` table
    const insertQuery = `
      INSERT INTO requests (ngoId, donationId, status)
      VALUES (?, ?, 'Pending')
    `;
    await db.execute(insertQuery, [ngoId, donationId]);

    // 2. Update donation status to 'ordered'
    const updateQuery = `
      UPDATE donations 
      SET status = 'ordered'
      WHERE id = ? AND status = 'available'
    `;
    const [result] = await db.execute(updateQuery, [donationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Donation not available or already ordered." });
    }

    res.json({ message: "Request successfully placed!" });
  } catch (err) {
    console.error("DB ORDER ERROR:", err);
    res.status(500).json({ message: "Database error while placing order." });
  }
});

// 4. Update delivery status (donor updates)
router.put("/status/:id", authenticateJWT, (req, res) => {
  const donationId = req.params.id;
  const { status } = req.body;

  const validStatuses = [
    "requested",
    "accepted",
    "ready",
    "out_for_delivery",
    "delivered",
    "expired",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const query = "UPDATE donations SET status = ? WHERE id = ?";
  db.query(query, [status, donationId], (err, result) => {
    if (err) {
      console.error("DB STATUS UPDATE ERROR:", err);
      return res.status(500).json({ message: "DB error while updating status." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Donation not found" });
    }
    res.json({ message: `Status updated to ${status}` });
  });
});

// 5. Get My Donations (for donors)
router.get("/mydonations", authenticateJWT, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT * FROM donations 
    WHERE user_id=? 
    ORDER BY created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("DB MYDONATIONS ERROR:", err.message);
      return res.status(500).json({ message: "Error fetching donations", error: err.message });
    }
    res.json(results);
  });
});

// 6. Get Pickup Requests (for volunteers)
router.get("/pickup-requests", authenticateJWT, (req, res) => {
  db.query(
    `
    SELECT d.*, u.name AS donor_name 
    FROM donations d 
    JOIN users u ON d.user_id = u.id 
    WHERE d.status = 'requested'
  `,
    (err, results) => {
      if (err) {
        console.error("DB PICKUP REQUESTS ERROR:", err);
        return res.status(500).json({ message: "Error fetching pickup requests" });
      }
      res.json(results);
    }
  );
});

// 7. Get My Deliveries (for volunteers)
router.get("/mydeliveries", authenticateJWT, (req, res) => {
  const volunteerId = req.user.id;

  const query = `
    SELECT * FROM donations 
    WHERE volunteer_id = ? 
    ORDER BY updated_at DESC
  `;

  db.query(query, [volunteerId], (err, results) => {
    if (err) {
      console.error("DB MYDELIVERIES ERROR:", err);
      return res.status(500).json({ message: "Error fetching your deliveries" });
    }
    res.json(results);
  });
});

// 8. Get My Requests (for NGOs) - fixed to use callback style
router.get("/my-requests", authenticateJWT, (req, res) => {
  const ngoId = req.user.id;

  const query = `
    SELECT r.*, d.foodName, d.photo, d.location, d.expiry, d.status AS donationStatus
    FROM requests r
    JOIN donations d ON r.donationId = d.id
    WHERE r.ngoId = ?
    ORDER BY r.createdAt DESC
  `;

  db.query(query, [ngoId], (err, results) => {
    if (err) {
      console.error("DB MY-REQUESTS ERROR:", err);
      return res.status(500).json({ message: "Database error fetching your requests" });
    }
    res.json(results);
  });
});


module.exports = router;
