import { AppointmentStatus, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin
  const adminPassword = await bcrypt.hash('AdminPass123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lawsuit.local' },
    update: {
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      phone: '+911000000001',
    },
    create: {
      name: 'Admin',
      email: 'admin@lawsuit.local',
      phone: '+911000000001',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Client
  const clientPassword = await bcrypt.hash('ClientPass123!', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@lawsuit.local' },
    update: {
      name: 'Jane Client',
      passwordHash: clientPassword,
      role: 'CLIENT',
      isVerified: true,
      phone: '+911000000002',
    },
    create: {
      name: 'Jane Client',
      email: 'client@lawsuit.local',
      phone: '+911000000002',
      passwordHash: clientPassword,
      role: 'CLIENT',
      isVerified: true,
    },
  });

  // create client profile
  await prisma.client.upsert({
    where: { userId: client.id },
    update: {},
    create: { userId: client.id },
  });

  // Lawyer 1
  const lawyer1Password = await bcrypt.hash('LawyerOne123!', 10);
  const lawyerUser1 = await prisma.user.upsert({
    where: { email: 'lawyer1@lawsuit.local' },
    update: {
      name: 'Alice Advocate',
      passwordHash: lawyer1Password,
      role: 'LAWYER',
      isVerified: true,
      phone: '+911000000003',
    },
    create: {
      name: 'Alice Advocate',
      email: 'lawyer1@lawsuit.local',
      phone: '+911000000003',
      passwordHash: lawyer1Password,
      role: 'LAWYER',
      isVerified: true,
    },
  });

  const lawyer1 = await prisma.lawyer.upsert({
    where: { userId: lawyerUser1.id },
    update: {
      licenseNumber: 'LIC-ALICE-001',
      barCouncilId: 'BC-ALICE-001',
      barCouncil: 'SB-001',
      specializations: ['Family'],
      experienceYears: 8,
      languages: ['English', 'Hindi'],
      feePerConsultation: 15000,
      bio: 'Experienced family law attorney.',
      isVerified: true,
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    create: {
      userId: lawyerUser1.id,
      licenseNumber: 'LIC-ALICE-001',
      barCouncilId: 'BC-ALICE-001',
      barCouncil: 'SB-001',
      specializations: ['Family'],
      experienceYears: 8,
      languages: ['English', 'Hindi'],
      feePerConsultation: 15000,
      bio: 'Experienced family law attorney.',
      isVerified: true,
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  });

  // Lawyer 2
  const lawyer2Password = await bcrypt.hash('LawyerTwo123!', 10);
  const lawyerUser2 = await prisma.user.upsert({
    where: { email: 'lawyer2@lawsuit.local' },
    update: {
      name: 'Bob Barrister',
      passwordHash: lawyer2Password,
      role: 'LAWYER',
      isVerified: false,
      phone: '+911000000004',
    },
    create: {
      name: 'Bob Barrister',
      email: 'lawyer2@lawsuit.local',
      phone: '+911000000004',
      passwordHash: lawyer2Password,
      role: 'LAWYER',
      isVerified: false,
    },
  });

  const lawyer2 = await prisma.lawyer.upsert({
    where: { userId: lawyerUser2.id },
    update: {
      licenseNumber: 'LIC-BOB-002',
      barCouncilId: 'BC-BOB-002',
      barCouncil: 'SB-002',
      specializations: ['Criminal'],
      experienceYears: 5,
      languages: ['English'],
      feePerConsultation: 20000,
      bio: 'Criminal defense specialist.',
      isVerified: false,
      city: 'Delhi',
      state: 'Delhi',
    },
    create: {
      userId: lawyerUser2.id,
      licenseNumber: 'LIC-BOB-002',
      barCouncilId: 'BC-BOB-002',
      barCouncil: 'SB-002',
      specializations: ['Criminal'],
      experienceYears: 5,
      languages: ['English'],
      feePerConsultation: 20000,
      bio: 'Criminal defense specialist.',
      isVerified: false,
      city: 'Delhi',
      state: 'Delhi',
    },
  });

  // Sample Case assigned to lawyer1 and client
  const sampleCase = await prisma.case.create({
    data: {
      title: 'Family dispute - custody',
      description: 'Custody dispute requiring mediation and court hearings.',
      category: 'Family',
      clientId: client.id, // user id
      lawyerId: lawyerUser1.id, // lawyer's user id
    },
  });

  // Sample Appointment
  const appointment = await prisma.appointment.create({
    data: {
      lawyerId: lawyerUser1.id,
      clientId: client.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // one week from now
      status: AppointmentStatus.CONFIRMED,
    },
  });

  console.log('Seed complete:');
  console.log('Admin user id:', admin.id);
  console.log('Client user id:', client.id);
  console.log('Client profile userId:', client.id);
  console.log('Lawyer1 user id:', lawyerUser1.id, 'lawyer profile id:', lawyer1.id);
  console.log('Lawyer2 user id:', lawyerUser2.id, 'lawyer profile id:', lawyer2.id);
  console.log('Sample case id:', sampleCase.id);
  console.log('Sample appointment id:', appointment.id);
}

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
