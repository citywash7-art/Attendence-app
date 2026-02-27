const bcrypt = require('bcryptjs');
const connectDB = require('../db');
const User = require('../models/User');
const Office = require('../models/Office');
const Role = require('../models/Role');

const run = async () => {
  await connectDB();

  await Role.updateOne({ name: 'admin' }, { $setOnInsert: { name: 'admin' } }, { upsert: true });
  await Role.updateOne({ name: 'worker' }, { $setOnInsert: { name: 'worker' } }, { upsert: true });

  let office = await Office.findOne({ name: 'Main Office' });
  if (!office) {
    office = await Office.create({
      name: 'Main Office',
      lat: 12.9716,
      lng: 77.5946,
      radiusMeters: 100
    });
  }

  const adminEmail = 'admin@test.com';
  const workerEmail = 'worker@test.com';

  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await User.create({
      name: 'Admin User',
      email: adminEmail,
      employeeCode: 'ADMIN001',
      passwordHash,
      role: 'admin',
      active: true
    });
  }

  const workerExists = await User.findOne({ email: workerEmail });
  if (!workerExists) {
    const passwordHash = await bcrypt.hash('Worker@123', 10);
    await User.create({
      name: 'Worker User',
      email: workerEmail,
      employeeCode: 'WORKER001',
      passwordHash,
      role: 'worker',
      officeId: office._id,
      active: true
    });
  }

  console.log('Seed completed');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
