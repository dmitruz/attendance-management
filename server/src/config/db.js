const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    // Modern mongoose (>=6) no longer needs useNewUrlParser/useUnifiedTopology,
    // they are kept out intentionally to avoid deprecation warnings.
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
