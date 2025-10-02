// ✅ Correct server.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const feedRoutes = require('./routes/feed');
const volunteerRoutes = require('./routes/volunteer'); // Make sure the file name is correct

const app = express();
const port = 3001;
const path = require("path");

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/volunteer', volunteerRoutes); // ✅ Correct path

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
