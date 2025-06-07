// frontend/src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../services/api';
import type { UserAdminView } from '../types/admin.types';
import { UserRoles, type UserRole } from '../types/user.types';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRoles.MEMBER);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [updateRoleError, setUpdateRoleError] = useState<string | null>(null);
  const [updateRoleSuccess, setUpdateRoleSuccess] = useState<string | null>(null);

  // Stany dla modala szczegółów użytkownika
  const [viewingUser, setViewingUser] = useState<UserAdminView | null>(null);

  const fetchUsers = useCallback(async () => {
     setIsLoading(true);
     setError(null);
     try {
         const response = await apiClient.get<UserAdminView[]>('/users'); // Assuming this is the admin endpoint for all users
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
     setNewRole(userToEdit.role as UserRole);
     setUpdateRoleError(null);
     setUpdateRoleSuccess(null);
     setViewingUser(null); // Close details modal if open
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
         await apiClient.patch(`/admin/users/${editingUser.id}/role`, { newRole });
         setUpdateRoleSuccess(`Rola dla ${editingUser.name || editingUser.email} została pomyślnie zmieniona na ${newRole}.`);
         fetchUsers();
         setTimeout(() => {
             closeEditRoleModal();
             setUpdateRoleSuccess(null);
         }, 2000);
     } catch (err: any) {
         setUpdateRoleError(err.response?.data?.error || "Nie udało się zaktualizować roli.");
         setTimeout(() => setUpdateRoleError(null), 5000);
     } finally {
         setIsUpdatingRole(false);
     }
  };

  const openUserDetailsModal = (userToView: UserAdminView) => {
    setViewingUser(userToView);
    setEditingUser(null); // Close role edit modal if open
  };

  const closeUserDetailsModal = () => {
    setViewingUser(null);
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
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                 <button
                                     onClick={() => openUserDetailsModal(user)}
                                     className="text-blue-600 hover:text-blue-900 hover:underline"
                                     disabled={!!editingUser || !!viewingUser}
                                 >
                                     Szczegóły
                                 </button>
                                 {user.role !== UserRoles.ADMIN && (
                                     <button 
                                         onClick={() => openEditRoleModal(user)}
                                         className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                         disabled={!!editingUser || !!viewingUser}
                                     >
                                         Zmień Rolę
                                     </button>
                                 )}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      )}

     {/* Modal do zmiany roli */}
     {editingUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
             <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                 <button onClick={closeEditRoleModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">Zmień rolę dla: <span className="font-normal">{editingUser.name || editingUser.email}</span></h3>
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
                             <option value={UserRoles.MEMBER}>MEMBER</option>
                             <option value={UserRoles.ZELATOR}>ZELATOR</option>
                             {/* ADMIN role cannot be assigned through this UI */}
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

     {/* Modal Szczegółów Użytkownika */}
     {viewingUser && (
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
                     {/* 
                        Poniżej przykładowe pola, jeśli `UserAdminView` zostałoby rozszerzone o te dane:
                        {viewingUser.memberships && viewingUser.memberships.length > 0 && (
                            <div>
                                <strong>Członkostwa w Różach:</strong>
                                <ul className="list-disc list-inside ml-4 text-gray-700">
                                    {viewingUser.memberships.map(mem => <li key={mem.rose.id}>{mem.rose.name}</li>)}
                                </ul>
                            </div>
                        )}
                        {viewingUser._count?.intentions !== undefined && (
                            <p><strong>Liczba intencji:</strong> <span className="text-gray-700">{viewingUser._count.intentions}</span></p>
                        )}
                     */}
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
  );
};

export default AdminUsersPage;