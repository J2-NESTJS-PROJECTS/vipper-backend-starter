import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roleDescriptions: Record<RoleType, string> = {
  [RoleType.SUPER_ADMIN]: 'Super Administrator',
  [RoleType.ADMIN]: 'Administrator',
  [RoleType.USER]: 'Regular user',
  [RoleType.CLIENT]: 'Vipper end customer',
  [RoleType.BUSINESS_OWNER]: 'Business owner',
  [RoleType.DRIVER]: 'Delivery driver',
  [RoleType.API_CLIENT]: 'External API client',
};

const permissions = [
  { action: 'read', resource: 'users', description: 'Read user data' },
  { action: 'manage', resource: 'users', description: 'Manage users' },
  { action: 'read', resource: 'profile', description: 'Read own profile' },
  { action: 'manage', resource: 'profile', description: 'Manage own profile' },
  { action: 'manage', resource: 'addresses', description: 'Manage customer addresses' },
  { action: 'read', resource: 'catalog', description: 'Read public catalog' },
  { action: 'manage', resource: 'verticals', description: 'Manage verticals' },
  { action: 'manage', resource: 'businesses', description: 'Manage businesses' },
  { action: 'manage', resource: 'branches', description: 'Manage branches' },
  { action: 'manage', resource: 'categories', description: 'Manage categories' },
  { action: 'manage', resource: 'products', description: 'Manage products' },
  { action: 'create', resource: 'orders', description: 'Create orders' },
  { action: 'read', resource: 'orders', description: 'Read orders' },
  { action: 'manage', resource: 'orders', description: 'Manage orders' },
  { action: 'manage', resource: 'drivers', description: 'Manage driver profile and availability' },
  { action: 'manage', resource: 'payments', description: 'Manage payments' },
  { action: 'manage', resource: 'notifications', description: 'Manage notification tokens and notifications' },
];

const rolePermissionMap: Record<RoleType, string[]> = {
  [RoleType.SUPER_ADMIN]: ['*'],
  [RoleType.ADMIN]: ['read:users', 'read:catalog', 'read:orders', 'manage:verticals', 'manage:businesses', 'manage:branches', 'manage:categories', 'manage:products', 'manage:orders', 'manage:drivers', 'manage:payments', 'manage:notifications'],
  [RoleType.USER]: ['read:profile', 'manage:profile'],
  [RoleType.CLIENT]: ['read:profile', 'manage:profile', 'manage:addresses', 'read:catalog', 'create:orders', 'read:orders', 'manage:payments', 'manage:notifications'],
  [RoleType.BUSINESS_OWNER]: ['read:profile', 'manage:profile', 'read:catalog', 'manage:businesses', 'manage:branches', 'manage:categories', 'manage:products', 'read:orders', 'manage:orders', 'manage:notifications'],
  [RoleType.DRIVER]: ['read:profile', 'manage:profile', 'read:catalog', 'read:orders', 'manage:orders', 'manage:drivers', 'manage:notifications'],
  [RoleType.API_CLIENT]: ['read:catalog'],
};

async function upsertUser(params: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
}) {
  const hashedPassword = await bcrypt.hash(params.password, 12);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      roleId: params.roleId,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      isActive: true,
    },
    create: {
      email: params.email,
      username: params.username,
      password: hashedPassword,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      roleId: params.roleId,
      isActive: true,
    },
  });
}

async function main() {
  const roles = await Promise.all(
    Object.values(RoleType).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: { description: roleDescriptions[name] },
        create: { name, description: roleDescriptions[name] },
      }),
    ),
  );

  const permissionRecords = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: {
          action_resource: {
            action: permission.action,
            resource: permission.resource,
          },
        },
        update: { description: permission.description },
        create: permission,
      }),
    ),
  );

  for (const role of roles) {
    const grants = rolePermissionMap[role.name];
    const grantedPermissions = grants.includes('*')
      ? permissionRecords
      : permissionRecords.filter((permission) =>
          grants.includes(`${permission.action}:${permission.resource}`),
        );

    for (const permission of grantedPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const roleByName = new Map(roles.map((role) => [role.name, role]));
  const superAdminRole = roleByName.get(RoleType.SUPER_ADMIN)!;
  const clientRole = roleByName.get(RoleType.CLIENT)!;
  const businessOwnerRole = roleByName.get(RoleType.BUSINESS_OWNER)!;
  const driverRole = roleByName.get(RoleType.DRIVER)!;

  await upsertUser({
    email: 'admin@example.com',
    username: 'admin',
    password: 'Admin@123456',
    firstName: 'System',
    lastName: 'Admin',
    roleId: superAdminRole.id,
  });

  const client = await upsertUser({
    email: 'client@example.com',
    username: 'client',
    password: 'Client@123456',
    firstName: 'Cliente',
    lastName: 'Demo',
    phone: '+593999000001',
    roleId: clientRole.id,
  });

  const businessOwner = await upsertUser({
    email: 'owner@example.com',
    username: 'owner',
    password: 'Owner@123456',
    firstName: 'Owner',
    lastName: 'Demo',
    phone: '+593999000002',
    roleId: businessOwnerRole.id,
  });

  const driver = await upsertUser({
    email: 'driver@example.com',
    username: 'driver',
    password: 'Driver@123456',
    firstName: 'Driver',
    lastName: 'Demo',
    phone: '+593999000003',
    roleId: driverRole.id,
  });

  await prisma.customerAddress.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: client.id,
      label: 'Casa',
      recipient: 'Cliente Demo',
      phone: '+593999000001',
      street: 'Av. Amazonas y Naciones Unidas',
      reference: 'Frente al parque La Carolina',
      city: 'Quito',
      province: 'Pichincha',
      latitude: -0.180653,
      longitude: -78.467834,
      isDefault: true,
    },
  });

  const foodVertical = await prisma.vertical.upsert({
    where: { slug: 'restaurantes' },
    update: { isActive: true, sortOrder: 1 },
    create: {
      name: 'Restaurantes',
      slug: 'restaurantes',
      description: 'Comida preparada y restaurantes locales',
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.vertical.upsert({
    where: { slug: 'farmacias' },
    update: { isActive: true, sortOrder: 2 },
    create: {
      name: 'Farmacias',
      slug: 'farmacias',
      description: 'Medicinas y productos de farmacia',
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.vertical.upsert({
    where: { slug: 'market' },
    update: { isActive: true, sortOrder: 3 },
    create: {
      name: 'Market',
      slug: 'market',
      description: 'Productos de supermercado y conveniencia',
      isActive: true,
      sortOrder: 3,
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: 'vipper-burger-demo' },
    update: {
      ownerId: businessOwner.id,
      verticalId: foodVertical.id,
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      ownerId: businessOwner.id,
      verticalId: foodVertical.id,
      name: 'Vipper Burger Demo',
      slug: 'vipper-burger-demo',
      description: 'Hamburguesas demo para validar el MVP de Vipper',
      phone: '+59322220000',
      email: 'demo@vipperburger.ec',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'la-carolina',
      },
    },
    update: { isActive: true, isOpen: true },
    create: {
      businessId: business.id,
      name: 'La Carolina',
      slug: 'la-carolina',
      phone: '+59322220001',
      address: 'Av. República del Salvador y Portugal',
      city: 'Quito',
      province: 'Pichincha',
      latitude: -0.181157,
      longitude: -78.480083,
      opensAt: '09:00',
      closesAt: '22:00',
      isOpen: true,
      isActive: true,
    },
  });

  const burgersCategory = await prisma.category.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'hamburguesas',
      },
    },
    update: { isActive: true, sortOrder: 1 },
    create: {
      businessId: business.id,
      name: 'Hamburguesas',
      slug: 'hamburguesas',
      description: 'Hamburguesas artesanales',
      isActive: true,
      sortOrder: 1,
    },
  });

  const drinksCategory = await prisma.category.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'bebidas',
      },
    },
    update: { isActive: true, sortOrder: 2 },
    create: {
      businessId: business.id,
      name: 'Bebidas',
      slug: 'bebidas',
      description: 'Bebidas frias',
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'classic-burger',
      },
    },
    update: { isActive: true, isAvailable: true },
    create: {
      businessId: business.id,
      branchId: branch.id,
      categoryId: burgersCategory.id,
      name: 'Classic Burger',
      slug: 'classic-burger',
      description: 'Carne, queso cheddar, vegetales y salsa de la casa',
      price: 6.5,
      isAvailable: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'limonada',
      },
    },
    update: { isActive: true, isAvailable: true },
    create: {
      businessId: business.id,
      branchId: branch.id,
      categoryId: drinksCategory.id,
      name: 'Limonada',
      slug: 'limonada',
      description: 'Limonada natural',
      price: 2.25,
      isAvailable: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {
      defaultBranchId: branch.id,
      status: 'AVAILABLE',
      isAvailable: true,
      vehicleType: 'MOTORCYCLE',
      vehiclePlate: 'ABC-1234',
    },
    create: {
      userId: driver.id,
      defaultBranchId: branch.id,
      status: 'AVAILABLE',
      isAvailable: true,
      vehicleType: 'MOTORCYCLE',
      vehiclePlate: 'ABC-1234',
      licenseNumber: 'DEMO-DRIVER-001',
    },
  });

  console.log('Seed completed successfully');
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.log(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
