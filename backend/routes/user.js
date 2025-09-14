const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const upload = multer({ dest: "uploads/" });

// ========================
// JWT AUTH MIDDLEWARE
// ========================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // must match login secret
    req.user = decoded; // attach decoded token to req.user
    next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ========================
// DONATE FOOD
// ========================
router.post('/donate', upload.single('photo'), (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user_id = decoded.id;

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

  } catch (err) {
    console.error("TOKEN ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

// ========================
// USER REGISTER
// ========================
router.post('/register', (req, res) => {
  const {
    name, email, password, phone, address, city, pincode, role,
    preferredArea, vehicleType, availability,     // volunteer
    donorType, foodType, availabilityTime,        // donor
    ngoName, licenseNumber, capacity, ngoFoodType // ngo
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length > 0) return res.status(400).json({ message: "Email already registered" });

    db.query(
      "INSERT INTO users (name, email, password, phone, address, city, pincode, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, email, password, phone || null, address || null, city || null, pincode || null, role || "donor"],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Error creating user" });

        const userId = result.insertId;

        // Insert role-specific details
        let roleQuery = null;
        let values = [];

        if (role === "donor") {
          roleQuery = "INSERT INTO donors (user_id, donorType, foodType, availabilityTime) VALUES (?, ?, ?, ?)";
          values = [userId, donorType || null, foodType || null, availabilityTime || null];
        } else if (role === "volunteer") {
          roleQuery = "INSERT INTO volunteers (user_id, preferredArea, vehicleType, availability) VALUES (?, ?, ?, ?)";
          values = [userId, preferredArea || null, vehicleType || null, availability || null];
        } else if (role === "ngo") {
          roleQuery = "INSERT INTO ngos (user_id, ngoName, licenseNumber, capacity, foodType) VALUES (?, ?, ?, ?, ?)";
          values = [userId, ngoName || null, licenseNumber || null, capacity || null, ngoFoodType || null];
        }

        if (roleQuery) {
          db.query(roleQuery, values, (err) => {
            if (err) return res.status(500).json({ message: "Error inserting role-specific details" });
            return res.status(201).json({ message: "User registered successfully", id: userId });
          });
        } else {
          return res.status(201).json({ message: "User registered successfully", id: userId });
        }
      }
    );
  });
});


// ========================
// USER LOGIN
// ========================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error during login" });
    if (results.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const user = results[0];
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

// ========================
// GET PROFILE
// ========================
router.get('/profile', authenticateJWT, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT id, name, email, phone, address, city, pincode, role, profile_photo FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching profile" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];

    if (user.role === "donor") {
      db.query("SELECT donorType, foodType, availabilityTime FROM donors WHERE user_id = ?", [userId], (err, donorRes) => {
        if (err) return res.status(500).json({ message: "Error fetching donor details" });
        return res.json({ ...user, donorDetails: donorRes[0] || {} });
      });
    } else if (user.role === "volunteer") {
      db.query("SELECT preferredArea, vehicleType, availability FROM volunteers WHERE user_id = ?", [userId], (err, volRes) => {
        if (err) return res.status(500).json({ message: "Error fetching volunteer details" });
        return res.json({ ...user, volunteerDetails: volRes[0] || {} });
      });
    } else if (user.role === "ngo") {
      db.query("SELECT ngoName, licenseNumber, capacity, foodType FROM ngos WHERE user_id = ?", [userId], (err, ngoRes) => {
        if (err) return res.status(500).json({ message: "Error fetching NGO details" });
        return res.json({ ...user, ngoDetails: ngoRes[0] || {} });
      });
    } else {
      return res.json(user);
    }
  });
});

// ========================
// UPDATE PROFILE
// ========================
router.put('/profile', authenticateJWT, upload.single("profileImage"), (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const {
    name, phone, address, city, pincode,
    preferredArea, vehicleType, availability,
    donorType, foodType, availabilityTime,
    ngoName, licenseNumber, capacity, ngoFoodType
  } = req.body;

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, userRes) => {
    if (err || !userRes.length) return res.status(500).json({ message: "Error fetching user" });
    const currentUser = userRes[0];

    const updates = {
      name: name ?? currentUser.name,
      phone: phone ?? currentUser.phone,
      address: address ?? currentUser.address,
      city: city ?? currentUser.city,
      pincode: pincode ?? currentUser.pincode,
    };

    db.query(
      "UPDATE users SET name=?, phone=?, address=?, city=?, pincode=? WHERE id=?",
      [updates.name, updates.phone, updates.address, updates.city, updates.pincode, userId],
      (err) => {
        if (err) return res.status(500).json({ message: "Error updating user" });

        if (req.file) {
          const photoPath = req.file.path.replace(/\\/g, "/");
          db.query("UPDATE users SET profile_photo=? WHERE id=?", [photoPath, userId], (err) => {
            if (err) console.error("Error saving profile photo:", err);
          });
        }

        const finish = () => res.json({ message: "Profile updated successfully" });

        if (role === "volunteer") {
          db.query("SELECT * FROM volunteers WHERE user_id = ?", [userId], (err, volRes) => {
            const cur = volRes[0] || {};
            db.query(
              "UPDATE volunteers SET preferredArea=?, vehicleType=?, availability=? WHERE user_id=?",
              [preferredArea ?? cur.preferredArea, vehicleType ?? cur.vehicleType, availability ?? cur.availability, userId],
              (err) => (err ? res.status(500).json({ message: "Error updating volunteer" }) : finish())
            );
          });
        } else if (role === "donor") {
          db.query("SELECT * FROM donors WHERE user_id = ?", [userId], (err, donRes) => {
            const cur = donRes[0] || {};
            db.query(
              "UPDATE donors SET donorType=?, foodType=?, availabilityTime=? WHERE user_id=?",
              [donorType ?? cur.donorType, foodType ?? cur.foodType, availabilityTime ?? cur.availabilityTime, userId],
              (err) => (err ? res.status(500).json({ message: "Error updating donor" }) : finish())
            );
          });
        } else if (role === "ngo") {
          db.query("SELECT * FROM ngos WHERE user_id = ?", [userId], (err, ngoRes) => {
            const cur = ngoRes[0] || {};
            db.query(
              "UPDATE ngos SET ngoName=?, licenseNumber=?, capacity=?, foodType=? WHERE user_id=?",
              [ngoName ?? cur.ngoName, licenseNumber ?? cur.licenseNumber, capacity ?? cur.capacity, ngoFoodType ?? cur.foodType, userId],
              (err) => (err ? res.status(500).json({ message: "Error updating NGO" }) : finish())
            );
          });
        } else finish();
      }
    );
  });
});

// ========================
// UPLOAD PROFILE PHOTO
// ========================
router.post("/upload-profile-photo", authenticateJWT, upload.single("profilePhoto"), (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const photoPath = req.file.path.replace(/\\/g, "/");

  db.query("UPDATE users SET profile_photo=? WHERE id=?", [photoPath, userId], (err) => {
    if (err) {
      console.error("Error saving profile photo:", err);
      return res.status(500).json({ message: "Error saving profile photo" });
    }
    res.json({ message: "Profile photo uploaded successfully" });
  });
});

router.get('/admin/users', authenticateJWT, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  // Extract filters and sort params from query
  const { role, city, sort, order } = req.query;

  // Base query
  let query = 'SELECT id, name, email, phone, address, city, pincode, role FROM users';
  let conditions = [];
  let params = [];

  // Add filters if present
  if (role && role !== '') {
    conditions.push('role = ?');
    params.push(role);
  }
  if (city && city !== '') {
    conditions.push('city LIKE ?');
    params.push(`%${city}%`); // Partial match for city
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Allowed columns to sort by (prevent SQL injection)
  const allowedSortColumns = ['name', 'email', 'role', 'city'];
  const sortColumn = allowedSortColumns.includes(sort) ? sort : 'name'; // default sort by name
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  query += ` ORDER BY ${sortColumn} ${sortOrder}`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(results);
  });
});

module.exports = router;