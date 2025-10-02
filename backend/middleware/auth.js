const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret';  // Use env var in production

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
}

// Example verifyVolunteer middleware - ensure user role is volunteer
function verifyVolunteer(req, res, next) {
  authenticateJWT(req, res, () => {
    if (req.user && req.user.role === 'volunteer') {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden: Not a volunteer' });
    }
  });
}

module.exports = {
  authenticateJWT,
  verifyVolunteer
};
