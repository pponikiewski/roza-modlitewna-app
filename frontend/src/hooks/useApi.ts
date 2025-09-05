// frontend/src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showErrorToast = true, showSuccessToast = false, successMessage } = options;
  
  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(...args);
      const result = response.data || response;
      
      setData(result);
      
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Wystąpił błąd';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showErrorToast, showSuccessToast, successMessage]);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return { data, loading, error, execute, reset };
}
