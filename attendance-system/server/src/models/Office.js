const mongoose = require('mongoose');
const { DEFAULT_RADIUS_METERS } = require('../config');

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radiusMeters: { type: Number, default: DEFAULT_RADIUS_METERS }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Office', officeSchema);
