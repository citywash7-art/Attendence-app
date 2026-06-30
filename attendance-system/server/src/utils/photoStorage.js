const fs = require('fs');
const path = require('path');
const { del, get, put } = require('@vercel/blob');
const { BLOB_ACCESS, PHOTO_STORAGE } = require('../config');

const uploadDir = path.join(__dirname, '..', 'uploads');

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif'
};

const createPhotoName = (file) => {
  const extension =
    extensionByMimeType[file.mimetype] ||
    path.extname(file.originalname || '').toLowerCase() ||
    '.img';
  return `punch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
};

const savePhoto = async (file, userId) => {
  const filename = createPhotoName(file);

  if (PHOTO_STORAGE === 'vercel-blob') {
    const blob = await put(`attendance/${userId}/${filename}`, file.buffer, {
      access: BLOB_ACCESS,
      addRandomSuffix: true,
      contentType: file.mimetype
    });

    return BLOB_ACCESS === 'private' ? blob.pathname : blob.url;
  }

  await fs.promises.mkdir(uploadDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

const deletePhoto = async (photoPath) => {
  if (!photoPath) return;

  if (photoPath.startsWith('/uploads/')) {
    const filename = path.basename(photoPath);
    await fs.promises.rm(path.join(uploadDir, filename), { force: true });
    return;
  }

  await del(photoPath);
};

const getLocalPhotoPath = (photoPath) => {
  if (!photoPath?.startsWith('/uploads/')) return null;
  return path.join(uploadDir, path.basename(photoPath));
};

const getBlobPhoto = (photoPath, ifNoneMatch) =>
  get(photoPath, {
    access: BLOB_ACCESS,
    ifNoneMatch: ifNoneMatch || undefined
  });

module.exports = {
  deletePhoto,
  getBlobPhoto,
  getLocalPhotoPath,
  savePhoto,
  uploadDir
};
