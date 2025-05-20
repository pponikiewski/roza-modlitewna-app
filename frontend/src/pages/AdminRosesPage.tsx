// frontend/src/pages/AdminRosesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { RoseListItemAdmin, UserAdminView } from '../types/admin.types';
import { UserRoles, type UserRole } from '../types/user.types'; // Potrzebne do filtrowania Zelatorów
import { Link as RouterLink } from 'react-router-dom'; // Jeśli będziesz dodawał linki

const AdminRosesPage: React.FC = () => {
  const [roses, setRoses] = useState<RoseListItemAdmin[]>([]);
  const [isLoadingRoses, setIsLoadingRoses] = useState(true);
  const [rosesError, setRosesError] = useState<string | null>(null);

  // Stany dla formularza tworzenia Róży
  const [createRoseName, setCreateRoseName] = useState('');
  const [createRoseDescription, setCreateRoseDescription] = useState('');
  const [createSelectedZelatorId, setCreateSelectedZelatorId] = useState('');
  const [availableZelators, setAvailableZelators] = useState<UserAdminView[]>([]);
  const [isCreatingRose, setIsCreatingRose] = useState(false);
  const [createRoseError, setCreateRoseError] = useState<string | null>(null);
  const [createRoseSuccess, setCreateRoseSuccess] = useState<string | null>(null);
  
  // Stany dla triggera przydzielania tajemnic
  const [isTriggeringMysteries, setIsTriggeringMysteries] = useState(false);
  const [triggerMysteriesMessage, setTriggerMysteriesMessage] = useState<string | null>(null);

  // Stany dla edycji Róży
  const [editingRose, setEditingRose] = useState<RoseListItemAdmin | null>(null);
  const [editRoseName, setEditRoseName] = useState('');
  const [editRoseDescription, setEditRoseDescription] = useState('');
  const [editSelectedZelatorId, setEditSelectedZelatorId] = useState('');
  const [isUpdatingRose, setIsUpdatingRose] = useState(false);
  const [updateRoseError, setUpdateRoseError] = useState<string | null>(null);
  const [updateRoseSuccess, setUpdateRoseSuccess] = useState<string | null>(null);

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

  const fetchAvailableZelators = useCallback(async () => {
    try {
        const response = await apiClient.get<UserAdminView[]>('/users');
        const potentialZelators = response.data.filter(
            user => user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN
        );
        setAvailableZelators(potentialZelators);
    } catch (err:any) {
        console.error("Nie udało się pobrać listy potencjalnych Zelatorów:", err);
    }
  }, []);

  useEffect(() => {
    fetchRoses();
    fetchAvailableZelators();
  }, [fetchRoses, fetchAvailableZelators]);

  const handleCreateRoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoseName.trim() || !createSelectedZelatorId) {
        setCreateRoseError("Nazwa Róży i wybrany Zelator są wymagane.");
        return;
    }
    setIsCreatingRose(true);
    setCreateRoseError(null);
    setCreateRoseSuccess(null);
    try {
        await apiClient.post('/admin/roses', {
            name: createRoseName,
            description: createRoseDescription,
            zelatorId: createSelectedZelatorId
        });
        setCreateRoseSuccess(`Róża "${createRoseName}" została pomyślnie utworzona.`);
        setCreateRoseName('');
        setCreateRoseDescription('');
        setCreateSelectedZelatorId('');
        fetchRoses(); // Odśwież listę Róż
         setTimeout(() => setCreateRoseSuccess(null), 3000); // Schowaj komunikat po 3s
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
        setTimeout(() => setTriggerMysteriesMessage(null), 5000); // Schowaj komunikat po 5s
    }
 };

  const openEditRoseModal = (roseToEdit: RoseListItemAdmin) => {
    setEditingRose(roseToEdit);
    setEditRoseName(roseToEdit.name);
    setEditRoseDescription(roseToEdit.description || '');
    setEditSelectedZelatorId(roseToEdit.zelator.id);
    setUpdateRoseError(null);
    setUpdateRoseSuccess(null);
  };

  const closeEditRoseModal = () => {
    setEditingRose(null);
  };

  const handleUpdateRoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRose || !editRoseName.trim() || !editSelectedZelatorId) {
        setUpdateRoseError("Nazwa Róży i wybrany Zelator są wymagane.");
        return;
    }
    setIsUpdatingRose(true);
    setUpdateRoseError(null);
    setUpdateRoseSuccess(null);
    try {
        const payload: { name: string; description: string; zelatorId?: string; } = {
            name: editRoseName,
            description: editRoseDescription,
        };
        // Dołącz zelatorId tylko jeśli się zmienił
        if (editSelectedZelatorId !== editingRose.zelator.id) {
            payload.zelatorId = editSelectedZelatorId;
        }

        await apiClient.patch(`/admin/roses/${editingRose.id}`, payload);
        setUpdateRoseSuccess(`Dane Róży "${editRoseName}" zostały pomyślnie zaktualizowane.`);
        fetchRoses();
        setTimeout(closeEditRoseModal, 1500);
    } catch (err:any) {
        setUpdateRoseError(err.response?.data?.error || "Nie udało się zaktualizować danych Róży.");
    } finally {
        setIsUpdatingRose(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-slate-50 p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Stwórz Nową Różę</h3>
        {createRoseError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{createRoseError}</p>}
        {createRoseSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{createRoseSuccess}</p>}
        <form onSubmit={handleCreateRoseSubmit} className="space-y-4">
            <div>
                <label htmlFor="createRoseName" className="block text-sm font-medium text-gray-700">Nazwa Róży <span className="text-red-500">*</span></label>
                <input type="text" id="createRoseName" value={createRoseName} onChange={(e) => setCreateRoseName(e.target.value)} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="createRoseDescription" className="block text-sm font-medium text-gray-700">Opis (opcjonalnie)</label>
                <textarea id="createRoseDescription" value={createRoseDescription} onChange={(e) => setCreateRoseDescription(e.target.value)} rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="createSelectedZelatorId" className="block text-sm font-medium text-gray-700">Wybierz Zelatora <span className="text-red-500">*</span></label>
                <select id="createSelectedZelatorId" value={createSelectedZelatorId} onChange={(e) => setCreateSelectedZelatorId(e.target.value)} required
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
      </section>

      <section className="bg-slate-50 p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Akcje Globalne</h3>
        {triggerMysteriesMessage && (
            <p className={`mb-3 p-3 text-sm rounded-md ${triggerMysteriesMessage.includes("Nie udało się") ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
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
        <p className="text-xs text-gray-500 mt-2">Ta akcja uruchomi proces przydzielania nowych tajemnic dla wszystkich członków wszystkich Róż i zresetuje statusy potwierdzeń.</p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pt-4 border-t mt-8">Lista Róż w Systemie</h3>
        {isLoadingRoses ? (
           <p className="text-gray-600 p-4">Ładowanie listy Róż...</p>
        ) : rosesError ? (
           <p className="text-red-500 bg-red-100 p-3 rounded-md">{rosesError}</p>
        ) : roses.length === 0 ? (
           <p className="p-4">Brak Róż w systemie. Stwórz pierwszą!</p>
        ) : (
           <div className="space-y-4">
               {roses.map(rose => (
                   <div key={rose.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                       <div className="flex justify-between items-start">
                           <div className="flex-grow">
                                <h4 className="text-lg font-semibold text-indigo-700">{rose.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{rose.description || <span className="italic">Brak opisu.</span>}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                    <p>Zelator: <span className="font-medium">{rose.zelator.name || rose.zelator.email}</span> (Rola: {rose.zelator.role})</p>
                                    <p>ID Zelatora: <span className="font-mono text-gray-700">{rose.zelator.id}</span></p>
                                    <p>Liczba członków: <span className="font-medium text-gray-700">{rose._count.members}</span></p>
                                    <p>ID Róży: <span className="font-mono text-gray-700">{rose.id}</span></p>
                                    <p>Utworzono: {new Date(rose.createdAt).toLocaleString('pl-PL', {dateStyle: 'medium', timeStyle: 'short'})}</p>
                                </div>
                           </div>
                           <div className="flex-shrink-0 ml-4">
                               <button
                                   onClick={() => openEditRoseModal(rose)}
                                   className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                               >
                                   Edytuj
                               </button>
                               {/* TODO: Przycisk Usuń Różę */}
                           </div>
                       </div>
                   </div>
               ))}
           </div>
        )}
      </section>

      {/* Modal do Edycji Róży */}
      {editingRose && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
                <button onClick={closeEditRoseModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Edytuj Różę</h3>
                {updateRoseError && <p className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{updateRoseError}</p>}
                {updateRoseSuccess && <p className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">{updateRoseSuccess}</p>}
                
                <form onSubmit={handleUpdateRoseSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="editRoseName" className="block text-sm font-medium text-gray-700">Nazwa Róży <span className="text-red-500">*</span></label>
                        <input type="text" id="editRoseName" value={editRoseName} onChange={(e) => setEditRoseName(e.target.value)} required
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="editRoseDescription" className="block text-sm font-medium text-gray-700">Opis</label>
                        <textarea id="editRoseDescription" value={editRoseDescription} onChange={(e) => setEditRoseDescription(e.target.value)} rows={3}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="editSelectedZelatorId" className="block text-sm font-medium text-gray-700">Zelator <span className="text-red-500">*</span></label>
                        <select id="editSelectedZelatorId" value={editSelectedZelatorId} onChange={(e) => setEditSelectedZelatorId(e.target.value)} required
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">-- Wybierz nowego Zelatora --</option>
                            {availableZelators.map(zelator => (
                                <option key={zelator.id} value={zelator.id}>
                                    {zelator.name || zelator.email} ({zelator.role})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={closeEditRoseModal}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdatingRose}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isUpdatingRose ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}
    </div>
  );
};

export default AdminRosesPage;