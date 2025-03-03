import 'dotenv/config';
import mongoose from 'mongoose';
import connectDatabase from '../config/database.config';
import RoleModel from '../models/roles-permission.model';
import { RolePermissions } from '../utils/role-permission';

const seedRoles = async () => {
  console.log('Seeding roles...');

  try {
    await connectDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    await RoleModel.deleteMany({}, { session });

    for (const roleName in RolePermissions) {
      const role = roleName as keyof typeof RolePermissions;
      const permissions = RolePermissions[role];

      const existingRole = await RoleModel.findOne({ name: role }).session(session);
      if (!existingRole) {
        const newRole = new RoleModel({ name: role, permissions });
        await newRole.save({ session });
        console.log(`Role ${role} seeded.`);
      } else {
        console.log(`Role ${role} already exists.`);
      }
    }

    await session.commitTransaction();
    session.endSession();
    console.log('Seeding completed.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

seedRoles().catch((error) => console.error('Error running seed script:', error));
