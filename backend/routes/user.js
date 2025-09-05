// backend/routes/user.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // <-- Ensure this file exists
const jwt = require('jsonwebtoken');
const multer = require('multer');
const authenticateJWT = require('../middleware/auth'); // <-- Ensure this file exists

// === Multer setup ===
const upload = multer({ dest: "uploads/" });

// === USER REGISTRATION ===
router.post('/register', (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    city,
    pincode,
    role,
    latitude,
    longitude,
    donorType,
    foodType,
    availabilityTime,
    preferredArea,
    vehicleType,
    volunteerAvailability,
    ngoName,
    licenseNumber,
    capacity,
    ngoFoodType
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password and role are required" });
  }

  db.query("SELECT email FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error during email check", error: err });
    if (results.length > 0) return res.status(400).json({ message: "Email already exists" });

    const insertUser = `
      INSERT INTO users 
      (name, email, password, phone, address, city, pincode, role, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertUser, [name, email, password, phone, address, city, pincode, role, latitude, longitude], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error during registration", error: err });

      const userId = result.insertId;

      // Role-based inserts
      if (role === 'donor') {
        db.query(
          `INSERT INTO donors (user_id, donorType, foodType, availabilityTime) VALUES (?, ?, ?, ?)`,
          [userId, donorType, foodType, availabilityTime],
          (err) => {
            if (err) return res.status(500).json({ message: "Error inserting donor details", error: err });
            return res.status(201).json({ message: "Donor registered successfully!" });
          }
        );
      } else if (role === 'volunteer') {
        db.query(
          `INSERT INTO volunteers (user_id, preferredArea, vehicleType, availability) VALUES (?, ?, ?, ?)`,
          [userId, preferredArea, vehicleType, volunteerAvailability],
          (err) => {
            if (err) return res.status(500).json({ message: "Error inserting volunteer details", error: err });
            return res.status(201).json({ message: "Volunteer registered successfully!" });
          }
        );
      } else if (role === 'ngo') {
        db.query(
          `INSERT INTO ngos (user_id, ngoName, licenseNumber, capacity, foodType) VALUES (?, ?, ?, ?, ?)`,
          [userId, ngoName, licenseNumber, capacity, ngoFoodType],
          (err) => {
            if (err) return res.status(500).json({ message: "Error inserting NGO details", error: err });
            return res.status(201).json({ message: "NGO registered successfully!" });
          }
        );
      } else {
        return res.status(201).json({ message: "User registered successfully!" });
      }
    });
  });
});

// === USER LOGIN ===
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

// === GET PROFILE ===
router.get('/profile', authenticateJWT, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT id, name, email, phone, address, city, pincode, role, profile_photo FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching profile" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];

    // Fetch role details
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

// === UPDATE PROFILE ===
router.put('/profile', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const { name, phone, address, city, pincode } = req.body;

  db.query(
    "UPDATE users SET name=?, phone=?, address=?, city=?, pincode=? WHERE id=?",
    [name, phone, address, city, pincode, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "Error updating profile" });
      res.json({ message: "Profile updated successfully" });
    }
  );
});

// === UPLOAD PROFILE PHOTO ===
router.post("/upload-profile-photo", authenticateJWT, upload.single("profilePhoto"), (req, res) => {
  const userId = req.user.id;
  const photoPath = req.file.path;

  db.query("UPDATE users SET profile_photo=? WHERE id=?", [photoPath, userId], (err) => {
    if (err) return res.status(500).json({ message: "Error saving profile photo" });
    res.json({ message: "Profile photo uploaded successfully" });
  });
});

module.exports = router;
