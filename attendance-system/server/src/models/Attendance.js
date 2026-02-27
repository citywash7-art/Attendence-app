const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    officeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    serverTime: { type: Date, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracyMeters: { type: Number, required: true },
    distanceMeters: { type: Number, required: true },
    insideGeofence: { type: Boolean, required: true },
    photoPath: { type: String, required: true },
    status: { type: String, enum: ['approved', 'flagged', 'rejected'], required: true },
    reason: { type: String, default: '' }
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, serverTime: -1 });
attendanceSchema.index({ officeId: 1, serverTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
