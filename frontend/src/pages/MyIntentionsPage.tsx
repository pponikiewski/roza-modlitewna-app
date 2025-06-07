// frontend/src/pages/MyIntentionsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import type { UserIntention, UserMembership } from '../types/rosary.types';
import { toast } from 'sonner'; // <<<< NOWY IMPORT

const MyIntentionsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [myIntentions, setMyIntentions] = useState<UserIntention[]>([]);
  const [isLoadingIntentions, setIsLoadingIntentions] = useState(true);
  // const [intentionsError, setIntentionsError] = useState<string | null>(null); // Zastąpione toastem

  const [newIntentionText, setNewIntentionText] = useState('');
  const [shareWithRoseIdOnCreate, setShareWithRoseIdOnCreate] = useState<string>('');
  const [isAddingIntention, setIsAddingIntention] = useState(false);
  // const [addIntentionError, setAddIntentionError] = useState<string | null>(null); // Zastąpione toastem
  // const [addIntentionSuccess, setAddIntentionSuccess] = useState<string | null>(null); // Zastąpione toastem

  const [editingIntention, setEditingIntention] = useState<UserIntention | null>(null);
  const [editIntentionText, setEditIntentionText] = useState('');
  const [editShareWithRoseId, setEditShareWithRoseId] = useState<string>('');
  const [isUpdatingIntention, setIsUpdatingIntention] = useState(false);
  // const [updateIntentionError, setUpdateIntentionError] = useState<string | null>(null); // Zastąpione toastem
  // const [updateIntentionSuccess, setUpdateIntentionSuccess] = useState<string | null>(null); // Zastąpione toastem

  const [isDeletingIntention, setIsDeletingIntention] = useState<string | null>(null);
  // const [deleteIntentionError, setDeleteIntentionError] = useState<string | null>(null); // Zastąpione toastem
  
  const [myMemberships, setMyMemberships] = useState<UserMembership[]>([]);

  const fetchMyMemberships = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.get<UserMembership[]>('/me/memberships');
      setMyMemberships(response.data);
    } catch (err: any) {
      console.error("Błąd pobierania członkostw dla formularza intencji:", err);
      toast.error("Nie udało się pobrać listy Róż do udostępnienia intencji.");
    }
  }, [user]);

  const fetchMyIntentions = useCallback(async () => {
    if (!user) return;
    setIsLoadingIntentions(true);
    // setIntentionsError(null); // Już niepotrzebne
    try {
        const response = await apiClient.get<UserIntention[]>('/me/intentions');
        setMyIntentions(response.data);
    } catch (err: any) {
        // setIntentionsError(err.response?.data?.error || 'Nie udało się pobrać Twoich intencji.');
        toast.error(err.response?.data?.error || 'Nie udało się pobrać Twoich intencji.');
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

  const handleAddIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntentionText.trim()) {
        toast.warning("Treść intencji nie może być pusta.");
        return;
    }
    if (shareWithRoseIdOnCreate && myMemberships.find(m => m.rose.id === shareWithRoseIdOnCreate) === undefined && user?.role !== 'ADMIN') {
        toast.error("Wybrano nieprawidłową Różę do udostępnienia lub nie należysz do tej Róży.");
        return;
    }

    setIsAddingIntention(true);
    // setAddIntentionError(null); // Już niepotrzebne
    // setAddIntentionSuccess(null); // Już niepotrzebne
    try {
        const payload: { text: string; isSharedWithRose: boolean; sharedWithRoseId?: string } = {
            text: newIntentionText,
            isSharedWithRose: !!shareWithRoseIdOnCreate,
        };
        if (shareWithRoseIdOnCreate) {
            payload.sharedWithRoseId = shareWithRoseIdOnCreate;
        }

        await apiClient.post<UserIntention>('/me/intentions', payload);
        toast.success("Intencja została pomyślnie dodana.");
        setNewIntentionText('');
        setShareWithRoseIdOnCreate('');
        fetchMyIntentions();
        // setTimeout(() => setAddIntentionSuccess(null), 3000); // Już niepotrzebne
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Nie udało się dodać intencji.");
    } finally {
        setIsAddingIntention(false);
    }
  };

  const openEditIntentionModal = (intention: UserIntention) => {
    setEditingIntention(intention);
    setEditIntentionText(intention.text);
    setEditShareWithRoseId(intention.sharedWithRoseId || '');
    // setUpdateIntentionError(null); // Już niepotrzebne
    // setUpdateIntentionSuccess(null); // Już niepotrzebne
  };

  const closeEditIntentionModal = () => {
    setEditingIntention(null);
  };

  const handleUpdateIntentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntention || !editIntentionText.trim()) {
      toast.warning("Treść intencji nie może być pusta.");
      return;
    }
    if (editShareWithRoseId && myMemberships.find(m => m.rose.id === editShareWithRoseId) === undefined && user?.role !== 'ADMIN') {
        toast.error("Wybrano nieprawidłową Różę do udostępnienia lub nie należysz do tej Róży.");
        return;
    }

    setIsUpdatingIntention(true);
    // setUpdateIntentionError(null); // Już niepotrzebne
    // setUpdateIntentionSuccess(null); // Już niepotrzebne
    try {
      const payload: { text: string; isSharedWithRose: boolean; sharedWithRoseId?: string | null } = {
        text: editIntentionText,
        isSharedWithRose: !!editShareWithRoseId,
        sharedWithRoseId: editShareWithRoseId || null,
      };

      await apiClient.patch(`/me/intentions/${editingIntention.id}`, payload);
      toast.success("Intencja została pomyślnie zaktualizowana.");
      fetchMyIntentions();
      // Opóźnienie zamknięcia modala, aby użytkownik zobaczył toast sukcesu wewnątrz modala
      // lub można zamknąć modal od razu i toast pojawi się na głównej stronie.
      // Wybieram drugą opcję, bo sonner domyślnie wyświetla toasty globalnie.
      closeEditIntentionModal(); 
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Nie udało się zaktualizować intencji.");
    } finally {
      setIsUpdatingIntention(false);
    }
  };

  const handleDeleteIntention = async (intentionId: string) => {
     // `window.confirm` można zostawić lub zastąpić modalem potwierdzającym.
     // Dla tego przykładu zostawiam `window.confirm`.
     if (!window.confirm("Czy na pewno chcesz usunąć tę intencję? Tej akcji nie można cofnąć.")) {
         return;
     }
     setIsDeletingIntention(intentionId);
     // setDeleteIntentionError(null); // Już niepotrzebne
     try {
         await apiClient.delete(`/me/intentions/${intentionId}`);
         toast.success("Intencja została usunięta.");
         setMyIntentions(prev => prev.filter(intention => intention.id !== intentionId));
     } catch (err:any) {
         console.error("Błąd usuwania intencji:", err);
         toast.error(err.response?.data?.error || "Nie udało się usunąć intencji.");
     } finally {
         setIsDeletingIntention(null);
     }
  };

 if (isLoadingIntentions) {
     return (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
             <div className="text-xl text-gray-700">Ładowanie Twoich intencji...</div>
         </div>
     );
 }

 return (
     <div className="p-4 md:p-8 bg-slate-100">
       <div className="max-w-3xl mx-auto space-y-8">
         <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">Moje Intencje Modlitewne</h1>

         <section className="bg-white p-6 rounded-lg shadow-xl">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Dodaj Nową Intencję</h2>
           {/* Usunięto wyświetlanie addIntentionError i addIntentionSuccess */}
           <form onSubmit={handleAddIntentionSubmit} className="space-y-4">
             <div>
                 <label htmlFor="newIntentionText" className="block text-sm font-medium text-gray-700">Treść intencji <span className="text-red-500">*</span></label>
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
                 <div>
                     <label htmlFor="shareWithRoseIdOnCreate" className="block text-sm font-medium text-gray-700">
                         Udostępnij Róży (opcjonalnie):
                     </label>
                     <select
                         id="shareWithRoseIdOnCreate"
                         value={shareWithRoseIdOnCreate}
                         onChange={(e) => setShareWithRoseIdOnCreate(e.target.value)}
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

         <section className="bg-white p-6 rounded-lg shadow-xl">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Zapisane Intencje</h2>
           {/* Usunięto wyświetlanie intentionsError i deleteIntentionError, toasty są globalne */}
           
           {myIntentions.length === 0 && !isLoadingIntentions /* && !intentionsError */ ? ( // Usunięto !intentionsError, bo nie ma już tego stanu
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
                                 className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                 disabled={isDeletingIntention === intention.id || !!editingIntention || isUpdatingIntention}
                             >
                                 Edytuj
                             </button>
                             <button 
                                 onClick={() => handleDeleteIntention(intention.id)}
                                 className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
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

         {editingIntention && (
             <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                 <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
                     <button onClick={closeEditIntentionModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </button>
                     <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-gray-800 border-b pb-3">Edytuj Intencję</h3>
                     {/* Usunięto updateIntentionError i updateIntentionSuccess z modala, toasty są globalne */}
                     
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