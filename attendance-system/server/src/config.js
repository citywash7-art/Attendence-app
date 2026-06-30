const path = require('path');
const dotenv = require('dotenv');

// Keep the workspace-level .env as the main configuration used from VS Code.
// The server-level .env supplies any values that are not defined there.
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toBool = (value, fallback) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const photoStorage =
  process.env.PHOTO_STORAGE || (process.env.VERCEL ? 'vercel-blob' : 'local');
const blobAccess = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';

module.exports = {
  PORT: toNumber(process.env.PORT, 4000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DEFAULT_RADIUS_METERS: toNumber(process.env.DEFAULT_RADIUS_METERS, 100),
  MAX_ACCURACY_METERS: toNumber(process.env.MAX_ACCURACY_METERS, 100),
  ALLOW_OUTSIDE_AS_FLAGGED: toBool(process.env.ALLOW_OUTSIDE_AS_FLAGGED, false),
  SERVE_WEB: toBool(process.env.SERVE_WEB, false),
  PHOTO_STORAGE: photoStorage,
  BLOB_ACCESS: blobAccess,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
};
