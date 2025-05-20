// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { CurrentMysteryInfo, MysteryHistoryResponse, MysteryHistoryEntry, UserMembership, RosaryMysteryDetails } from '../types/rosary.types'; // Upewnij się, że wszystkie typy są tu lub w `rosary.types.ts`
import { Link as RouterLink } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth(); // Pobieramy usera i funkcję logout z kontekstu

  // Stan dla informacji o "głównej" lub pierwszej tajemnicy (może być później usunięty lub zmieniony)
  const [currentMysteryInfo, setCurrentMysteryInfo] = useState<CurrentMysteryInfo | null>(null);
  const [isLoadingMystery, setIsLoadingMystery] = useState(true); // Ładowanie dla "głównej" tajemnicy
  
  // Stany dla listy członkostw użytkownika
  const [myMemberships, setMyMemberships] = useState<UserMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);

  // Stany dla historii tajemnic (dla wybranego członkostwa)
  const [selectedMembershipForHistory, setSelectedMembershipForHistory] = useState<UserMembership | null>(null);
  const [mysteryHistory, setMysteryHistory] = useState<MysteryHistoryEntry[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Ogólny błąd strony i błąd potwierdzenia
  const [pageError, setPageError] = useState<string | null>(null); // Zastępuje poprzedni `error`
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<string | null>(null); // Przechowuje ID członkostwa, które jest potwierdzane


  // Pobieranie "głównej" aktualnej tajemnicy (dla pierwszego członkostwa - do ewentualnej refaktoryzacji)
  const fetchCurrentMysteryDEPRECATED = useCallback(async () => {
    if (!user) return;
    setIsLoadingMystery(true);
    setPageError(null); // Resetujemy ogólny błąd strony
    try {
      const response = await apiClient.get<CurrentMysteryInfo>('/me/current-mystery');
      setCurrentMysteryInfo(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania 'głównej' aktualnej tajemnicy:", err);
      setPageError(err.response?.data?.error || 'Nie udało się pobrać danych o głównej tajemnicy.');
      setCurrentMysteryInfo(null);
    } finally {
      setIsLoadingMystery(false);
    }
  }, [user]);

  // Pobieranie listy członkostw użytkownika
  const fetchMyMemberships = useCallback(async () => {
    if (!user) return;
    setIsLoadingMemberships(true);
    setMembershipsError(null);
    try {
      const response = await apiClient.get<UserMembership[]>('/me/my-memberships');
      setMyMemberships(response.data);
      // Jeśli jest to pierwsze ładowanie i nie ma currentMysteryInfo, a są członkostwa,
      // możemy ustawić currentMysteryInfo na podstawie pierwszego członkostwa z listy
      if (!currentMysteryInfo && response.data.length > 0) {
        const firstMembership = response.data[0];
        if (firstMembership) {
            setCurrentMysteryInfo({
                membershipId: firstMembership.id,
                roseName: firstMembership.rose.name,
                mystery: firstMembership.currentMysteryFullDetails,
                confirmedAt: firstMembership.mysteryConfirmedAt
            });
        }
      }

    } catch (err: any) {
      console.error("Błąd pobierania członkostw użytkownika:", err);
      setMembershipsError(err.response?.data?.error || 'Nie udało się pobrać listy Twoich Róż.');
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [user, currentMysteryInfo]); // Dodano currentMysteryInfo, aby uniknąć wielokrotnego ustawiania

  useEffect(() => {
    // fetchCurrentMysteryDEPRECATED(); // Możemy to wywołać lub polegać na danych z fetchMyMemberships
    fetchMyMemberships();
  }, [fetchMyMemberships]); // fetchCurrentMysteryDEPRECATED nie jest już w zależnościach, bo fetchMyMemberships może obsłużyć jego cel


  const handleConfirmMystery = async (membershipIdToConfirm: string, mysteryId: string | null) => {
     if (!membershipIdToConfirm || !mysteryId) {
         setConfirmError('Brak ID członkostwa lub tajemnicy do potwierdzenia.');
         return;
     }
     setIsConfirming(membershipIdToConfirm); // Ustawiamy ID potwierdzanego członkostwa
     setConfirmError(null);
     try {
         const response = await apiClient.patch<CurrentMysteryInfo>(`/me/memberships/${membershipIdToConfirm}/confirm-mystery`);
         // Zaktualizuj stan myMemberships, aby odzwierciedlić potwierdzenie
         setMyMemberships(prevMemberships => 
            prevMemberships.map(memb => 
                memb.id === membershipIdToConfirm 
                ? { ...memb, mysteryConfirmedAt: response.data.confirmedAt, currentMysteryFullDetails: response.data.mystery } 
                : memb
            )
         );
         // Jeśli to było "główne" currentMysteryInfo, też je zaktualizuj
         if (currentMysteryInfo && currentMysteryInfo.membershipId === membershipIdToConfirm) {
            setCurrentMysteryInfo(prev => prev ? {...prev, confirmedAt: response.data.confirmedAt, mystery: response.data.mystery } : null);
         }

     } catch (err: any) {
         console.error("Błąd potwierdzania tajemnicy:", err);
         setConfirmError(err.response?.data?.error || 'Nie udało się potwierdzić tajemnicy.');
     } finally {
        setIsConfirming(null); // Reset
     }
  };
  
  const fetchMysteryHistory = async (membership: UserMembership) => {
     if (!membership || !membership.id) {
         setHistoryError('Brak informacji o członkostwie, aby pobrać historię.');
         return;
     }
     setSelectedMembershipForHistory(membership); // Zapisz, dla której róży jest historia
     setIsLoadingHistory(true);
     setHistoryError(null);
     setMysteryHistory(null); // Wyczyść poprzednią historię
     try {
         const response = await apiClient.get<MysteryHistoryResponse>(`/me/memberships/${membership.id}/mystery-history`);
         setMysteryHistory(response.data.history);
         // roseNameForHistory jest już w selectedMembershipForHistory.rose.name
     } catch (err:any) {
         console.error("Błąd pobierania historii tajemnic:", err);
         setHistoryError(err.response?.data?.error || 'Nie udało się pobrać historii tajemnic.');
         setMysteryHistory(null);
     } finally {
         setIsLoadingHistory(false);
     }
  };

  if (!user) {
    return <p className="p-8 text-center text-red-600">Błąd: Brak danych użytkownika. Proszę się zalogować.</p>;
  }

  // Główny widok ładowania, jeśli jeszcze nie ma danych o członkostwach
  if (isLoadingMemberships) {
    return <div className="p-8 text-center text-xl">Ładowanie Twoich danych...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">
            Witaj, {user.name || user.email}!
          </h1>
        </div>

        {membershipsError && <p className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{membershipsError}</p>}
        {pageError && <p className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{pageError}</p>}

        {myMemberships.length === 0 && !isLoadingMemberships && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-gray-700 text-lg">Nie należysz jeszcze do żadnej Róży.</p>
            <p className="text-gray-500 mt-2">Skontaktuj się z Zelatorem lub Administratorem, aby dołączyć do Róży.</p>
          </div>
        )}

        {myMemberships.map(membership => (
          <div key={membership.id} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              Twoja Róża: <span className="font-medium text-indigo-600">{membership.rose.name}</span>
            </h2>
            <p className="text-sm text-gray-500 mb-1">Zelator: {membership.rose.zelator.name || membership.rose.zelator.email}</p>
            {membership.rose.description && <p className="text-sm text-gray-500 mb-4 italic">"{membership.rose.description}"</p>}
            
            {membership.currentMysteryFullDetails ? (
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-blue-700 mt-4 mb-2">{membership.currentMysteryFullDetails.name}</h3>
                <p className="text-xs text-gray-500 mb-3">({membership.currentMysteryFullDetails.group})</p>
                
                {membership.currentMysteryFullDetails.imageUrl && (
                   <img 
                       src={membership.currentMysteryFullDetails.imageUrl} 
                       alt={`Grafika dla ${membership.currentMysteryFullDetails.name}`} 
                       className="w-full max-w-sm mx-auto h-auto rounded-lg shadow mb-4 object-contain" 
                       style={{maxHeight: '250px'}}
                   />
                )}

                <div className="bg-blue-50 p-3 rounded-md mb-4">
                   <h4 className="font-semibold text-blue-800 mb-1 text-sm">Rozważanie:</h4>
                   <p className="text-gray-700 text-sm whitespace-pre-wrap">{membership.currentMysteryFullDetails.contemplation}</p>
                </div>

                {confirmError && isConfirming === membership.id && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{confirmError}</p>}
                {membership.mysteryConfirmedAt ? (
                  <p className="text-green-600 bg-green-100 p-2 rounded-md text-xs">
                    Zapoznanie z tajemnicą potwierdzone dnia: {new Date(membership.mysteryConfirmedAt).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                ) : (
                  <button
                    onClick={() => handleConfirmMystery(membership.id, membership.currentMysteryFullDetails!.id)}
                    disabled={isConfirming === membership.id}
                    className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                  >
                    {isConfirming === membership.id ? 'Potwierdzanie...' : 'Potwierdzam zapoznanie się'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mt-4 py-2">Nie masz jeszcze przydzielonej tajemnicy w tej Róży. Poczekaj na przydział.</p>
            )}

            {/* Przycisk do pokazania/ukrycia historii dla tej konkretnej róży */}
            <div className="mt-4 border-t pt-4">
                {selectedMembershipForHistory?.id === membership.id && isLoadingHistory ? (
                    <p className="text-sm text-gray-600">Ładowanie historii...</p>
                ) : selectedMembershipForHistory?.id === membership.id && mysteryHistory ? (
                    <>
                        <button onClick={() => { setMysteryHistory(null); setSelectedMembershipForHistory(null); }} className="text-sm text-blue-600 hover:underline mb-2">Ukryj historię</button>
                        {historyError && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{historyError}</p>}
                        {mysteryHistory.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                {mysteryHistory.map(entry => (
                                <li key={entry.id} className="p-2 bg-gray-100 rounded">
                                    <span className="font-medium">{entry.mysteryDetails?.name || `ID: ${entry.mystery}`}</span>
                                    <span className="text-gray-500 ml-2">({entry.assignedMonth}/{entry.assignedYear})</span>
                                </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">Brak historii dla tej Róży.</p>}
                    </>
                ) : (
                    <button onClick={() => fetchMysteryHistory(membership)} className="text-sm text-blue-600 hover:underline">
                        Pokaż historię tej Róży
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;