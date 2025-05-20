// backend/src/services/rosary.service.ts
import prisma from '../db';
import { ROSARY_MYSTERIES, RosaryMystery } from '../utils/constants'; // Upewnij się, że typ RosaryMystery jest poprawny

/**
 * Przydziela tajemnice dla WSZYSTKICH członków DANEJ Róży zgodnie z uproszczoną zasadą rotacji.
 * @param roseId ID Róży
 */
export async function assignAndRotateMysteriesForRose(roseId: string): Promise<void> {
  console.log(`[assignAndRotateMysteriesForRose] Rozpoczynanie rotacji dla Róży ${roseId}`);

  const memberships = await prisma.roseMembership.findMany({
    where: { roseId: roseId },
    orderBy: { 
      // Sortuj po mysteryOrderIndex, jeśli istnieje, w przeciwnym razie po dacie utworzenia
      // To ważne dla spójnego przypisywania, jeśli mysteryOrderIndex nie jest jeszcze wszędzie ustawiony
      mysteryOrderIndex: 'asc', 
      // createdAt: 'asc', // Można dodać jako drugi klucz sortowania
    },
    select: { id: true, userId: true, currentAssignedMystery: true, mysteryOrderIndex: true }
  });

  if (memberships.length === 0) {
    console.log(`[assignAndRotateMysteriesForRose] Róża ${roseId} nie ma członków. Pomijanie.`);
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // Miesiące są 0-indeksowane
  const currentYear = now.getFullYear();

  // Pobierz "offset rotacji" dla Róży - to powinno być przechowywane w modelu Rose
  // Na razie symulujemy go lub używamy prostego globalnego offsetu
  // Dla przykładu, użyjemy numeru miesiąca jako bardzo prostego offsetu.
  // Lepsze rozwiązanie: `const roseData = await prisma.rose.findUnique({where: {id: roseId}, select: {rotationOffset: true}});`
  // `const currentOffset = roseData?.rotationOffset || 0;`
  const currentOffset = (currentYear * 12 + currentMonth) % ROSARY_MYSTERIES.length; // Prosty, powtarzalny offset globalny

  const transactions = [];

  for (let i = 0; i < memberships.length; i++) {
    const membership = memberships[i];
    
    let memberOrderIndex = membership.mysteryOrderIndex;
    // Jeśli orderIndex nie jest ustawiony, użyj 'i' jako fallback i zaktualizuj w bazie
    if (memberOrderIndex === null || memberOrderIndex === undefined) {
      memberOrderIndex = i;
      // Opcjonalnie: dodaj transakcję aktualizującą mysteryOrderIndex, jeśli go nie ma
      // To zapewni, że przy następnej rotacji będzie już ustawiony
      transactions.push(
        prisma.roseMembership.update({
          where: { id: membership.id },
          data: { mysteryOrderIndex: memberOrderIndex }
        })
      );
    }

    // Prosta deterministyczna "rotacja" na podstawie pozycji członka i globalnego offsetu
    // Każdy członek (o ile jest ich <= 20) dostanie inną tajemnicę
    const mysteryArrayIndex = (memberOrderIndex + currentOffset) % ROSARY_MYSTERIES.length;
    
    if (mysteryArrayIndex < 0 || mysteryArrayIndex >= ROSARY_MYSTERIES.length) {
        console.error(`[assignAndRotateMysteriesForRose] Błędny indeks tajemnicy (${mysteryArrayIndex}) dla Róży ${roseId}, członkostwo ${membership.id}. Pomijanie.`);
        continue;
    }
    const newMysteryId = ROSARY_MYSTERIES[mysteryArrayIndex].id;

    // Aktualizuj tylko jeśli tajemnica się zmieniła, aby uniknąć niepotrzebnych zapisów do historii
    if (newMysteryId !== membership.currentAssignedMystery) {
      transactions.push(
        prisma.roseMembership.update({
          where: { id: membership.id },
          data: {
            currentAssignedMystery: newMysteryId,
            mysteryConfirmedAt: null, // Resetuj potwierdzenie
          },
        })
      );
    }

    // Zawsze dodawaj do historii, nawet jeśli tajemnica jest ta sama (oznacza nowy miesiąc)
    // LUB dodawaj tylko, gdy się zmienia (kwestia decyzji)
    // Poniżej: dodaje zawsze, aby mieć wpis na każdy miesiąc
    transactions.push(
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

  if (transactions.length > 0) {
    try {
      await prisma.$transaction(transactions);
      console.log(`[assignAndRotateMysteriesForRose] Pomyślnie zaktualizowano tajemnice i historię dla ${memberships.length} członków Róży ${roseId}.`);
    } catch (e) {
      console.error(`[assignAndRotateMysteriesForRose] Błąd transakcji dla Róży ${roseId}:`, e);
      // Można by tu dodać logikę ponawiania lub powiadamiania admina
    }
  } else {
    console.log(`[assignAndRotateMysteriesForRose] Brak zmian tajemnic do przetworzenia dla Róży ${roseId} lub brak transakcji.`);
  }
}
    
export async function assignMysteriesToAllRoses(): Promise<void> {
  console.log('Rozpoczęcie procesu przydzielania nowych tajemnic dla wszystkich Róż...');
  const roses = await prisma.rose.findMany({
    select: { id: true }
  });

  let successCount = 0;
  let failureCount = 0;

  for (const rose of roses) {
    try {
      await assignAndRotateMysteriesForRose(rose.id);
      successCount++;
    } catch (error) {
      console.error(`Błąd podczas przetwarzania Róży ${rose.id}:`, error);
      failureCount++;
    }
  }
  console.log(`Proces przydzielania tajemnic dla Róż zakończony. Przetworzono Róż: ${successCount}, Niepowodzenia: ${failureCount}`);
}