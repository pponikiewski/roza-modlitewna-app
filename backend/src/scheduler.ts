// backend/src/scheduler.ts
import cron from 'node-cron';
import { assignMysteriesToAllRoses } from './services/rosary.service';

// Set do śledzenia już wykonanych zadań (zapobiega wielokrotnemu uruchomieniu)
const executedTasks = new Set<string>();

/**
 * Sprawdza czy podana data jest pierwszą niedzielą miesiąca
 * @param date - data do sprawdzenia (domyślnie dzisiaj)
 * @param timezone - strefa czasowa (domyślnie lokalna)
 */
function isFirstSundayOfMonth(date?: Date, timezone: string = 'Europe/Warsaw'): boolean {
  try {
    const checkDate = date || new Date();
    
    // Konwertuj na polską strefę czasową
    const localDate = new Date(checkDate.toLocaleString('en-US', { timeZone: timezone }));
    
    // Sprawdź czy to niedziela (0 = niedziela)
    if (localDate.getDay() !== 0) {
      return false;
    }
    
    // Pierwsza niedziela miesiąca może wypaść między 1. a 7. dniem miesiąca
    const dayOfMonth = localDate.getDate();
    return dayOfMonth >= 1 && dayOfMonth <= 7;
  } catch (error) {
    console.error('Błąd podczas sprawdzania pierwszej niedzieli:', error);
    return false;
  }
}

/**
 * Znajduje pierwszą niedzielę w danym miesiącu
 * @param year - rok
 * @param month - miesiąc (0-indexed: 0 = styczeń, 11 = grudzień)
 * @param timezone - strefa czasowa
 */
function getFirstSundayOfMonth(year: number, month: number, timezone: string = 'Europe/Warsaw'): Date {
  try {
    // Pierwszy dzień miesiąca w danej strefie czasowej
    const firstDay = new Date();
    firstDay.setFullYear(year, month, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const localFirstDay = new Date(firstDay.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = localFirstDay.getDay(); // 0 = niedziela, 1 = poniedziałek, ...
    
    // Oblicz ile dni dodać do pierwszego dnia miesiąca, żeby dotrzeć do niedzieli
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    return new Date(year, month, 1 + daysToAdd);
  } catch (error) {
    console.error('Błąd podczas znajdowania pierwszej niedzieli:', error);
    throw error;
  }
}

/**
 * Sprawdza czy dzisiaj jest dokładnie pierwsza niedziela miesiąca
 * @param timezone - strefa czasowa
 */
function isTodayFirstSundayOfMonth(timezone: string = 'Europe/Warsaw'): boolean {
  try {
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    const year = localNow.getFullYear();
    const month = localNow.getMonth();
    const day = localNow.getDate();
    
    const firstSunday = getFirstSundayOfMonth(year, month, timezone);
    const firstSundayLocal = new Date(firstSunday.toLocaleString('en-US', { timeZone: timezone }));
    
    // Porównaj daty (rok, miesiąc, dzień)
    return localNow.getFullYear() === firstSundayLocal.getFullYear() &&
           localNow.getMonth() === firstSundayLocal.getMonth() &&
           localNow.getDate() === firstSundayLocal.getDate();
  } catch (error) {
    console.error('Błąd podczas sprawdzania czy dzisiaj jest pierwsza niedziela:', error);
    return false;
  }
}

/**
 * Tworzy unikalny klucz dla zadania na podstawie daty
 */
function getTaskKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Wykonuje przydzielanie tajemnic różańca z zabezpieczeniami
 */
async function executeRosaryAssignment(): Promise<void> {
  const now = new Date();
  const taskKey = getTaskKey(now);
  
  // Sprawdź czy zadanie już zostało wykonane dziś
  if (executedTasks.has(taskKey)) {
    console.log(`[${now.toISOString()}] Zadanie już zostało wykonane dziś (${taskKey}). Pomijanie.`);
    return;
  }
  
  console.log(`[${now.toISOString()}] Jest pierwsza niedziela miesiąca. Uruchamianie przydzielania tajemnic dla wszystkich Róż...`);
  
  try {
    await assignMysteriesToAllRoses();
    
    // Oznacz zadanie jako wykonane
    executedTasks.add(taskKey);
    
    // Czyść stare wpisy (zachowuj tylko z ostatnich 7 dni)
    cleanupExecutedTasks();
    
    console.log(`[${now.toISOString()}] ✅ Pomyślnie zakończono cykl przydzielania tajemnic dla Róż.`);
  } catch (error) {
    console.error(`[${now.toISOString()}] ❌ Błąd podczas automatycznego przydzielania tajemnic dla Róż:`, error);
    
    // Opcjonalnie: wyślij powiadomienie o błędzie do administratora
    // await notifyAdmin('Błąd schedulera różańca', error);
    
    throw error; // Re-throw dla dalszego handling
  }
}

/**
 * Czyści stare wpisy z executedTasks
 */
function cleanupExecutedTasks(): void {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (const taskKey of executedTasks) {
    const [year, month, day] = taskKey.split('-').map(Number);
    const taskDate = new Date(year, month - 1, day);
    
    if (taskDate < sevenDaysAgo) {
      executedTasks.delete(taskKey);
    }
  }
}

/**
 * Handler zadania cron
 */
async function handleCronTask(): Promise<void> {
  const now = new Date();
  console.log(`[${now.toISOString()}] 🔄 Uruchomiono zadanie cron w niedzielę.`);

  try {
    if (isTodayFirstSundayOfMonth()) {
      await executeRosaryAssignment();
    } else {
      console.log(`[${now.toISOString()}] ℹ️  Dzisiaj nie jest pierwsza niedziela miesiąca. Pomijanie przydzielania tajemnic.`);
    }
  } catch (error) {
    console.error(`[${now.toISOString()}] ❌ Błąd w handlerze cron:`, error);
  }
}

/**
 * Główna funkcja uruchamiająca scheduler
 */
export function startScheduler(): void {
  console.log('🚀 Inicjalizacja schedulera różańca...');
  
  // Test funkcji (można odkomentować do debugowania)
  if (process.env.NODE_ENV === 'development') {
    const today = new Date();
    console.log(`📅 Dzisiaj (${today.toLocaleDateString('pl-PL')}): ${isTodayFirstSundayOfMonth() ? '✅ Jest' : '❌ Nie jest'} pierwszą niedzielą miesiąca`);
  }

  try {
    // Sprawdź czy cron pattern jest poprawny
    const cronPattern = '0 1 * * 0'; // Każda niedziela o 01:00
    if (!cron.validate(cronPattern)) {
      throw new Error(`Niepoprawny cron pattern: ${cronPattern}`);
    }

    // Utwórz zadanie cron
    const task = cron.schedule(cronPattern, handleCronTask, {
      timezone: 'Europe/Warsaw' // Ustaw polską strefę czasową
    });
    
    console.log('✅ Scheduler skonfigurowany pomyślnie:');
    console.log(`   - Wzorzec: ${cronPattern} (każda niedziela o 01:00)`);
    console.log(`   - Strefa czasowa: Europe/Warsaw`);
    console.log(`   - Status: ${task.getStatus()}`);
    
    // Opcjonalna informacja o następnym uruchomieniu
    const nextSunday = getNextSunday();
    console.log(`   - Następne uruchomienie: ${nextSunday.toLocaleString('pl-PL')}`);
    
  } catch (error) {
    console.error('❌ Błąd podczas konfiguracji cron schedulera:', error);
    console.log('🔄 Przełączanie na alternatywny scheduler...');
    
    // Fallback na alternatywny scheduler
    startAlternativeScheduler();
  }
}

/**
 * Znajduje najbliższą niedzielę
 */
function getNextSunday(): Date {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setHours(1, 0, 0, 0); // Ustaw na 01:00
  return nextSunday;
}

/**
 * Alternatywny scheduler używający setTimeout jako fallback
 */
function startAlternativeScheduler(): void {
  console.log('🔄 Uruchomiono alternatywny scheduler...');
  
  function scheduleNextCheck(): void {
    const now = new Date();
    const nextSunday = getNextSunday();
    const timeUntilNextSunday = nextSunday.getTime() - now.getTime();
    
    console.log(`⏰ Następne sprawdzenie: ${nextSunday.toLocaleString('pl-PL')}`);
    
    setTimeout(async () => {
      try {
        await handleCronTask();
      } catch (error) {
        console.error('❌ Błąd w alternatywnym schedulerze:', error);
      }
      
      // Zaplanuj następne sprawdzenie
      scheduleNextCheck();
    }, timeUntilNextSunday);
  }
  
  scheduleNextCheck();
}



/**
 * Funkcja do manualnego uruchomienia zadania (do testów)
 */
export async function runManualTask(): Promise<void> {
  console.log('🔧 Manualne uruchomienie zadania schedulera...');
  try {
    await executeRosaryAssignment();
    console.log('✅ Manualne zadanie zakończone pomyślnie');
  } catch (error) {
    console.error('❌ Błąd podczas manualnego uruchomienia:', error);
    throw error;
  }
}

// Eksportowane funkcje do testowania
export { 
  isFirstSundayOfMonth, 
  getFirstSundayOfMonth, 
  isTodayFirstSundayOfMonth,
  getTaskKey,
  cleanupExecutedTasks
};