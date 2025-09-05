// frontend/src/pages/ZelatorDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import type { ManagedRose } from '../types/zelator.types'; 
import { UserRoles } from '../types/user.types';
import { toast } from 'sonner'; // <<<< ZMIANA: Dodano import


const ZelatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [managedRoses, setManagedRoses] = useState<ManagedRose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const fetchManagedRoses = useCallback(async () => {
    if (!user || (user.role !== UserRoles.ZELATOR && user.role !== UserRoles.ADMIN)) {
      toast.error("Nie masz uprawnień, aby wyświetlić tę stronę."); // <<<< ZMIANA: Dodano toast
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // setError(null); // <<<< ZMIANA: Usunięto
    try {
      const response = await apiClient.get<ManagedRose[]>('/zelator/my-roses');
      setManagedRoses(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania zarządzanych Róż:", err);
      let errorMessage = 'Nie udało się pobrać danych o Twoich Różach.';
      if (err.response?.status === 403) {
        errorMessage = "Nie masz uprawnień do pobrania listy zarządzanych Róż.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      toast.error(errorMessage); // <<<< ZMIANA: Dodano toast
      // setError(errorMessage); // <<<< ZMIANA: Usunięto
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchManagedRoses();
    } else {
      // Jeśli user jest null, ProtectedRoute powinien przekierować.
      // Nie ma potrzeby ustawiać tu błędu, bo isLoading pozostanie true
      // lub ProtectedRoute zadziała zanim useEffect się wykona w pełni.
      setIsLoading(false); 
    }
  }, [fetchManagedRoses, user]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <div className="text-xl text-gray-700">Ładowanie Panelu Zelatora...</div>
        </div>
      </div>
    );
  }

  // if (error) { // <<<< ZMIANA: Usunięto ten blok, toasty są globalne
  //   return (
  //     <div className="p-8 text-center">
  //       <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">{error}</p>
  //       <RouterLink to="/dashboard" className="text-blue-600 hover:underline">Wróć do Panelu Głównego</RouterLink>
  //     </div>
  //   );
  // }
  
  // Ten warunek może być zbędny, jeśli ProtectedRoute i logika w fetchManagedRoses działają poprawnie
  // i toast błędu już się pojawił. Jednak jako dodatkowe zabezpieczenie można go zostawić.
  if (!user || (user.role !== UserRoles.ZELATOR && user.role !== UserRoles.ADMIN)) {
    // Toast powinien być już wyświetlony przez fetchManagedRoses lub ProtectedRoute
    return (
        <div className="p-8 text-center">
            <p className="text-red-600 bg-red-100 p-4 rounded-md">Nie masz uprawnień do wyświetlenia tej strony.</p>
             <RouterLink to="/dashboard" className="text-blue-600 hover:underline">Wróć do Panelu Głównego</RouterLink>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 pb-4 border-b border-gray-300">
            <h1 className="text-3xl font-bold text-gray-800">Panel Zelatora</h1>
            <p className="text-md text-gray-600">Witaj, {user.name || user.email}!</p>
        </div>
        
        {managedRoses.length === 0 && !isLoading && (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-700 text-lg">
              {user.role === UserRoles.ADMIN ? "Nie ma jeszcze żadnych Róż w systemie." : "Nie zarządzasz jeszcze żadnymi Różami."}
            </p>
            {user.role === UserRoles.ADMIN && (
                <p className="mt-2 text-sm text-gray-500">
                    Możesz stworzyć nową Różę w <RouterLink to="/admin-panel/roses" className="text-indigo-600 hover:underline">Panelu Administratora</RouterLink>.
                </p>
            )}
          </div>
        )}

        {managedRoses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700">
              {user.role === UserRoles.ADMIN ? "Wszystkie Róże w systemie (widok Admina):" : "Twoje Zarządzane Róże:"}
            </h2>
            {managedRoses.map(rose => (
              <div key={rose.id} className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-grow mb-3 sm:mb-0">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-1">{rose.name}</h3>
                        {rose.description && <p className="text-gray-600 text-sm mb-2 italic">"{rose.description}"</p>}
                        <div className="text-xs text-gray-500 space-y-0.5">
                            {user.role === UserRoles.ADMIN && rose.zelator && (
                                <p>Zelator: <span className="font-medium">{rose.zelator.name || rose.zelator.email}</span> (ID: <span className="font-mono">{rose.zelator.id}</span>)</p>
                            )}
                            <p>Liczba członków: <span className="font-medium text-gray-700">{rose._count?.members ?? 0}</span> / {20}</p>
                            <p>ID Róży: <span className="font-mono text-gray-700">{rose.id}</span></p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 self-start sm:self-center">
                        <RouterLink 
                        to={`/zelator/rose/${rose.id}`} 
                        className="inline-block px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        Zarządzaj
                        </RouterLink>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZelatorDashboardPage;