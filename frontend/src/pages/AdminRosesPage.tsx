// frontend/src/pages/AdminRosesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { RoseListItemAdmin, UserAdminView } from '../types/admin.types';
import { UserRoles } from '../types/user.types'; 
import { toast } from 'sonner';
import ConfirmationDialog from '../components/ConfirmationDialog'; // <<<< NOWY IMPORT

const AdminRosesPage: React.FC = () => {
  const [roses, setRoses] = useState<RoseListItemAdmin[]>([]);
  const [isLoadingRoses, setIsLoadingRoses] = useState(true);
  // const [rosesError, setRosesError] = useState<string | null>(null); // Zastąpione

  const [createRoseName, setCreateRoseName] = useState('');
  const [createRoseDescription, setCreateRoseDescription] = useState('');
  const [createSelectedZelatorId, setCreateSelectedZelatorId] = useState('');
  const [availableZelators, setAvailableZelators] = useState<UserAdminView[]>([]);
  const [isCreatingRose, setIsCreatingRose] = useState(false);
  // const [createRoseError, setCreateRoseError] = useState<string | null>(null); // Zastąpione
  // const [createRoseSuccess, setCreateRoseSuccess] = useState<string | null>(null); // Zastąpione
  
  const [isTriggeringMysteriesGlobal, setIsTriggeringMysteriesGlobal] = useState(false);
  // const [triggerMysteriesGlobalMessage, setTriggerMysteriesGlobalMessage] = useState<string | null>(null); // Zastąpione

  const [editingRose, setEditingRose] = useState<RoseListItemAdmin | null>(null);
  const [editRoseName, setEditRoseName] = useState('');
  const [editRoseDescription, setEditRoseDescription] = useState('');
  const [editSelectedZelatorId, setEditSelectedZelatorId] = useState('');
  const [isUpdatingRose, setIsUpdatingRose] = useState(false);
  // const [updateRoseError, setUpdateRoseError] = useState<string | null>(null); // Zastąpione
  // const [updateRoseSuccess, setUpdateRoseSuccess] = useState<string | null>(null); // Zastąpione

  const [isTriggeringSingleRose, setIsTriggeringSingleRose] = useState<string | null>(null);
  // const [singleRoseTriggerMessage, setSingleRoseTriggerMessage] = useState<{id: string, message: string, isError?: boolean} | null>(null); // Zastąpione

  const [isDeletingRose, setIsDeletingRose] = useState<string | null>(null); // Do pokazywania "Usuwanie..."
  // const [deleteRoseError, setDeleteRoseError] = useState<string | null>(null); // Zastąpione
  // const [deleteRoseSuccess, setDeleteRoseSuccess] = useState<string | null>(null); // Zastąpione

  // Stany dla modala potwierdzenia usunięcia Róży
  const [isDeleteRoseConfirmOpen, setIsDeleteRoseConfirmOpen] = useState(false);
  const [roseToProcess, setRoseToProcess] = useState<{id: string, name: string} | null>(null);


  const fetchRoses = useCallback(async () => {
    setIsLoadingRoses(true);
    try {
        const response = await apiClient.get<RoseListItemAdmin[]>('/admin/roses');
        setRoses(response.data);
    } catch (err:any) {
        toast.error(err.response?.data?.error || "Nie udało się pobrać listy Róż.");
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
        toast.error("Nie udało się pobrać listy potencjalnych Zelatorów.");
    }
  }, []);

  useEffect(() => {
    fetchRoses();
    fetchAvailableZelators();
  }, [fetchRoses, fetchAvailableZelators]);

  const handleCreateRoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoseName.trim() || !createSelectedZelatorId) {
        toast.warning("Nazwa Róży i wybrany Zelator są wymagane.");
        return;
    }
    setIsCreatingRose(true);
    try {
        await apiClient.post('/admin/roses', {
            name: createRoseName,
            description: createRoseDescription,
            zelatorId: createSelectedZelatorId
        });
        toast.success(`Róża "${createRoseName}" została pomyślnie utworzona.`);
        setCreateRoseName('');
        setCreateRoseDescription('');
        setCreateSelectedZelatorId('');
        fetchRoses(); 
    } catch (err:any) {
        toast.error(err.response?.data?.error || "Nie udało się utworzyć Róży.");
    } finally {
        setIsCreatingRose(false);
    }
  };

 const handleTriggerMysteryAssignmentGlobal = async () => {
    setIsTriggeringMysteriesGlobal(true);
    try {
        const response = await apiClient.post('/admin/trigger-mystery-assignment');
        toast.success(response.data.message || "Proces globalnego przydzielania tajemnic zainicjowany.");
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Nie udało się zainicjować globalnego przydzielania tajemnic.");
    } finally {
        setIsTriggeringMysteriesGlobal(false);
    }
  };

  const openEditRoseModal = (roseToEdit: RoseListItemAdmin) => {
    setEditingRose(roseToEdit);
    setEditRoseName(roseToEdit.name);
    setEditRoseDescription(roseToEdit.description || '');
    setEditSelectedZelatorId(roseToEdit.zelator.id);
  };

  const closeEditRoseModal = () => {
    setEditingRose(null);
  };

  const handleUpdateRoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRose || !editRoseName.trim() || !editSelectedZelatorId) {
        toast.warning("Nazwa Róży i wybrany Zelator są wymagane.");
        return;
    }
    setIsUpdatingRose(true);
    try {
        const payload: { name: string; description: string; zelatorId?: string; } = {
            name: editRoseName,
            description: editRoseDescription,
        };
        if (editSelectedZelatorId !== editingRose.zelator.id) {
            payload.zelatorId = editSelectedZelatorId;
        }

        await apiClient.patch(`/admin/roses/${editingRose.id}`, payload);
        toast.success(`Dane Róży "${editRoseName}" zostały pomyślnie zaktualizowane.`);
        fetchRoses();
        closeEditRoseModal();
    } catch (err:any) {
        toast.error(err.response?.data?.error || "Nie udało się zaktualizować danych Róży.");
    } finally {
        setIsUpdatingRose(false);
    }
  };

  const handleTriggerMysteryAssignmentForRose = async (roseId: string, roseName: string) => {
    setIsTriggeringSingleRose(roseId);
    try {
        const response = await apiClient.post(`/admin/roses/${roseId}/trigger-mystery-assignment`);
        toast.success(response.data.message || `Proces przydzielania tajemnic dla Róży "${roseName}" zainicjowany.`);
    } catch (err: any) {
        toast.error(err.response?.data?.error || `Nie udało się zainicjować przydzielania dla Róży "${roseName}".`);
    } finally {
        setIsTriggeringSingleRose(null);
    }
  };

  const confirmDeleteRose = async () => {
    if (!roseToProcess) return;
    
    setIsDeletingRose(roseToProcess.id);
    try {
        await apiClient.delete(`/admin/roses/${roseToProcess.id}`);
        toast.success(`Róża "${roseToProcess.name}" została pomyślnie usunięta.`);
        fetchRoses();
    } catch (err: any) {
        toast.error(err.response?.data?.error || `Nie udało się usunąć Róży "${roseToProcess.name}".`);
    } finally {
        setIsDeletingRose(null);
        setRoseToProcess(null);
        // setIsDeleteRoseConfirmOpen(false); // Zamknięte przez ConfirmationDialog
    }
  };

  const handleDeleteRoseClick = (roseId: string, roseName: string) => {
    setRoseToProcess({ id: roseId, name: roseName });
    setIsDeleteRoseConfirmOpen(true);
  };

  const generalActionInProgress = !!editingRose || isCreatingRose || isUpdatingRose || isTriggeringMysteriesGlobal || isDeletingRose !== null || isTriggeringSingleRose !== null || isDeleteRoseConfirmOpen;

  return (
    <>
    <div className="space-y-8 p-1">
      <section className="bg-slate-50 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Stwórz Nową Różę</h3>
        <form onSubmit={handleCreateRoseSubmit} className="space-y-4">
            <div>
                <label htmlFor="createRoseName" className="block text-sm font-medium text-gray-700">Nazwa Róży <span className="text-red-500">*</span></label>
                <input type="text" id="createRoseName" value={createRoseName} onChange={(e) => setCreateRoseName(e.target.value)} required
                       disabled={generalActionInProgress}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"/>
            </div>
            <div>
                <label htmlFor="createRoseDescription" className="block text-sm font-medium text-gray-700">Opis (opcjonalnie)</label>
                <textarea id="createRoseDescription" value={createRoseDescription} onChange={(e) => setCreateRoseDescription(e.target.value)} rows={2}
                          disabled={generalActionInProgress}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"/>
            </div>
            <div>
                <label htmlFor="createSelectedZelatorId" className="block text-sm font-medium text-gray-700">Wybierz Zelatora <span className="text-red-500">*</span></label>
                <select id="createSelectedZelatorId" value={createSelectedZelatorId} onChange={(e) => setCreateSelectedZelatorId(e.target.value)} required
                        disabled={generalActionInProgress || availableZelators.length === 0}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100">
                    <option value="">-- Wybierz Zelatora --</option>
                    {availableZelators.map(zelator => (
                        <option key={zelator.id} value={zelator.id}>
                            {zelator.name || zelator.email} ({zelator.role})
                        </option>
                    ))}
                </select>
            </div>
            <button type="submit" disabled={isCreatingRose || generalActionInProgress}
                    className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                {isCreatingRose ? 'Tworzenie Róży...' : 'Stwórz Różę'}
            </button>
        </form>
      </section>

      <section className="bg-slate-50 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Akcje Globalne</h3>
        <button
            onClick={handleTriggerMysteryAssignmentGlobal}
            disabled={isTriggeringMysteriesGlobal || generalActionInProgress}
            className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-md shadow-sm hover:bg-orange-600 disabled:opacity-60"
        >
            {isTriggeringMysteriesGlobal ? 'Inicjowanie Globalne...' : 'Uruchom Przydział dla Wszystkich Róż'}
        </button>
        <p className="text-xs text-gray-500 mt-2">Ta akcja uruchomi proces przydzielania nowych tajemnic dla wszystkich członków wszystkich Róż i zresetuje statusy potwierdzeń.</p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pt-4 border-t mt-8">Lista Róż w Systemie</h3>
        
        {isLoadingRoses ? (
           <p className="text-gray-600 p-4">Ładowanie listy Róż...</p>
        ) : roses.length === 0 && !isLoadingRoses ? (
           <p className="p-4">Brak Róż w systemie. Stwórz pierwszą!</p>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {roses.map(rose => (
                   <div key={rose.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
                       <div>
                           <h4 className="text-lg font-semibold text-indigo-700">{rose.name}</h4>
                           <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">{rose.description || <span className="italic">Brak opisu.</span>}</p>
                           <div className="mt-2 text-xs text-gray-500">
                               <p>Zelator: <span className="font-medium">{rose.zelator.name || rose.zelator.email}</span> ({rose.zelator.role})</p>
                               <p>Liczba członków: <span className="font-medium text-gray-700">{rose._count.members}</span></p>
                               <p>Utworzono: {new Date(rose.createdAt).toLocaleString('pl-PL', {dateStyle: 'medium'})}</p>
                           </div>
                       </div>
                       <div className="mt-4 flex flex-wrap gap-2 items-center">
                           <button
                               onClick={() => openEditRoseModal(rose)}
                               disabled={generalActionInProgress}
                               className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                               Edytuj
                           </button>
                           <button
                               onClick={() => handleTriggerMysteryAssignmentForRose(rose.id, rose.name)}
                               disabled={isTriggeringSingleRose === rose.id || generalActionInProgress}
                               className="px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                               {isTriggeringSingleRose === rose.id ? 'Inicjuję...' : 'Przydziel Tajemnice'}
                           </button>
                           <button 
                               onClick={() => handleDeleteRoseClick(rose.id, rose.name)} // <<<< ZMIANA TUTAJ
                               disabled={isDeletingRose === rose.id || generalActionInProgress}
                               className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               {isDeletingRose === rose.id ? 'Usuwanie...' : 'Usuń Różę'}
                           </button>
                       </div>
                   </div>
               ))}
           </div>
        )}
      </section>

      {editingRose && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
                <button onClick={closeEditRoseModal} disabled={isUpdatingRose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl sm:text-2xl font-semibold mb-5 text-gray-800 border-b pb-3">Edytuj Różę</h3>
                <form onSubmit={handleUpdateRoseSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editRoseName" className="block text-sm font-medium text-gray-700">Nazwa Róży <span className="text-red-500">*</span></label>
                        <input type="text" id="editRoseName" value={editRoseName} onChange={(e) => setEditRoseName(e.target.value)} required
                               disabled={isUpdatingRose}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="editRoseDescription" className="block text-sm font-medium text-gray-700">Opis</label>
                        <textarea id="editRoseDescription" value={editRoseDescription} onChange={(e) => setEditRoseDescription(e.target.value)} rows={3}
                                  disabled={isUpdatingRose}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="editSelectedZelatorId" className="block text-sm font-medium text-gray-700">Zelator <span className="text-red-500">*</span></label>
                        <select id="editSelectedZelatorId" value={editSelectedZelatorId} onChange={(e) => setEditSelectedZelatorId(e.target.value)} required
                                disabled={availableZelators.length === 0 || isUpdatingRose}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100">
                            <option value="">-- Wybierz nowego Zelatora --</option>
                            {availableZelators.map(zelator => (
                                <option key={zelator.id} value={zelator.id}>
                                    {zelator.name || zelator.email} ({zelator.role})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-end space-x-3 pt-3 border-t mt-5">
                        <button
                            type="button"
                            onClick={closeEditRoseModal}
                            disabled={isUpdatingRose}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdatingRose}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isUpdatingRose ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}
    </div>
    <ConfirmationDialog
        isOpen={isDeleteRoseConfirmOpen}
        onClose={() => {
            setIsDeleteRoseConfirmOpen(false);
            setRoseToProcess(null);
        }}
        onConfirm={confirmDeleteRose}
        title="Potwierdzenie Usunięcia Róży"
        message={`Czy na pewno chcesz usunąć Różę "${roseToProcess?.name || ''}"? Tej akcji nie można cofnąć, a wszyscy członkowie zostaną z niej usunięci.`}
        confirmButtonText="Usuń Różę"
        confirmButtonColor="red"
    />
    </>
  );
};

export default AdminRosesPage;