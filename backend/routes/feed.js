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

//1. POST /donate 
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
    needVolunteer,
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
      storageCondition, instructions, foodType, photo, status, needVolunteer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    needVolunteer ? 1 : 0,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("DB INSERT ERROR:", err);
      return res.status(500).json({ message: "Failed to create donation due to DB error." });
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
router.post("/order/:id", authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const donationId = req.params.id;

  const checkNgoQuery = "SELECT id FROM ngos WHERE user_id = ?";
  db.query(checkNgoQuery, [userId], (err, ngoResults) => {
    if (err) {
      console.error("DB CHECK NGO ERROR:", err);
      return res.status(500).json({ message: "DB error checking NGO" });
    }
    if (ngoResults.length === 0) {
      return res.status(403).json({ message: "NGO not registered." });
    }

    const ngoId = ngoResults[0].id;

    const insertQuery = "INSERT INTO requests (ngoId, donationId, status) VALUES (?, ?, 'Pending')";
    db.query(insertQuery, [ngoId, donationId], (err, insertResult) => {
      if (err) {
        console.error("DB INSERT REQUEST ERROR:", err);
        return res.status(500).json({ message: "Database error while creating request" });
      }

      const updateQuery = "UPDATE donations SET status = 'ordered' WHERE id = ? AND status = 'available'";
      db.query(updateQuery, [donationId], (err2, updateResult) => {
        if (err2) {
          console.error("DB UPDATE DONATION ERROR:", err2);
          return res.status(500).json({ message: "Database error while updating donation status" });
        }
        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ message: "Donation not available or already ordered." });
        }

        res.json({
          message: "Request successfully placed!",
          requestId: insertResult.insertId,
        });
      });
    });
  });
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
  const volunteerId = req.user.id;

  const query = `
    SELECT 
      r.id AS requestId,
      d.foodName,
      d.quantity,
      d.expiry,
      d.location,
      u.name AS donorName,
      u.address AS donorAddress
    FROM requests r
    JOIN donations d ON r.donationId = d.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN deliveries del ON r.id = del.requestId
    WHERE d.needVolunteer = 1 AND del.id IS NULL AND r.status = 'Approved'
    ORDER BY r.createdAt DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching pickup requests" });
    res.json({ requests: results });
  });
});

// 7. Get My Deliveries (for volunteers)
router.get("/mydeliveries", authenticateJWT, (req, res) => {
  const volunteerId = req.user.id;

  const query = `
    SELECT 
      del.id AS deliveryId,
      del.status AS deliveryStatus,
      r.id AS requestId,
      d.foodName,
      d.quantity,
      d.expiry,
      d.location,
      donor.name AS donorName,
      donor.email AS donorEmail,
      ngo_user.name AS ngoName,
      ngo_user.email AS ngoEmail
    FROM deliveries del
    JOIN requests r ON del.requestId = r.id
    JOIN donations d ON r.donationId = d.id
    JOIN users donor ON d.user_id = donor.id
    JOIN ngos n ON r.ngoId = n.id
    JOIN users ngo_user ON n.user_id = ngo_user.id
    WHERE del.volunteerId = ?
    ORDER BY del.updated_at DESC
  `;

  db.query(query, [volunteerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching your deliveries" });
    res.json({ deliveries: results });
  });
});

// 8. Get My Requests (for NGOs)
router.get("/my-requests", authenticateJWT, (req, res) => {
  const userId = req.user.id; // User ID from JWT token

  // Step 1: Get NGO ID using user_id
  const getNgoIdQuery = `SELECT id FROM ngos WHERE user_id = ?`;
  db.query(getNgoIdQuery, [userId], (err, ngoResults) => {
    if (err) {
      console.error("DB ERROR getting NGO ID:", err);
      return res.status(500).json({ message: "Failed to fetch NGO" });
    }

    if (ngoResults.length === 0) {
      return res.status(403).json({ message: "User is not registered as NGO" });
    }

    const ngoId = ngoResults[0].id;

    // Step 2: Fetch requests using ngoId
    const query = `
      SELECT 
        r.id AS requestId,
        r.status AS requestStatus,
        r.createdAt,
        d.foodName,
        d.photo,
        d.quantity,
        d.location,
        d.expiry,
        d.status AS donationStatus,
        d.user_id AS donorId,
        u.name AS donorName,
        u.email AS donorEmail
      FROM requests r
      JOIN donations d ON r.donationId = d.id
      JOIN users u ON d.user_id = u.id
      WHERE r.ngoId = ?
      ORDER BY r.createdAt DESC
    `;

    db.query(query, [ngoId], (err2, results) => {
      if (err2) {
        console.error("DB MY-REQUESTS ERROR:", err2);
        return res.status(500).json({ message: "Error fetching your requests" });
      }

      res.json(results);
    });
  });
});

// 9. Get requests for donor's donations
router.get("/donor/requests", authenticateJWT, (req, res) => {
  const donorId = req.user.id;

  const query = `
    SELECT r.id AS requestId, r.status, r.createdAt,
           d.id AS donationId, d.foodName, d.photo, d.quantity, d.location, d.expiry,
           u.name AS ngo_name, u.email AS ngo_email
    FROM requests r
    JOIN donations d ON r.donationId = d.id
    JOIN users u ON r.ngoId = u.id
    WHERE d.user_id = ?
    ORDER BY r.createdAt DESC
  `;

  db.query(query, [donorId], (err, results) => {
    if (err) {
      console.error("DB DONOR REQUESTS ERROR:", err);
      return res.status(500).json({ message: "Error fetching donor requests" });
    }
    res.json(results);
  });
});

// 10. Approve / Reject request
router.put("/donor/request/:id", authenticateJWT, (req, res) => {
  const donorId = req.user.id;
  const requestId = req.params.id;
  const { status } = req.body; // Approved or Rejected

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Ensure donor owns this donation
  const query = `
    UPDATE requests r
    JOIN donations d ON r.donationId = d.id
    SET r.status = ?
    WHERE r.id = ? AND d.user_id = ?
  `;

  db.query(query, [status, requestId, donorId], (err, result) => {
    if (err) {
      console.error("DB UPDATE REQUEST ERROR:", err);
      return res.status(500).json({ message: "Database error while updating request." });
    }
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not authorized or request not found" });
    }
    res.json({ message: `Request ${status.toLowerCase()} successfully!` });
  });
});

// 11. Get request details by request ID
router.get("/request-details/:id", authenticateJWT, (req, res) => {
  const requestId = req.params.id;

  const query = `
    SELECT 
      r.id AS requestId,
      r.status AS requestStatus,
      d.foodName,
      d.quantity,
      d.expiry,
      d.needVolunteer,
      donor.name AS donorName,
      donor.email AS donorEmail,
      ngo_user.name AS ngoName,
      ngo_user.email AS ngoEmail
    FROM requests r
    JOIN donations d ON r.donationId = d.id
    JOIN users donor ON d.user_id = donor.id
    JOIN ngos n ON r.ngoId = n.id
    JOIN users ngo_user ON n.user_id = ngo_user.id
    WHERE r.id = ?
  `;

  db.query(query, [requestId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (results.length === 0) return res.status(404).json({ message: "Request not found." });

    const row = results[0];

    res.json({
      requestId: row.requestId,
      requestStatus: row.requestStatus,
      needVolunteer: !!row.needVolunteer,
      donor: { name: row.donorName, email: row.donorEmail },
      ngo: { name: row.ngoName, email: row.ngoEmail },
      food: { foodName: row.foodName, quantity: row.quantity, expiry: row.expiry }
    });
  });
});


//12.
router.get("/request/:id/volunteers", authenticateJWT, (req, res) => {
  const requestId = req.params.id;

  const donationQuery = `
    SELECT d.latitude, d.longitude FROM requests r
    JOIN donations d ON r.donationId = d.id
    WHERE r.id = ?
  `;
  db.query(donationQuery, [requestId], (err, donationResults) => {
    if (err || donationResults.length === 0) {
      return res.status(500).json({ message: "Could not find donation location" });
    }
    const { latitude, longitude } = donationResults[0];

    const volunteersQuery = `
      SELECT id, name, email,
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?))
        + sin(radians(?)) * sin(radians(latitude))
      )) AS distance_km
      FROM users
      WHERE role = 'volunteer' AND latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING distance_km <= 20
      ORDER BY distance_km ASC
      LIMIT 10
    `;

    db.query(volunteersQuery, [latitude, longitude, latitude], (err2, volunteerResults) => {
      if (err2) return res.status(500).json({ message: "Error fetching volunteers" });
      res.json({ volunteers: volunteerResults });
    });
  });
});


router.post("/book-request/:id", authenticateJWT, (req, res) => {
  const requestId = req.params.id;
  const { volunteerId } = req.body; // optional

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: "Transaction start failed." });

    // Approve request if Pending
    const updateRequestQuery = `
      UPDATE requests
      SET status = 'Approved'
      WHERE id = ? AND status IN ('Pending','Approved')
    `;

    db.query(updateRequestQuery, [requestId], (err, result) => {
      if (err) return db.rollback(() => res.status(500).json({ message: "DB error updating request." }));
      if (result.affectedRows === 0) return db.rollback(() => res.status(404).json({ message: "Request not found." }));

      // Insert into deliveries
      const createDeliveryQuery = `
        INSERT INTO deliveries (requestId, volunteerId, status)
        VALUES (?, ?, ?)
      `;
      const deliveryStatus = volunteerId ? 'Assigned' : 'PendingPickup';

      db.query(createDeliveryQuery, [requestId, volunteerId || null, deliveryStatus], (err1) => {
        if (err1) return db.rollback(() => res.status(500).json({ message: "DB error creating delivery." }));

        // Update donation status to 'ordered'
        const updateDonationQuery = `
          UPDATE donations d
          JOIN requests r ON d.id = r.donationId
          SET d.status = 'ordered', d.volunteer_id = ?
          WHERE r.id = ?
        `;
        db.query(updateDonationQuery, [volunteerId || null, requestId], (err2) => {
          if (err2) return db.rollback(() => res.status(500).json({ message: "DB error updating donation status." }));

          db.commit(err3 => {
            if (err3) return db.rollback(() => res.status(500).json({ message: "Commit failed." }));
            return res.status(200).json({ message: "Food booked successfully!" });
          });
        });
      });
    });
  });
});


// 14.GET ALL UNASSIGNED PICKUP REQUESTS
router.get("/unassigned-requests", authenticateJWT, (req, res) => {
  const query = `
    SELECT
      r.id AS requestId,
      d.foodName,
      d.quantity,
      d.expiry,
      u.name AS donorName,
      u.address AS donorAddress
    FROM requests r
    JOIN donations d ON r.donationId = d.id
    JOIN users u ON d.user_id = u.id
    LEFT JOIN deliveries del ON r.id = del.requestId
    WHERE d.needVolunteer = 1 AND del.id IS NULL AND r.status = 'Approved'
    ORDER BY r.createdAt DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("DB UNASSIGNED-REQUESTS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch unassigned requests." });
    }
    res.json({ requests: results });
  });
});


// ===================== PUT /deliveries/:id/delivered =====================
// Mark a delivery as Delivered
router.put("/deliveries/:id/delivered", authenticateJWT, (req, res) => {
  const deliveryId = req.params.id;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ message: "Transaction start failed." });

    const updateDelivery = `
      UPDATE deliveries 
      SET status = 'Delivered', updated_at = NOW()
      WHERE id = ?
    `;

    db.query(updateDelivery, [deliveryId], (err, result) => {
      if (err) return db.rollback(() => res.status(500).json({ message: "DB error updating delivery." }));

      const updateDonation = `
        UPDATE donations d
        JOIN requests r ON d.id = r.donationId
        JOIN deliveries del ON del.requestId = r.id
        SET d.status = 'delivered'
        WHERE del.id = ?
      `;

      db.query(updateDonation, [deliveryId], (err2) => {
        if (err2) return db.rollback(() => res.status(500).json({ message: "DB error updating donation." }));

        db.commit(err3 => {
          if (err3) return db.rollback(() => res.status(500).json({ message: "Commit failed." }));
          res.json({ message: "Delivery confirmed and donation marked as delivered." });
        });
      });
    });
  });
});


module.exports = router;
