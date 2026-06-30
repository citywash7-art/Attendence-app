const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../db');
const Attendance = require('../models/Attendance');
const { BLOB_ACCESS, PHOTO_STORAGE } = require('../config');
const { deletePhoto, savePhoto, uploadDir } = require('./photoStorage');

const mimeTypeByExtension = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif'
};

const run = async () => {
  if (!['vercel-blob', 'cloudinary'].includes(PHOTO_STORAGE)) {
    throw new Error(
      'Set PHOTO_STORAGE=vercel-blob or PHOTO_STORAGE=cloudinary before running this migration'
    );
  }

  if (PHOTO_STORAGE === 'vercel-blob' && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  await connectDB();

  const records = await Attendance.find({ photoPath: /^\/uploads\// });
  let migrated = 0;
  let missing = 0;

  for (const attendance of records) {
    const filename = path.basename(attendance.photoPath);
    const localPath = path.join(uploadDir, filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`Missing local photo: ${filename}`);
      missing += 1;
      continue;
    }

    const extension = path.extname(filename).toLowerCase();
    const file = {
      buffer: await fs.promises.readFile(localPath),
      mimetype: mimeTypeByExtension[extension] || 'application/octet-stream',
      originalname: filename
    };

    const blobPath = await savePhoto(file, attendance.userId.toString());

    try {
      const result = await Attendance.updateOne(
        { _id: attendance._id, photoPath: attendance.photoPath },
        { $set: { photoPath: blobPath } }
      );

      if (result.modifiedCount !== 1) {
        await deletePhoto(blobPath);
        console.warn(`Skipped changed record: ${attendance._id}`);
        continue;
      }
    } catch (err) {
      await deletePhoto(blobPath).catch(() => {});
      throw err;
    }

    migrated += 1;
    console.log(`Migrated: ${filename}`);
  }

  console.log(`Photo migration complete: ${migrated} migrated, ${missing} missing`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Photo migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
