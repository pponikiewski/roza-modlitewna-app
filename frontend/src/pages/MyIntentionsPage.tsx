// frontend/src/pages/MyIntentionsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { UserIntention, UserMembership } from '../types/rosary.types'; // Potrzebujemy UserMembership dla listy Róż do udostępnienia

const MyIntentionsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [myIntentions, setMyIntentions] = useState<UserIntention[]>([]);
  const [isLoadingIntentions, setIsLoadingIntentions] = useState(true);
  const [intentionsError, setIntentionsError] = useState<string | null>(null);
  
  const [newIntentionText, setNewIntentionText] = useState('');
  const [shareWithRoseId, setShareWithRoseId] = useState<string>(''); // ID Róży do udostępnienia przy dodawaniu
  const [isAddingIntention, setIsAddingIntention] = useState(false);
  const [addIntentionError, setAddIntentionError] = useState<string | null>(null);
  const [addIntentionSuccess, setAddIntentionSuccess] = useState<string | null>(null);

  const [editingIntention, setEditingIntention] = useState<UserIntention | null>(null);
  const [editIntentionText, setEditIntentionText] = useState('');
  const [editShareWithRoseId, setEditShareWithRoseId] = useState<string>(''); // ID Róży do udostępnienia przy edycji
  const [isUpdatingIntention, setIsUpdatingIntention] = useState(false);
  const [updateIntentionError, setUpdateIntentionError] = useState<string | null>(null);
  const [updateIntentionSuccess, setUpdateIntentionSuccess] = useState<string | null>(null);

  const [isDeletingIntention, setIsDeletingIntention] = useState<string | null>(null);
  const [deleteIntentionError, setDeleteIntentionError] = useState<string | null>(null);
  
  const [myMemberships, setMyMemberships] = useState<UserMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false); 

  // Pobieranie listy członkostw użytkownika (Róż, do których należy) dla selecta
  const fetchMyMemberships = useCallback(async () => {
    if (!user) return;
    setIsLoadingMemberships(true);
    try {
      const response = await apiClient.get<UserMembership[]>('/me/memberships');
      setMyMemberships(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania członkostw dla formularza intencji:", err);
      // Nie ustawiamy tu globalnego błędu, żeby nie zakłócać listy intencji
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [user]);

  // Pobieranie intencji użytkownika
  const fetchMyIntentions = useCallback(async () => {
    if (!user) return;
    setIsLoadingIntentions(true);
    setIntentionsError(null);
    try {
        const response = await apiClient.get<UserIntention[]>('/me/intentions');
        setMyIntentions(response.data);
    } catch (err: any) {
        console.error("Błąd pobierania intencji użytkownika:", err);
        setIntentionsError(err.response?.data?.error || 'Nie udało się pobrać Twoich intencji.');
        setMyIntentions([]);
    } finally {
        setIsLoadingIntentions(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyMemberships();
      fetchMyIntentions();
    }
  }, [user, fetchMyMemberships, fetchMyIntentions]);

  // Dodawanie nowej intencji
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

  // Otwieranie modala edycji
  const openEditIntentionModal = (intention: UserIntention) => {
    setEditingIntention(intention);
    setEditIntentionText(intention.text);
    setEditShareWithRoseId(intention.sharedWithRoseId || '');
    setUpdateIntentionError(null);
    setUpdateIntentionSuccess(null);
  };

  // Zamykanie modala edycji
  const closeEditIntentionModal = () => {
    setEditingIntention(null);
  };

  // Wysyłanie zaktualizowanej intencji
  const handleUpdateIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntention || !editIntentionText.trim()) {
      setUpdateIntentionError("Treść intencji nie może być pusta.");
      return;
    }
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
        sharedWithRoseId: editShareWithRoseId || null,
      };

      await apiClient.patch(`/me/intentions/${editingIntention.id}`, payload);
      setUpdateIntentionSuccess("Intencja została pomyślnie zaktualizowana.");
      fetchMyIntentions();
      setTimeout(closeEditIntentionModal, 1500);
    } catch (err: any) {
      setUpdateIntentionError(err.response?.data?.error || "Nie udało się zaktualizować intencji.");
    } finally {
      setIsUpdatingIntention(false);
    }
  };

  // Usuwanie intencji
  const handleDeleteIntention = async (intentionId: string) => {
     if (!window.confirm("Czy na pewno chcesz usunąć tę intencję? Tej akcji nie można cofnąć.")) {
         return;
     }
     setIsDeletingIntention(intentionId);
     setDeleteIntentionError(null);
     try {
         await apiClient.delete(`/me/intentions/${intentionId}`);
         setMyIntentions(prev => prev.filter(intention => intention.id !== intentionId));
     } catch (err:any) {
         console.error("Błąd usuwania intencji:", err);
         setDeleteIntentionError(err.response?.data?.error || "Nie udało się usunąć intencji.");
     } finally {
         setIsDeletingIntention(null);
     }
  };

  if (isLoadingIntentions || (myMemberships.length === 0 && isLoadingMemberships && user)) { // Pokaż ładowanie, jeśli ładują się intencje LUB członkostwa (dla selecta)
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-xl text-gray-700">Ładowanie Twoich intencji...</div>
        </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 bg-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">Intencje Modlitewne</h1>

        {/* Formularz dodawania nowej intencji */}
        <section className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Dodaj Nową Intencję</h2>
          {addIntentionError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{addIntentionError}</p>}
          {addIntentionSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{addIntentionSuccess}</p>}
          
          <form onSubmit={handleAddIntentionSubmit} className="space-y-4">
            <div>
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
            {myMemberships.length > 0 && (
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
        </section>

        {/* Lista intencji użytkownika */}
        <section className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Zapisane Intencje</h2>
          {intentionsError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{intentionsError}</p>}
          {deleteIntentionError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{deleteIntentionError}</p>}
          
          {myIntentions.length === 0 && !isLoadingIntentions && !intentionsError ? (
            <p className="text-gray-600 text-center py-4">Nie masz jeszcze żadnych zapisanych intencji.</p>
          ) : (
            <div className="space-y-4">
                {myIntentions.map(intention => (
                    <div key={intention.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-gray-800 whitespace-pre-wrap mb-2">{intention.text}</p>
                        <div className="text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <span className="mb-1 sm:mb-0">Dodano: {new Date(intention.createdAt).toLocaleDateString('pl-PL', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                            {intention.isSharedWithRose && intention.sharedWithRose ? (
                                <span className="mt-1 sm:mt-0 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    Udostępniono Róży: {intention.sharedWithRose.name}
                                </span>
                            ) : (
                                <span className="mt-1 sm:mt-0 px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                    Prywatna
                                </span>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 space-x-3">
                            <button 
                                onClick={() => openEditIntentionModal(intention)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400"
                                disabled={isDeletingIntention === intention.id || !!editingIntention}
                            >
                                Edytuj
                            </button>
                            <button 
                                onClick={() => handleDeleteIntention(intention.id)}
                                className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline disabled:text-gray-400"
                                disabled={isDeletingIntention === intention.id || !!editingIntention || isUpdatingIntention}
                            >
                                {isDeletingIntention === intention.id ? 'Usuwanie...' : 'Usuń'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </section>

        {/* Modal do Edycji Intencji */}
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
                                value={editIntentionText}
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
                                    value={editShareWithRoseId}
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
                                onClick={closeEditIntentionModal}
                                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingIntention}
                                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isUpdatingIntention ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MyIntentionsPage;