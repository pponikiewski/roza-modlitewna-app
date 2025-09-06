// Testy dla funkcji schedulera
const mockAssignMysteriesToAllRoses = jest.fn();

// Symulacja funkcji schedulera
const isFirstSundayOfMonth = (date, timezone = 'Europe/Warsaw') => {
  try {
    const checkDate = date || new Date();
    const localDate = new Date(checkDate.toLocaleString('en-US', { timeZone: timezone }));
    
    if (localDate.getDay() !== 0) {
      return false;
    }
    
    const dayOfMonth = localDate.getDate();
    return dayOfMonth >= 1 && dayOfMonth <= 7;
  } catch (error) {
    return false;
  }
};

const getFirstSundayOfMonth = (year, month, timezone = 'Europe/Warsaw') => {
  try {
    const firstDay = new Date();
    firstDay.setFullYear(year, month, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const localFirstDay = new Date(firstDay.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = localFirstDay.getDay();
    
    const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    return new Date(year, month, 1 + daysToAdd);
  } catch (error) {
    throw error;
  }
};

const isTodayFirstSundayOfMonth = (timezone = 'Europe/Warsaw') => {
  try {
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    const year = localNow.getFullYear();
    const month = localNow.getMonth();
    
    const firstSunday = getFirstSundayOfMonth(year, month, timezone);
    const firstSundayLocal = new Date(firstSunday.toLocaleString('en-US', { timeZone: timezone }));
    
    return localNow.getFullYear() === firstSundayLocal.getFullYear() &&
           localNow.getMonth() === firstSundayLocal.getMonth() &&
           localNow.getDate() === firstSundayLocal.getDate();
  } catch (error) {
    return false;
  }
};

const getTaskKey = (date) => {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const executedTasks = new Set();

const executeRosaryAssignment = async () => {
  const now = new Date();
  const taskKey = getTaskKey(now);
  
  if (executedTasks.has(taskKey)) {
    return;
  }
  
  try {
    await mockAssignMysteriesToAllRoses();
    executedTasks.add(taskKey);
  } catch (error) {
    throw error;
  }
};

const getNextSunday = () => {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  nextSunday.setHours(1, 0, 0, 0);
  return nextSunday;
};

const runManualTask = async () => {
  try {
    await executeRosaryAssignment();
  } catch (error) {
    throw error;
  }
};

describe('Scheduler Functions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    executedTasks.clear();
  });

  describe('isFirstSundayOfMonth', () => {
    test('returns true for first Sunday of month', () => {
      const firstSunday = new Date(2024, 0, 7); // 7 stycznia 2024 (niedziela)
      const result = isFirstSundayOfMonth(firstSunday);
      expect(result).toBe(true);
    });

    test('returns false for second Sunday of month', () => {
      const secondSunday = new Date(2024, 0, 14); // 14 stycznia 2024 (druga niedziela)
      const result = isFirstSundayOfMonth(secondSunday);
      expect(result).toBe(false);
    });

    test('returns false for non-Sunday days', () => {
      const monday = new Date(2024, 0, 1); // 1 stycznia 2024 (poniedziałek)
      const result = isFirstSundayOfMonth(monday);
      expect(result).toBe(false);
    });
  });

  describe('getFirstSundayOfMonth', () => {
    test('returns correct first Sunday for January 2024', () => {
      const firstSunday = getFirstSundayOfMonth(2024, 0);
      expect(firstSunday.getDate()).toBe(7);
      expect(firstSunday.getDay()).toBe(0);
    });

    test('returns correct first Sunday for February 2024', () => {
      const firstSunday = getFirstSundayOfMonth(2024, 1);
      expect(firstSunday.getDate()).toBe(4);
      expect(firstSunday.getDay()).toBe(0);
    });
  });

  describe('isTodayFirstSundayOfMonth', () => {
    test('returns boolean value', () => {
      const result = isTodayFirstSundayOfMonth();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('executeRosaryAssignment', () => {
    test('calls assignMysteriesToAllRoses', async () => {
      mockAssignMysteriesToAllRoses.mockResolvedValue();
      
      await executeRosaryAssignment();
      
      expect(mockAssignMysteriesToAllRoses).toHaveBeenCalled();
    });

    test('handles errors', async () => {
      const testError = new Error('Database error');
      mockAssignMysteriesToAllRoses.mockRejectedValue(testError);
      
      await expect(executeRosaryAssignment()).rejects.toThrow('Database error');
    });
  });

  describe('getNextSunday', () => {
    test('returns next Sunday', () => {
      const nextSunday = getNextSunday();
      
      expect(nextSunday).toBeInstanceOf(Date);
      expect(nextSunday.getDay()).toBe(0);
      expect(nextSunday.getHours()).toBe(1);
    });
  });

  describe('runManualTask', () => {
    test('executes successfully', async () => {
      mockAssignMysteriesToAllRoses.mockResolvedValue();
      
      await runManualTask();
      
      expect(mockAssignMysteriesToAllRoses).toHaveBeenCalled();
    });

    test('propagates errors', async () => {
      const testError = new Error('Critical error');
      mockAssignMysteriesToAllRoses.mockRejectedValue(testError);
      
      await expect(runManualTask()).rejects.toThrow('Critical error');
    });
  });
});
