// backend/src/services/rosary.service.ts
import prisma from '../db';
import { ROSARY_MYSTERIES, RosaryMystery } from '../utils/constants';

export async function assignAndRotateMysteriesForRose(roseId: string): Promise<void> {
  console.log(`[assignAndRotateMysteriesForRose] Rozpoczynanie rotacji dla Róży ${roseId}`);

  const [rose, memberships] = await Promise.all([
    prisma.rose.findUnique({
      where: { id: roseId },
      select: { currentRotationOffset: true }
    }),
    prisma.roseMembership.findMany({
      where: { roseId: roseId },
      orderBy: { mysteryOrderIndex: 'asc' },
      select: { id: true, userId: true, currentAssignedMystery: true, mysteryOrderIndex: true }
    })
  ]);

  if (!rose) {
    console.error(`[assignAndRotateMysteriesForRose] Nie znaleziono Róży o ID ${roseId}.`);
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const newRotationOffset = (rose.currentRotationOffset + 1) % ROSARY_MYSTERIES.length;

  // Przygotuj operacje w transakcji
  const operations: any[] = [
    prisma.rose.update({
      where: { id: roseId },
      data: { currentRotationOffset: newRotationOffset }
    })
  ];

  // Dodaj operacje dla członków
  for (const membership of memberships) {
    const { mysteryOrderIndex } = membership;
    
    if (mysteryOrderIndex == null || mysteryOrderIndex < 0 || mysteryOrderIndex >= ROSARY_MYSTERIES.length) {
      console.warn(`[assignAndRotateMysteriesForRose] Nieprawidłowy mysteryOrderIndex (${mysteryOrderIndex}) dla członkostwa ${membership.id}. Pomijanie.`);
      continue; 
    }

    const mysteryArrayIndex = (mysteryOrderIndex + newRotationOffset) % ROSARY_MYSTERIES.length;
    const newMysteryId = ROSARY_MYSTERIES[mysteryArrayIndex].id;

    // Aktualizuj członkostwo jeśli tajemnica się zmieniła
    if (newMysteryId !== membership.currentAssignedMystery) {
      operations.push(
        prisma.roseMembership.update({
          where: { id: membership.id },
          data: {
            currentAssignedMystery: newMysteryId,
            mysteryConfirmedAt: null,
          },
        })
      );
    }

    // Dodaj do historii
    operations.push(
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
  }

  // Wykonaj wszystkie operacje w transakcji
  try {
    await prisma.$transaction(operations);
    const message = memberships.length > 0 
      ? `Pomyślnie zaktualizowano offset (${newRotationOffset}), tajemnice i historię dla członków Róży ${roseId}.`
      : `Zaktualizowano offset rotacji dla Róży ${roseId} do ${newRotationOffset}. Brak członków.`;
    console.log(`[assignAndRotateMysteriesForRose] ${message}`);
  } catch (e) {
    console.error(`[assignAndRotateMysteriesForRose] Błąd transakcji dla Róży ${roseId}:`, e);
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