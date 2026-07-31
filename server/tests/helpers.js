const request = require('supertest');
const createApp = require('../src/app');
const User = require('../src/models/User');
const generateToken = require('../src/utils/generateToken');

const app = createApp();

async function createUser(overrides = {}) {
  const defaults = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random()}@example.com`,
    password: 'Password123!',
    role: 'employee',
  };
  const user = await User.create({ ...defaults, ...overrides });
  const token = generateToken(user);
  return { user, token };
}

async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

module.exports = { app, request, createUser, createAdmin };
