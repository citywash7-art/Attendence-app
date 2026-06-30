const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');
mongoose.set('autoCreate', false);

const requiredCollections = ['attendances', 'offices', 'roles', 'users'];

const ensureCollections = async (connection) => {
  const existingCollections = await connection.db
    .listCollections({}, { nameOnly: true })
    .toArray();
  const existingNames = new Set(existingCollections.map(({ name }) => name));

  for (const collectionName of requiredCollections) {
    if (!existingNames.has(collectionName)) {
      await connection.db.createCollection(collectionName);
    }
  }
};

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }
  await mongoose.connect(MONGODB_URI, { autoCreate: false });

  // Materialize every required collection on first startup.
  await ensureCollections(mongoose.connection);

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
};

module.exports = connectDB;
