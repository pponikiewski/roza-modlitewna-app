// backend/src/scheduler.ts
import cron from 'node-cron';
import { assignMysteriesToAllRoses } from './services/rosary.service'; // Zmieniony import

function isFirstSundayOfMonth(): boolean {
  const today = new Date();
  if (today.getDay() !== 0) { // 0 to niedziela
    return false;
  }
  return today.getDate() >= 1 && today.getDate() <= 7;
}

export function startScheduler(): void {
  console.log('Scheduler zainicjowany.');
  // console.log('Test isFirstSundayOfMonth():', isFirstSundayOfMonth()); // Do testów

  const task = cron.schedule('0 1 * * *', async () => { // Harmonogram: o 01:00 każdego dnia
    console.log(`[${new Date().toISOString()}] Uruchomiono codzienne zadanie cron.`);

    if (isFirstSundayOfMonth()) {
      console.log(`[${new Date().toISOString()}] Jest pierwsza niedziela miesiąca. Uruchamianie przydzielania tajemnic dla wszystkich Róż...`);
      try {
        await assignMysteriesToAllRoses(); // Wywołaj nową funkcję
        console.log(`[${new Date().toISOString()}] Pomyślnie zakończono cykl przydzielania tajemnic dla Róż.`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Błąd podczas automatycznego przydzielania tajemnic dla Róż:`, error);
      }
    } else {
      console.log(`[${new Date().toISOString()}] Dzisiaj nie jest pierwsza niedziela miesiąca. Pomijanie przydzielania tajemnic.`);
    }
  }, {
    timezone: "Europe/Warsaw"
    // scheduled: true // Domyślnie true, więc można pominąć
  });
  // task.start(); // Jeśli scheduled byłoby false
}