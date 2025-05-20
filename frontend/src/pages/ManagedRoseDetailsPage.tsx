// frontend/src/pages/ManagedRoseDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { RoseMembershipWithUserAndMystery, BasicRoseInfo } from '../types/zelator.types'; // Używamy BasicRoseInfo
import type { RoseListItemAdmin } from '../types/admin.types'; // Typ dla danych róży z endpointu admina
import { findMysteryById } from '../utils/constants';

const ManagedRoseDetailsPage: React.FC = () => {
  const { roseId } = useParams<{ roseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<RoseMembershipWithUserAndMystery[]>([]);
  const [currentRose, setCurrentRose] = useState<RoseListItemAdmin | null>(null); // Używamy pełniejszego typu
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [userIdToAdd, setUserIdToAdd] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);

  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    if (!roseId || !user) {
        // Jeśli jesteśmy w trakcie ładowania danych użytkownika, poczekajmy
        if(!user) console.log("fetchPageData: Brak użytkownika, czekam...");
        if(!roseId) console.log("fetchPageData: Brak roseId, czekam...");
        return;
    }

    setIsLoading(true);
    setPageError(null);
    setMembers([]);
    setCurrentRose(null);
    setAddMemberError(null); 
    setAddMemberSuccess(null);
    setRemoveMemberError(null);


    try {
      // 1. Pobierz szczegóły Róży
      // Używamy endpointu /admin/roses/:roseId, który (zgodnie z naszymi modyfikacjami)
      // powinien być dostępny dla Admina LUB Zelatora tej konkretnej Róży.
      const roseResponse = await apiClient.get<RoseListItemAdmin>(`/admin/roses/${roseId}`);
      setCurrentRose(roseResponse.data);

      // 2. Pobierz członków Róży
      // Endpoint /zelator/roses/:roseId/members również powinien być dostępny dla Admina i Zelatora tej Róży
      const membersResponse = await apiClient.get<RoseMembershipWithUserAndMystery[]>(`/zelator/roses/${roseId}/members`);
      const processedMembers = membersResponse.data.map(member => ({
        ...member,
        mysteryDetails: member.currentAssignedMystery 
          ? findMysteryById(member.currentAssignedMystery) 
          : undefined
      }));
      setMembers(processedMembers);

    } catch (err: any) {
      console.error("Błąd pobierania danych dla ManagedRoseDetailsPage:", err);
      if (err.response?.status === 403) {
         setPageError('Nie masz uprawnień do wyświetlania szczegółów tej Róży.');
      } else if (err.response?.status === 404) {
         setPageError(`Róża o ID "${roseId}" nie została znaleziona.`);
      } else {
         setPageError(err.response?.data?.error || 'Wystąpił błąd podczas ładowania danych strony.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [roseId, user]); // Zależność od user jest ważna

  useEffect(() => {
    // Wywołaj tylko jeśli mamy roseId i user (aby uniknąć niepotrzebnych zapytań)
    if (roseId && user) {
        fetchPageData();
    }
  }, [fetchPageData, roseId, user]); // Dodano roseId i user do zależności

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRose || !userIdToAdd.trim()) {
        setAddMemberError("ID użytkownika do dodania nie może być puste lub brak danych Róży.");
        return;
    }
    setIsAddingMember(true); setAddMemberError(null); setAddMemberSuccess(null);
    try {
        await apiClient.post(`/zelator/roses/${currentRose.id}/members`, { userIdToAdd });
        setAddMemberSuccess(`Pomyślnie dodano użytkownika (ID: ${userIdToAdd}). Odświeżanie listy...`);
        setUserIdToAdd('');
        // Odśwież dane strony po dodaniu członka
        // Opóźnienie, aby użytkownik zdążył zobaczyć komunikat sukcesu
        setTimeout(() => {
            fetchPageData(); 
            setAddMemberSuccess(null);
        }, 1500);
    } catch (err: any) {
        setAddMemberError(err.response?.data?.error || "Wystąpił błąd podczas dodawania członka.");
    } finally {
        setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (membershipIdToRemove: string) => {
    if (!currentRose) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tego członka z Róży? Tej akcji nie można cofnąć.")) {
        return;
    }
    setIsRemovingMember(membershipIdToRemove); setRemoveMemberError(null);
    try {
        await apiClient.delete(`/zelator/roses/${currentRose.id}/members/${membershipIdToRemove}`);
        // Odśwież dane strony po usunięciu członka
        fetchPageData();
        // Można dodać komunikat o sukcesie, np. używając setAddMemberSuccess lub dedykowanego stanu
    } catch (err: any) {
        setRemoveMemberError(err.response?.data?.error || "Nie udało się usunąć członka.");
    } finally {
        setIsRemovingMember(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xl">Ładowanie danych Róży...</div>;
  }

  if (pageError) {
    return (
        <div className="p-8 text-center flex flex-col justify-center items-center">
            <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4 text-lg">{pageError}</p>
            <RouterLink to="/zelator-dashboard" className="px-5 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
    );
  }

  if (!currentRose) {
    return ( // Ten stan nie powinien być często widoczny, jeśli pageError dobrze łapie 404
        <div className="p-8 text-center flex flex-col justify-center items-center">
            <p className="text-gray-700 bg-yellow-100 p-4 rounded-md mb-4">Nie można załadować danych Róży o ID: {roseId}.</p>
            <RouterLink to="/zelator-dashboard" className="px-5 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
            <RouterLink to="/zelator-dashboard" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {currentRose.name}
            </h1>
            {currentRose.description && <p className="text-md text-gray-600 mb-3 italic">"{currentRose.description}"</p>}
            <div className="text-xs text-gray-500 space-y-0.5">
                <p>Zelator: {currentRose.zelator?.name || currentRose.zelator?.email || 'Brak danych'} (ID: {currentRose.zelatorId})</p>
                <p>ID Róży: {currentRose.id}</p>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
             <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Dodaj Nowego Członka</h3>
             {addMemberError && <p className="mb-3 p-3 text-sm text-red-700 bg-red-100 rounded-md">{addMemberError}</p>}
             {addMemberSuccess && <p className="mb-3 p-3 text-sm text-green-700 bg-green-100 rounded-md">{addMemberSuccess}</p>}
             <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row sm:items-end gap-4">
                 <div className="flex-grow">
                     <label htmlFor="userIdToAdd" className="block text-sm font-medium text-gray-700 mb-1">
                         ID Użytkownika
                     </label>
                     <input
                         type="text"
                         id="userIdToAdd"
                         value={userIdToAdd}
                         onChange={(e) => setUserIdToAdd(e.target.value)}
                         placeholder="Wklej ID użytkownika z listy systemowej"
                         className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         required
                     />
                 </div>
                 <button
                     type="submit"
                     disabled={isAddingMember}
                     className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 min-w-[140px] h-[42px]"
                 >
                     {isAddingMember ? 'Dodawanie...' : 'Dodaj Członka'}
                 </button>
             </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-5 border-b pb-3">
            Członkowie Róży ({members.length} / {currentRose._count?.members ?? members.length} z {20})
            </h2>
          {removeMemberError && <p className="mb-3 p-3 text-sm text-red-700 bg-red-100 rounded-md">{removeMemberError}</p>}
          
          {!isLoading && members.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Ta Róża nie ma jeszcze żadnych członków.</p>
          ) : (
            <ul className="space-y-5">
              {members.map(member => (
                <li key={member.id} className="p-4 border border-gray-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                    <div className="flex-grow">
                       <p className="font-bold text-gray-800">{member.user.name || member.user.email}</p>
                       <p className="text-sm text-gray-600">{member.user.email}</p>
                       <p className="text-xs text-gray-400 mt-0.5">Rola systemowa: {member.user.role}</p>
                       
                       <div className="mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-100">
                           <p className="text-xs text-indigo-600 font-semibold mb-1">Aktualna tajemnica:</p>
                           {member.mysteryDetails ? (
                               <>
                                   <p className="text-md font-semibold text-indigo-800">{member.mysteryDetails.name}</p>
                                   <p className="text-xs text-gray-500 mb-1">({member.mysteryDetails.group})</p>
                                   {/* Można dodać rozwijane rozważanie
                                   <details className="text-xs">
                                       <summary className="cursor-pointer text-indigo-500 hover:underline">Pokaż rozważanie</summary>
                                       <p className="mt-1 text-gray-700">{member.mysteryDetails.contemplation}</p>
                                   </details>
                                   */}
                               </>
                           ) : member.currentAssignedMystery ? (
                                <p className="text-sm text-orange-600 italic">Tajemnica o ID: {member.currentAssignedMystery} (oczekuje na odświeżenie)</p>
                           ) : (
                               <p className="text-sm text-gray-500 italic">Brak przydzielonej tajemnicy</p>
                           )}

                           {member.currentAssignedMystery && ( // Pokaż status potwierdzenia tylko jeśli jest tajemnica
                                member.mysteryConfirmedAt ? (
                                    <p className="text-xs font-medium text-green-600 mt-2 bg-green-100 px-2 py-1 rounded inline-block">
                                        Potwierdzono: {new Date(member.mysteryConfirmedAt).toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit', year:'numeric'})}
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-red-600 mt-2 bg-red-100 px-2 py-1 rounded inline-block">
                                        Oczekuje na potwierdzenie
                                    </p>
                                )
                           )}
                       </div>
                    </div>
                    <div className="flex-shrink-0 pt-1 self-center sm:self-start"> {/* Przycisk usuwania */}
                       <button 
                           onClick={() => handleRemoveMember(member.id)}
                           className="px-3.5 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 min-w-[100px]"
                           disabled={isRemovingMember === member.id}
                       >
                           {isRemovingMember === member.id ? 'Usuwanie...' : 'Usuń'}
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