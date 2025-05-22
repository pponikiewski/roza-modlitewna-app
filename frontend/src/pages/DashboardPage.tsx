// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { 
    UserMembership, 
    MysteryHistoryResponse, 
    MysteryHistoryEntry, 
    UserIntention, 
    // RoseMainIntentionData, // Ten typ jest zawarty w UserMembership.currentMainIntentionForRose
    // RosaryMysteryDetails // Ten typ jest zawarty w UserMembership.currentMysteryFullDetails
} from '../types/rosary.types';
import { Link as RouterLink } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth(); 
  
  const [myMemberships, setMyMemberships] = useState<UserMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);

  const [selectedMembershipForHistory, setSelectedMembershipForHistory] = useState<UserMembership | null>(null);
  const [mysteryHistory, setMysteryHistory] = useState<MysteryHistoryEntry[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);

  const [myIntentions, setMyIntentions] = useState<UserIntention[]>([]);
  const [isLoadingIntentions, setIsLoadingIntentions] = useState(true); // Domyślnie true
  const [intentionsError, setIntentionsError] = useState<string | null>(null);
  const [newIntentionText, setNewIntentionText] = useState('');
  const [shareWithRoseId, setShareWithRoseId] = useState<string>('');
  const [isAddingIntention, setIsAddingIntention] = useState(false);
  const [addIntentionError, setAddIntentionError] = useState<string | null>(null);
  const [addIntentionSuccess, setAddIntentionSuccess] = useState<string | null>(null);

    // NOWE STANY DLA EDYCJI INTENCJI
  const [editingIntention, setEditingIntention] = useState<UserIntention | null>(null);
  const [editIntentionText, setEditIntentionText] = useState('');
  const [editShareWithRoseId, setEditShareWithRoseId] = useState<string>(''); // ID Róży do udostępnienia przy edycji
  const [isUpdatingIntention, setIsUpdatingIntention] = useState(false);
  const [updateIntentionError, setUpdateIntentionError] = useState<string | null>(null);
  const [updateIntentionSuccess, setUpdateIntentionSuccess] = useState<string | null>(null);

  // STAN DLA USUWANIA INTENCJI
  const [isDeletingIntention, setIsDeletingIntention] = useState<string | null>(null); // Przechowuje ID usuwanej intencji
  const [deleteIntentionError, setDeleteIntentionError] = useState<string | null>(null);

  const fetchMyMemberships = useCallback(async () => {
    if (!user) {
        setIsLoadingMemberships(false); // Zakończ ładowanie, jeśli nie ma usera
        return;
    }
    setIsLoadingMemberships(true);
    setMembershipsError(null);
    try {
      const response = await apiClient.get<UserMembership[]>('/me/memberships'); // Zmieniony URL
      setMyMemberships(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania członkostw użytkownika (fetchMyMemberships):", err);
      setMembershipsError(err.response?.data?.error || 'Nie udało się pobrać listy Twoich Róż.');
      setMyMemberships([]); // Wyczyść w razie błędu, aby nie wyświetlać starych danych
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [user]);

  const fetchMyIntentions = useCallback(async () => {
    if (!user) {
        setIsLoadingIntentions(false); // Zakończ ładowanie
        return;
    }
    setIsLoadingIntentions(true);
    setIntentionsError(null);
    try {
        const response = await apiClient.get<UserIntention[]>('/me/intentions');
        setMyIntentions(response.data);
    } catch (err: any) {
        // Linia 64, o której wspominałeś, jest prawdopodobnie tutaj w bloku catch
        console.error("Błąd pobierania intencji użytkownika (fetchMyIntentions):", err); 
        setIntentionsError(err.response?.data?.error || 'Nie udało się pobrać Twoich intencji.');
        setMyIntentions([]); // Wyczyść w razie błędu
    } finally {
        setIsLoadingIntentions(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyMemberships();
      fetchMyIntentions();
    } else {
        // Jeśli użytkownik nie jest dostępny (np. wylogowanie), wyczyść dane
        setMyMemberships([]);
        setMyIntentions([]);
        setIsLoadingMemberships(false);
        setIsLoadingIntentions(false);
    }
  }, [user, fetchMyMemberships, fetchMyIntentions]);


  const handleConfirmMystery = async (membershipIdToConfirm: string, currentMysteryId: string | null) => {
     if (!membershipIdToConfirm || !currentMysteryId) {
         setConfirmError('Brak ID członkostwa lub tajemnicy do potwierdzenia.');
         return;
     }
     setIsConfirming(membershipIdToConfirm);
     setConfirmError(null);
     try {
         const response = await apiClient.patch<UserMembership>(`/me/memberships/${membershipIdToConfirm}/confirm-mystery`);
         setMyMemberships(prevMemberships => 
            prevMemberships.map(memb => 
                memb.id === membershipIdToConfirm 
                ? response.data 
                : memb
            )
         );
     } catch (err: any) {
         console.error("Błąd potwierdzania tajemnicy:", err);
         setConfirmError(err.response?.data?.error || 'Nie udało się potwierdzić tajemnicy.');
     } finally {
        setIsConfirming(null);
     }
  };
  
  const fetchMysteryHistory = async (membership: UserMembership) => {
     if (!membership || !membership.id) {
         setHistoryError('Brak informacji o członkostwiem, aby pobrać historię.');
         return;
     }
     setSelectedMembershipForHistory(membership);
     setIsLoadingHistory(true);
     setHistoryError(null);
     setMysteryHistory(null);
     try {
         const response = await apiClient.get<MysteryHistoryResponse>(`/me/memberships/${membership.id}/mystery-history`);
         setMysteryHistory(response.data.history);
     } catch (err:any) {
         console.error("Błąd pobierania historii tajemnic:", err);
         setHistoryError(err.response?.data?.error || 'Nie udało się pobrać historii tajemnic.');
         setMysteryHistory(null);
     } finally {
         setIsLoadingHistory(false);
     }
  };

  const handleAddIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntentionText.trim()) {
        setAddIntentionError("Treść intencji nie może być pusta.");
        return;
    }
    if (shareWithRoseId && myMemberships.find(m => m.rose.id === shareWithRoseId) === undefined && user?.role !== 'ADMIN') {
        setAddIntentionError("Wybrano nieprawidłową Różę do udostępnienia lub nie należysz do tej Róży.");
        return;
    }

    setIsAddingIntention(true);
    setAddIntentionError(null);
    setAddIntentionSuccess(null);
    try {
        const payload: { text: string; isSharedWithRose: boolean; sharedWithRoseId?: string } = {
            text: newIntentionText,
            isSharedWithRose: !!shareWithRoseId,
        };
        if (shareWithRoseId) {
            payload.sharedWithRoseId = shareWithRoseId;
        }

        await apiClient.post<UserIntention>('/me/intentions', payload);
        setAddIntentionSuccess("Intencja została pomyślnie dodana.");
        setNewIntentionText('');
        setShareWithRoseId('');
        fetchMyIntentions();
        setTimeout(() => setAddIntentionSuccess(null), 3000);
    } catch (err: any) {
        setAddIntentionError(err.response?.data?.error || "Nie udało się dodać intencji.");
    } finally {
        setIsAddingIntention(false);
    }
  };

  // Funkcja do edytowania intencji
    // NOWE FUNKCJE:

  const openEditIntentionModal = (intention: UserIntention) => {
    setEditingIntention(intention);
    setEditIntentionText(intention.text);
    setEditShareWithRoseId(intention.sharedWithRoseId || ''); // Ustaw ID Róży lub pusty string
    setUpdateIntentionError(null);
    setUpdateIntentionSuccess(null);
  };

  const closeEditIntentionModal = () => {
    setEditingIntention(null);
  };

  const handleUpdateIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntention || !editIntentionText.trim()) {
      setUpdateIntentionError("Treść intencji nie może być pusta.");
      return;
    }
    // Walidacja udostępniania (podobna jak przy dodawaniu)
    if (editShareWithRoseId && myMemberships.find(m => m.rose.id === editShareWithRoseId) === undefined && user?.role !== 'ADMIN') {
        setUpdateIntentionError("Wybrano nieprawidłową Różę do udostępnienia lub nie należysz do tej Róży.");
        return;
    }

    setIsUpdatingIntention(true);
    setUpdateIntentionError(null);
    setUpdateIntentionSuccess(null);
    try {
      const payload: { text: string; isSharedWithRose: boolean; sharedWithRoseId?: string | null } = {
        text: editIntentionText,
        isSharedWithRose: !!editShareWithRoseId,
        sharedWithRoseId: editShareWithRoseId || null, // Wyślij null, jeśli nie udostępniono
      };

      await apiClient.patch(`/me/intentions/${editingIntention.id}`, payload);
      setUpdateIntentionSuccess("Intencja została pomyślnie zaktualizowana.");
      fetchMyIntentions(); // Odśwież listę
      setTimeout(closeEditIntentionModal, 1500);
    } catch (err: any) {
      setUpdateIntentionError(err.response?.data?.error || "Nie udało się zaktualizować intencji.");
    } finally {
      setIsUpdatingIntention(false);
    }
  };

  const handleDeleteIntention = async (intentionId: string) => {
     if (!window.confirm("Czy na pewno chcesz usunąć tę intencję? Tej akcji nie można cofnąć.")) {
         return;
     }
     setIsDeletingIntention(intentionId);
     setDeleteIntentionError(null);
     try {
         await apiClient.delete(`/me/intentions/${intentionId}`);
         // Odśwież listę intencji po usunięciu
         setMyIntentions(prev => prev.filter(intention => intention.id !== intentionId));
         // Można dodać komunikat o sukcesie, jeśli potrzeba
     } catch (err:any) {
         console.error("Błąd usuwania intencji:", err);
         setDeleteIntentionError(err.response?.data?.error || "Nie udało się usunąć intencji.");
     } finally {
         setIsDeletingIntention(null);
     }
  };
     
  if (!user) { // Ten warunek powinien być obsłużony przez ProtectedRoute w App.tsx
    return <p className="p-8 text-center text-red-600">Błąd: Brak danych użytkownika. Proszę się zalogować.</p>;
  }

  // Główny ekran ładowania, jeśli jeszcze nie ma danych o członkostwach ANI intencjach
  if (isLoadingMemberships || isLoadingIntentions) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-xl text-gray-700">Ładowanie Twoich danych...</div>
            {/* Można tu dodać bardziej zaawansowany spinner/loader */}
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100"> {/* Główny kontener strony dashboardu */}
      <div className="max-w-4xl mx-auto space-y-8"> {/* Kontener centrujący treść i dodający odstępy między sekcjami */}
        
        {/* Karta powitalna użytkownika */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Witaj, {user.name || user.email}!
            </h1>
            <p className="text-sm text-gray-500">Twoja rola w systemie: <span className="font-semibold">{user.role}</span></p>
        </div>

        {/* Wyświetlanie błędu ładowania członkostw, jeśli wystąpił */}
        {membershipsError && <p className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{membershipsError}</p>}
        
        {/* Sekcja Twoich Róż */}
        {myMemberships.length > 0 ? (
            myMemberships.map(membership => (
            <div key={membership.id} className="bg-white p-6 rounded-lg shadow-xl"> {/* Karta dla każdej Róży */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-1">
                    {membership.rose.name}
                    </h2>
                    {membership.rose.description && <p className="text-sm text-gray-600 italic">"{membership.rose.description}"</p>}
                    <p className="text-xs text-gray-500 mt-1">
                        Zelator: {membership.rose.zelator.name || membership.rose.zelator.email}
                    </p>
                </div>
                
                {/* Główna Intencja Róży */}
                {membership.currentMainIntentionForRose ? (
                <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Główna Intencja tej Róży (ten miesiąc):</h4>
                    <p className="text-amber-700 text-sm whitespace-pre-wrap">{membership.currentMainIntentionForRose.text}</p>
                    {membership.currentMainIntentionForRose.author && (
                        <p className="text-xs text-amber-600 mt-1.5">
                            Ustawiona przez: {membership.currentMainIntentionForRose.author.name || membership.currentMainIntentionForRose.author.email}
                        </p>
                    )}
                </div>
                ) : (
                <p className="mb-6 text-sm text-gray-500 italic">Brak ustawionej głównej intencji dla tej Róży na bieżący miesiąc.</p>
                )}

                {/* Aktualna Tajemnica Użytkownika w tej Róży */}
                {membership.currentMysteryFullDetails ? (
                <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-blue-700">{membership.currentMysteryFullDetails.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">({membership.currentMysteryFullDetails.group})</p>
                    
                    {membership.currentMysteryFullDetails.imageUrl && (
                    <img 
                        src={membership.currentMysteryFullDetails.imageUrl} 
                        alt={`Grafika dla ${membership.currentMysteryFullDetails.name}`} 
                        className="w-full max-w-xs sm:max-w-sm mx-auto h-auto rounded-lg shadow-md mb-4 object-contain" 
                        style={{maxHeight: '200px'}}
                    />
                    )}

                    <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-1 text-sm">Rozważanie:</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{membership.currentMysteryFullDetails.contemplation}</p>
                    </div>

                    {confirmError && isConfirming === membership.id && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{confirmError}</p>}
                    {membership.mysteryConfirmedAt ? (
                    <p className="text-green-600 bg-green-100 p-2.5 rounded-md text-sm font-medium inline-block">
                        Potwierdzono: {new Date(membership.mysteryConfirmedAt).toLocaleString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    ) : (
                    <button
                        onClick={() => handleConfirmMystery(membership.id, membership.currentMysteryFullDetails!.id)}
                        disabled={isConfirming === membership.id}
                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                    >
                        {isConfirming === membership.id ? 'Potwierdzanie...' : 'Potwierdzam zapoznanie się'}
                    </button>
                    )}
                </div>
                ) : (
                <p className="text-gray-600 mt-4 py-2">Nie masz jeszcze przydzielonej tajemnicy w tej Róży. Poczekaj na przydział.</p>
                )}

                {/* Historia Tajemnic dla tego członkostwa */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    {selectedMembershipForHistory?.id === membership.id && isLoadingHistory ? (
                        <p className="text-sm text-gray-600">Ładowanie historii...</p>
                    ) : selectedMembershipForHistory?.id === membership.id && mysteryHistory ? (
                        <>
                            <button onClick={() => { setMysteryHistory(null); setSelectedMembershipForHistory(null); }} className="text-sm text-blue-600 hover:underline mb-3 block">Ukryj historię</button>
                            {historyError && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{historyError}</p>}
                            {mysteryHistory.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                    {mysteryHistory.map(entry => (
                                    <div key={entry.id} className="p-2.5 bg-gray-100 rounded-md text-xs">
                                        <p className="font-medium text-gray-800">{entry.mysteryDetails?.name || `Tajemnica ID: ${entry.mystery}`}</p>
                                        <p className="text-gray-500">{entry.mysteryDetails?.group}</p>
                                        <p className="text-gray-500">
                                            Przydzielono: {entry.assignedMonth}/{entry.assignedYear} 
                                            <span className="text-gray-400"> ({new Date(entry.assignedAt).toLocaleDateString('pl-PL')})</span>
                                        </p>
                                    </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-500">Brak historii przydzielonych tajemnic dla tej Róży.</p>}
                        </>
                    ) : (
                        <button onClick={() => fetchMysteryHistory(membership)} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                            Pokaż historię tej Róży
                        </button>
                    )}
                </div>
            </div>
            ))
        ) : (
            // Wyświetlaj tylko jeśli nie ładujemy i nie ma błędu z ładowaniem członkostw
            !isLoadingMemberships && !membershipsError && (
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-gray-700 text-lg">Nie należysz jeszcze do żadnej Róży.</p>
                    <p className="text-gray-500 mt-2">Skontaktuj się z Zelatorem lub Administratorem, aby dołączyć do Róży.</p>
                </div>
            )
        )}

        {/* Sekcja Moje Intencje Osobiste */}
        <div className="bg-white p-6 rounded-lg shadow-xl mt-8"> {/* Dodano mt-8 dla spójności odstępów */}
          <h2 className="text-2xl font-semibold text-gray-700 mb-5 border-b pb-3">Moje Intencje Osobiste</h2>
          
          {/* Formularz dodawania nowej intencji */}
          <form onSubmit={handleAddIntentionSubmit} className="mb-6 p-4 bg-slate-50 rounded-md border">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Dodaj nową intencję:</h3>
            {addIntentionError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{addIntentionError}</p>}
            {addIntentionSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{addIntentionSuccess}</p>}
            
            <div className="mb-4">
                <label htmlFor="newIntentionText" className="block text-sm font-medium text-gray-700">Treść intencji:</label>
                <textarea
                    id="newIntentionText"
                    rows={3}
                    value={newIntentionText}
                    onChange={(e) => setNewIntentionText(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Wpisz treść swojej intencji..."
                    required
                />
            </div>
            {myMemberships.length > 0 && ( // Pokaż opcję udostępnienia tylko jeśli użytkownik należy do jakiejś Róży
                <div className="mb-4">
                    <label htmlFor="shareWithRoseId" className="block text-sm font-medium text-gray-700">
                        Udostępnij Róży (opcjonalnie):
                    </label>
                    <select
                        id="shareWithRoseId"
                        value={shareWithRoseId}
                        onChange={(e) => setShareWithRoseId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">-- Nie udostępniaj (intencja prywatna) --</option>
                        {myMemberships.map(membership => (
                            <option key={membership.rose.id} value={membership.rose.id}>
                                {membership.rose.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <button
                type="submit"
                disabled={isAddingIntention}
                className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60"
            >
                {isAddingIntention ? 'Dodawanie...' : 'Dodaj Intencję'}
            </button>
          </form>

          {/* Lista intencji użytkownika */}
          {isLoadingIntentions ? (
            <p className="text-gray-600 text-center py-4">Ładowanie Twoich intencji...</p>
          ) : intentionsError ? (
            <p className="text-red-500 bg-red-100 p-3 rounded-md">{intentionsError}</p>
          ) : myIntentions.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Nie masz jeszcze żadnych zapisanych intencji.</p>
          ) : (
            <div className="space-y-3">
                {myIntentions.map(intention => (
                    <div key={intention.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-800 whitespace-pre-wrap mb-2">{intention.text}</p>
                        <div className="text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <span>Dodano: {new Date(intention.createdAt).toLocaleDateString('pl-PL')}</span>
                            {intention.isSharedWithRose && intention.sharedWithRose ? (
                                <span className="mt-1 sm:mt-0 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    Udostępniono Róży: {intention.sharedWithRose.name}
                                </span>
                            ) : (
                                <span className="mt-1 sm:mt-0 px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                                    Prywatna
                                </span>
                            )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 space-x-3">
                            <button 
                                onClick={() => openEditIntentionModal(intention)} // Załóżmy, że ta funkcja istnieje
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                // disabled={isDeletingIntention === intention.id || !!editingIntention} // Dostosuj logikę disabled
                            >
                                Edytuj
                            </button>
                            <button 
                                onClick={() => handleDeleteIntention(intention.id)} // Załóżmy, że ta funkcja istnieje
                                className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                disabled={isDeletingIntention === intention.id /* || !!editingIntention */} // Dostosuj logikę disabled
                            >
                                {isDeletingIntention === intention.id ? 'Usuwanie...' : 'Usuń'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div> {/* Koniec sekcji Moje Intencje */}

        {/* Modal do Edycji Intencji (jeśli funkcje open/close/submit są zdefiniowane) */}
        {editingIntention && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
                    <button onClick={closeEditIntentionModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-gray-800 border-b pb-3">Edytuj Intencję</h3>
                    {updateIntentionError && <p className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{updateIntentionError}</p>}
                    {updateIntentionSuccess && <p className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{updateIntentionSuccess}</p>}
                    
                    <form onSubmit={handleUpdateIntentionSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="editIntentionText" className="block text-sm font-medium text-gray-700">Treść intencji:</label>
                            <textarea
                                id="editIntentionText"
                                rows={4}
                                value={editIntentionText} // Powiązane ze stanem editIntentionText
                                onChange={(e) => setEditIntentionText(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        {myMemberships.length > 0 && (
                            <div>
                                <label htmlFor="editShareWithRoseId" className="block text-sm font-medium text-gray-700">
                                    Udostępnij Róży:
                                </label>
                                <select
                                    id="editShareWithRoseId"
                                    value={editShareWithRoseId} // Powiązane ze stanem editShareWithRoseId
                                    onChange={(e) => setEditShareWithRoseId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">-- Prywatna (nie udostępniaj) --</option>
                                    {myMemberships.map(membership => (
                                        <option key={membership.rose.id} value={membership.rose.id}>
                                            {membership.rose.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center justify-end space-x-3 pt-3 border-t mt-5">
                            <button
                                type="button"
                                onClick={closeEditIntentionModal} // Funkcja zamykająca modal
                                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingIntention} // Stan isUpdatingIntention
                                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isUpdatingIntention ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )} {/* Koniec modala edycji intencji */}

      </div>
    </div>
  );
};

export default DashboardPage;