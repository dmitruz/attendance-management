const User = require('../models/User');

// @route  GET /api/employees
// @access Private/Admin
async function listEmployees(req, res, next) {
  try {
    const { department, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter).populate('department', 'name').sort('name');
    res.json({ employees: employees.map((e) => e.toSafeObject()) });
  } catch (err) {
    next(err);
  }
}

// @route  GET /api/employees/:id
// @access Private/Admin
async function getEmployee(req, res, next) {
  try {
    const employee = await User.findById(req.params.id).populate('department', 'name');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: employee.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// @route  POST /api/employees
// @access Private/Admin
async function createEmployee(req, res, next) {
  try {
    const { name, email, password, role, department, jobTitle } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const employee = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'employee',
      department: department || null,
      jobTitle: jobTitle || '',
    });

    res.status(201).json({ employee: employee.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// @route  PUT /api/employees/:id
// @access Private/Admin
async function updateEmployee(req, res, next) {
  try {
    const { name, jobTitle, department, role, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (jobTitle !== undefined) update.jobTitle = jobTitle;
    if (department !== undefined) update.department = department || null;
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const employee = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('department', 'name');

    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: employee.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// @route  DELETE /api/employees/:id
// @access Private/Admin
// Soft delete: deactivate instead of removing, so historical attendance stays intact.
async function deactivateEmployee(req, res, next) {
  try {
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deactivated', employee: employee.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
};
