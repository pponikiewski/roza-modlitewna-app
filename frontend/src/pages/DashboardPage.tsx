// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { CurrentMysteryInfo, MysteryHistoryResponse } from '../types/rosary.types'; // Używamy type import

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentMysteryInfo, setCurrentMysteryInfo] = useState<CurrentMysteryInfo | null>(null);
  const [mysteryHistory, setMysteryHistory] = useState<MysteryHistoryResponse | null>(null); // Na razie nieużywane
  const [isLoadingMystery, setIsLoadingMystery] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);


  useEffect(() => {
    const fetchCurrentMystery = async () => {
      if (!user) return;
      setIsLoadingMystery(true);
      setError(null);
      try {
        const response = await apiClient.get<CurrentMysteryInfo>('/me/current-mystery');
        setCurrentMysteryInfo(response.data);
      } catch (err: any) {
        console.error("Błąd pobierania aktualnej tajemnicy:", err);
        setError(err.response?.data?.error || 'Nie udało się pobrać danych o tajemnicy.');
        setCurrentMysteryInfo(null);
      } finally {
        setIsLoadingMystery(false);
      }
    };

    fetchCurrentMystery();
  }, [user]);

  const handleConfirmMystery = async () => {
     if (!currentMysteryInfo || !currentMysteryInfo.membershipId || !currentMysteryInfo.mystery) {
         setError('Brak danych o członkostwie lub tajemnicy do potwierdzenia.');
         return;
     }
     setIsConfirming(true);
     setError(null);
     try {
         const response = await apiClient.patch<CurrentMysteryInfo>(`/me/memberships/${currentMysteryInfo.membershipId}/confirm-mystery`);
         setCurrentMysteryInfo(response.data);
         // Można dodać bardziej subtelne powiadomienie niż alert
         // np. setSuccessMessage('Potwierdzono zapoznanie się z tajemnicą!');
     } catch (err: any) {
         console.error("Błąd potwierdzania tajemnicy:", err);
         setError(err.response?.data?.error || 'Nie udało się potwierdzić tajemnicy.');
     } finally {
        setIsConfirming(false);
     }
  };
  
  // TODO: Funkcja do ładowania historii na żądanie
  // const fetchMysteryHistory = async () => { ... }

  if (!user) {
    // To nie powinno się zdarzyć, jeśli ProtectedRoute działa poprawnie
    return <p className="p-8 text-center text-red-600">Błąd: Brak danych użytkownika. Proszę się zalogować.</p>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Witaj, {user.name || user.email}!
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:ring-2 focus:ring-red-500"
          >
            Wyloguj
          </button>
        </div>

        {error && <p className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</p>}

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            Twoja Róża: <span className="font-normal">{isLoadingMystery ? 'Ładowanie...' : currentMysteryInfo?.roseName || 'Brak danych Róży'}</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">Rola w systemie: {user.role}</p>
          
          {isLoadingMystery ? (
            <p className="text-gray-600 py-4">Ładowanie aktualnej tajemnicy...</p>
          ) : currentMysteryInfo && currentMysteryInfo.mystery ? (
            <div>
              <h3 className="text-2xl font-semibold text-indigo-700 mb-2">{currentMysteryInfo.mystery.name}</h3>
              <p className="text-sm text-gray-500 mb-3">({currentMysteryInfo.mystery.group})</p>
              
              {currentMysteryInfo.mystery.imageUrl && (
                 <img 
                     src={currentMysteryInfo.mystery.imageUrl} 
                     alt={`Grafika dla ${currentMysteryInfo.mystery.name}`} 
                     className="w-full max-w-md mx-auto h-auto rounded-lg shadow-md mb-4 object-contain" 
                     style={{maxHeight: '300px'}}
                 />
              )}

              <div className="bg-indigo-50 p-4 rounded-md mb-4">
                 <h4 className="font-semibold text-indigo-800 mb-1">Rozważanie:</h4>
                 <p className="text-gray-700 whitespace-pre-wrap">{currentMysteryInfo.mystery.contemplation}</p>
              </div>

              {currentMysteryInfo.confirmedAt ? (
                <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">
                  Zapoznanie z tajemnicą potwierdzone dnia: {new Date(currentMysteryInfo.confirmedAt).toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              ) : (
                <button
                  onClick={handleConfirmMystery}
                  disabled={isConfirming}
                  className="w-full md:w-auto px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                >
                  {isConfirming ? 'Potwierdzanie...' : 'Potwierdzam zapoznanie się z tajemnicą'}
                </button>
              )}
            </div>
          ) : currentMysteryInfo && !currentMysteryInfo.mystery ? (
            <p className="text-gray-600 py-4">Nie masz jeszcze przydzielonej tajemnicy w Róży "{currentMysteryInfo.roseName}". Poczekaj na przydział.</p>
          ) : (
            <p className="text-gray-600 py-4">Brak informacji o członkostwie lub nie udało się załadować danych.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
             <h2 className="text-xl font-semibold text-gray-700 mb-4">Historia Twoich Tajemnic</h2>
             <p className="text-gray-500">Funkcjonalność wyświetlania historii tajemnic zostanie dodana wkrótce.</p>
             {/* Tutaj w przyszłości:
             <button onClick={fetchMysteryHistory} disabled={isLoadingHistory}>
                {isLoadingHistory ? 'Ładowanie historii...' : 'Pokaż historię'}
             </button>
             {mysteryHistory && mysteryHistory.history.length > 0 ? (
                <ul>
                    {mysteryHistory.history.map(entry => <li key={entry.id}>{entry.mysteryDetails?.name} ({entry.assignedMonth}/{entry.assignedYear})</li>)}
                </ul>
             ) : mysteryHistory && <p>Brak historii.</p>}
             */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;