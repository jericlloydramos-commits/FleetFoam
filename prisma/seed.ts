// CS 490 Senior Capstone - Week 7 Backend & Database Lead Audit
// Section 2.3: Idempotent Test Data Seeding
// Author: Michael Sapinoso (Backend & Database Lead)

import { PrismaClient, UserRole, BookingStatus, TicketStatus, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent database seed for FleetFoam...');

  // 1. Seed Core Services Catalog (Lookup Table) via Upsert
  const services = [
    {
      id: 'srv-001',
      name: 'Standard Express Detail',
      slug: 'standard-express-detail',
      description: 'Exterior foam wash, tire dressing, interior vacuum, and dashboard wipe down.',
      price: 1500.00,
      durationMinutes: 60,
      isAvailable: true,
    },
    {
      id: 'srv-002',
      name: 'Executive Interior Deep Clean',
      slug: 'executive-interior-deep-clean',
      description: 'Comprehensive steam disinfection, leather conditioning, shampoo carpets, and ozone odor removal.',
      price: 3200.00,
      durationMinutes: 120,
      isAvailable: true,
    },
    {
      id: 'srv-003',
      name: 'Ceramic Paint Protection Coating',
      slug: 'ceramic-paint-protection-coating',
      description: 'Multi-stage paint correction, 9H nano-ceramic coating, hydrophobic windshield treatment.',
      price: 8500.00,
      durationMinutes: 240,
      isAvailable: true,
    },
    {
      id: 'srv-004',
      name: 'Engine Bay & Undercarriage Detail',
      slug: 'engine-bay-undercarriage-detail',
      description: 'Degreasing engine bay, high-pressure undercarriage wash, rust inhibitor coating.',
      price: 2800.00,
      durationMinutes: 90,
      isAvailable: true,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
        isAvailable: s.isAvailable,
      },
      create: {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
        isAvailable: s.isAvailable,
      },
    });
  }
  console.log(`✅ Seeded ${services.length} services via upsert.`);

  // 2. Seed Demo Agency Accounts (RBAC) via Upsert
  const users = [
    {
      id: 'usr-admin-01',
      email: 'admin@fleetfoam.com',
      fullName: 'FleetFoam Admin',
      role: UserRole.ADMIN,
    },
    {
      id: 'usr-ops-01',
      email: 'ops@fleetfoam.com',
      fullName: 'Operations Coordinator',
      role: UserRole.OPERATIONS,
    },
    {
      id: 'usr-crew-01',
      email: 'crew.juan@fleetfoam.com',
      fullName: 'Juan Dela Cruz (Crew Lead)',
      role: UserRole.CREW,
    },
    {
      id: 'usr-cust-01',
      email: 'client.earl@gmail.com',
      fullName: 'Earlstephen Señoran',
      role: UserRole.CUSTOMER,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
      },
      create: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
      },
    });
  }
  console.log(`✅ Seeded ${users.length} RBAC users via upsert.`);

  // 3. Seed Crew Profile via Upsert
  await prisma.crewProfile.upsert({
    where: { userId: 'usr-crew-01' },
    update: {
      phone: '+63 917 555 0101',
      vehicleType: 'Mobile Van A (Isuzu D-Max)',
    },
    create: {
      id: 'crew-prof-01',
      userId: 'usr-crew-01',
      phone: '+63 917 555 0101',
      vehicleType: 'Mobile Van A (Isuzu D-Max)',
      currentLatitude: 14.5547,
      currentLongitude: 121.0244,
    },
  });

  // 4. Seed Customer Profile via Upsert
  await prisma.customerProfile.upsert({
    where: { userId: 'usr-cust-01' },
    update: {
      phone: '+63 918 888 2026',
      defaultAddress: 'Bonifacio Global City, Taguig, Metro Manila',
    },
    create: {
      id: 'cust-prof-01',
      userId: 'usr-cust-01',
      phone: '+63 918 888 2026',
      defaultAddress: 'Bonifacio Global City, Taguig, Metro Manila',
    },
  });

  // 5. Seed Support Tickets (CS-01 Module) via Upsert
  const tickets = [
    {
      id: 'tkt-001',
      ticketNumber: 'TKT-2026-001',
      customerPhone: '+63 918 888 2026',
      customerName: 'Earlstephen Señoran',
      issueType: 'Reschedule Request',
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      notes: 'Customer requested 30-minute delay due to basement gate pass verification.',
    },
    {
      id: 'tkt-002',
      ticketNumber: 'TKT-2026-002',
      customerPhone: '+63 920 123 4567',
      customerName: 'Maria Santos',
      issueType: 'Service Inquiry',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.RESOLVED,
      notes: 'Inquired about Ceramic Coating package warranties. Brochure emailed.',
    },
  ];

  for (const t of tickets) {
    await prisma.supportTicket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        customerPhone: t.customerPhone,
        customerName: t.customerName,
        issueType: t.issueType,
        priority: t.priority,
        status: t.status,
        notes: t.notes,
      },
      create: {
        id: t.id,
        ticketNumber: t.ticketNumber,
        customerPhone: t.customerPhone,
        customerName: t.customerName,
        issueType: t.issueType,
        priority: t.priority,
        status: t.status,
        notes: t.notes,
      },
    });
  }
  console.log(`✅ Seeded ${tickets.length} CS-01 support tickets via upsert.`);

  console.log('🚀 Idempotent database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
