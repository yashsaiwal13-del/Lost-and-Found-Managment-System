import { PrismaClient, ItemType, ItemStatus, UserRole, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusFind database seed...');

  // 1. Create or upsert Users
  const studentMaya = await prisma.user.upsert({
    where: { email: 'maya.lin@campus.edu' },
    update: {},
    create: {
      name: 'Maya Lin',
      email: 'maya.lin@campus.edu',
      studentId: 'STU-88291',
      role: UserRole.STUDENT,
      phone: '(555) 019-2834',
    },
  });

  const officerVance = await prisma.user.upsert({
    where: { email: 'vance.security@campus.edu' },
    update: {},
    create: {
      name: 'Officer Vance',
      email: 'vance.security@campus.edu',
      studentId: 'SEC-402',
      role: UserRole.SECURITY,
      phone: '(555) 019-9000',
    },
  });

  const studentAlex = await prisma.user.upsert({
    where: { email: 'alex.rivera@campus.edu' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex.rivera@campus.edu',
      studentId: 'STU-99412',
      role: UserRole.STUDENT,
      phone: '(555) 019-7711',
    },
  });

  console.log('✓ Seeded Users: Maya Lin, Officer Vance, Alex Rivera');

  // 2. Create sample FOUND Items
  const airPodsFound = await prisma.item.create({
    data: {
      name: 'Apple AirPods Pro (2nd Gen)',
      description: 'White MagSafe charging case with lanyard loop. Left earbud has tiny surface scratch near mic stem.',
      category: 'Electronics',
      type: ItemType.FOUND,
      location: 'Main Library - 2nd Floor Quiet Study',
      date: new Date('2026-03-04T14:30:00Z'),
      time: '14:30',
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.PENDING_CLAIM,
      storageLocation: 'Main Campus Security Desk - Locker #B-14',
      reportedById: officerVance.id,
    },
  });

  const hydroFlaskFound = await prisma.item.create({
    data: {
      name: 'Hydro Flask 32oz Wide Mouth Bottle',
      description: 'Cobalt blue finish with black flex cap. Noticeable dent on the bottom rim from a drop.',
      category: 'Drinkware',
      type: ItemType.FOUND,
      location: 'Student Union - Food Court North',
      date: new Date('2026-03-03T16:15:00Z'),
      time: '16:15',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.OPEN,
      storageLocation: 'Student Union Info Desk - Bin #3',
      reportedById: studentAlex.id,
    },
  });

  const backpackFound = await prisma.item.create({
    data: {
      name: 'North Face Borealis Backpack',
      description: 'Charcoal gray with reflective bungee cords and university engineering department patch.',
      category: 'Bags & Luggage',
      type: ItemType.FOUND,
      location: 'Engineering Hall - Room 302',
      date: new Date('2026-03-02T11:00:00Z'),
      time: '11:00',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.OPEN,
      storageLocation: 'Campus Security Safe Room - Shelf #2',
      reportedById: officerVance.id,
    },
  });

  // 3. Create sample LOST Item
  const airPodsLost = await prisma.item.create({
    data: {
      name: 'AirPods Pro Case + Buds',
      description: 'White AirPods Pro in silicone sleeve left behind on desk in library quiet zone.',
      category: 'Electronics',
      type: ItemType.LOST,
      location: 'Main Library - 2nd Floor',
      date: new Date('2026-03-04T13:45:00Z'),
      time: '13:45',
      status: ItemStatus.PENDING_CLAIM,
      additionalDetails: 'Serial number ends with 88K; small scratch on left pod stem.',
      reportedById: studentMaya.id,
    },
  });

  console.log('✓ Seeded Items: AirPods, Hydro Flask, Backpack');

  // 4. Create sample Claim
  await prisma.claim.create({
    data: {
      itemId: airPodsFound.id,
      claimantId: studentMaya.id,
      color: 'White case with matte finish',
      uniqueMark: 'Small horizontal scratch on left earbud stem near bottom microphone grill',
      lastSeenLocation: 'Library 2nd floor cubicle #14 next to corner window',
      status: ClaimStatus.PENDING,
    },
  });

  console.log('✓ Seeded Claim: Maya Lin claiming AirPods Pro');

  // 5. Create sample Match
  await prisma.match.create({
    data: {
      lostItemId: airPodsLost.id,
      foundItemId: airPodsFound.id,
      similarityScore: 0.94,
    },
  });

  console.log('✓ Seeded Match: 94% similarity match between lost and found AirPods');

  // 6. Create sample Notification
  await prisma.notification.create({
    data: {
      userId: studentMaya.id,
      title: 'Potential Match Found! (94%)',
      message: 'A found Apple AirPods Pro matching your lost report was logged at Main Library - 2nd Floor.',
      type: 'MATCH_FOUND',
      link: `/items/${airPodsFound.id}`,
    },
  });

  console.log('✓ Seeded Notification for Maya Lin');
  console.log('🎉 CampusFind database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
