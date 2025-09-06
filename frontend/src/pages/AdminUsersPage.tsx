// frontend/src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { UserAdminView } from '../types/admin.types';
import { UserRoles, type UserRole } from '../types/user.types';
import { toast } from 'sonner';
import ConfirmationDialog from '../components/ConfirmationDialog'; // Upewnij się, że ścieżka jest poprawna

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRoles.MEMBER);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [viewingUser, setViewingUser] = useState<UserAdminView | null>(null);

  // Stany dla usuwania użytkownika
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToProcess, setUserToProcess] = useState<UserAdminView | null>(null);

  const fetchUsers = useCallback(async () => {
     setIsLoading(true);
     try {
         const response = await apiClient.get<UserAdminView[]>('/users'); // Zakładam, że /users to endpoint admina do pobierania wszystkich użytkowników
         setUsers(response.data);
     } catch (err:any) {
         toast.error(err.response?.data?.error || "Nie udało się pobrać listy użytkowników.");
     } finally {
         setIsLoading(false);
     }
  }, []);

  useEffect(() => {
     fetchUsers();
  }, [fetchUsers]);

  const openEditRoleModal = (userToEdit: UserAdminView) => {
     setEditingUser(userToEdit);
     setNewRole(userToEdit.role as UserRole);
     setViewingUser(null);
     setUserToProcess(null); // Zamknij inne akcje
     setIsConfirmDeleteDialogOpen(false);
  };

  const closeEditRoleModal = () => {
     setEditingUser(null);
  };

  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editingUser) return;

     setIsUpdatingRole(true);
     try {
         await apiClient.patch(`/admin/users/${editingUser.id}/role`, { newRole });
         toast.success(`Rola dla ${editingUser.name || editingUser.email} została pomyślnie zmieniona na ${newRole}.`);
         fetchUsers();
         closeEditRoleModal();
     } catch (err: any) {
         toast.error(err.response?.data?.error || "Nie udało się zaktualizować roli.");
     } finally {
         setIsUpdatingRole(false);
     }
  };

  const openUserDetailsModal = (userToView: UserAdminView) => {
    setViewingUser(userToView);
    setEditingUser(null);
    setUserToProcess(null);
    setIsConfirmDeleteDialogOpen(false);
  };

  const closeUserDetailsModal = () => {
    setViewingUser(null);
  };

  // Otwieranie modala potwierdzającego usunięcie
  const handleDeleteUserClick = (userToDelete: UserAdminView) => {
    setUserToProcess(userToDelete);
    setIsConfirmDeleteDialogOpen(true);
    setEditingUser(null); // Zamknij inne modale/akcje
    setViewingUser(null);
  };

  // Faktyczne usuwanie użytkownika po potwierdzeniu
  const confirmDeleteUser = async () => {
    if (!userToProcess) return;

    setIsDeletingUser(userToProcess.id);
    try {
      // Endpoint API do usuwania użytkownika
      await apiClient.delete(`/admin/users/${userToProcess.id}`);
      toast.success(`Użytkownik ${userToProcess.name || userToProcess.email} został pomyślnie usunięty.`);
      fetchUsers(); // Odśwież listę
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Nie udało się usunąć użytkownika ${userToProcess.name || userToProcess.email}.`);
    } finally {
      setIsDeletingUser(null);
      setUserToProcess(null);
      // setIsConfirmDeleteDialogOpen(false); // Modal zostanie zamknięty przez onConfirm w ConfirmationDialog
    }
  };


  if (isLoading) return <p className="text-gray-600 p-4">Ładowanie użytkowników...</p>;

  const anyModalOpen = !!editingUser || !!viewingUser || isConfirmDeleteDialogOpen;

  return (
    <>
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Lista Użytkowników Systemu</h2>
      {users.length === 0 && !isLoading ? (
         <p>Brak zarejestrowanych użytkowników.</p>
      ) : (
         <div className="overflow-x-auto shadow-md rounded-lg">
             <table className="min-w-full bg-white">
                 <thead className="bg-gray-100 border-b border-gray-300">
                     <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imię</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utworzono</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200">
                     {users.map(user => (
                         <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{user.email}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.name || '-'}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm">
                                 <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                     user.role === UserRoles.ADMIN ? 'bg-red-100 text-red-800' :
                                     user.role === UserRoles.ZELATOR ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-green-100 text-green-800'
                                 }`}>
                                     {user.role}
                                 </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                 <button
                                     onClick={() => openUserDetailsModal(user)}
                                     className="text-blue-600 hover:text-blue-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                     disabled={anyModalOpen || isDeletingUser === user.id}
                                 >
                                     Szczegóły
                                 </button>
                                 {user.role !== UserRoles.ADMIN && ( // Admin nie może zmieniać roli innego admina ani usuwać go
                                    <>
                                     <button 
                                         onClick={() => openEditRoleModal(user)}
                                         className="text-indigo-600 hover:text-indigo-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                         disabled={anyModalOpen || isDeletingUser === user.id}
                                     >
                                         Zmień Rolę
                                     </button>
                                     <button
                                        onClick={() => handleDeleteUserClick(user)}
                                        className="text-red-600 hover:text-red-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                        disabled={anyModalOpen || isDeletingUser === user.id}
                                     >
                                        {isDeletingUser === user.id ? 'Usuwanie...' : 'Usuń'}
                                     </button>
                                    </>
                                 )}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      )}

     {editingUser && (
        // ... modal edycji roli bez zmian ...
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
             <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                 <button onClick={closeEditRoleModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">Zmień rolę dla: <span className="font-normal">{editingUser.name || editingUser.email}</span></h3>
                 
                 <form onSubmit={handleRoleChangeSubmit}>
                     <div className="mb-5">
                         <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-1">Nowa rola:</label>
                         <select
                             id="newRole"
                             value={newRole}
                             onChange={(e) => setNewRole(e.target.value as UserRole)}
                             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         >
                             <option value={UserRoles.MEMBER}>MEMBER</option>
                             <option value={UserRoles.ZELATOR}>ZELATOR</option>
                         </select>
                     </div>
                     <div className="flex items-center justify-end space-x-3">
                         <button
                             type="button"
                             onClick={closeEditRoleModal}
                             disabled={isUpdatingRole}
                             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                         >
                             Anuluj
                         </button>
                         <button
                             type="submit"
                             disabled={isUpdatingRole}
                             className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                         >
                             {isUpdatingRole ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                         </button>
                     </div>
                 </form>
             </div>
         </div>
     )}

     {viewingUser && (
        // ... modal szczegółów użytkownika bez zmian ...
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
             <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                 <button onClick={closeUserDetailsModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
                 <h3 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-3">Szczegóły Użytkownika</h3>
                 <div className="space-y-3 text-sm">
                     <p><strong>ID:</strong> <span className="text-gray-700">{viewingUser.id}</span></p>
                     <p><strong>Email:</strong> <span className="text-gray-700">{viewingUser.email}</span></p>
                     <p><strong>Imię:</strong> <span className="text-gray-700">{viewingUser.name || 'Nie podano'}</span></p>
                     <p><strong>Rola:</strong> 
                         <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                             viewingUser.role === UserRoles.ADMIN ? 'bg-red-100 text-red-800' :
                             viewingUser.role === UserRoles.ZELATOR ? 'bg-yellow-100 text-yellow-800' :
                             'bg-green-100 text-green-800'
                         }`}>
                             {viewingUser.role}
                         </span>
                     </p>
                     <p><strong>Data utworzenia konta:</strong> <span className="text-gray-700">{new Date(viewingUser.createdAt).toLocaleString('pl-PL')}</span></p>
                 </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                     <button
                         type="button"
                         onClick={closeUserDetailsModal}
                         className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                     >
                         Zamknij
                     </button>
                 </div>
             </div>
         </div>
     )}
    </div>
    <ConfirmationDialog
      isOpen={isConfirmDeleteDialogOpen}
      onClose={() => {
        setIsConfirmDeleteDialogOpen(false);
        setUserToProcess(null);
      }}
      onConfirm={confirmDeleteUser}
      title="Potwierdzenie Usunięcia Użytkownika"
      message={`Czy na pewno chcesz usunąć użytkownika ${userToProcess?.name || userToProcess?.email || ''}? Tej akcji nie można cofnąć, a wszystkie powiązane dane (np. członkostwa, intencje) mogą zostać usunięte lub zanonimizowane zgodnie z logiką backendu.`}
      confirmButtonText="Usuń Użytkownika"
      confirmButtonColor="red"
    />
    </>
  );
};

export default AdminUsersPage;