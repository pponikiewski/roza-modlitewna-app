// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { 
    UserMembership, 
    MysteryHistoryResponse, 
    MysteryHistoryEntry,
} from '../types/rosary.types';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'sonner'; // <<<< ZMIANA: Dodano import

const DashboardPage: React.FC = () => {
  const { user } = useAuth(); 
  
  const [myMemberships, setMyMemberships] = useState<UserMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(true);
  // const [membershipsError, setMembershipsError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  const [selectedMembershipForHistory, setSelectedMembershipForHistory] = useState<UserMembership | null>(null);
  const [mysteryHistory, setMysteryHistory] = useState<MysteryHistoryEntry[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // const [historyError, setHistoryError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto

  // const [confirmError, setConfirmError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto
  const [isConfirming, setIsConfirming] = useState<string | null>(null);

  const fetchMyMemberships = useCallback(async () => {
    if (!user) {
        setIsLoadingMemberships(false);
        return;
    }
    setIsLoadingMemberships(true);
    // setMembershipsError(null); // <<<< ZMIANA: Usunięto
    try {
      const response = await apiClient.get<UserMembership[]>('/me/memberships');
      setMyMemberships(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania członkostw użytkownika:", err);
      toast.error(err.response?.data?.error || 'Nie udało się pobrać listy Twoich Róż.'); // <<<< ZMIANA: Dodano toast
      setMyMemberships([]);
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyMemberships();
    } else {
        setMyMemberships([]);
        setIsLoadingMemberships(false);
    }
  }, [user, fetchMyMemberships]);


  const handleConfirmMystery = async (membershipIdToConfirm: string, currentMysteryId: string | null) => {
     if (!membershipIdToConfirm || !currentMysteryId) {
         toast.warning('Brak ID członkostwa lub tajemnicy do potwierdzenia.'); // <<<< ZMIANA: Dodano toast
         return;
     }
     setIsConfirming(membershipIdToConfirm);
     // setConfirmError(null); // <<<< ZMIANA: Usunięto
     try {
         const response = await apiClient.patch<UserMembership>(`/me/memberships/${membershipIdToConfirm}/confirm-mystery`);
         setMyMemberships(prevMemberships => 
            prevMemberships.map(memb => 
                memb.id === membershipIdToConfirm 
                ? { ...memb, ...response.data } 
                : memb
            )
         );
         toast.success("Tajemnica została potwierdzona!"); // <<<< ZMIANA: Dodano toast
     } catch (err: any) {
         console.error("Błąd potwierdzania tajemnicy:", err);
         toast.error(err.response?.data?.error || 'Nie udało się potwierdzić tajemnicy.'); // <<<< ZMIANA: Dodano toast
     } finally {
        setIsConfirming(null);
     }
  };
  
  const fetchMysteryHistory = async (membership: UserMembership) => {
     if (!membership || !membership.id) {
         toast.warning('Brak informacji o członkostwie, aby pobrać historię.'); // <<<< ZMIANA: Dodano toast
         return;
     }
     setSelectedMembershipForHistory(membership);
     setIsLoadingHistory(true);
     // setHistoryError(null); // <<<< ZMIANA: Usunięto
     setMysteryHistory(null);
     try {
         const response = await apiClient.get<MysteryHistoryResponse>(`/me/memberships/${membership.id}/mystery-history`);
         setMysteryHistory(response.data.history);
     } catch (err:any) {
         console.error("Błąd pobierania historii tajemnic:", err);
         toast.error(err.response?.data?.error || 'Nie udało się pobrać historii tajemnic.'); // <<<< ZMIANA: Dodano toast
         setMysteryHistory(null);
     } finally {
         setIsLoadingHistory(false);
     }
  };
     
  if (!user) {
    return <p className="p-8 text-center text-red-600">Błąd: Brak danych użytkownika. Proszę się zalogować.</p>;
  }

  if (isLoadingMemberships) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-xl text-gray-700">Ładowanie Twoich danych...</div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-lg shadow-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Witaj, {user.name || user.email}!
            </h1>
            <p className="text-sm text-gray-500">Twoja rola w systemie: <span className="font-semibold">{user.role}</span></p>
        </div>

        {/* {membershipsError && <p className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{membershipsError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
        
        {myMemberships.length > 0 ? (
            myMemberships.map(membership => (
            <div key={membership.id} className="bg-white p-6 rounded-lg shadow-xl">
                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-1">
                    {membership.rose.name}
                    </h2>
                    {membership.rose.description && <p className="text-sm text-gray-600 italic">"{membership.rose.description}"</p>}
                    <p className="text-xs text-gray-500 mt-1">
                        Zelator: {membership.rose.zelator.name || membership.rose.zelator.email}
                    </p>
                </div>
                
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

                <div className="mt-6 mb-6 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Intencje Udostępnione przez Członków:</h4>
                    {membership.sharedIntentionsPreview && membership.sharedIntentionsPreview.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm">
                            {membership.sharedIntentionsPreview.map(intention => (
                                <div key={intention.id} className="p-2.5 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-gray-800 whitespace-pre-wrap text-xs sm:text-sm">
                                        {intention.text}
                                    </p>
                                    {intention.author && (
                                    <p className="text-xs text-green-700 mt-1">
                                        Przez: {intention.author?.name || intention.author?.email || 'Anonim'}
                                        <span className="text-gray-500 ml-2">
                                            ({new Date(intention.createdAt).toLocaleDateString('pl-PL')})
                                        </span>
                                    </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Brak udostępnionych intencji w tej Róży.</p>
                    )}
                    <RouterLink 
                        to="/my-intentions"
                        className="mt-3 inline-block text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                        Dodaj lub zarządzaj swoimi intencjami
                    </RouterLink>
                </div>

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

                    {/* {confirmError && isConfirming === membership.id && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{confirmError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
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

                <div className="mt-6 border-t border-gray-200 pt-4">
                    {selectedMembershipForHistory?.id === membership.id && isLoadingHistory ? (
                        <p className="text-sm text-gray-600">Ładowanie historii...</p>
                    ) : selectedMembershipForHistory?.id === membership.id && mysteryHistory ? (
                        <>
                            <button onClick={() => { setMysteryHistory(null); setSelectedMembershipForHistory(null); }} className="text-sm text-blue-600 hover:underline mb-3 block">Ukryj historię</button>
                            {/* {historyError && <p className="mb-2 p-2 text-xs text-red-600 bg-red-100 rounded">{historyError}</p>} */} {/* <<<< ZMIANA: Usunięto */}
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
                            Pokaż historię moich tajemnic
                        </button>
                    )}
                </div>
            </div>
            ))
        ) : (
            !isLoadingMemberships && /* !membershipsError && */ ( // <<<< ZMIANA: Usunięto !membershipsError
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <p className="text-gray-700 text-lg">Nie należysz jeszcze do żadnej Róży.</p>
                    <p className="text-gray-500 mt-2">Skontaktuj się z Zelatorem lub Administratorem, aby dołączyć do Róży.</p>
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default DashboardPage;