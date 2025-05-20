// frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import ZelatorDashboardPage from './pages/ZelatorDashboardPage';
import ManagedRoseDetailsPage from './pages/ManagedRoseDetailsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRosesPage from './pages/AdminRosesPage';
import { useAuth } from "./contexts/AuthContext"; // Importujemy useAuth do pobrania logout i user
import { UserRoles, type UserRole } from './types/user.types'; // Upewnij się, że ścieżka jest poprawna

// Komponent chronionej trasy
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Ładowanie sesji...</div>;
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Brak Uprawnień</h1>
        <p className="text-gray-700 mb-6">Przepraszamy, nie masz wystarczających uprawnień, aby wyświetlić tę stronę.</p>
        <RouterLink 
          to="/dashboard" 
          className="px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Wróć do Panelu
        </RouterLink>
      </div>
    );
  }
  return children;
};


// Komponent dla stron publicznych
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Ładowanie sesji...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};


function App() {
  const { isLoading, user, logout } = useAuth(); // Pobieramy logout i user z AuthContext

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl font-semibold text-gray-700">
        Ładowanie aplikacji Róży Modlitewnej...
      </div>
    );
  }

  return (
    <>
     {user && ( // Wyświetl nawigację tylko jeśli użytkownik jest zalogowany
       <nav className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-50">
         <div className="container mx-auto flex flex-wrap justify-between items-center">
           {/* Lewa strona nawigacji - Nazwa aplikacji/link do dashboardu */}
           <RouterLink to="/dashboard" className="text-xl font-semibold hover:text-indigo-200 mb-2 sm:mb-0">
             Róża Modlitewna
           </RouterLink>
           
           {/* Prawa strona nawigacji - Linki i przycisk wylogowania */}
           <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-sm">
             <RouterLink to="/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Użytkownika</RouterLink>
             
             {(user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN) && (
               <RouterLink to="/zelator-dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Zelatora</RouterLink>
             )}
             {user.role === UserRoles.ADMIN && (
               <RouterLink to="/admin-panel" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Admina</RouterLink>
             )}

             {/* Przycisk Wyloguj */}
             <button
               onClick={logout} // Użyj funkcji logout z AuthContext
               className="px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 transition-colors text-xs font-medium"
             >
               Wyloguj ({user.email})
             </button>
           </div>
         </div>
       </nav>
     )}

     {/* Dodajemy padding-top do main, jeśli navbar jest widoczny i sticky, aby treść nie była zakryta */}
     {/* Wysokość pt-16 (padding-top: 4rem; // 64px) jest przykładowa, dostosuj do wysokości swojego navbara */}
     <main className={user ? "pt-16" : ""}> 
      <Routes>
        {/* Domyślna trasa */}
        <Route 
            path="/" 
            element={
                <ProtectedRoute>
                    <Navigate to="/dashboard" replace /> 
                </ProtectedRoute>
            } 
        />
        
        {/* Trasy publiczne */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        {/* Trasy dla zalogowanego użytkownika (MEMBER, ZELATOR, ADMIN) */}
        <Route 
            path="/dashboard" 
            element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } 
        />
        
        {/* Trasy dla Zelatora (i Admina) */}
        <Route 
          path="/zelator-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[UserRoles.ZELATOR, UserRoles.ADMIN]}>
              <ZelatorDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/zelator/rose/:roseId"
          element={
            <ProtectedRoute allowedRoles={[UserRoles.ZELATOR, UserRoles.ADMIN]}>
              <ManagedRoseDetailsPage />
            </ProtectedRoute>
          } 
        />

        {/* Trasy dla Admina (z zagnieżdżonym routingiem) */}
        <Route 
          path="/admin-panel" 
          element={
            <ProtectedRoute allowedRoles={[UserRoles.ADMIN]}>
              <AdminPanelPage /> 
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="users" replace />} /> 
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="roses" element={<AdminRosesPage />} />
        </Route>

        {/* Strona 404 - łapie wszystkie inne niepasujące ścieżki */}
        <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen py-10">
                  <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
                  <p className="text-2xl text-gray-700 mb-6">Strona nie została znaleziona.</p>
                  <RouterLink to="/" className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                    Wróć na stronę główną
                  </RouterLink>
              </div>
            } />
      </Routes>
     </main>
    </>
  );
}

export default App;