/**
 * CampusFind - Database Seed Script
 * 
 * DEV-ONLY SEED DATA: This script provides comprehensive sample data for local
 * development and testing. It is strictly NOT intended to be run automatically in production.
 */

import { PrismaClient } from '@prisma/client';
import { ItemType, ItemStatus, UserRole, ClaimStatus, MatchStatus } from '../src/lib/enums';
import bcrypt from 'bcryptjs';

// Safety Guard: Prevent accidental execution in production
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
  console.error('🚫 Seeding is strictly disabled in production environments.');
  console.error('Set ALLOW_PROD_SEED=true if you explicitly intend to seed production.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusFind dev-only database seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create or upsert Seed Users
  const studentMaya = await prisma.user.upsert({
    where: { email: 'maya.lin@campus.edu' },
    update: { password: hashedPassword },
    create: {
      name: 'Maya Lin',
      email: 'maya.lin@campus.edu',
      password: hashedPassword,
      studentId: 'STU-88291',
      role: UserRole.STUDENT,
      phone: '(555) 019-2834',
    },
  });

  const officerVance = await prisma.user.upsert({
    where: { email: 'vance.security@campus.edu' },
    update: { password: hashedPassword },
    create: {
      name: 'Officer Vance',
      email: 'vance.security@campus.edu',
      password: hashedPassword,
      studentId: 'SEC-402',
      role: UserRole.SECURITY,
      phone: '(555) 019-9000',
    },
  });

  const studentAlex = await prisma.user.upsert({
    where: { email: 'alex.rivera@campus.edu' },
    update: { password: hashedPassword },
    create: {
      name: 'Alex Rivera',
      email: 'alex.rivera@campus.edu',
      password: hashedPassword,
      studentId: 'STU-99412',
      role: UserRole.STUDENT,
      phone: '(555) 019-7711',
    },
  });

  const studentJordan = await prisma.user.upsert({
    where: { email: 'jordan.d@campus.edu' },
    update: { password: hashedPassword },
    create: {
      name: 'Jordan Davis',
      email: 'jordan.d@campus.edu',
      password: hashedPassword,
      studentId: 'STU-44120',
      role: UserRole.STUDENT,
      phone: '(555) 019-3322',
    },
  });

  console.log('✓ Seeded Demo Users: Maya Lin (Student), Officer Vance (Security), Alex Rivera (Student), Jordan Davis (Student)');
  console.log('ℹ Note: Administrator account is initialized via src/lib/bootstrap.ts (ADMIN_BOOTSTRAP_PASSWORD)');

  // 2. Create sample FOUND Items
  const airPodsFound = await prisma.item.create({
    data: {
      name: 'Apple AirPods Pro (2nd Gen)',
      description: 'Found inside a white charging case with a small blue silicone astronaut keychain.',
      category: 'Electronics',
      type: ItemType.FOUND,
      location: 'Central Library (Floors 1-4)',
      date: new Date('2026-09-07T10:15:00Z'),
      time: '10:15',
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.PENDING_CLAIM,
      storageLocation: 'Main Security Desk - Locker #04',
      reportedById: officerVance.id,
    },
  });

  const studentIdFound = await prisma.item.create({
    data: {
      name: 'Student ID Card - Alex Morgan',
      description: 'Sophomore CS student ID card with RFID badge and orange college lanyard.',
      category: 'IDs & Cards',
      type: ItemType.FOUND,
      location: 'Student Union & Cafeteria',
      date: new Date('2026-09-07T08:40:00Z'),
      time: '08:40',
      status: ItemStatus.OPEN,
      storageLocation: 'Student Union Info Desk',
      reportedById: officerVance.id,
    },
  });

  const calculatorFound = await prisma.item.create({
    data: {
      name: 'Texas Instruments TI-84 Plus CE',
      description: 'Black graphic calculator with initials "J.D." etched on the back casing.',
      category: 'Electronics',
      type: ItemType.FOUND,
      location: 'Engineering Lecture Hall A',
      date: new Date('2026-09-06T15:30:00Z'),
      time: '15:30',
      status: ItemStatus.OPEN,
      storageLocation: 'Engineering Department Front Office',
      reportedById: studentJordan.id,
    },
  });

  const hydroFlaskFound = await prisma.item.create({
    data: {
      name: 'Hydro Flask 32oz (Pacific Blue)',
      description: 'Wide-mouth vacuum insulated bottle covered with computer science and hackathon stickers.',
      category: 'Bottles & Containers',
      type: ItemType.FOUND,
      location: 'Campus Sports & Recreation Gym',
      date: new Date('2026-09-06T18:10:00Z'),
      time: '18:10',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.OPEN,
      storageLocation: 'Gym Front Reception',
      reportedById: studentAlex.id,
    },
  });

  const keysFound = await prisma.item.create({
    data: {
      name: 'Car & Dorm Key Ring (Subaru Key + Brass FOB)',
      description: 'Black key ring holding one electronic car key, brass room key #312, and a red bottle opener.',
      category: 'Keys & Access',
      type: ItemType.FOUND,
      location: 'North Dormitory Common Area',
      date: new Date('2026-09-05T12:00:00Z'),
      status: ItemStatus.OPEN,
      storageLocation: 'Main Security Desk - Safe #2',
      reportedById: studentMaya.id,
    },
  });

  const backpackFound = await prisma.item.create({
    data: {
      name: 'North Face Surge Backpack (Grey)',
      description: 'Contains a spiral notebook titled "Organic Chemistry II" and a grey pencil case.',
      category: 'Bags & Wallets',
      type: ItemType.FOUND,
      location: 'Science & Tech Complex',
      date: new Date('2026-09-05T14:20:00Z'),
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      status: ItemStatus.OPEN,
      storageLocation: 'Main Security Desk - Locker #11',
      reportedById: studentAlex.id,
    },
  });

  const headphonesFound = await prisma.item.create({
    data: {
      name: 'Sony WH-1000XM4 Headphones (Black)',
      description: 'Premium wireless headphones in original black zippered case with audio cable.',
      category: 'Electronics',
      type: ItemType.FOUND,
      location: 'Central Library (Floors 1-4)',
      date: new Date('2026-09-03T16:00:00Z'),
      status: ItemStatus.OPEN,
      storageLocation: 'Library Front Circulation Counter',
      reportedById: officerVance.id,
    },
  });

  const walletFound = await prisma.item.create({
    data: {
      name: 'Leather Bifold Wallet (Dark Brown)',
      description: 'Contains state driver license and college meal plan card. Name starts with "M.K."',
      category: 'Bags & Wallets',
      type: ItemType.FOUND,
      location: 'Administration Block',
      date: new Date('2026-09-02T11:15:00Z'),
      status: ItemStatus.OPEN,
      storageLocation: 'Main Security Desk - Safe #1',
      reportedById: officerVance.id,
    },
  });

  // 3. Create sample LOST Items
  const airPodsLost = await prisma.item.create({
    data: {
      name: 'Apple AirPods Pro (2nd Gen)',
      description: 'Lost near 2nd floor silent study cubicles. White case with blue astronaut sticker.',
      category: 'Electronics',
      type: ItemType.LOST,
      location: 'Central Library (Floors 1-4)',
      date: new Date('2026-09-07T09:30:00Z'),
      time: '09:30',
      status: ItemStatus.PENDING_CLAIM,
      additionalDetails: 'Serial number ends with 88K; small scratch on left pod stem.',
      reportedById: studentMaya.id,
    },
  });

  const backpackLost = await prisma.item.create({
    data: {
      name: 'North Face Surge Backpack (Grey)',
      description: 'Left in Chemistry Lab 102. Contains lecture notebooks and graph paper.',
      category: 'Bags & Wallets',
      type: ItemType.LOST,
      location: 'Science & Tech Complex',
      date: new Date('2026-09-05T13:00:00Z'),
      status: ItemStatus.OPEN,
      additionalDetails: 'Name tag on inside compartment says Maya Lin.',
      reportedById: studentMaya.id,
    },
  });

  console.log('✓ Seeded Items: AirPods, Student ID, Calculator, Hydro Flask, Keys, Backpack, Headphones, Wallet');

  // 4. Create sample Claim
  await prisma.claim.create({
    data: {
      itemId: airPodsFound.id,
      claimantId: studentMaya.id,
      color: 'White case with slight scratch on bottom hinge',
      uniqueMark: 'Blue silicone astronaut keychain attached to charging loop, named "Maya" in Bluetooth settings',
      lastSeenLocation: 'Central Library 2nd Floor silent study cubicle #14',
      status: ClaimStatus.PENDING,
    },
  });

  console.log('✓ Seeded Claim: Maya Lin claiming AirPods Pro');

  // 5. Create sample Match
  await prisma.match.create({
    data: {
      lostItemId: airPodsLost.id,
      foundItemId: airPodsFound.id,
      similarityScore: 0.96,
      status: MatchStatus.SUGGESTED,
    },
  });

  console.log('✓ Seeded Match: 96% similarity match between lost and found AirPods');

  // 6. Create sample Notification
  await prisma.notification.create({
    data: {
      userId: studentMaya.id,
      title: 'Potential Match Found! (96%)',
      message: 'A found Apple AirPods Pro matching your lost report was logged at Central Library (Floors 1-4).',
      type: 'MATCH_FOUND',
      link: `/items/${airPodsFound.id}`,
    },
  });

  // 7. Create sample Verification Request
  await prisma.verificationRequest.create({
    data: {
      itemId: airPodsFound.id,
      recipientId: studentMaya.id,
      createdById: officerVance.id,
      status: 'ANSWERED',
      adminNotes: 'Student answers received. Please verify Bluetooth name during in-person pickup.',
      questions: {
        create: [
          {
            questionText: 'What Bluetooth device name appears when the charging lid is opened?',
            answerText: 'The Bluetooth name is "Maya\'s AirPods Pro".',
            answeredAt: new Date(),
            order: 0,
          },
          {
            questionText: 'Can you confirm the serial number or scratch marks on the left stem?',
            answerText: 'Left stem has a micro-scratch right below the speaker grill.',
            answeredAt: new Date(),
            order: 1,
          },
          {
            questionText: 'Which desk number in the Central Library did you sit at?',
            answerText: 'Silent study desk #14 on Floor 2.',
            answeredAt: new Date(),
            order: 2,
          },
        ],
      },
    },
  });

  // 8. Create sample Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: officerVance.id,
      action: 'VERIFICATION_SENT',
      targetType: 'ITEM',
      targetId: airPodsFound.id,
      metadata: JSON.stringify({
        recipientName: 'Maya Lin',
        details: 'Dispatched 3 ownership verification questions to Maya Lin for item #1',
      }),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: officerVance.id,
      action: 'STATUS_CHANGED',
      targetType: 'ITEM',
      targetId: airPodsFound.id,
      metadata: JSON.stringify({
        newStatus: 'PENDING_CLAIM',
        storageLocation: 'Custody Locker #04',
      }),
    },
  });

  // 9. Bootstrap Administrator Account (Yash Saiwal)
  const { bootstrapAdminUser } = await import('../src/lib/bootstrap');
  await bootstrapAdminUser();

  console.log('✓ Seeded Verification Inquiry & Audit Logs for Admin Console');
  console.log('🎉 CampusFind dev seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
