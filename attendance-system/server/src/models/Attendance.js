const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    workMode: { type: String, enum: ['OFFICE', 'WFH'], default: 'OFFICE' },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    serverTime: { type: Date, required: true },
    lat: {
      type: Number,
      required: function requiredLat() {
        return this.workMode !== 'WFH';
      },
      default: null
    },
    lng: {
      type: Number,
      required: function requiredLng() {
        return this.workMode !== 'WFH';
      },
      default: null
    },
    accuracyMeters: {
      type: Number,
      required: function requiredAccuracy() {
        return this.workMode !== 'WFH';
      },
      default: null
    },
    distanceMeters: {
      type: Number,
      required: function requiredDistance() {
        return this.workMode !== 'WFH';
      },
      default: null
    },
    insideGeofence: {
      type: Boolean,
      required: function requiredInside() {
        return this.workMode !== 'WFH';
      },
      default: null
    },
    photoPath: { type: String, required: true },
    status: { type: String, enum: ['approved', 'flagged', 'rejected'], required: true },
    reason: { type: String, default: '' }
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, serverTime: -1 });
attendanceSchema.index({ officeId: 1, serverTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
