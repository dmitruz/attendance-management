const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Normalized to midnight UTC so there is exactly one record per employee per day
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day', 'on-leave'],
      default: 'present',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// One attendance document per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('workHours').get(function getWorkHours() {
  if (!this.checkIn || !this.checkOut) return null;
  const ms = this.checkOut.getTime() - this.checkIn.getTime();
  return Math.round((ms / 3600000) * 100) / 100;
});

attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
