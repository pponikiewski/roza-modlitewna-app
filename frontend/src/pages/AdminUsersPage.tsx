// frontend/src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { UserAdminView } from '../types/admin.types';
import { UserRoles, type UserRole } from '../types/user.types'; // Potrzebne do wyboru roli

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stany do obsługi modala/formularza zmiany roli
  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRoles.MEMBER); // Domyślnie MEMBER
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [updateRoleError, setUpdateRoleError] = useState<string | null>(null);
  const [updateRoleSuccess, setUpdateRoleSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
         const response = await apiClient.get<UserAdminView[]>('/users');
         setUsers(response.data);
     } catch (err:any) {
         setError(err.response?.data?.error || "Nie udało się pobrać listy użytkowników.");
     } finally {
         setIsLoading(false);
     }
  }, []);

  useEffect(() => {
     fetchUsers();
  }, [fetchUsers]);

  const openEditRoleModal = (userToEdit: UserAdminView) => {
     setEditingUser(userToEdit);
     setNewRole(userToEdit.role as UserRole); // Ustaw aktualną rolę jako domyślną w selekcie
     setUpdateRoleError(null);
     setUpdateRoleSuccess(null);
  };

  const closeEditRoleModal = () => {
     setEditingUser(null);
  };

  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editingUser) return;

     setIsUpdatingRole(true);
     setUpdateRoleError(null);
     setUpdateRoleSuccess(null);
     try {
         // Endpoint: PATCH /admin/users/:userIdToUpdate/role
         // Body: { "newRole": "ZELATOR" } (lub MEMBER)
         await apiClient.patch(`/admin/users/${editingUser.id}/role`, { newRole });
         setUpdateRoleSuccess(`Rola dla ${editingUser.email} została pomyślnie zmieniona na ${newRole}.`);
         // Odśwież listę użytkowników, aby zobaczyć zmianę
         fetchUsers();
         // Zamknij modal po chwili
         setTimeout(() => {
             closeEditRoleModal();
         }, 1500);
     } catch (err: any) {
         setUpdateRoleError(err.response?.data?.error || "Nie udało się zaktualizować roli.");
     } finally {
         setIsUpdatingRole(false);
     }
  };


  if (isLoading) return <p className="text-gray-600 p-4">Ładowanie użytkowników...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Lista Użytkowników Systemu</h2>
      {users.length === 0 ? (
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
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 {user.role !== UserRoles.ADMIN && ( // Nie pozwól na zmianę roli innego admina (ani siebie)
                                     <button 
                                         onClick={() => openEditRoleModal(user)}
                                         className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                     >
                                         Zmień Rolę
                                     </button>
                                 )}
                                 {/* Można dodać inne akcje, np. "Zobacz Róże" jeśli to Zelator */}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      )}

     {/* Modal/Formularz do zmiany roli */}
     {editingUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
             <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">Zmień rolę dla: {editingUser.email}</h3>
                 {updateRoleError && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{updateRoleError}</p>}
                 {updateRoleSuccess && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{updateRoleSuccess}</p>}
                 
                 <form onSubmit={handleRoleChangeSubmit}>
                     <div className="mb-5">
                         <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-1">Nowa rola:</label>
                         <select
                             id="newRole"
                             value={newRole}
                             onChange={(e) => setNewRole(e.target.value as UserRole)}
                             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         >
                             {/* Dopuszczalne role do przypisania (zdefiniowane na backendzie) */}
                             <option value={UserRoles.MEMBER}>MEMBER</option>
                             <option value={UserRoles.ZELATOR}>ZELATOR</option>
                             {/* Nie pozwalamy na przypisanie roli ADMIN przez ten interfejs */}
                         </select>
                     </div>
                     <div className="flex items-center justify-end space-x-3">
                         <button
                             type="button"
                             onClick={closeEditRoleModal}
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
    </div>
  );
};

export default AdminUsersPage;