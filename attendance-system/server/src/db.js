const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }
  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
};

module.exports = connectDB;
