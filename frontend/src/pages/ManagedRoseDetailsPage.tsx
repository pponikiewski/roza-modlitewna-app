// frontend/src/pages/ManagedRoseDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { RoseMembershipWithUserAndMystery, BasicRoseInfo } from '../types/zelator.types'; // Upewnij się, że BasicRoseInfo jest tu lub w zelator.types
import { findMysteryById } from '../utils/constants';

const ManagedRoseDetailsPage: React.FC = () => {
  const { roseId } = useParams<{ roseId: string }>(); // Pobieramy ID Róży z URL
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<RoseMembershipWithUserAndMystery[]>([]);
  const [currentRose, setCurrentRose] = useState<BasicRoseInfo | null>(null); // Stan do przechowywania danych o aktualnej Róży
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userIdToAdd, setUserIdToAdd] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);

  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);

  const fetchRoseDetailsAndMembers = useCallback(async () => {
    if (!roseId || !user) return;
    setIsLoading(true);
    setError(null);
    setRemoveMemberError(null);
    setAddMemberSuccess(null);
    setAddMemberError(null);
    try {
      const response = await apiClient.get<RoseMembershipWithUserAndMystery[]>(`/zelator/roses/${roseId}/members`);
      
      const processedMembers = response.data.map(member => ({
        ...member,
        mysteryDetails: member.currentAssignedMystery 
          ? findMysteryById(member.currentAssignedMystery) 
          : undefined // Zmieniono null na undefined dla spójności z opcjonalnym polem
      }));
      setMembers(processedMembers);

      // Ustaw dane Róży na podstawie informacji z pierwszego członkostwa (jeśli są członkowie)
      // lub zrób osobny request po dane Róży, jeśli nie ma członków lub chcesz pełniejsze dane Róży
      if (response.data.length > 0 && response.data[0].rose) {
        setCurrentRose(response.data[0].rose);
      } else {
        // Jeśli nie ma członków, spróbuj pobrać dane samej Róży
        // To wymaga endpointu GET /zelator/roses/:roseId lub /admin/roses/:roseId
        try {
          // Załóżmy, że Admin ma dostęp do GET /admin/roses/:id, a Zelator też może go użyć
          // W idealnym świecie Zelator miałby swój endpoint /zelator/roses/:id
          const roseInfoResponse = await apiClient.get<BasicRoseInfo>(`/admin/roses/${roseId}`);
          setCurrentRose(roseInfoResponse.data);
        } catch (roseErr: any) {
          console.warn(`Nie udało się pobrać danych Róży ${roseId}:`, roseErr.message);
          setError(`Nie udało się pobrać szczegółów Róży. ${roseErr.response?.data?.error || ''}`);
          // Można przekierować lub pokazać błąd krytyczny, jeśli Róża nie istnieje
          // np. if (roseErr.response?.status === 404) navigate('/zelator-dashboard');
        }
      }

    } catch (err: any) {
      console.error("Błąd pobierania członków lub danych Róży:", err);
      if (err.response?.status === 403) {
         setError('Nie masz uprawnień do wyświetlania tej Róży.');
      } else if (err.response?.status === 404) {
         setError('Róża o podanym ID nie została znaleziona lub nie masz do niej dostępu.');
      } else {
         setError(err.response?.data?.error || 'Nie udało się pobrać danych o członkach Róży.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [roseId, user, navigate]); // Dodano navigate do zależności useCallback

  useEffect(() => {
    fetchRoseDetailsAndMembers();
  }, [fetchRoseDetailsAndMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!roseId || !userIdToAdd.trim()) {
         setAddMemberError("ID użytkownika do dodania nie może być puste.");
         return;
     }
     setIsAddingMember(true);
     setAddMemberError(null);
     setAddMemberSuccess(null);
     try {
         await apiClient.post(`/zelator/roses/${roseId}/members`, { userIdToAdd });
         fetchRoseDetailsAndMembers(); 
         setAddMemberSuccess(`Pomyślnie dodano użytkownika (ID: ${userIdToAdd}) do Róży.`);
         setUserIdToAdd('');
     } catch (err: any) {
         console.error("Błąd dodawania członka:", err);
         setAddMemberError(err.response?.data?.error || "Wystąpił błąd podczas dodawania członka.");
     } finally {
         setIsAddingMember(false);
     }
  };

  const handleRemoveMember = async (membershipIdToRemove: string) => {
     if (!roseId) return;
     if (!window.confirm("Czy na pewno chcesz usunąć tego członka z Róży? Tej akcji nie można cofnąć.")) {
         return;
     }
     setIsRemovingMember(membershipIdToRemove);
     setRemoveMemberError(null);
     try {
         await apiClient.delete(`/zelator/roses/${roseId}/members/${membershipIdToRemove}`);
         setMembers(prevMembers => prevMembers.filter(member => member.id !== membershipIdToRemove));
         // alert('Członek został pomyślnie usunięty.'); // Można zastąpić innym powiadomieniem
     } catch (err: any) {
         console.error("Błąd usuwania członka:", err);
         setRemoveMemberError(err.response?.data?.error || "Nie udało się usunąć członka.");
         fetchRoseDetailsAndMembers(); // Odśwież listę w razie błędu
     } finally {
         setIsRemovingMember(null);
     }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xl">Ładowanie danych Róży...</div>;
  }

  if (error) { // Jeśli wystąpił błąd podczas ładowania Róży/członków
    return (
        <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center">
            <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">{error}</p>
            <RouterLink to="/zelator-dashboard" className="text-blue-600 hover:underline">
                ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
    );
  }

  if (!currentRose) { // Jeśli Róża nie została znaleziona (np. 404 z backendu)
    return (
        <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center">
            <p className="text-gray-700 bg-yellow-100 p-4 rounded-md mb-4">Nie znaleziono danych dla tej Róży (ID: {roseId}).</p>
            <RouterLink to="/zelator-dashboard" className="text-blue-600 hover:underline">
                ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <RouterLink to="/zelator-dashboard" className="text-blue-600 hover:underline mb-6 inline-block text-sm">
          ← Wróć do Panelu Zelatora
        </RouterLink>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          Zarządzanie Różą: <span className="text-indigo-700">{currentRose.name}</span>
        </h1>
        {currentRose.description && <p className="text-sm text-gray-600 mb-6 italic">"{currentRose.description}"</p>}
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
             <h3 className="text-xl font-semibold text-gray-700 mb-4">Dodaj Nowego Członka</h3>
             {addMemberError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{addMemberError}</p>}
             {addMemberSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{addMemberSuccess}</p>}
             <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row sm:items-end gap-3">
                 <div className="flex-grow">
                     <label htmlFor="userIdToAdd" className="block text-sm font-medium text-gray-700 mb-1">
                         ID Użytkownika (znajdziesz w panelu Admina)
                     </label>
                     <input
                         type="text"
                         id="userIdToAdd"
                         value={userIdToAdd}
                         onChange={(e) => setUserIdToAdd(e.target.value)}
                         placeholder="Wklej ID użytkownika"
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         required
                     />
                 </div>
                 <button
                     type="submit"
                     disabled={isAddingMember}
                     className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-60 sm:self-end h-[42px] min-w-[130px]"
                 >
                     {isAddingMember ? 'Dodawanie...' : 'Dodaj Członka'}
                 </button>
             </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Członkowie Róży ({members.length} / {20}):</h2>
          {removeMemberError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{removeMemberError}</p>}
          {members.length === 0 ? (
            <p className="text-gray-600">Ta Róża nie ma jeszcze żadnych członków.</p>
          ) : (
            <ul className="space-y-4">
              {members.map(member => (
                <li key={member.id} className="p-4 border rounded-md bg-gray-50 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                    <div className="flex-grow">
                       <p className="font-semibold text-gray-800">{member.user.name || member.user.email}</p>
                       <p className="text-sm text-gray-600">Email: {member.user.email} <span className="text-xs text-gray-400">(ID: {member.user.id})</span></p>
                       {/* <p className="text-xs text-gray-500">ID Członkostwa: {member.id}</p> */}
                       <div className="mt-2 p-3 bg-indigo-50 rounded">
                           <p className="text-xs text-indigo-700 font-medium">Aktualna tajemnica:</p>
                           {member.mysteryDetails ? (
                               <>
                                   <p className="text-sm font-semibold text-indigo-900">{member.mysteryDetails.name}</p>
                                   <p className="text-xs text-gray-500">({member.mysteryDetails.group})</p>
                               </>
                           ) : member.currentAssignedMystery ? (
                                <p className="text-sm text-orange-600 italic">Tajemnica o ID: {member.currentAssignedMystery} (brak szczegółów)</p>
                           ) : (
                               <p className="text-sm text-gray-500 italic">Brak przydzielonej tajemnicy</p>
                           )}
                           {member.mysteryConfirmedAt ? (
                               <p className="text-xs text-green-600 mt-1">Potwierdzono: {new Date(member.mysteryConfirmedAt).toLocaleDateString('pl-PL')}</p>
                           ) : member.currentAssignedMystery ? (
                               <p className="text-xs text-red-600 mt-1">Oczekuje na potwierdzenie</p>
                           ) : null}
                       </div>
                    </div>
                    <div className="flex-shrink-0 pt-1">
                       <button 
                           onClick={() => handleRemoveMember(member.id)}
                           className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                           disabled={isRemovingMember === member.id}
                       >
                           {isRemovingMember === member.id ? 'Usuwanie...' : 'Usuń z Róży'}
                       </button> 
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagedRoseDetailsPage;