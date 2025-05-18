// backend/src/services/rosary.service.ts
import prisma from '../db';
import { ROSARY_MYSTERIES, RosaryMystery, getRandomElement } from '../utils/constants'; // Zaimportuj nasze tajemnice
import { RoseMembership } from '@prisma/client'; // Import typu RoseMembership

const HISTORY_LENGTH_TO_AVOID = 5; // Ile ostatnich tajemnic unikać

/**
 * Pobiera N ostatnich unikalnych ID tajemnic dla danego członkostwa.
 * @param membershipId ID członkostwa w Róży
 * @param limit Liczba ostatnich tajemnic do pobrania
 * @returns Tablica stringów z ID ostatnich tajemnic
 */
async function getRecentMysteryIdsForMembership(membershipId: string, limit: number): Promise<string[]> {
  const historyEntries = await prisma.assignedMysteryHistory.findMany({
    where: { membershipId },
    orderBy: { assignedAt: 'desc' },
    take: limit,
    select: { mystery: true }, // Pobieramy tylko ID tajemnicy (które jest stringiem)
  });
  return historyEntries.map(entry => entry.mystery);
}

/**
 * Wybiera nową, losową tajemnicę dla członkostwa, unikając N ostatnich.
 * @param membershipId ID członkostwa w Róży
 * @returns Obiekt RosaryMystery lub undefined jeśli nie można wybrać nowej (np. wszystkie były niedawno)
 */
export async function assignNewMysteryToMember(membershipId: string): Promise<RosaryMystery | null> {
  const recentMysteryIds = await getRecentMysteryIdsForMembership(membershipId, HISTORY_LENGTH_TO_AVOID);

  // Filtruj dostępne tajemnice, aby wykluczyć te z niedawnej historii
  const availableMysteries = ROSARY_MYSTERIES.filter(
    (mystery) => !recentMysteryIds.includes(mystery.id)
  );

  if (availableMysteries.length === 0) {
    // Jeśli wszystkie tajemnice były niedawno używane (co jest mało prawdopodobne przy 20 tajemnicach i unikaniu 5)
    // Możemy wybrać całkowicie losową lub zaimplementować inną logikę rezerwową.
    // Na razie wybierzmy całkowicie losową z pełnej listy jako fallback.
    console.warn(`Dla członkostwa ${membershipId} wszystkie tajemnice były ostatnio używane. Wybieranie losowej z pełnej puli.`);
    const fallbackMystery = getRandomElement(ROSARY_MYSTERIES);
    if (!fallbackMystery) {
        console.error('Nie udało się wybrać tajemnicy zapasowej - lista ROSARY_MYSTERIES jest pusta.');
        return null; // Nie powinno się zdarzyć
    }
    return fallbackMystery;
  }

  // Wybierz losową tajemnicę z dostępnych
  const newMystery = getRandomElement(availableMysteries);

  if (!newMystery) {
     console.error('Nie udało się wylosować nowej tajemnicy z dostępnych.');
     return null; // Nie powinno się zdarzyć, jeśli availableMysteries nie jest puste
  }

  // Zaktualizuj `currentAssignedMystery` w RoseMembership i dodaj wpis do historii
  // Użyjemy transakcji, aby obie operacje były atomowe
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // Miesiące są 0-indeksowane
    const currentYear = now.getFullYear();

    await prisma.$transaction(async (tx) => {
      // 1. Zaktualizuj aktualnie przypisaną tajemnicę w RoseMembership
      await tx.roseMembership.update({
        where: { id: membershipId },
        data: {
          currentAssignedMystery: newMystery.id, // Zapisujemy ID tajemnicy
          mysteryConfirmedAt: null, // Resetujemy potwierdzenie przy nowej tajemnicy
        },
      });

      // 2. Dodaj wpis do AssignedMysteryHistory
      await tx.assignedMysteryHistory.create({
        data: {
          membershipId: membershipId,
          mystery: newMystery.id, // Zapisujemy ID tajemnicy
          assignedMonth: currentMonth,
          assignedYear: currentYear,
          assignedAt: now, // Zapisujemy dokładny czas przydziału
        },
      });
    });

    console.log(`Przydzielono nową tajemnicę "${newMystery.name}" (ID: ${newMystery.id}) dla członkostwa ${membershipId}`);
    return newMystery; // Zwróć pełny obiekt nowej tajemnicy

  } catch (error) {
    console.error(`Błąd podczas aktualizacji tajemnicy i historii dla członkostwa ${membershipId}:`, error);
    // W przypadku błędu transakcji, zmiany zostaną wycofane
    return null;
  }
}

/**
 * Funkcja do uruchomienia dla wszystkich członków wszystkich Róż, np. przez cron job.
 */
export async function assignMysteriesToAllActiveMembers(): Promise<void> {
  console.log('Rozpoczęcie procesu przydzielania nowych tajemnic dla wszystkich członków...');
  const memberships = await prisma.roseMembership.findMany({
    // Tutaj można by dodać warunki, np. tylko dla aktywnych Róż/członkostw, jeśli takie statusy istnieją
    select: { id: true } // Pobieramy tylko ID, resztę zrobi assignNewMysteryToMember
  });

  let successCount = 0;
  let failureCount = 0;

  for (const membership of memberships) {
    const assignedMystery = await assignNewMysteryToMember(membership.id);
    if (assignedMystery) {
      successCount++;
    } else {
      failureCount++;
    }
    // Można dodać małe opóźnienie, aby nie obciążać bazy przy dużej liczbie członków
    // await new Promise(resolve => setTimeout(resolve, 100)); 
  }
  console.log(`Proces przydzielania tajemnic zakończony. Pomyślnie przydzielono: ${successCount}, Niepowodzenia: ${failureCount}`);
}