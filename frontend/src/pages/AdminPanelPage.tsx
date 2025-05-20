// frontend/src/pages/AdminPanelPage.tsx
import React from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'; // Dodaj Outlet i useLocation
import { useAuth } from '../contexts/AuthContext';

const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Sprawdzenie uprawnień (choć ProtectedRoute w App.tsx powinien to załatwić)
  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-500">Brak uprawnień administratora.</div>;
  }

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <div className="p-4 md:p-8 bg-slate-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel Administratora</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Nawigacja boczna Panelu Admina */}
          <aside className="md:w-1/4 lg:w-1/5">
            <nav className="space-y-2">
              <RouterLink
                to="users" // Ścieżka względna do /admin-panel
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin-panel/users') 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                Zarządzaj Użytkownikami
              </RouterLink>
              <RouterLink
                to="roses" // Ścieżka względna
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin-panel/roses')
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                Zarządzaj Różami
              </RouterLink>
              {/* Można dodać więcej linków, np. do globalnych ustawień */}
            </nav>
          </aside>

          {/* Główna treść renderowana przez Outlet */}
          <main className="md:w-3/4 lg:w-4/5 bg-white p-6 rounded-lg shadow">
            <Outlet /> {/* Tutaj będą renderowane komponenty zagnieżdżonych tras */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;