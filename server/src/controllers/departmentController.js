const Department = require('../models/Department');
const User = require('../models/User');

// @route  GET /api/departments
// @access Private (admin, employee - read only for dropdowns)
async function listDepartments(req, res, next) {
  try {
    const departments = await Department.find().sort('name');
    res.json({ departments });
  } catch (err) {
    next(err);
  }
}

// @route  POST /api/departments
// @access Private/Admin
async function createDepartment(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required' });

    const department = await Department.create({ name, description });
    res.status(201).json({ department });
  } catch (err) {
    next(err);
  }
}

// @route  PUT /api/departments/:id
// @access Private/Admin
async function updateDepartment(req, res, next) {
  try {
    const { name, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }) },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ department });
  } catch (err) {
    next(err);
  }
}

// @route  DELETE /api/departments/:id
// @access Private/Admin
async function deleteDepartment(req, res, next) {
  try {
    const inUse = await User.countDocuments({ department: req.params.id });
    if (inUse > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${inUse} employee(s) are assigned to this department`,
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
