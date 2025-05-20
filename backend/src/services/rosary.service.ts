// backend/src/services/rosary.service.ts
import prisma from '../db';
import { ROSARY_MYSTERIES, RosaryMystery } from '../utils/constants';

export async function assignAndRotateMysteriesForRose(roseId: string): Promise<void> {
  console.log(`[assignAndRotateMysteriesForRose] Rozpoczynanie rotacji dla Róży ${roseId}`);

  const rose = await prisma.rose.findUnique({
    where: { id: roseId },
    select: { currentRotationOffset: true }
  });

  if (!rose) {
    console.error(`[assignAndRotateMysteriesForRose] Nie znaleziono Róży o ID ${roseId}.`);
    return;
  }

  const memberships = await prisma.roseMembership.findMany({
    where: { roseId: roseId },
    orderBy: { mysteryOrderIndex: 'asc' },
    select: { id: true, userId: true, currentAssignedMystery: true, mysteryOrderIndex: true }
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Oblicz nowy offset rotacji dla tej Róży
  const newRotationOffset = (rose.currentRotationOffset + 1) % ROSARY_MYSTERIES.length;

  // Lista operacji do wykonania w transakcji
  const prismaOperations: any[] = []; // Użyjemy 'any' dla uproszczenia, Prisma.$transaction to obsłuży

  // 2. Zawsze dodajemy operację aktualizacji offsetu Róży
  prismaOperations.push(
    prisma.rose.update({
      where: { id: roseId },
      data: { currentRotationOffset: newRotationOffset }
    })
  );

  // 3. Przydziel tajemnice członkom, jeśli jacyś są
  if (memberships.length > 0) {
    for (const membership of memberships) {
      if (membership.mysteryOrderIndex === null || membership.mysteryOrderIndex === undefined || membership.mysteryOrderIndex < 0 || membership.mysteryOrderIndex >= ROSARY_MYSTERIES.length) {
        console.warn(`[assignAndRotateMysteriesForRose] Członkostwo ${membership.id} w Róży ${roseId} ma nieprawidłowy mysteryOrderIndex (${membership.mysteryOrderIndex}). Pomijanie tego członka.`);
        continue; 
      }

      const mysteryArrayIndex = (membership.mysteryOrderIndex + newRotationOffset) % ROSARY_MYSTERIES.length;
      
      if (mysteryArrayIndex < 0 || mysteryArrayIndex >= ROSARY_MYSTERIES.length) {
          console.error(`[assignAndRotateMysteriesForRose] BŁĄD KRYTYCZNY: Obliczony indeks tajemnicy (${mysteryArrayIndex}) jest poza zakresem dla Róży ${roseId}, członkostwo ${membership.id}.`);
          continue;
      }
      const newMysteryId = ROSARY_MYSTERIES[mysteryArrayIndex].id;

      if (newMysteryId !== membership.currentAssignedMystery || membership.currentAssignedMystery === null) {
        prismaOperations.push(
          prisma.roseMembership.update({
            where: { id: membership.id },
            data: {
              currentAssignedMystery: newMysteryId,
              mysteryConfirmedAt: null,
            },
          })
        );
      }

      prismaOperations.push(
        prisma.assignedMysteryHistory.create({
          data: {
            membershipId: membership.id,
            mystery: newMysteryId,
            assignedMonth: currentMonth,
            assignedYear: currentYear,
            assignedAt: now,
          },
        })
      );
    } // Koniec pętli po członkach
  } // Koniec if (memberships.length > 0)

  // Wykonaj transakcję, jeśli są jakiekolwiek operacje (zawsze będzie co najmniej aktualizacja offsetu Róży)
  if (prismaOperations.length > 0) {
    try {
      await prisma.$transaction(prismaOperations);
      if (memberships.length > 0) {
          console.log(`[assignAndRotateMysteriesForRose] Pomyślnie zaktualizowano offset (${newRotationOffset}), tajemnice i historię dla członków Róży ${roseId}.`);
      } else {
          console.log(`[assignAndRotateMysteriesForRose] Zaktualizowano offset rotacji dla Róży ${roseId} do ${newRotationOffset}. Brak członków do aktualizacji tajemnic.`);
      }
    } catch (e) {
      console.error(`[assignAndRotateMysteriesForRose] Błąd transakcji dla Róży ${roseId}:`, e);
    }
  } else {
    // Ten przypadek nie powinien wystąpić, bo zawsze aktualizujemy offset Róży
    console.log(`[assignAndRotateMysteriesForRose] Brak operacji do wykonania dla Róży ${roseId}.`);
  }
}

// Funkcja assignMysteriesToAllRoses pozostaje bez zmian
export async function assignMysteriesToAllRoses(): Promise<void> {
  console.log('Rozpoczęcie procesu przydzielania nowych tajemnic dla wszystkich Róż...');
  const roses = await prisma.rose.findMany({
    select: { id: true }
  });

  for (const rose of roses) {
    try {
      await assignAndRotateMysteriesForRose(rose.id);
    } catch (error) {
      console.error(`Błąd podczas przetwarzania Róży ${rose.id} w assignMysteriesToAllRoses:`, error);
    }
  }
  console.log(`Proces przydzielania tajemnic dla Róż zakończony.`);
}