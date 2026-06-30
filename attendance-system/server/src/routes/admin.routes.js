const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Office = require('../models/Office');
const Attendance = require('../models/Attendance');
const Role = require('../models/Role');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth, admin);

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

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const ensureRoleExists = async (roleName) => {
  if (!roleName) return;
  const existing = await Role.findOne({ name: roleName });
  if (!existing) {
    await Role.create({ name: roleName });
  }
};

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const base = { serverTime: { $gte: start, $lt: end } };
    const totalPunches = await Attendance.countDocuments(base);
    const approved = await Attendance.countDocuments({ ...base, status: 'approved' });
    const flagged = await Attendance.countDocuments({ ...base, status: 'flagged' });
    const rejected = await Attendance.countDocuments({ ...base, status: 'rejected' });

    res.json({ totalPunches, approved, flagged, rejected });
  })
);

router.get(
  '/offices',
  asyncHandler(async (req, res) => {
    const offices = await Office.find().sort({ name: 1 });
    res.json({ offices });
  })
);

router.post(
  '/offices',
  asyncHandler(async (req, res) => {
    const name = sanitizeString(req.body.name);
    const lat = parseNumber(req.body.lat);
    const lng = parseNumber(req.body.lng);
    const radiusMeters = parseNumber(req.body.radiusMeters);

    if (!name || lat === null || lng === null) {
      throw createError(400, 'Name, lat, and lng are required');
    }

    const data = { name, lat, lng };
    if (radiusMeters !== null) data.radiusMeters = radiusMeters;

    const office = await Office.create(data);
    res.status(201).json({ office });
  })
);

router.patch(
  '/offices/:id',
  asyncHandler(async (req, res) => {
    const update = {};

    if (req.body.name !== undefined) update.name = sanitizeString(req.body.name);
    if (req.body.lat !== undefined) {
      const lat = parseNumber(req.body.lat);
      if (lat === null) throw createError(400, 'Invalid lat');
      update.lat = lat;
    }
    if (req.body.lng !== undefined) {
      const lng = parseNumber(req.body.lng);
      if (lng === null) throw createError(400, 'Invalid lng');
      update.lng = lng;
    }
    if (req.body.radiusMeters !== undefined) {
      const radius = parseNumber(req.body.radiusMeters);
      if (radius === null) throw createError(400, 'Invalid radiusMeters');
      update.radiusMeters = radius;
    }

    const office = await Office.findByIdAndUpdate(req.params.id, update, {
      new: true
    });

    if (!office) throw createError(404, 'Office not found');
    res.json({ office });
  })
);

router.get(
  '/roles',
  asyncHandler(async (req, res) => {
    const roles = await Role.find().sort({ name: 1 });
    res.json({ roles });
  })
);

router.post(
  '/roles',
  asyncHandler(async (req, res) => {
    const name = sanitizeString(req.body.name, 40).toLowerCase();
    if (!name) throw createError(400, 'Role name is required');

    const existing = await Role.findOne({ name });
    if (existing) return res.json({ role: existing });

    const role = await Role.create({ name });
    res.status(201).json({ role });
  })
);

router.patch(
  '/roles/:id',
  asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw createError(404, 'Role not found');

    const update = {};
    if (req.body.name !== undefined) {
      const name = sanitizeString(req.body.name, 40).toLowerCase();
      if (!name) throw createError(400, 'Role name is required');
      update.name = name;
    }
    if (req.body.active !== undefined) update.active = Boolean(req.body.active);

    const oldName = role.name;
    Object.assign(role, update);
    await role.save();

    if (update.name && update.name !== oldName) {
      await User.updateMany({ role: oldName }, { $set: { role: update.name } });
    }

    res.json({ role });
  })
);

router.delete(
  '/roles/:id',
  asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw createError(404, 'Role not found');

    if (role.name === 'admin') {
      throw createError(400, 'Admin role cannot be deleted');
    }

    const inUse = await User.countDocuments({ role: role.name });
    if (inUse > 0) {
      throw createError(409, 'Role is assigned to users');
    }

    await role.deleteOne();
    res.json({ ok: true });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await User.find().select('-passwordHash').populate('officeId', 'name');
    res.json({ users });
  })
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const name = sanitizeString(req.body.name);
    const email = sanitizeString(req.body.email).toLowerCase();
    const employeeCode = sanitizeString(req.body.employeeCode);
    const password = String(req.body.password || '').trim();
    const roleRaw = sanitizeString(req.body.role, 40).toLowerCase();
    const role = roleRaw || 'worker';
    const officeId = req.body.officeId || null;
    const active = req.body.active !== undefined ? Boolean(req.body.active) : true;

    if (!name || !email || !employeeCode || !password) {
      throw createError(400, 'Name, email, employeeCode, and password are required');
    }

    if (role !== 'admin' && !officeId) {
      throw createError(400, 'Non-admin users must have an office assigned');
    }

    if (officeId) {
      const office = await Office.findById(officeId);
      if (!office) throw createError(400, 'Office not found');
    }

    const exists = await User.findOne({
      $or: [{ email }, { employeeCode }]
    });
    if (exists) {
      throw createError(409, 'User already exists');
    }

    await ensureRoleExists(role);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      employeeCode,
      passwordHash,
      role,
      officeId,
      active
    });

    const safeUser = await User.findById(user._id)
      .select('-passwordHash')
      .populate('officeId', 'name');

    res.status(201).json({ user: safeUser });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const existing = await User.findById(req.params.id);
    if (!existing) throw createError(404, 'User not found');

    const update = {};
    if (req.body.name !== undefined) update.name = sanitizeString(req.body.name);
    if (req.body.email !== undefined) {
      const email = sanitizeString(req.body.email).toLowerCase();
      if (!email) throw createError(400, 'Email cannot be empty');
      update.email = email;
    }
    if (req.body.employeeCode !== undefined) {
      const employeeCode = sanitizeString(req.body.employeeCode);
      if (!employeeCode) throw createError(400, 'Employee code cannot be empty');
      update.employeeCode = employeeCode;
    }
    if (req.body.role !== undefined) {
      const nextRole = sanitizeString(req.body.role, 40).toLowerCase();
      if (!nextRole) throw createError(400, 'Role cannot be empty');
      update.role = nextRole;
      await ensureRoleExists(nextRole);
    }
    if (req.body.officeId !== undefined) update.officeId = req.body.officeId || null;
    if (req.body.active !== undefined) update.active = Boolean(req.body.active);
    if (req.body.password !== undefined) {
      const password = String(req.body.password || '').trim();
      if (password) {
        update.passwordHash = await bcrypt.hash(password, 10);
      }
    }

    const nextRole = update.role || existing.role;
    const nextOfficeId =
      update.officeId !== undefined ? update.officeId : existing.officeId;

    if (nextRole !== 'admin' && !nextOfficeId) {
      throw createError(400, 'Non-admin users must have an office assigned');
    }

    if (update.officeId) {
      const office = await Office.findById(update.officeId);
      if (!office) throw createError(400, 'Office not found');
    }

    if (update.email || update.employeeCode) {
      const or = [];
      if (update.email) or.push({ email: update.email });
      if (update.employeeCode) or.push({ employeeCode: update.employeeCode });
      const conflict = await User.findOne({
        _id: { $ne: existing._id },
        $or: or
      });
      if (conflict) throw createError(409, 'User already exists');
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true
    })
      .select('-passwordHash')
      .populate('officeId', 'name');

    res.json({ user });
  })
);

router.get(
  '/attendance',
  asyncHandler(async (req, res) => {
    const { from, to, userId, officeId, status, type } = req.query;
    const filter = {};

    if (from || to) {
      filter.serverTime = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          throw createError(400, 'Invalid from date');
        }
        filter.serverTime.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          throw createError(400, 'Invalid to date');
        }
        filter.serverTime.$lte = toDate;
      }
    }

    if (userId) filter.userId = userId;
    if (officeId) filter.officeId = officeId;
    if (status) filter.status = status;
    if (type) filter.type = String(type).toUpperCase();

    const items = await Attendance.find(filter)
      .sort({ serverTime: -1 })
      .populate('userId', 'name email employeeCode')
      .populate('officeId', 'name');

    res.json({ items });
  })
);

router.post(
  '/attendance/:id/decision',
  asyncHandler(async (req, res) => {
    const status = req.body.status;
    const note = sanitizeString(req.body.note, 500);

    if (!['approved', 'rejected'].includes(status)) {
      throw createError(400, 'Status must be approved or rejected');
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      throw createError(404, 'Attendance not found');
    }

    attendance.status = status;
    if (note) attendance.reason = note;

    await attendance.save();
    res.json({ attendance });
  })
);

module.exports = router;
