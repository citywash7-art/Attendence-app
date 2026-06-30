const fs = require('fs');
const path = require('path');
const { del, get, put } = require('@vercel/blob');
const cloudinary = require('cloudinary').v2;
const {
  BLOB_ACCESS,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  PHOTO_STORAGE
} = require('../config');

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

const configureCloudinary = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
};

const getCloudinaryPublicId = (photoPath) =>
  photoPath?.startsWith('cloudinary:') ? photoPath.slice('cloudinary:'.length) : null;

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

  if (PHOTO_STORAGE === 'cloudinary') {
    configureCloudinary();
    const publicId = `attendance/${userId}/${path.parse(filename).name}`;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          overwrite: false
        },
        (err, uploadResult) => {
          if (err) return reject(err);
          return resolve(uploadResult);
        }
      );
      stream.end(file.buffer);
    });

    return `cloudinary:${result.public_id}`;
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

  const cloudinaryPublicId = getCloudinaryPublicId(photoPath);
  if (cloudinaryPublicId) {
    configureCloudinary();
    await cloudinary.uploader.destroy(cloudinaryPublicId, {
      resource_type: 'image',
      invalidate: true
    });
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

const getCloudinaryPhoto = async (photoPath) => {
  const publicId = getCloudinaryPublicId(photoPath);
  if (!publicId) return null;

  configureCloudinary();
  const url = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image'
  });
  return fetch(url);
};

module.exports = {
  deletePhoto,
  getBlobPhoto,
  getCloudinaryPhoto,
  getCloudinaryPublicId,
  getLocalPhotoPath,
  savePhoto,
  uploadDir
};
