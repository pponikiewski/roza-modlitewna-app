// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react'; // Dodaj useCallback
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { CurrentMysteryInfo, MysteryHistoryResponse, MysteryHistoryEntry } from '../types/rosary.types';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentMysteryInfo, setCurrentMysteryInfo] = useState<CurrentMysteryInfo | null>(null);
  const [mysteryHistory, setMysteryHistory] = useState<MysteryHistoryEntry[] | null>(null); // Zmieniamy na tablicę lub null
  const [roseNameForHistory, setRoseNameForHistory] = useState<string | null>(null); // Nazwa Róży dla historii
  const [isLoadingMystery, setIsLoadingMystery] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null); // Osobny error dla potwierdzenia
  const [historyError, setHistoryError] = useState<string | null>(null); // Osobny error dla historii
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchCurrentMystery = useCallback(async () => { // Użyj useCallback
    if (!user) return;
    setIsLoadingMystery(true);
    setError(null);
    try {
      const response = await apiClient.get<CurrentMysteryInfo>('/me/current-mystery');
      setCurrentMysteryInfo(response.data);
      // Jeśli mamy membershipId, możemy od razu spróbować załadować historię lub przygotować do załadowania
      if (response.data && response.data.membershipId) {
         // Można by od razu wywołać fetchMysteryHistory(response.data.membershipId)
         // lub poczekać na kliknięcie użytkownika
      }
    } catch (err: any) {
      console.error("Błąd pobierania aktualnej tajemnicy:", err);
      setError(err.response?.data?.error || 'Nie udało się pobrać danych o tajemnicy.');
      setCurrentMysteryInfo(null);
    } finally {
      setIsLoadingMystery(false);
    }
  }, [user]); // Zależność od user

  useEffect(() => {
    fetchCurrentMystery();
  }, [fetchCurrentMystery]); // Wywołaj po zamontowaniu i gdy fetchCurrentMystery się zmieni

  const handleConfirmMystery = async () => {
     if (!currentMysteryInfo || !currentMysteryInfo.membershipId || !currentMysteryInfo.mystery) {
         setConfirmError('Brak danych o członkostwie lub tajemnicy do potwierdzenia.');
         return;
     }
     setIsConfirming(true);
     setConfirmError(null);
     try {
         const response = await apiClient.patch<CurrentMysteryInfo>(`/me/memberships/${currentMysteryInfo.membershipId}/confirm-mystery`);
         setCurrentMysteryInfo(response.data); // Zaktualizuj dane, w tym confirmedAt
     } catch (err: any) {
         console.error("Błąd potwierdzania tajemnicy:", err);
         setConfirmError(err.response?.data?.error || 'Nie udało się potwierdzić tajemnicy.');
     } finally {
        setIsConfirming(false);
     }
  };
  
  const fetchMysteryHistory = async () => {
     if (!currentMysteryInfo || !currentMysteryInfo.membershipId) {
         setHistoryError('Brak informacji o członkostwie, aby pobrać historię.');
         return;
     }
     setIsLoadingHistory(true);
     setHistoryError(null);
     try {
         const response = await apiClient.get<MysteryHistoryResponse>(`/me/memberships/${currentMysteryInfo.membershipId}/mystery-history`);
         setMysteryHistory(response.data.history);
         setRoseNameForHistory(response.data.roseName);
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

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Sekcja nagłówka i wylogowania (bez zmian) */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Witaj, {user.name || user.email}!
          </h1>
          <button onClick={logout} /* ... */ >Wyloguj</button>
        </div>

        {error && <p className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</p>}

        {/* Sekcja Aktualnej Tajemnicy */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            Twoja Róża: <span className="font-normal">{isLoadingMystery ? 'Ładowanie...' : currentMysteryInfo?.roseName || 'Brak danych Róży'}</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">Rola w systemie: {user.role}</p>
          
          {isLoadingMystery ? (
            <p className="text-gray-600 py-4">Ładowanie aktualnej tajemnicy...</p>
          ) : currentMysteryInfo && currentMysteryInfo.mystery ? (
            <div>
              {/* Wyświetlanie tajemnicy, rozważania, obrazka (bez zmian) */}
              <h3 className="text-2xl font-semibold text-indigo-700 mb-2">{currentMysteryInfo.mystery.name}</h3>
              <p className="text-sm text-gray-500 mb-3">({currentMysteryInfo.mystery.group})</p>
              {currentMysteryInfo.mystery.imageUrl && ( <img src={currentMysteryInfo.mystery.imageUrl} /* ... */ /> )}
              <div className="bg-indigo-50 p-4 rounded-md mb-4"> {/* ... rozważanie ... */} </div>
              
              {confirmError && <p className="mb-2 p-2 text-sm text-red-600 bg-red-100 rounded">{confirmError}</p>}
              {currentMysteryInfo.confirmedAt ? (
                <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">
                  Zapoznanie z tajemnicą potwierdzone dnia: {new Date(currentMysteryInfo.confirmedAt).toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              ) : (
                <button onClick={handleConfirmMystery} disabled={isConfirming} /* ... */ >
                  {isConfirming ? 'Potwierdzanie...' : 'Potwierdzam zapoznanie się z tajemnicą'}
                </button>
              )}
            </div>
          ) : currentMysteryInfo && !currentMysteryInfo.mystery ? (
            <p className="text-gray-600 py-4">Nie masz jeszcze przydzielonej tajemnicy w Róży "{currentMysteryInfo.roseName}". Poczekaj na przydział.</p>
          ) : !isLoadingMystery ? ( // Dodatkowe sprawdzenie, by nie pokazywać, gdy error jest już wyświetlony
             <p className="text-gray-600 py-4">Brak informacji o członkostwie lub nie udało się załadować danych.</p>
          ) : null }
        </div>

        {/* Sekcja Historii Tajemnic */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
             <h2 className="text-xl font-semibold text-gray-700 mb-3">
                 Historia Twoich Tajemnic {roseNameForHistory && `w Róży "${roseNameForHistory}"`}
             </h2>
             
             {historyError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{historyError}</p>}

             {!mysteryHistory && !isLoadingHistory && currentMysteryInfo?.membershipId && (
                 <button 
                     onClick={fetchMysteryHistory}
                     className="mb-4 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                 >
                     Pokaż historię
                 </button>
             )}
             {isLoadingHistory && <p className="text-gray-600">Ładowanie historii...</p>}

             {mysteryHistory && mysteryHistory.length > 0 && (
                 <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                     {mysteryHistory.map(entry => (
                         <li key={entry.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                             <p className="font-semibold text-gray-800">{entry.mysteryDetails?.name || `Tajemnica ID: ${entry.mystery}`}</p>
                             <p className="text-sm text-gray-600">Grupa: {entry.mysteryDetails?.group || 'Brak danych'}</p>
                             <p className="text-xs text-gray-500">
                                 Przydzielono: {entry.assignedMonth}/{entry.assignedYear} 
                                 (dokładnie: {new Date(entry.assignedAt).toLocaleDateString('pl-PL')})
                             </p>
                             {entry.mysteryDetails?.contemplation && (
                                 <p className="mt-1 text-xs text-gray-600 italic">Rozważanie: {entry.mysteryDetails.contemplation.substring(0,100)}...</p>
                             )}
                         </li>
                     ))}
                 </ul>
             )}
             {mysteryHistory && mysteryHistory.length === 0 && (
                 <p className="text-gray-500">Brak historii przydzielonych tajemnic.</p>
             )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;