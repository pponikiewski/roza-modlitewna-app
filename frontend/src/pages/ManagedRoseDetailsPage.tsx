// frontend/src/pages/ManagedRoseDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; // Usunięto useNavigate, nie jest używany
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { RoseMembershipWithUserAndMystery, AvailableUser } from '../types/zelator.types';
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

  // Nowy state dla dostępnych użytkowników
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoadingAvailableUsers, setIsLoadingAvailableUsers] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // Nowy state dla multi-select

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
    if (!currentRose) {
        toast.warning("Brak danych Róży."); 
        return;
    }

    // Sprawdź czy są wybrani użytkownicy lub wpisane ID
    const usersToAdd = selectedUsers.length > 0 ? selectedUsers : (userIdToAdd.trim() ? [userIdToAdd.trim()] : []);
    
    if (usersToAdd.length === 0) {
        toast.warning("Wybierz użytkowników z listy lub wpisz ID użytkownika."); 
        return;
    }

    setIsAddingMember(true);
    
    try {
        // Dodaj użytkowników jeden po drugim
        const results = [];
        for (const userId of usersToAdd) {
            try {
                const response = await apiClient.post(`/zelator/roses/${currentRose.id}/members`, { userIdToAdd: userId });
                results.push({ userId, success: true, data: response.data });
            } catch (err: any) {
                results.push({ userId, success: false, error: err.response?.data?.error || 'Błąd' });
            }
        }
        
        // Sprawdź wyniki
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        if (successful.length > 0) {
            toast.success(`Pomyślnie dodano ${successful.length} użytkowników do Róży.`);
        }
        
        if (failed.length > 0) {
            failed.forEach(result => {
                toast.error(`Błąd dla użytkownika ${result.userId}: ${result.error}`);
            });
        }
        
        // Reset form
        setUserIdToAdd('');
        setSelectedUsers([]);
        setShowUserSelector(false);
        fetchPageData(); 
    } catch (err: any) {
        toast.error("Wystąpił nieoczekiwany błąd podczas dodawania członków.");
    } finally {
        setIsAddingMember(false);
    }
  };

  // Funkcja do pobierania dostępnych użytkowników
  const fetchAvailableUsers = async () => {
    setIsLoadingAvailableUsers(true);
    try {
      const response = await apiClient.get<AvailableUser[]>('/zelator/available-users');
      setAvailableUsers(response.data);
    } catch (err: any) {
      toast.error("Nie udało się pobrać listy dostępnych użytkowników.");
      console.error('Błąd pobierania dostępnych użytkowników:', err);
    } finally {
      setIsLoadingAvailableUsers(false);
    }
  };

  // Funkcja do pokazania/ukrycia selektora użytkowników
  const toggleUserSelector = () => {
    if (!showUserSelector && availableUsers.length === 0) {
      fetchAvailableUsers();
    }
    setShowUserSelector(!showUserSelector);
    // Reset selection when hiding
    if (showUserSelector) {
      setSelectedUsers([]);
      setUserIdToAdd('');
    }
  };

  // Funkcja do toggle użytkownika w multi-select
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    // Clear manual input when using multi-select
    setUserIdToAdd('');
  };

  // Funkcja do dodania wszystkich wybranych użytkowników
  const addSelectedUsers = () => {
    if (selectedUsers.length === 0) {
      toast.warning("Nie wybrano żadnych użytkowników.");
      return;
    }
    
    // Trigger form submission with selected users
    const form = document.getElementById('add-member-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Dodaj Nowych Członków</h3>
            
            <div className="space-y-4">
              {/* Formularz z input do kliknięcia */}
              <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="userIdToAdd" className="block text-sm font-medium text-gray-700 mb-1">
                    Wybierz użytkowników do dodania
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="userIdToAdd"
                      value={selectedUsers.length > 0 ? `Wybrano ${selectedUsers.length} użytkowników` : userIdToAdd}
                      onChange={(e) => setUserIdToAdd(e.target.value)}
                      onClick={toggleUserSelector}
                      placeholder="Kliknij aby wybrać użytkowników lub wpisz ID ręcznie"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
                      readOnly={selectedUsers.length > 0}
                    />
                    {selectedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUsers([]);
                          setUserIdToAdd('');
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista dostępnych użytkowników z multi-select */}
                {showUserSelector && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Wybierz użytkowników (możesz wybrać kilku):
                      </h4>
                      {selectedUsers.length > 0 && (
                        <span className="text-sm font-medium text-indigo-600">
                          Wybrano: {selectedUsers.length}
                        </span>
                      )}
                    </div>
                    
                    {isLoadingAvailableUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-600">Ładowanie użytkowników...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Brak dostępnych użytkowników. Wszyscy użytkownicy należą już do róż.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {availableUsers.map((user) => {
                            const isSelected = selectedUsers.includes(user.id);
                            return (
                              <div
                                key={user.id}
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                                onClick={() => toggleUserSelection(user.id)}
                              >
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleUserSelection(user.id)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 flex-grow">
                                  <p className="font-medium text-gray-900">
                                    {user.name || user.email}
                                  </p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                  <p className="text-xs text-gray-400">
                                    Rola: {user.role} • ID: {user.id}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Przyciski akcji */}
                        <div className="flex gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => setSelectedUsers(availableUsers.map(u => u.id))}
                            className="flex-1 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50"
                          >
                            Wybierz wszystkich
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUsers([])}
                            className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            Wyczyść
                          </button>
                          <button
                            type="button"
                            onClick={addSelectedUsers}
                            disabled={selectedUsers.length === 0}
                            className="flex-1 px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Dodaj ({selectedUsers.length})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Główny przycisk dodawania */}
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="w-full px-5 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60"
                >
                  {isAddingMember ? 'Dodawanie...' : 
                   selectedUsers.length > 0 ? `Dodaj ${selectedUsers.length} członków` : 'Dodaj Członka'}
                </button>
              </form>
            </div>
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
                                   
                                   {member.mysteryDetails.imageUrl && (
                                   <img 
                                       src={member.mysteryDetails.imageUrl} 
                                       alt={`Grafika dla ${member.mysteryDetails.name}`} 
                                       className="w-full max-w-xs mx-auto h-auto rounded-lg shadow-sm mt-2 mb-2 object-contain" 
                                       style={{maxHeight: '150px'}}
                                   />
                                   )}

                                   {member.mysteryDetails.contemplation && (
                                   <div className="mt-2 p-2 bg-white/80 rounded border border-indigo-200">
                                       <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                           {member.mysteryDetails.contemplation.length > 200 
                                               ? `${member.mysteryDetails.contemplation.substring(0, 200)}...` 
                                               : member.mysteryDetails.contemplation
                                           }
                                       </p>
                                   </div>
                                   )}
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