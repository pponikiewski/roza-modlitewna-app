// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Rozpoczęcie seedowania ...`);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL lub ADMIN_PASSWORD nie są ustawione w zmiennych środowiskowych.');
    process.exit(1);
  }

  // Sprawdź, czy admin już istnieje
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Użytkownik Admin (${adminEmail}) już istnieje. Pomijanie tworzenia.`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrator Główny',
        password: hashedPassword,
        role: 'ADMIN', // Ustawiamy rolę ADMIN
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