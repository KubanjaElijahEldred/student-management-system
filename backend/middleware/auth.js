// middleware/auth.js
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload; // { sub, email, role }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

module.exports = { authRequired };
