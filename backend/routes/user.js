const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ========================
// JWT AUTH MIDDLEWARE
// ========================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error('JWT ERROR:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ========================
// REGISTER USER
// ========================
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, phone, address, city, pincode, role,
      preferredArea, vehicleType, availability,     // volunteer
      donorType, foodType, availabilityTime,        // donor
      ngoName, licenseNumber, capacity, ngoFoodType // ngo
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const [userResult] = await db.query(
      `INSERT INTO users (name, email, password, phone, address, city, pincode, role, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, phone || null, address || null, city || null, pincode || null, role || 'donor', req.body.latitude || null, req.body.longitude || null]
    );

    const userId = userResult.insertId;

    // Role-specific insertion
    if (role === 'donor') {
      await db.query('INSERT INTO donors (user_id, donorType, foodType, availabilityTime) VALUES (?, ?, ?, ?)', [userId, donorType || null, foodType || null, availabilityTime || null]);
    } else if (role === 'volunteer') {
      await db.query('INSERT INTO volunteers (user_id, preferredArea, vehicleType, availability) VALUES (?, ?, ?, ?)', [userId, preferredArea || null, vehicleType || null, availability || null]);
    } else if (role === 'ngo') {
      await db.query('INSERT INTO ngos (user_id, ngoName, licenseNumber, capacity, foodType) VALUES (?, ?, ?, ?, ?)', [userId, ngoName || null, licenseNumber || null, capacity || null, ngoFoodType || null]);
    }

    res.status(201).json({ message: 'User registered successfully', id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error during registration' });
  }
});

// ========================
// LOGIN USER
// ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    if (password !== user.password) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error during login' });
  }
});

// ========================
// GET PROFILE
// ========================
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const [userRes] = await db.query('SELECT id, name, email, phone, address, city, pincode, role, profile_photo FROM users WHERE id = ?', [userId]);
    if (!userRes.length) return res.status(404).json({ message: 'User not found' });

    const user = userRes[0];

    if (user.role === 'donor') {
      const [donorRes] = await db.query('SELECT donorType, foodType, availabilityTime FROM donors WHERE user_id = ?', [userId]);
      return res.json({ ...user, donorDetails: donorRes[0] || {} });
    } else if (user.role === 'volunteer') {
      const [volRes] = await db.query('SELECT preferredArea, vehicleType, availability FROM volunteers WHERE user_id = ?', [userId]);
      return res.json({ ...user, volunteerDetails: volRes[0] || {} });
    } else if (user.role === 'ngo') {
      const [ngoRes] = await db.query('SELECT ngoName, licenseNumber, capacity, foodType FROM ngos WHERE user_id = ?', [userId]);
      return res.json({ ...user, ngoDetails: ngoRes[0] || {} });
    } else return res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// ========================
// UPDATE PROFILE
// ========================
router.put('/profile', authenticateJWT, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const {
      name, phone, address, city, pincode,
      preferredArea, vehicleType, availability,
      donorType, foodType, availabilityTime,
      ngoName, licenseNumber, capacity, ngoFoodType
    } = req.body;

    // Update users table
    const [userRes] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!userRes.length) return res.status(404).json({ message: 'User not found' });
    const currentUser = userRes[0];

    await db.query(
      'UPDATE users SET name=?, phone=?, address=?, city=?, pincode=? WHERE id=?',
      [name ?? currentUser.name, phone ?? currentUser.phone, address ?? currentUser.address, city ?? currentUser.city, pincode ?? currentUser.pincode, userId]
    );

    if (req.file) {
      const photoPath = req.file.path.replace(/\\/g, '/');
      await db.query('UPDATE users SET profile_photo=? WHERE id=?', [photoPath, userId]);
    }

    // Update role-specific table
    if (role === 'donor') {
      const [donRes] = await db.query('SELECT * FROM donors WHERE user_id = ?', [userId]);
      const cur = donRes[0] || {};
      await db.query(
        'UPDATE donors SET donorType=?, foodType=?, availabilityTime=? WHERE user_id=?',
        [donorType ?? cur.donorType, foodType ?? cur.foodType, availabilityTime ?? cur.availabilityTime, userId]
      );
    } else if (role === 'volunteer') {
      const [volRes] = await db.query('SELECT * FROM volunteers WHERE user_id = ?', [userId]);
      const cur = volRes[0] || {};
      await db.query(
        'UPDATE volunteers SET preferredArea=?, vehicleType=?, availability=? WHERE user_id=?',
        [preferredArea ?? cur.preferredArea, vehicleType ?? cur.vehicleType, availability ?? cur.availability, userId]
      );
    } else if (role === 'ngo') {
      const [ngoRes] = await db.query('SELECT * FROM ngos WHERE user_id = ?', [userId]);
      const cur = ngoRes[0] || {};
      await db.query(
        'UPDATE ngos SET ngoName=?, licenseNumber=?, capacity=?, foodType=? WHERE user_id=?',
        [ngoName ?? cur.ngoName, licenseNumber ?? cur.licenseNumber, capacity ?? cur.capacity, ngoFoodType ?? cur.foodType, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// ========================
// UPLOAD PROFILE PHOTO
// ========================
router.post('/upload-profile-photo', authenticateJWT, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const photoPath = req.file.path.replace(/\\/g, '/');
    await db.query('UPDATE users SET profile_photo=? WHERE id=?', [photoPath, userId]);

    res.json({ message: 'Profile photo uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving profile photo' });
  }
});

// ========================
// ADMIN: GET USERS WITH FILTERS
// ========================
router.get('/admin/users', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

    const { role, city, sort, order } = req.query;
    let query = 'SELECT id, name, email, phone, address, city, pincode, role FROM users';
    const conditions = [];
    const params = [];

    if (role) { conditions.push('role=?'); params.push(role); }
    if (city) { conditions.push('city LIKE ?'); params.push(`%${city}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

    const allowedSort = ['name', 'email', 'role', 'city'];
    query += ` ORDER BY ${allowedSort.includes(sort) ? sort : 'name'} ${order === 'desc' ? 'DESC' : 'ASC'}`;

    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
