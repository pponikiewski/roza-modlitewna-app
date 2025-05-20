// frontend/src/pages/AdminRosesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { RoseListItemAdmin, UserAdminView } from '../types/admin.types'; // Potrzebujemy UserAdminView dla listy Zelatorów
import { UserRoles } from '../types/user.types'; // Potrzebujemy UserRoles do filtrowania Zelatorów

const AdminRosesPage: React.FC = () => {
  const [roses, setRoses] = useState<RoseListItemAdmin[]>([]);
  const [isLoadingRoses, setIsLoadingRoses] = useState(true);
  const [rosesError, setRosesError] = useState<string | null>(null);

  // Stany dla formularza tworzenia Róży
  const [roseName, setRoseName] = useState('');
  const [roseDescription, setRoseDescription] = useState('');
  const [selectedZelatorId, setSelectedZelatorId] = useState('');
  const [availableZelators, setAvailableZelators] = useState<UserAdminView[]>([]); // Lista użytkowników z rolą ZELATOR lub ADMIN
  const [isCreatingRose, setIsCreatingRose] = useState(false);
  const [createRoseError, setCreateRoseError] = useState<string | null>(null);
  const [createRoseSuccess, setCreateRoseSuccess] = useState<string | null>(null);

  // Stan dla triggera przydzielania tajemnic
  const [isTriggeringMysteries, setIsTriggeringMysteries] = useState(false);
  const [triggerMysteriesMessage, setTriggerMysteriesMessage] = useState<string | null>(null);


  // Pobieranie listy Róż
  const fetchRoses = useCallback(async () => {
     setIsLoadingRoses(true);
     setRosesError(null);
     try {
         const response = await apiClient.get<RoseListItemAdmin[]>('/admin/roses');
         setRoses(response.data);
     } catch (err:any) {
         setRosesError(err.response?.data?.error || "Nie udało się pobrać listy Róż.");
     } finally {
         setIsLoadingRoses(false);
     }
  }, []);

  // Pobieranie listy użytkowników, którzy mogą być Zelatorami (ADMIN lub ZELATOR)
  const fetchAvailableZelators = useCallback(async () => {
     try {
         const response = await apiClient.get<UserAdminView[]>('/users'); // Endpoint listujący wszystkich użytkowników
         // Filtrujemy użytkowników, którzy mogą być Zelatorami
         const potentialZelators = response.data.filter(
             user => user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN
         );
         setAvailableZelators(potentialZelators);
         if (potentialZelators.length > 0 && !selectedZelatorId) {
             // Opcjonalnie ustaw pierwszego z listy jako domyślnie wybranego
             // setSelectedZelatorId(potentialZelators[0].id); 
         }
     } catch (err:any) {
         console.error("Nie udało się pobrać listy potencjalnych Zelatorów:", err);
         // Można ustawić błąd, jeśli to krytyczne
     }
  }, [selectedZelatorId]); // Dodano selectedZelatorId do zależności, aby uniknąć resetu wyboru

  useEffect(() => {
     fetchRoses();
     fetchAvailableZelators();
  }, [fetchRoses, fetchAvailableZelators]);

  const handleCreateRoseSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!roseName.trim() || !selectedZelatorId) {
         setCreateRoseError("Nazwa Róży i wybrany Zelator są wymagane.");
         return;
     }
     setIsCreatingRose(true);
     setCreateRoseError(null);
     setCreateRoseSuccess(null);
     try {
         await apiClient.post('/admin/roses', {
             name: roseName,
             description: roseDescription,
             zelatorId: selectedZelatorId
         });
         setCreateRoseSuccess(`Róża "${roseName}" została pomyślnie utworzona.`);
         // Reset formularza
         setRoseName('');
         setRoseDescription('');
         setSelectedZelatorId(''); // Można też nie resetować, jeśli admin tworzy wiele róż po kolei
         fetchRoses(); // Odśwież listę Róż
     } catch (err:any) {
         setCreateRoseError(err.response?.data?.error || "Nie udało się utworzyć Róży.");
     } finally {
         setIsCreatingRose(false);
     }
  };

 const handleTriggerMysteryAssignment = async () => {
     setIsTriggeringMysteries(true);
     setTriggerMysteriesMessage(null);
     try {
         const response = await apiClient.post('/admin/trigger-mystery-assignment');
         setTriggerMysteriesMessage(response.data.message || "Proces przydzielania tajemnic zainicjowany.");
     } catch (err: any) {
         setTriggerMysteriesMessage(err.response?.data?.error || "Nie udało się zainicjować przydzielania tajemnic.");
     } finally {
         setIsTriggeringMysteries(false);
     }
 };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Zarządzanie Różami</h2>

      {/* Formularz Tworzenia Nowej Róży */}
      <div className="bg-slate-50 p-6 rounded-lg shadow-md mb-8 border border-slate-200">
         <h3 className="text-xl font-semibold text-gray-800 mb-4">Stwórz Nową Różę</h3>
         {createRoseError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{createRoseError}</p>}
         {createRoseSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{createRoseSuccess}</p>}
         <form onSubmit={handleCreateRoseSubmit} className="space-y-4">
             <div>
                 <label htmlFor="roseName" className="block text-sm font-medium text-gray-700">Nazwa Róży <span className="text-red-500">*</span></label>
                 <input type="text" id="roseName" value={roseName} onChange={(e) => setRoseName(e.target.value)} required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
             <div>
                 <label htmlFor="roseDescription" className="block text-sm font-medium text-gray-700">Opis (opcjonalnie)</label>
                 <textarea id="roseDescription" value={roseDescription} onChange={(e) => setRoseDescription(e.target.value)} rows={3}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
             </div>
             <div>
                 <label htmlFor="zelatorId" className="block text-sm font-medium text-gray-700">Wybierz Zelatora <span className="text-red-500">*</span></label>
                 <select id="zelatorId" value={selectedZelatorId} onChange={(e) => setSelectedZelatorId(e.target.value)} required
                         className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                     <option value="">-- Wybierz Zelatora --</option>
                     {availableZelators.map(zelator => (
                         <option key={zelator.id} value={zelator.id}>
                             {zelator.name || zelator.email} ({zelator.role})
                         </option>
                     ))}
                 </select>
             </div>
             <button type="submit" disabled={isCreatingRose}
                     className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                 {isCreatingRose ? 'Tworzenie Róży...' : 'Stwórz Różę'}
             </button>
         </form>
      </div>

     {/* Przycisk do Wywołania Przydzielania Tajemnic */}
     <div className="bg-slate-50 p-6 rounded-lg shadow-md mb-8 border border-slate-200">
         <h3 className="text-xl font-semibold text-gray-800 mb-4">Akcje Globalne</h3>
         {triggerMysteriesMessage && (
             <p className={`mb-3 p-2 text-sm rounded ${triggerMysteriesMessage.includes("Nie udało się") ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}`}>
                 {triggerMysteriesMessage}
             </p>
         )}
         <button
             onClick={handleTriggerMysteryAssignment}
             disabled={isTriggeringMysteries}
             className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-md shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-60"
         >
             {isTriggeringMysteries ? 'Inicjowanie...' : 'Uruchom Przydzielanie Tajemnic'}
         </button>
         <p className="text-xs text-gray-500 mt-2">Ta akcja uruchomi proces przydzielania nowych tajemnic dla wszystkich członków wszystkich Róż, zgodnie z harmonogramem (pierwsza niedziela miesiąca), resetując statusy potwierdzeń.</p>
     </div>


      {/* Lista Wszystkich Róż */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pt-4 border-t mt-8">Lista Róż w Systemie</h3>
      {isLoadingRoses ? (
         <p className="text-gray-600">Ładowanie listy Róż...</p>
      ) : rosesError ? (
         <p className="text-red-500 bg-red-100 p-3 rounded-md">{rosesError}</p>
      ) : roses.length === 0 ? (
         <p>Brak Róż w systemie. Stwórz pierwszą!</p>
      ) : (
         <div className="space-y-4">
             {roses.map(rose => (
                 <div key={rose.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                     <h4 className="text-lg font-semibold text-indigo-700">{rose.name}</h4>
                     <p className="text-sm text-gray-600 mt-1">{rose.description || <span className="italic">Brak opisu.</span>}</p>
                     <div className="mt-2 text-xs text-gray-500">
                         <p>Zelator: {rose.zelator.name || rose.zelator.email} (Rola: {rose.zelator.role})</p>
                         <p>ID Zelatora: <span className="font-mono">{rose.zelator.id}</span></p>
                         <p>Liczba członków: {rose._count.members}</p>
                         <p>ID Róży: <span className="font-mono">{rose.id}</span></p>
                         <p>Utworzono: {new Date(rose.createdAt).toLocaleString('pl-PL')}</p>
                     </div>
                     {/* TODO: Linki/Przyciski do edycji Róży, zarządzania jej członkami z panelu Admina */}
                     <div className="mt-3">
                         {/* <RouterLink to={`/admin-panel/rose-details/${rose.id}`} className="text-sm text-blue-600 hover:underline">
                             Szczegóły / Zarządzaj członkami (Admin)
                         </RouterLink> */}
                     </div>
                 </div>
             ))}
         </div>
      )}
    </div>
  );
};

export default AdminRosesPage;