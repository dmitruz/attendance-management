const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @route  POST /api/auth/login
// @access Public
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// @route  GET /api/auth/me
// @access Private
async function getMe(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { login, getMe };
