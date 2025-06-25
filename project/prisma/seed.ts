import { PrismaClient, Role, UserStatus, LogStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Corporate
  const corporate = await prisma.corporate.create({
    data: {
      name: 'TechCorp Holdings',
    },
  });

  // Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: 'TechCorp Solutions',
      corporateId: corporate.id,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'TechCorp Services',
      corporateId: corporate.id,
    },
  });

  // Hash default password
  const hashedPassword = await bcrypt.hash('TempPass123!', 12);

  // Create Corporate Admin
  const corporateAdmin = await prisma.user.create({
    data: {
      email: 'corporate.admin@techcorp.com',
      phoneNumber: '+1234567890',
      firstName: 'Corporate',
      lastName: 'Admin',
      password: hashedPassword,
      role: Role.CORPORATE_ADMIN,
      status: UserStatus.ACTIVE,
      companyId: company1.id, // Corporate admins are associated with a company but can access all
      isFirstLogin: false,
    },
  });

  // Create Company Admins
  const companyAdmin1 = await prisma.user.create({
    data: {
      email: 'admin1@techcorp-solutions.com',
      phoneNumber: '+1234567891',
      firstName: 'John',
      lastName: 'Manager',
      password: hashedPassword,
      role: Role.COMPANY_ADMIN,
      status: UserStatus.ACTIVE,
      companyId: company1.id,
      isFirstLogin: false,
    },
  });

  const companyAdmin2 = await prisma.user.create({
    data: {
      email: 'admin2@techcorp-services.com',
      phoneNumber: '+1234567892',
      firstName: 'Sarah',
      lastName: 'Director',
      password: hashedPassword,
      role: Role.COMPANY_ADMIN,
      status: UserStatus.ACTIVE,
      companyId: company2.id,
      isFirstLogin: false,
    },
  });

  // Create Workers
  const worker1 = await prisma.user.create({
    data: {
      email: 'worker1@techcorp-solutions.com',
      phoneNumber: '+1234567893',
      firstName: 'Alice',
      lastName: 'Developer',
      password: hashedPassword,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      companyId: company1.id,
      isFirstLogin: false,
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      email: 'worker2@techcorp-solutions.com',
      phoneNumber: '+1234567894',
      firstName: 'Bob',
      lastName: 'Designer',
      password: hashedPassword,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      companyId: company1.id,
      isFirstLogin: false,
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      email: 'worker3@techcorp-services.com',
      phoneNumber: '+1234567895',
      firstName: 'Charlie',
      lastName: 'Analyst',
      password: hashedPassword,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      companyId: company2.id,
      isFirstLogin: false,
    },
  });

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'Building a new e-commerce platform',
      companyId: company1.id,
      isActive: true,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Developing mobile applications',
      companyId: company1.id,
      isActive: true,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Data Analytics Dashboard',
      description: 'Building analytics dashboard for clients',
      companyId: company2.id,
      isActive: true,
    },
  });

  // Assign Workers to Projects
  await prisma.workerProject.createMany({
    data: [
      { workerId: worker1.id, projectId: project1.id },
      { workerId: worker1.id, projectId: project2.id },
      { workerId: worker2.id, projectId: project1.id },
      { workerId: worker3.id, projectId: project3.id },
    ],
  });

  // Create Sample Time Logs
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  await prisma.timeLog.createMany({
    data: [
      {
        userId: worker1.id,
        projectId: project1.id,
        startTime: new Date(yesterday.setHours(9, 0, 0, 0)),
        endTime: new Date(yesterday.setHours(17, 0, 0, 0)),
        totalHours: 8,
        description: 'Worked on user authentication module',
        status: LogStatus.APPROVED,
        reviewerId: companyAdmin1.id,
        reviewedAt: now,
      },
      {
        userId: worker2.id,
        projectId: project1.id,
        startTime: new Date(yesterday.setHours(9, 30, 0, 0)),
        endTime: new Date(yesterday.setHours(16, 30, 0, 0)),
        totalHours: 7,
        description: 'Designed user interface mockups',
        status: LogStatus.PENDING,
      },
      {
        userId: worker3.id,
        projectId: project3.id,
        startTime: new Date(yesterday.setHours(8, 0, 0, 0)),
        endTime: new Date(yesterday.setHours(17, 30, 0, 0)),
        totalHours: 9.5,
        description: 'Analyzed client data requirements',
        status: LogStatus.APPROVED,
        reviewerId: companyAdmin2.id,
        reviewedAt: now,
      },
    ],
  });

  console.log('Database seeding completed successfully!');
  console.log('Created:');
  console.log('- 1 Corporate');
  console.log('- 2 Companies');
  console.log('- 6 Users (1 Corporate Admin, 2 Company Admins, 3 Workers)');
  console.log('- 3 Projects');
  console.log('- 4 Worker-Project assignments');
  console.log('- 3 Time logs');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });