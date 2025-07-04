// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRole } from '../src/types/user.types'; // Zaimportuj swój enum

const prisma = new PrismaClient();

async function main() {
  console.log(`Rozpoczęcie seedowania ...`);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@roza.app'; // Użyj emaila z .env
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword'; // Użyj hasła z .env

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL lub ADMIN_PASSWORD nie są ustawione w zmiennych środowiskowych.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== UserRole.ADMIN) {
      console.log(`Użytkownik Admin (${adminEmail}) istnieje, ale ma nieprawidłową rolę (${existingAdmin.role}). Aktualizowanie roli na ADMIN...`);
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: UserRole.ADMIN },
      });
      console.log(`Rola użytkownika Admin (${adminEmail}) została zaktualizowana na ADMIN.`);
    } else {
      console.log(`Użytkownik Admin (${adminEmail}) już istnieje z poprawną rolą. Pomijanie.`);
    }
  } else {
    console.log(`Tworzenie nowego użytkownika Admin: ${adminEmail}...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrator Główny',
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });
    console.log(`Utworzono użytkownika Admin: ${adminEmail}`);
  }

  console.log(`Seedowanie zakończone.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });