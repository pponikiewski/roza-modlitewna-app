// utils/performance.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading helper dla obrazów
export const createIntersectionObserver = (callback: IntersectionObserverCallback) => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }
  return null;
};

// Preload krytycznych zasobów
export const preloadRoute = (routeComponent: () => Promise<any>) => {
  const componentPromise = routeComponent();
  return componentPromise;
};

// Memory optimization
export const cleanupMemory = () => {
  if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
  }
};
