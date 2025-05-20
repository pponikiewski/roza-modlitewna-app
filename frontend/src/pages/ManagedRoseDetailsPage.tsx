// frontend/src/pages/ManagedRoseDetailsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { RoseMembershipWithUserAndMystery } from '../types/zelator.types'; // Zdefiniujemy ten typ
import { findMysteryById } from '../utils/constants'; // <<< POPRAWIONY IMPORT

// Zdefiniuj typ w nowym pliku frontend/src/types/zelator.types.ts
// export interface RoseMembershipWithUserAndMystery {
//   id: string; // ID członkostwa
//   userId: string;
//   roseId: string;
//   currentAssignedMystery: string | null; // ID tajemnicy
//   mysteryConfirmedAt: string | null;
//   user: {
//     id: string;
//     email: string;
//     name?: string | null;
//   };
//   // Możemy dodać pole na pełne dane tajemnicy po przetworzeniu
//   mysteryDetails?: { name: string; group: string; contemplation: string; imageUrl?: string } | null;
// }

const ManagedRoseDetailsPage: React.FC = () => {
  const { roseId } = useParams<{ roseId: string }>(); // Pobieramy ID Róży z URL
  const { user } = useAuth();
  const [members, setMembers] = useState<RoseMembershipWithUserAndMystery[]>([]);
  const [roseName, setRoseName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoseDetailsAndMembers = async () => {
      if (!roseId || !user) return;
      setIsLoading(true);
      setError(null);
      try {
        // Endpoint do pobierania członków danej Róży (ten sam co dla /zelator/roses/:roseId/members)
        // Mógłby on też zwracać nazwę Róży dla wygody
        const response = await apiClient.get<RoseMembershipWithUserAndMystery[]>(`/zelator/roses/${roseId}/members`);
        
        // Przetwórz członków, aby dodać pełne dane tajemnicy
        const processedMembers = response.data.map(member => {
          const mysteryDetails = member.currentAssignedMystery 
            ? findMysteryById(member.currentAssignedMystery) 
            : null;
          return { ...member, mysteryDetails: mysteryDetails || undefined }; // dodajemy undefined, jeśli null
        });
        setMembers(processedMembers);

        // Idealnie, API /zelator/roses/:roseId/members powinno też zwracać nazwę Róży
        // Jeśli nie, musielibyśmy zrobić drugie zapytanie lub pobrać ją inaczej.
        // Na razie założymy, że nazwa Róży musi być pobrana osobno lub jest już znana
        // Dla uproszczenia, ustawimy ją statycznie lub pobierzemy z listy Róż Zelatora, jeśli ją mamy.
        // Możemy też zrobić request GET /admin/roses/:roseId (jeśli taki endpoint istnieje i jest dostępny dla Zelatora)
        // LUB endpoint /zelator/my-roses/:roseId
        // Na razie:
        // const roseInfoResponse = await apiClient.get(`/admin/roses/${roseId}`); // PRZYKŁAD, jeśli taki istnieje
        // setRoseName(roseInfoResponse.data.name);
        // Załóżmy, że API /zelator/roses/:roseId/members zwraca listę, a nazwa róży mogłaby być częścią tej odpowiedzi
        // lub pobierana z globalnego stanu/kontekstu jeśli mamy listę zarządzanych róż.
        // Aby to uprościć na teraz, nazwa róży nie będzie tu dynamicznie pobierana,
        // tylko wyświetlimy ID, a później to ulepszymy.
        // W kontrolerze backendu /zelator/roses/:roseId/members można by dołączyć nazwę róży do odpowiedzi.

      } catch (err: any) {
        console.error("Błąd pobierania członków Róży:", err);
        setError(err.response?.data?.error || 'Nie udało się pobrać danych o członkach Róży.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoseDetailsAndMembers();
  }, [roseId, user]);

  if (isLoading) {
    return <div className="p-8 text-center">Ładowanie danych Róży...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <RouterLink to="/zelator-dashboard" className="text-blue-600 hover:underline mb-6 inline-block">← Wróć do Panelu Zelatora</RouterLink>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Zarządzanie Różą {/* Tutaj można by wstawić {roseName} jeśli byłaby pobrana */}
        </h1>
        <p className="text-sm text-gray-500 mb-6">ID Róży: {roseId}</p>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Członkowie Róży:</h2>
          {members.length === 0 ? (
            <p className="text-gray-600">Ta Róża nie ma jeszcze żadnych członków.</p>
          ) : (
            <ul className="space-y-4">
              {members.map(member => (
                <li key={member.id} className="p-4 border rounded-md bg-gray-50">
                  <p className="font-semibold text-gray-800">{member.user.name || member.user.email}</p>
                  <p className="text-sm text-gray-600">Email: {member.user.email}</p>
                  <div className="mt-2 p-3 bg-indigo-50 rounded">
                     <p className="text-xs text-indigo-700 font-medium">Aktualna tajemnica:</p>
                     {member.mysteryDetails ? (
                         <>
                             <p className="text-sm font-semibold text-indigo-900">{member.mysteryDetails.name}</p>
                             <p className="text-xs text-gray-500">({member.mysteryDetails.group})</p>
                         </>
                     ) : (
                         <p className="text-sm text-gray-500 italic">Brak przydzielonej tajemnicy</p>
                     )}
                     {member.mysteryConfirmedAt ? (
                         <p className="text-xs text-green-600 mt-1">Potwierdzono: {new Date(member.mysteryConfirmedAt).toLocaleDateString('pl-PL')}</p>
                     ) : member.currentAssignedMystery ? (
                         <p className="text-xs text-red-600 mt-1">Niepotwierdzono</p>
                     ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* TODO: Przycisk/Formularz do dodawania nowych członków */}
          <div className="mt-6">
             <h3 className="text-lg font-semibold text-gray-700">Dodaj nowego członka</h3>
             <p className="text-sm text-gray-500 italic">(Funkcjonalność w przygotowaniu)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagedRoseDetailsPage;