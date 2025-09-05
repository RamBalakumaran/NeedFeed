// backend/server.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const feedRoutes = require('./routes/feed'); // <-- Ensure this file exists

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/feed', feedRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
