const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const connectDB = require('./db');
const { PORT, CORS_ORIGIN, SERVE_WEB } = require('./config');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = (req, cb) => {
  const origin = req.header('Origin');
  if (!origin) {
    return cb(null, { origin: false });
  }

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return cb(null, { origin: true, credentials: true });
  }

  if (SERVE_WEB) {
    const proto = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const requestOrigin = `${proto}://${host}`;
    if (origin === requestOrigin) {
      return cb(null, { origin: true, credentials: true });
    }
  }

  return cb(null, { origin: false });
};

app.use('/api', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

if (SERVE_WEB) {
  const webDist = path.join(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }
}

app.use(require('./middleware/error'));

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
