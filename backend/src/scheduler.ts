// backend/src/scheduler.ts
import cron from 'node-cron';
import { assignMysteriesToAllActiveMembers } from './services/rosary.service';

function isFirstSundayOfMonth(): boolean {
  const today = new Date();
  if (today.getDay() !== 0) { // 0 to niedziela
    return false;
  }
  return today.getDate() >= 1 && today.getDate() <= 7;
}

export function startScheduler(): void {
  console.log('Scheduler zainicjowany.');
  // console.log('Test isFirstSundayOfMonth():', isFirstSundayOfMonth()); // Możesz zostawić do testów

  // Definiowanie zadania cron
  const task = cron.schedule('0 1 * * *', async () => { // Harmonogram: o 01:00 każdego dnia
    console.log(`[${new Date().toISOString()}] Uruchomiono codzienne zadanie cron.`);

    if (isFirstSundayOfMonth()) {
      console.log(`[${new Date().toISOString()}] Jest pierwsza niedziela miesiąca. Uruchamianie przydzielania tajemnic...`);
      try {
        await assignMysteriesToAllActiveMembers();
        console.log(`[${new Date().toISOString()}] Pomyślnie zakończono przydzielanie tajemnic.`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Błąd podczas automatycznego przydzielania tajemnic:`, error);
      }
    } else {
      console.log(`[${new Date().toISOString()}] Dzisiaj nie jest pierwsza niedziela miesiąca. Pomijanie przydzielania tajemnic.`);
    }
  }, {
    // Obiekt opcji jako trzeci argument
    timezone: "Europe/Warsaw",
    // scheduled: true, // Można pominąć, bo jest domyślnie true. Jeśli ustawisz na false, musisz potem wywołać task.start()
  });

  // Jeśli ustawiłbyś scheduled: false, zadanie nie wystartuje automatycznie.
  // Wtedy musiałbyś je uruchomić ręcznie:
  // task.start();
  // console.log('Zadanie cron zostało zaplanowane i uruchomione.');

  // Możesz dodać tutaj inne zadania cykliczne w przyszłości
}