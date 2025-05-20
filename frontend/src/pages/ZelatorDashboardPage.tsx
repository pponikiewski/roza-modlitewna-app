// frontend/src/pages/ZelatorDashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
// Zaimportuj typ ManagedRose z zelator.types.ts
import type { ManagedRose } from '../types/zelator.types'; 
// Zaimportuj UserRoles do sprawdzania uprawnień
import { UserRoles, type UserRole } from '../types/user.types'; 


const ZelatorDashboardPage: React.FC = () => {
  const { user } = useAuth(); // Pobieramy dane zalogowanego użytkownika
  const [managedRoses, setManagedRoses] = useState<ManagedRose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagedRoses = useCallback(async () => {
    // Sprawdzenie, czy użytkownik jest załadowany i ma odpowiednią rolę
    if (!user || (user.role !== UserRoles.ZELATOR && user.role !== UserRoles.ADMIN)) {
      setError("Nie masz uprawnień, aby wyświetlić tę stronę.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Endpoint /zelator/my-roses zwraca Róże zarządzane przez Zelatora,
      // lub wszystkie Róże, jeśli zalogowany jest Admin (zgodnie z logiką backendu)
      const response = await apiClient.get<ManagedRose[]>('/zelator/my-roses');
      setManagedRoses(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania zarządzanych Róż:", err);
      if (err.response?.status === 403) {
        setError("Nie masz uprawnień do pobrania listy zarządzanych Róż.");
      } else {
        setError(err.response?.data?.error || 'Nie udało się pobrać danych o Twoich Różach.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Zależność od 'user'

  useEffect(() => {
    // Wywołaj fetchManagedRoses tylko jeśli 'user' jest dostępny
    if (user) {
      fetchManagedRoses();
    } else {
      // Jeśli user jest null (np. AuthContext jeszcze się nie załadował lub użytkownik nie jest zalogowany)
      // ProtectedRoute w App.tsx powinien to obsłużyć i przekierować,
      // ale dla pewności można ustawić isLoading na false i ewentualnie error.
      setIsLoading(false); 
      // setError("Brak danych użytkownika do załadowania panelu Zelatora."); // Opcjonalnie
    }
  }, [fetchManagedRoses, user]); // Dodano 'user' do zależności

  // Obsługa stanu ładowania (globalny dla tej strony)
  if (isLoading) {
    return <div className="p-8 text-center text-xl text-gray-700">Ładowanie Panelu Zelatora...</div>;
  }

  // Obsługa błędów lub braku uprawnień (jeśli useEffect nie złapał tego wcześniej)
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">{error}</p>
        <RouterLink to="/dashboard" className="text-blue-600 hover:underline">Wróć do Panelu Głównego</RouterLink>
      </div>
    );
  }
  
  // Dodatkowe zabezpieczenie, choć ProtectedRoute w App.tsx powinien to załatwić
  if (!user || (user.role !== UserRoles.ZELATOR && user.role !== UserRoles.ADMIN)) {
    return (
        <div className="p-8 text-center">
            <p className="text-red-600 bg-red-100 p-4 rounded-md">Nie masz uprawnień do wyświetlenia tej strony.</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100"> {/* Używamy bg-slate-50 dla spójności */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 pb-4 border-b border-gray-300">
            <h1 className="text-3xl font-bold text-gray-800">Panel Zelatora</h1>
            <p className="text-md text-gray-600">Witaj, {user.name || user.email}!</p>
        </div>
        
        {managedRoses.length === 0 && !isLoading && ( // Sprawdzamy !isLoading, aby nie pokazywać, gdy jeszcze się ładuje
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
                            {user.role === UserRoles.ADMIN && rose.zelator && ( // Admin widzi Zelatora każdej Róży
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