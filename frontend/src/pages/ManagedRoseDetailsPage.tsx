// frontend/src/pages/ManagedRoseDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; // Usunięto useNavigate, nie jest używany
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { RoseMembershipWithUserAndMystery } from '../types/zelator.types';
import type { RoseListItemAdmin } from '../types/admin.types';
import { findMysteryById } from '../utils/constants';
import type { RoseMainIntentionData, UserIntention } from '../types/rosary.types';
import { toast } from 'sonner'; // <<<< ZMIANA: Dodano import

const ManagedRoseDetailsPage: React.FC = () => {
  const { roseId } = useParams<{ roseId: string }>();
  const { user } = useAuth();
  
  const [members, setMembers] = useState<RoseMembershipWithUserAndMystery[]>([]);
  const [currentRose, setCurrentRose] = useState<RoseListItemAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [pageError, setPageError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const [userIdToAdd, setUserIdToAdd] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  // const [addMemberError, setAddMemberError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto
  // const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  // const [removeMemberError, setRemoveMemberError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const [currentMainIntention, setCurrentMainIntention] = useState<RoseMainIntentionData | null>(null);
  const [intentionText, setIntentionText] = useState('');
  const [intentionMonth, setIntentionMonth] = useState<number>(new Date().getMonth() + 1);
  const [intentionYear, setIntentionYear] = useState<number>(new Date().getFullYear());
  const [isSubmittingIntention, setIsSubmittingIntention] = useState(false);
  // const [intentionError, setIntentionError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto
  // const [intentionSuccess, setIntentionSuccess] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const [sharedIntentions, setSharedIntentions] = useState<UserIntention[]>([]);
  // const [sharedIntentionsError, setSharedIntentionsError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto


  const fetchPageData = useCallback(async () => {
    if (!roseId || !user) {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);
    // setPageError(null); // <<<< ZMIANA: Usunięto
    setMembers([]);
    setCurrentRose(null);
    setCurrentMainIntention(null);
    setSharedIntentions([]);

    try {
      const [
        roseResponse, 
        membersResponse, 
        currentIntentionResponse,
        sharedIntentionsResponse
      ] = await Promise.all([
        apiClient.get<RoseListItemAdmin>(`/admin/roses/${roseId}`),
        apiClient.get<RoseMembershipWithUserAndMystery[]>(`/zelator/roses/${roseId}/members`),
        apiClient.get<RoseMainIntentionData>(`/zelator/roses/${roseId}/main-intention/current`).catch(() => null),
        apiClient.get<UserIntention[]>(`/roses/${roseId}/shared-intentions`).catch(() => ({ data: [] }))
      ]);

      setCurrentRose(roseResponse.data);
      
      const processedMembers = membersResponse.data.map(m => ({
        ...m,
        mysteryDetails: m.currentAssignedMystery 
          ? findMysteryById(m.currentAssignedMystery) 
          : undefined
      }));
      setMembers(processedMembers);

      if (currentIntentionResponse && currentIntentionResponse.data) {
        setCurrentMainIntention(currentIntentionResponse.data);
        const today = new Date();
        if (currentIntentionResponse.data.month === intentionMonth && currentIntentionResponse.data.year === intentionYear) {
            setIntentionText(currentIntentionResponse.data.text);
        } else if (currentIntentionResponse.data.month === (today.getMonth() +1) && currentIntentionResponse.data.year === today.getFullYear()){
             setIntentionText(currentIntentionResponse.data.text);
             setIntentionMonth(today.getMonth() + 1);
             setIntentionYear(today.getFullYear());
        }
         else {
            setIntentionText('');
        }
      } else {
        setCurrentMainIntention(null);
        setIntentionText('');
        const today = new Date();
        setIntentionMonth(today.getMonth() + 1);
        setIntentionYear(today.getFullYear());
      }

      if (sharedIntentionsResponse && sharedIntentionsResponse.data) {
         setSharedIntentions(sharedIntentionsResponse.data);
      } else {
         setSharedIntentions([]);
      }

    } catch (err: any) {
      console.error("Błąd pobierania danych dla ManagedRoseDetailsPage:", err);
      let errorMessage = 'Wystąpił błąd podczas ładowania danych strony.';
      if (err.response?.status === 403) {
         errorMessage = 'Nie masz uprawnień do wyświetlania szczegółów tej Róży.';
      } else if (err.response?.status === 404) {
         errorMessage = `Róża o ID "${roseId}" nie została znaleziona.`;
      } else if (err.response?.data?.error) {
         errorMessage = err.response.data.error;
      }
      toast.error(errorMessage); // <<<< ZMIANA: Dodano toast
      // setPageError(errorMessage); // <<<< ZMIANA: Usunięto
    } finally {
      setIsLoading(false);
    }
  }, [roseId, user, intentionMonth, intentionYear]);

  useEffect(() => {
    if (roseId && user) {
      fetchPageData();
    }
  }, [roseId, user, fetchPageData]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRose || !userIdToAdd.trim()) {
        toast.warning("ID użytkownika do dodania nie może być puste lub brak danych Róży."); // <<<< ZMIANA: Dodano toast
        return;
    }
    setIsAddingMember(true);
    try {
        await apiClient.post(`/zelator/roses/${currentRose.id}/members`, { userIdToAdd });
        toast.success(`Pomyślnie dodano użytkownika (ID: ${userIdToAdd}).`); // <<<< ZMIANA: Dodano toast
        setUserIdToAdd('');
        fetchPageData(); 
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Wystąpił błąd podczas dodawania członka."); // <<<< ZMIANA: Dodano toast
    } finally {
        setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (membershipIdToRemove: string) => {
    if (!currentRose) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tego członka z Róży? Tej akcji nie można cofnąć.")) {
        return;
    }
    setIsRemovingMember(membershipIdToRemove);
    try {
        await apiClient.delete(`/zelator/roses/${currentRose.id}/members/${membershipIdToRemove}`);
        toast.success("Członek został usunięty z Róży."); // <<<< ZMIANA: Dodano toast
        fetchPageData();
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Nie udało się usunąć członka."); // <<<< ZMIANA: Dodano toast
    } finally {
        setIsRemovingMember(null);
    }
  };

  const handleMainIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRose || !intentionText.trim()) {
        toast.warning("Treść intencji jest wymagana."); // <<<< ZMIANA: Dodano toast
        return;
    }
    setIsSubmittingIntention(true);
    try {
        const payload = {
            text: intentionText,
            isActive: true 
        };
        const response = await apiClient.post<RoseMainIntentionData>(`/zelator/roses/${currentRose.id}/main-intention`, payload);
        setCurrentMainIntention(response.data);
        // setIntentionText(response.data.text); // Można zostawić lub usunąć, zależnie od preferencji UX
        toast.success("Główna intencja na bieżący miesiąc została pomyślnie zapisana/zaktualizowana."); // <<<< ZMIANA: Dodano toast
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Nie udało się zapisać głównej intencji."); // <<<< ZMIANA: Dodano toast
    } finally {
        setIsSubmittingIntention(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <div className="text-xl text-gray-700">Ładowanie danych Róży...</div>
        </div>
      </div>
    );
  }

  // if (pageError) { // <<<< ZMIANA: Usunięto ten blok, toasty są globalne
  //   return (
  //       <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center">
  //           <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4 text-lg">{pageError}</p>
  //           <RouterLink to="/zelator-dashboard" className="px-5 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
  //               ← Wróć do Panelu Zelatora
  //           </RouterLink>
  //       </div>
  //   );
  // }

  if (!currentRose && !isLoading) { // Sprawdzamy !isLoading, aby nie pokazywać, gdy już jest toast błędu
    return (
        <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center">
            <p className="text-gray-700 bg-yellow-100 p-4 rounded-md mb-4">
                Nie można załadować danych Róży o ID: {roseId}. Sprawdź powiadomienia, aby uzyskać więcej informacji.
            </p>
            <RouterLink to="/zelator-dashboard" className="px-5 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-6">
            <RouterLink to="/zelator-dashboard" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            ← Wróć do Panelu Zelatora
            </RouterLink>
        </div>
        
        {currentRose && (
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
        )}
        
        <section className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Główna Intencja Róży (na bieżący miesiąc)</h2>
          {currentMainIntention ? (
            <div className="mb-4 p-4 bg-amber-100 border-l-4 border-amber-500 rounded-r-md">
                <h4 className="text-sm font-semibold text-amber-700">Aktualna na {currentMainIntention.month}/{currentMainIntention.year}:</h4>
                <p className="text-amber-800 text-sm whitespace-pre-wrap mt-1">{currentMainIntention.text}</p>
                {currentMainIntention.author && <p className="text-xs text-amber-600 mt-1.5">Dodał: {currentMainIntention.author.name || currentMainIntention.author.email}</p>}
            </div>
          ) : (
            <p className="mb-4 text-sm text-gray-500 italic">Brak ustawionej głównej intencji na bieżący miesiąc/rok. Możesz ją ustawić poniżej.</p>
          )}

          <form onSubmit={handleMainIntentionSubmit} className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Ustaw lub zmień intencję na bieżący miesiąc/rok:</h4>
            {/* {intentionError && <p className="p-2 text-sm text-red-600 bg-red-100 rounded">{intentionError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
            {/* {intentionSuccess && <p className="p-2 text-sm text-green-600 bg-green-100 rounded">{intentionSuccess}</p>} */} {/* <<<< ZMIANA: Usunięto */}
            
            <div>
                <label htmlFor="intentionText" className="block text-sm font-medium text-gray-700">Treść intencji <span className="text-red-500">*</span></label>
                <textarea
                    id="intentionText"
                    rows={4}
                    value={intentionText}
                    onChange={(e) => setIntentionText(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Wpisz główną intencję modlitewną dla Róży..."
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isSubmittingIntention}
                className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
                {isSubmittingIntention ? 'Zapisywanie...' : 'Zapisz Główną Intencję'}
            </button>
          </form>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Intencje Udostępnione w Róży "{currentRose?.name}"</h2>
            
            {/* {!isLoading && sharedIntentionsError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{sharedIntentionsError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
            
            {!isLoading && sharedIntentions.length === 0 /* && !sharedIntentionsError */ && ( // <<<< ZMIANA: Usunięto !sharedIntentionsError
            <p className="text-gray-600 text-center py-4">Brak udostępnionych intencji w tej Róży.</p>
            )}

            {sharedIntentions.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sharedIntentions.map(intention => (
                <div key={intention.id} className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap mb-1.5">{intention.text}</p>
                    <p className="text-xs text-blue-700">
                    Przez: <span className="font-medium">{intention.author?.name || intention.author?.email || 'Anonim'}</span>
                    <span className="text-gray-500 ml-2">({new Date(intention.createdAt).toLocaleDateString('pl-PL')})</span>
                    </p>
                </div>
                ))}
            </div>
            )}
        </section>

        <section className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Dodaj Nowego Członka</h3>
            {/* {addMemberError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{addMemberError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
            {/* {addMemberSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{addMemberSuccess}</p>} */} {/* <<<< ZMIANA: Usunięto */}
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
        </section>

        <section className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-5 border-b pb-3">
            Członkowie Róży ({currentRose?._count?.members ?? members.length} / {20})
          </h2>
          {/* {removeMemberError && <p className="mb-3 p-3 text-sm text-red-700 bg-red-100 rounded-md">{removeMemberError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
          
          {!isLoading && members.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">Ta Róża nie ma jeszcze żadnych członków.</p>
          ) : (
            <ul className="space-y-5">
              {members.map(member => (
                <li key={member.id} className="p-4 border border-gray-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                    <div className="flex-grow">
                       <p className="font-bold text-gray-800">{member.user.name || member.user.email}</p>
                       <p className="text-sm text-gray-600">{member.user.email} <span className="text-xs text-gray-400">(ID: {member.user.id})</span></p>
                       <p className="text-xs text-gray-400 mt-0.5">Rola systemowa: {member.user.role}</p>
                       
                       <div className="mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-100">
                           <p className="text-xs text-indigo-600 font-semibold mb-1">Aktualna tajemnica:</p>
                           {member.mysteryDetails ? (
                               <>
                                   <p className="text-md font-semibold text-indigo-800">{member.mysteryDetails.name}</p>
                                   <p className="text-xs text-gray-500 mb-1">({member.mysteryDetails.group})</p>
                               </>
                           ) : member.currentAssignedMystery ? (
                                <p className="text-sm text-orange-600 italic">Tajemnica o ID: {member.currentAssignedMystery} (oczekuje na odświeżenie)</p>
                           ) : (
                               <p className="text-sm text-gray-500 italic">Brak przydzielonej tajemnicy</p>
                           )}

                           {member.currentAssignedMystery && (
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
                    <div className="flex-shrink-0 pt-1 self-center sm:self-start">
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
        </section>
      </div>
    </div>
  );
};

export default ManagedRoseDetailsPage;