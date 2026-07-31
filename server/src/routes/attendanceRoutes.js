const express = require('express');
const {
  checkIn,
  checkOut,
  myAttendance,
  listAttendance,
  attendanceSummary,
  exportAttendanceCsv,
  updateAttendanceRecord,
} = require('../controllers/attendanceController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

router.use(protect);

// Employee self-service
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/me', myAttendance);

// Admin views
router.get('/', authorize('admin'), listAttendance);
router.get('/summary', authorize('admin'), attendanceSummary);
router.get('/export', authorize('admin'), exportAttendanceCsv);
router.put('/:id', authorize('admin'), updateAttendanceRecord);

module.exports = router;
