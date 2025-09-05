// backend/src/scheduler.ts
import cron from 'node-cron';
import { assignMysteriesToAllRoses } from './services/rosary.service'; // Zmieniony import

function isFirstSundayOfMonth(date?: Date): boolean {
  const today = date || new Date();
  
  // Sprawdź czy to niedziela (0 = niedziela)
  if (today.getDay() !== 0) {
    return false;
  }
  
  // Pierwsza niedziela miesiąca może wypaść między 1. a 7. dniem miesiąca
  const dayOfMonth = today.getDate();
  return dayOfMonth >= 1 && dayOfMonth <= 7;
}

// Funkcja pomocnicza do znajdowania pierwszej niedzieli w danym miesiącu
function getFirstSundayOfMonth(year: number, month: number): Date {
  // month is 0-indexed (0 = styczeń, 11 = grudzień)
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0 = niedziela, 1 = poniedziałek, ...
  
  // Oblicz ile dni dodać do pierwszego dnia miesiąca, żeby dotrzeć do niedzieli
  const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  return new Date(year, month, 1 + daysToAdd);
}

// Funkcja sprawdzająca czy dzisiaj jest dokładnie pierwsza niedziela miesiąca
function isTodayFirstSundayOfMonth(): boolean {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstSunday = getFirstSundayOfMonth(year, month);
  
  // Porównaj daty (rok, miesiąc, dzień)
  return today.getFullYear() === firstSunday.getFullYear() &&
         today.getMonth() === firstSunday.getMonth() &&
         today.getDate() === firstSunday.getDate();
}

export function startScheduler(): void {
  console.log('Scheduler zainicjowany.');
  
  // Test funkcji (można odkomentować do debugowania)
  // const today = new Date();
  // console.log(`Dzisiaj (${today.toLocaleDateString('pl-PL')}): ${isTodayFirstSundayOfMonth() ? 'Jest' : 'Nie jest'} pierwszą niedzielą miesiąca`);

  try {
    // Sprawdź czy cron pattern jest poprawny
    if (!cron.validate('0 1 * * 0')) {
      throw new Error('Niepoprawny cron pattern');
    }

    const task = cron.schedule('0 1 * * 0', async () => { // Uruchamiaj tylko w niedziele o 01:00
      console.log(`[${new Date().toISOString()}] Uruchomiono zadanie cron w niedzielę.`);

      if (isTodayFirstSundayOfMonth()) {
        console.log(`[${new Date().toISOString()}] Jest pierwsza niedziela miesiąca. Uruchamianie przydzielania tajemnic dla wszystkich Róż...`);
        try {
          await assignMysteriesToAllRoses();
          console.log(`[${new Date().toISOString()}] Pomyślnie zakończono cykl przydzielania tajemnic dla Róż.`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Błąd podczas automatycznego przydzielania tajemnic dla Róż:`, error);
        }
      } else {
        console.log(`[${new Date().toISOString()}] Dzisiaj nie jest pierwsza niedziela miesiąca. Pomijanie przydzielania tajemnic.`);
      }
    });
    
    console.log('Scheduler skonfigurowany: będzie uruchamiany w każdą niedzielę o 01:00');
  } catch (error) {
    console.error('Błąd podczas konfiguracji cron schedulera:', error);
    console.log('Przełączanie na alternatywny scheduler...');
    
    // Alternatywny scheduler używający setInterval
    startAlternativeScheduler();
  }
}

// Alternatywny scheduler bez node-cron
function startAlternativeScheduler(): void {
  // Sprawdzaj co godzinę czy jest niedziela o 01:00
  const checkInterval = setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = niedziela
    
    // Sprawdź czy jest niedziela o 01:00
    if (currentDay === 0 && currentHour === 1) {
      console.log(`[${now.toISOString()}] Uruchomiono alternatywny scheduler w niedzielę.`);
      
      if (isTodayFirstSundayOfMonth()) {
        console.log(`[${now.toISOString()}] Jest pierwsza niedziela miesiąca. Uruchamianie przydzielania tajemnic dla wszystkich Róż...`);
        try {
          await assignMysteriesToAllRoses();
          console.log(`[${now.toISOString()}] Pomyślnie zakończono cykl przydzielania tajemnic dla Róż.`);
        } catch (error) {
          console.error(`[${now.toISOString()}] Błąd podczas automatycznego przydzielania tajemnic dla Róż:`, error);
        }
      } else {
        console.log(`[${now.toISOString()}] Dzisiaj nie jest pierwsza niedziela miesiąca. Pomijanie przydzielania tajemnic.`);
      }
    }
  }, 60 * 60 * 1000); // Sprawdzaj co godzinę
  
  console.log('Alternatywny scheduler skonfigurowany: będzie sprawdzał co godzinę czy uruchomić zadanie');
}

// Eksportowane funkcje do testowania
export { isFirstSundayOfMonth, getFirstSundayOfMonth, isTodayFirstSundayOfMonth };