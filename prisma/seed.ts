import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleType.SUPER_ADMIN },
      update: {},
      create: { name: RoleType.SUPER_ADMIN, description: 'Super Administrator' },
    }),
    prisma.role.upsert({
      where: { name: RoleType.ADMIN },
      update: {},
      create: { name: RoleType.ADMIN, description: 'Administrator' },
    }),
    prisma.role.upsert({
      where: { name: RoleType.USER },
      update: {},
      create: { name: RoleType.USER, description: 'Regular user' },
    }),
    prisma.role.upsert({
      where: { name: RoleType.API_CLIENT },
      update: {},
      create: { name: RoleType.API_CLIENT, description: 'External API client' },
    }),
  ]);

  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { action_resource: { action: 'read', resource: 'customers' } },
      update: {},
      create: { action: 'read', resource: 'customers', description: 'Read customer data' },
    }),
    prisma.permission.upsert({
      where: { action_resource: { action: 'read', resource: 'cards' } },
      update: {},
      create: { action: 'read', resource: 'cards', description: 'Read card data' },
    }),
    prisma.permission.upsert({
      where: { action_resource: { action: 'read', resource: 'transactions' } },
      update: {},
      create: { action: 'read', resource: 'transactions', description: 'Read transactions' },
    }),
    prisma.permission.upsert({
      where: { action_resource: { action: 'read', resource: 'statements' } },
      update: {},
      create: { action: 'read', resource: 'statements', description: 'Read statements' },
    }),
    prisma.permission.upsert({
      where: { action_resource: { action: 'manage', resource: 'users' } },
      update: {},
      create: { action: 'manage', resource: 'users', description: 'Manage users' },
    }),
  ]);

  const superAdminRole = roles.find((r) => r.name === RoleType.SUPER_ADMIN);

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const adminRole = roles.find((r) => r.name === RoleType.ADMIN);
  const readPermissions = permissions.filter((p) => p.action === 'read');
  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log('Seed completed successfully');
}

//main()
//  .catch((e) => {
//    console.error(e);
//    process.exit(1);
//  })
//  .finally(async () => {
//    await prisma.$disconnect();
//  });

(async () => {
  try {
    await main()
  } catch (error) {
    console.log(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
