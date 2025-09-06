const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const authenticateJWT = require('../middleware/auth');
const path = require('path');

// === Multer setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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
router.put('/profile', authenticateJWT, upload.single("profileImage"), (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const {
    name,
    phone,
    address,
    city,
    pincode,
    preferredArea,
    vehicleType,
    availability,
    donorType,
    foodType,
    availabilityTime,
    ngoName,
    licenseNumber,
    capacity,
    ngoFoodType
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

// === UPLOAD PROFILE PHOTO (optional) ===
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

module.exports = router;
