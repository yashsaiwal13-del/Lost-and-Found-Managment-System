import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/lib/enums';

/**
 * Safe, idempotent administrator initialization.
 * Checks if ANY user with role 'ADMIN' exists in the database.
 * If not, creates exactly one administrator account for Yash Saiwal using ADMIN_BOOTSTRAP_PASSWORD.
 * If an admin already exists, it does nothing and never overwrites existing credentials.
 */
export async function bootstrapAdminUser() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log(`[Bootstrap] Admin account already exists (${existingAdmin.email}). Skipping bootstrap.`);
    return existingAdmin;
  }

  const rawPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!rawPassword) {
    console.warn('[Bootstrap] ADMIN_BOOTSTRAP_PASSWORD not set in environment. Skipping admin creation.');
    return null;
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Yash Saiwal',
      email: 'yashsaiwal@pccoepune.org',
      password: hashedPassword,
      studentId: 'ADM-001',
      role: UserRole.ADMIN,
      phone: '(555) 019-0001',
    },
  });

  console.log(`[Bootstrap] Successfully created initial Administrator account: ${admin.name} (${admin.email}).`);
  return admin;
}
