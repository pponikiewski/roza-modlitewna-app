// frontend/src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import type { UserAdminView } from '../types/admin.types';
import { UserRoles, type UserRole } from '../types/user.types';
import { toast } from 'sonner';
import ConfirmationDialog from '../components/ConfirmationDialog';

type SortField = 'email' | 'name' | 'role' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtrowanie i sortowanie
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Paginacja
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const [viewingUser, setViewingUser] = useState<UserAdminView | null>(null);

  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRoles.MEMBER);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Stany dla usuwania użytkownika
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToProcess, setUserToProcess] = useState<UserAdminView | null>(null);

  const fetchUsers = useCallback(async () => {
     setIsLoading(true);
     try {
         const response = await apiClient.get<UserAdminView[]>('/admin/users');
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

  // Filtrowanie i sortowanie użytkowników
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sortowanie
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

  // Paginacja
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredAndSortedUsers, currentPage, usersPerPage]);

  // Funkcje sortowania
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset paginacji przy zmianie filtrów
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const openEditRoleModal = (userToEdit: UserAdminView) => {
     setEditingUser(userToEdit);
     setNewRole(userToEdit.role as UserRole);
  };

  const closeEditRoleModal = () => {
     setEditingUser(null);
     setIsUpdatingRole(false);
  };

  const updateUserRole = async () => {
     if (!editingUser) return;

     setIsUpdatingRole(true);
     try {
       await apiClient.patch(`/admin/users/${editingUser.id}/role`, { role: newRole });
       const roleDisplayName = newRole === UserRoles.ADMIN ? 'Administrator' :
                               newRole === UserRoles.ZELATOR ? 'Zelator' : 'Członek';
       toast.success(`Rola użytkownika ${editingUser.name || editingUser.email} została pomyślnie zmieniona na ${roleDisplayName}.`);
       fetchUsers(); // Odśwież listę
       closeEditRoleModal();
     } catch (err: any) {
       toast.error(err.response?.data?.error || `Nie udało się zmienić roli użytkownika ${editingUser.name || editingUser.email}.`);
     } finally {
       setIsUpdatingRole(false);
     }
  };

  const openUserDetailsModal = (userToView: UserAdminView) => {
    setViewingUser(userToView);
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

  const anyModalOpen = !!viewingUser || !!editingUser || isConfirmDeleteDialogOpen;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Komponent do wyświetlania przynależności do róż
  const RoseMemberships = ({ user }: { user: UserAdminView }) => {
    const managedRoses = user.managedRoses || [];
    const memberRoses = user.memberRoses || [];
    
    if (managedRoses.length === 0 && memberRoses.length === 0) {
      return <span className="text-gray-400 text-sm">Brak przynależności</span>;
    }

    return (
      <div className="space-y-1">
        {managedRoses.map(rose => (
          <div key={`managed-${rose.id}`} className="flex items-center space-x-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Zelator
            </span>
            <span className="text-sm text-gray-900">{rose.name}</span>
          </div>
        ))}
        {memberRoses.map(rose => (
          <div key={`member-${rose.id}`} className="flex items-center space-x-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Członek
            </span>
            <span className="text-sm text-gray-900">{rose.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-700">Zarządzanie Użytkownikami</h2>
        <div className="flex flex-col text-sm text-gray-600 space-y-1">
          <span>Znaleziono: {filteredAndSortedUsers.length} z {users.length}</span>
        </div>
      </div>

      {/* Filtry i wyszukiwanie */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Wyszukaj
            </label>
            <input
              id="search"
              type="text"
              placeholder="Email lub imię..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtruj po roli
            </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            >
              <option value="ALL">Wszystkie role</option>
              <option value={UserRoles.ADMIN}>Administratorzy</option>
              <option value={UserRoles.ZELATOR}>Zelatorzy</option>
              <option value={UserRoles.MEMBER}>Członek</option>
            </select>
          </div>

          {/* Sortowanie mobilne */}
          <div className="lg:hidden">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sortuj według
            </label>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            >
              <option value="createdAt-desc">Data utworzenia ↓</option>
              <option value="createdAt-asc">Data utworzenia ↑</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="name-asc">Imię A-Z</option>
              <option value="name-desc">Imię Z-A</option>
              <option value="role-asc">Rola A-Z</option>
              <option value="role-desc">Rola Z-A</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Wyczyść filtry
            </button>
          </div>
        </div>
      </div>
      {/* Tabela użytkowników */}
      {filteredAndSortedUsers.length === 0 && !isLoading ? (
         <div className="text-center py-8 text-gray-500">
           <p>Nie znaleziono użytkowników spełniających kryteria.</p>
         </div>
      ) : (
         <>
           {/* Widok desktop - tabela */}
           <div className="hidden lg:block bg-white shadow-md rounded-lg overflow-hidden border">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                       <tr>
                           <th 
                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('email')}
                           >
                             <div className="flex items-center space-x-1">
                               <span>Email</span>
                               <SortIcon field="email" />
                             </div>
                           </th>
                           <th 
                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('name')}
                           >
                             <div className="flex items-center space-x-1">
                               <span>Imię</span>
                               <SortIcon field="name" />
                             </div>
                           </th>
                           <th 
                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('role')}
                           >
                             <div className="flex items-center space-x-1">
                               <span>Rola</span>
                               <SortIcon field="role" />
                             </div>
                           </th>
                           <th 
                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('createdAt')}
                           >
                             <div className="flex items-center space-x-1">
                               <span>Utworzono</span>
                               <SortIcon field="createdAt" />
                             </div>
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Akcje
                           </th>
                       </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                       {paginatedUsers.map(user => (
                           <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm font-medium text-gray-900">{user.email}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm text-gray-900">{user.name || '-'}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                       user.role === UserRoles.ADMIN ? 'bg-red-100 text-red-800' :
                                       user.role === UserRoles.ZELATOR ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-green-100 text-green-800'
                                   }`}>
                                       {user.role === UserRoles.ADMIN ? 'Administrator' :
                                        user.role === UserRoles.ZELATOR ? 'Zelator' :
                                        'Członek'}
                                   </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   <div className="flex flex-col">
                                     <span>{new Date(user.createdAt).toLocaleDateString('pl-PL')}</span>
                                     <span className="text-xs text-gray-400">
                                       {new Date(user.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                   </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 <div className="flex flex-wrap gap-2">
                                   <button
                                       onClick={() => openUserDetailsModal(user)}
                                       className="text-blue-600 hover:text-blue-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                       disabled={anyModalOpen || isDeletingUser === user.id}
                                   >
                                       Szczegóły
                                   </button>
                                   {user.role !== UserRoles.ADMIN && (
                                       <button
                                          onClick={() => handleDeleteUserClick(user)}
                                          className="text-red-600 hover:text-red-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                                          disabled={anyModalOpen || isDeletingUser === user.id}
                                       >
                                          {isDeletingUser === user.id ? 'Usuwanie...' : 'Usuń'}
                                       </button>
                                   )}
                                 </div>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
             </div>
           </div>

           {/* Widok mobilny - karty */}
           <div className="lg:hidden space-y-4">
             {paginatedUsers.map(user => (
               <div key={user.id} className="bg-white shadow-md rounded-lg p-4 border">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex-1 min-w-0">
                     <h3 className="text-sm font-medium text-gray-900 truncate">
                       {user.name || 'Bez nazwy'}
                     </h3>
                     <p className="text-sm text-gray-500 truncate">{user.email}</p>
                   </div>
                   <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                     user.role === UserRoles.ADMIN ? 'bg-red-100 text-red-800' :
                     user.role === UserRoles.ZELATOR ? 'bg-yellow-100 text-yellow-800' :
                     'bg-green-100 text-green-800'
                   }`}>
                     {user.role === UserRoles.ADMIN ? 'Administrator' :
                      user.role === UserRoles.ZELATOR ? 'Zelator' :
                      'Członek'}
                   </span>
                 </div>
                 
                 <div className="text-xs text-gray-500 mb-3">
                   Utworzono: {new Date(user.createdAt).toLocaleDateString('pl-PL')} o {new Date(user.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 
                 <div className="flex flex-wrap gap-2">
                   <button
                     onClick={() => openUserDetailsModal(user)}
                     className="flex-1 min-w-0 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                     disabled={anyModalOpen || isDeletingUser === user.id}
                   >
                     Szczegóły
                   </button>
                   {user.role !== UserRoles.ADMIN && (
                     <button
                       onClick={() => handleDeleteUserClick(user)}
                       className="flex-1 min-w-0 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                       disabled={anyModalOpen || isDeletingUser === user.id}
                     >
                       {isDeletingUser === user.id ? 'Usuwanie...' : 'Usuń'}
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </>
      )}

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Poprzednia
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Następna
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Pokazano <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> do{' '}
                <span className="font-medium">
                  {Math.min(currentPage * usersPerPage, filteredAndSortedUsers.length)}
                </span>{' '}
                z <span className="font-medium">{filteredAndSortedUsers.length}</span> wyników
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Poprzednia</span>
                  &#8249;
                </button>
                
                {/* Numery stron */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Następna</span>
                  &#8250;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>

     {/* Modale */}
     {viewingUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
             <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
                 <button onClick={closeUserDetailsModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
                 <h3 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-3">Szczegóły Użytkownika</h3>
                 
                 <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-500 mb-1">ID Użytkownika</label>
                         <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">{viewingUser.id}</p>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500 mb-1">Rola</label>
                         <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                             viewingUser.role === UserRoles.ADMIN ? 'bg-red-100 text-red-800' :
                             viewingUser.role === UserRoles.ZELATOR ? 'bg-yellow-100 text-yellow-800' :
                             'bg-green-100 text-green-800'
                         }`}>
                             {viewingUser.role === UserRoles.ADMIN ? 'Administrator' :
                              viewingUser.role === UserRoles.ZELATOR ? 'Zelator' :
                              'Członek'}
                         </span>
                       </div>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-500 mb-1">Adres email</label>
                       <p className="text-sm text-gray-900">{viewingUser.email}</p>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-500 mb-1">Imię</label>
                       <p className="text-sm text-gray-900">{viewingUser.name || 'Nie podano'}</p>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-500 mb-2">Przynależność do Róż</label>
                       <RoseMemberships user={viewingUser} />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-500 mb-1">Data utworzenia</label>
                         <div className="text-sm text-gray-900">
                           <p>{new Date(viewingUser.createdAt).toLocaleDateString('pl-PL')}</p>
                           <p className="text-xs text-gray-500">
                             {new Date(viewingUser.createdAt).toLocaleTimeString('pl-PL')}
                           </p>
                         </div>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-500 mb-1">Ostatnia aktualizacja</label>
                         <div className="text-sm text-gray-900">
                           <p>{new Date(viewingUser.updatedAt).toLocaleDateString('pl-PL')}</p>
                           <p className="text-xs text-gray-500">
                             {new Date(viewingUser.updatedAt).toLocaleTimeString('pl-PL')}
                           </p>
                         </div>
                       </div>
                     </div>
                 </div>
                 
                 <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                     {viewingUser.role !== UserRoles.ADMIN && (
                       <>
                         <button
                             onClick={() => {
                               closeUserDetailsModal();
                               openEditRoleModal(viewingUser);
                             }}
                             className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                         >
                             Zmień Rolę
                         </button>
                         <button
                             onClick={() => {
                               closeUserDetailsModal();
                               handleDeleteUserClick(viewingUser);
                             }}
                             className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                         >
                             Usuń Użytkownika
                         </button>
                       </>
                     )}
                     <button
                         type="button"
                         onClick={closeUserDetailsModal}
                         className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
                     >
                         Zamknij
                     </button>
                 </div>
             </div>
         </div>
     )}
    
    {/* Modal Edycji Roli */}
    {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                <button onClick={closeEditRoleModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-3">Zmiana Roli Użytkownika</h3>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Użytkownik: <span className="font-medium">{editingUser.name || editingUser.email}</span></p>
                    <p className="text-sm text-gray-600 mb-4">Obecna rola: <span className="font-medium">
                        {editingUser.role === UserRoles.ADMIN ? 'Administrator' :
                         editingUser.role === UserRoles.ZELATOR ? 'Zelator' :
                         'Członek'}
                    </span></p>
                </div>
                
                <div className="mb-6">
                    <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-2">Nowa rola</label>
                    <select
                        id="newRole"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value={UserRoles.MEMBER}>Członek</option>
                        <option value={UserRoles.ZELATOR}>Zelator</option>
                    </select>
                </div>
                <div className="flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={closeEditRoleModal}
                        disabled={isUpdatingRole}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={updateUserRole}
                        disabled={isUpdatingRole || newRole === editingUser.role}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdatingRole ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </div>
        </div>
    )}
    
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