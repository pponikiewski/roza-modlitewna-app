// frontend/src/pages/AdminUsersPage.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import type { UserAdminView } from '../types/admin.types'; // Zaimportuj typy
// Zaimportuj UserRole, jeśli będziesz go używać do filtrowania lub wyświetlania
// import { UserRoles, type UserRole } from '../types/user.types';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Funkcja do pobierania użytkowników
  useEffect(() => {
     const fetchUsers = async () => {
         setIsLoading(true);
         setError(null);
         try {
             const response = await apiClient.get<UserAdminView[]>('/users'); // Używamy endpointu GET /users
             setUsers(response.data);
         } catch (err:any) {
             setError(err.response?.data?.error || "Nie udało się pobrać listy użytkowników.");
         } finally {
             setIsLoading(false);
         }
     };
     fetchUsers();
  }, []);

  if (isLoading) return <p className="text-gray-600">Ładowanie użytkowników...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Lista Użytkowników Systemu</h2>
      {users.length === 0 ? (
         <p>Brak zarejestrowanych użytkowników.</p>
      ) : (
         <div className="overflow-x-auto">
             <table className="min-w-full bg-white border border-gray-200">
                 <thead className="bg-gray-50">
                     <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imię</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                     </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                     {users.map(user => (
                         <tr key={user.id}>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.id}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || '-'}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm">
                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                     user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                     user.role === 'ZELATOR' ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-green-100 text-green-800'
                                 }`}>
                                     {user.role}
                                 </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 {/* TODO: Przyciski do zmiany roli, edycji, usuwania */}
                                 <button className="text-indigo-600 hover:text-indigo-900 hover:underline">Zmień Rolę (TODO)</button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      )}
    </div>
  );
};

export default AdminUsersPage;