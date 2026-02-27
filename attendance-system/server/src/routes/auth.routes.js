const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { JWT_SECRET } = require('../config');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createError = (status, message, details) => {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
};

const sanitizeString = (value, maxLen = 200) =>
  String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLen);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const emailOrCode = sanitizeString(req.body.emailOrCode);
    const password = String(req.body.password || '').trim();

    if (!emailOrCode || !password) {
      throw createError(400, 'Email/Code and password are required');
    }

    const query = emailOrCode.includes('@')
      ? { email: emailOrCode.toLowerCase() }
      : { employeeCode: emailOrCode };

    const user = await User.findOne(query);
    if (!user) {
      throw createError(401, 'Invalid credentials');
    }
    if (!user.active) {
      throw createError(403, 'User is inactive');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw createError(401, 'Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      role: user.role,
      active: user.active,
      officeId: user.officeId
    };

    res.json({ token, user: safeUser });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

module.exports = router;
