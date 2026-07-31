const { Parser } = require('json2csv');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { startOfUTCDay, endOfUTCDay } = require('../utils/date');

const LATE_CUTOFF = process.env.LATE_CUTOFF || '09:15'; // HH:mm, UTC

function isLate(checkInDate) {
  const [h, m] = LATE_CUTOFF.split(':').map(Number);
  const cutoffMinutes = h * 60 + m;
  const checkInMinutes = checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes();
  return checkInMinutes > cutoffMinutes;
}

// @route  POST /api/attendance/check-in
// @access Private (employee, for themselves)
async function checkIn(req, res, next) {
  try {
    const today = startOfUTCDay();
    const now = new Date();

    let record = await Attendance.findOne({ employee: req.user._id, date: today });
    if (record && record.checkIn) {
      return res.status(409).json({ message: 'Already checked in today' });
    }

    const status = isLate(now) ? 'late' : 'present';

    if (record) {
      record.checkIn = now;
      record.status = status;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: req.user._id,
        date: today,
        checkIn: now,
        status,
      });
    }

    res.status(201).json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

// @route  POST /api/attendance/check-out
// @access Private (employee, for themselves)
async function checkOut(req, res, next) {
  try {
    const today = startOfUTCDay();
    const record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (!record || !record.checkIn) {
      return res.status(400).json({ message: 'You must check in before checking out' });
    }
    if (record.checkOut) {
      return res.status(409).json({ message: 'Already checked out today' });
    }

    record.checkOut = new Date();
    await record.save();
    res.json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

// @route  GET /api/attendance/me?from=&to=
// @access Private
async function myAttendance(req, res, next) {
  try {
    const { from, to } = req.query;
    const filter = { employee: req.user._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfUTCDay(from);
      if (to) filter.date.$lte = endOfUTCDay(to);
    }

    const records = await Attendance.find(filter).sort('-date');
    res.json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

function buildAdminFilter(query) {
  const { employee, department, from, to, status } = query;
  const filter = {};
  if (employee) filter.employee = employee;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfUTCDay(from);
    if (to) filter.date.$lte = endOfUTCDay(to);
  }
  return { filter, department };
}

// @route  GET /api/attendance?employee=&department=&from=&to=&status=
// @access Private/Admin
async function listAttendance(req, res, next) {
  try {
    const { filter, department } = buildAdminFilter(req.query);

    let query = Attendance.find(filter)
      .populate({
        path: 'employee',
        select: 'name email department jobTitle',
        populate: { path: 'department', select: 'name' },
      })
      .sort('-date');

    let records = await query;

    if (department) {
      records = records.filter(
        (r) => r.employee && r.employee.department && String(r.employee.department._id) === String(department)
      );
    }

    res.json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

// @route  GET /api/attendance/summary?from=&to=
// @access Private/Admin
// Aggregated counts per employee, useful for a dashboard chart.
async function attendanceSummary(req, res, next) {
  try {
    const { filter } = buildAdminFilter(req.query);

    const summary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { employee: '$employee', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.employee',
          statusCounts: { $push: { status: '$_id.status', count: '$count' } },
          total: { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          _id: 0,
          employeeId: '$employee._id',
          name: '$employee.name',
          email: '$employee.email',
          total: 1,
          statusCounts: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

// @route  GET /api/attendance/export?employee=&department=&from=&to=&status=
// @access Private/Admin
async function exportAttendanceCsv(req, res, next) {
  try {
    const { filter, department } = buildAdminFilter(req.query);

    let records = await Attendance.find(filter).populate({
      path: 'employee',
      select: 'name email department',
      populate: { path: 'department', select: 'name' },
    });

    if (department) {
      records = records.filter(
        (r) => r.employee && r.employee.department && String(r.employee.department._id) === String(department)
      );
    }

    const rows = records.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      employeeName: r.employee?.name || 'Unknown',
      employeeEmail: r.employee?.email || '',
      department: r.employee?.department?.name || '',
      status: r.status,
      checkIn: r.checkIn ? r.checkIn.toISOString() : '',
      checkOut: r.checkOut ? r.checkOut.toISOString() : '',
      workHours: r.workHours ?? '',
    }));

    const parser = new Parser({
      fields: ['date', 'employeeName', 'employeeEmail', 'department', 'status', 'checkIn', 'checkOut', 'workHours'],
    });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

// @route  PUT /api/attendance/:id
// @access Private/Admin (manual correction, e.g. marking someone absent/on-leave)
async function updateAttendanceRecord(req, res, next) {
  try {
    const { status, notes, checkIn: checkInTime, checkOut: checkOutTime } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (checkInTime !== undefined) update.checkIn = checkInTime ? new Date(checkInTime) : null;
    if (checkOutTime !== undefined) update.checkOut = checkOutTime ? new Date(checkOutTime) : null;

    const record = await Attendance.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    res.json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkIn,
  checkOut,
  myAttendance,
  listAttendance,
  attendanceSummary,
  exportAttendanceCsv,
  updateAttendanceRecord,
};
