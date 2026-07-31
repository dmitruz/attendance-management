require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

async function bootstrapAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return;

  await User.create({ name: 'Admin', email, password, role: 'admin' });
  console.log(`Seeded initial admin account: ${email}`);
}

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    await bootstrapAdmin();

    const app = createApp();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
