const express = require('express');
const path = require('path');
const multer = require('multer');
const Attendance = require('../models/Attendance');
const Office = require('../models/Office');
const auth = require('../middleware/auth');
const { MAX_ACCURACY_METERS, ALLOW_OUTSIDE_AS_FLAGGED } = require('../config');
const { haversineDistance } = require('../utils/distance');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const name = `punch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    const err = new Error('Only image files are allowed');
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createError = (status, message, details) => {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
};

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

router.post(
  '/punch',
  auth,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    const type = String(req.body.type || '').toUpperCase().trim();
    if (!['IN', 'OUT'].includes(type)) {
      throw createError(400, 'Invalid punch type');
    }

    const workMode = String(req.body.workMode || 'OFFICE').toUpperCase().trim();
    if (!['OFFICE', 'WFH'].includes(workMode)) {
      throw createError(400, 'Invalid work mode');
    }

    if (!req.file) {
      throw createError(400, 'Photo is required');
    }

    const user = req.user;
    if (!user.officeId) {
      throw createError(400, 'User has no office assigned');
    }

    const office = await Office.findById(user.officeId);
    if (!office) {
      throw createError(400, 'Assigned office not found');
    }

    const last = await Attendance.findOne({ userId: user._id }).sort({
      serverTime: -1
    });

    if (type === 'IN' && last && last.type === 'IN') {
      throw createError(400, 'Cannot punch IN twice in a row');
    }

    if (type === 'OUT') {
      if (!last) {
        throw createError(400, 'Cannot punch OUT before first IN');
      }
      if (last.type === 'OUT') {
        throw createError(400, 'Cannot punch OUT twice in a row');
      }
    }

    if (workMode === 'WFH') {
      const attendance = await Attendance.create({
        userId: user._id,
        officeId: office._id,
        workMode,
        type,
        serverTime: new Date(),
        lat: null,
        lng: null,
        accuracyMeters: null,
        distanceMeters: null,
        insideGeofence: null,
        photoPath: `/uploads/${req.file.filename}`,
        status: 'approved',
        reason: 'Work from home'
      });

      return res.json({ attendance });
    }

    const lat = parseNumber(req.body.lat);
    const lng = parseNumber(req.body.lng);
    const accuracyMeters = parseNumber(req.body.accuracyMeters);

    if (lat === null || lng === null || accuracyMeters === null) {
      throw createError(400, 'Invalid location data');
    }

    const distanceMeters = haversineDistance(lat, lng, office.lat, office.lng);
    const insideGeofence = distanceMeters <= office.radiusMeters;

    let status = 'approved';
    const reasons = [];

    if (!insideGeofence) {
      if (!ALLOW_OUTSIDE_AS_FLAGGED) {
        status = 'rejected';
        reasons.push('Outside geofence');
      } else {
        status = 'flagged';
        reasons.push('Outside geofence');
      }
    }

    if (status !== 'rejected' && accuracyMeters > MAX_ACCURACY_METERS) {
      status = 'flagged';
      reasons.push('Low GPS accuracy');
    }

    const attendance = await Attendance.create({
      userId: user._id,
      officeId: office._id,
      type,
      serverTime: new Date(),
      lat,
      lng,
      accuracyMeters,
      distanceMeters,
      insideGeofence,
      photoPath: `/uploads/${req.file.filename}`,
      status,
      reason: reasons.join('; '),
      workMode
    });

    res.json({ attendance });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const { from, to, status, type } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = String(type).toUpperCase();

    if (from || to) {
      filter.serverTime = {};
      if (from) filter.serverTime.$gte = new Date(from);
      if (to) filter.serverTime.$lte = new Date(to);
    }

    const items = await Attendance.find(filter)
      .sort({ serverTime: -1 })
      .populate('officeId', 'name');

    res.json({ items });
  })
);

module.exports = router;
