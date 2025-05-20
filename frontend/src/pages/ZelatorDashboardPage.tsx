// frontend/src/pages/ZelatorDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { Link as RouterLink } from 'react-router-dom'; // Użyj RouterLink
import type { Rose } from '../types/admin.types'; // Załóżmy, że Rose ma podobny typ jak w admin.types

// Możemy zdefiniować bardziej szczegółowy typ dla Róży zarządzanej przez Zelatora, jeśli potrzeba
// np. z liczbą członków, itp. Na razie użyjemy prostego typu.
// Jeśli nie masz admin.types.ts, możesz zdefiniować typ Rose tutaj lub w rosary.types.ts
// export interface ManagedRose {
//   id: string;
//   name: string;
//   description?: string | null;
//   memberCount?: number; // Opcjonalnie, jeśli API to zwraca
// }


const ZelatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [managedRoses, setManagedRoses] = useState<Rose[]>([]); // Użyj typu Rose z admin.types lub zdefiniuj nowy
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagedRoses = async () => {
      if (!user || (user.role !== 'ZELATOR' && user.role !== 'ADMIN')) {
         // Admin też może mieć dostęp do tego widoku, jeśli chcemy
        setError("Nie masz uprawnień Zelatora.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // Potrzebujemy endpointu na backendzie, np. GET /zelator/my-roses
        // który zwróci Róże zarządzane przez zalogowanego Zelatora
        const response = await apiClient.get<Rose[]>('/zelator/my-roses'); // ZAKTUALIZUJEMY TEN ENDPOINT
        setManagedRoses(response.data);
      } catch (err: any) {
        console.error("Błąd pobierania zarządzanych Róż:", err);
        setError(err.response?.data?.error || 'Nie udało się pobrać danych o Różach.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagedRoses();
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center">Ładowanie danych Zelatora...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;
  }
  
  if (user?.role !== 'ZELATOR' && user?.role !== 'ADMIN') {
     return <div className="p-8 text-center text-red-600">Dostęp tylko dla Zelatorów i Administratorów.</div>
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel Zelatora</h1>
        <p className="mb-2 text-gray-700">Witaj, {user?.name || user?.email}!</p>
        
        {managedRoses.length === 0 && !isLoading && (
          <p className="text-gray-600">Nie zarządzasz jeszcze żadnymi Różami.</p>
        )}

        {managedRoses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">Twoje Róże:</h2>
            {managedRoses.map(rose => (
              <div key={rose.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-indigo-700 mb-2">{rose.name}</h3>
                {rose.description && <p className="text-gray-600 text-sm mb-3">{rose.description}</p>}
                {/* Dodamy _count.members jeśli backend to zwróci */}
                {/* <p className="text-sm text-gray-500">Liczba członków: {rose._count?.members || 0}</p> */}
                <RouterLink 
                  to={`/zelator/rose/${rose.id}`} 
                  className="inline-block mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Zarządzaj Różą
                </RouterLink>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZelatorDashboardPage;