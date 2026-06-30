const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');
mongoose.set('autoCreate', false);

const requiredCollections = ['attendances', 'offices', 'roles', 'users'];
let connectionPromise;

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

const connectDB = () => {
  if (!MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI not set'));
  }

  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI, { autoCreate: false })
      .then(async () => {
        // Materialize every required collection on first startup.
        await ensureCollections(mongoose.connection);
        console.log(`MongoDB connected: ${mongoose.connection.name}`);
        return mongoose.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
