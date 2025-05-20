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
import { useAuth } from "./contexts/AuthContext";
import { UserRoles, type UserRole } from './types/user.types';

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
  const { isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl font-semibold text-gray-700">
        Ładowanie aplikacji Róży Modlitewnej...
      </div>
    );
  }

  // Ustaw tę klasę na podstawie rzeczywistej wysokości swojego navbara.
  // np. jeśli nav ma wysokość 4rem (64px), Tailwind klasa to 'pt-16'.
  // Jeśli nav ma p-4 (1rem paddingu góra/dół) i tekst jednoliniowy, może to być ~3.5rem (h-14 -> pt-14)
  const navbarPaddingTopClass = "pt-16"; // Przykładowa wartość, dostosuj!

  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* Tło dla całej aplikacji, jeśli main nie pokrywa */}
     {user && (
       <nav className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-50 shrink-0">
         <div className="container mx-auto flex flex-wrap justify-between items-center">
           <RouterLink to="/dashboard" className="text-xl font-semibold hover:text-indigo-200 mb-2 sm:mb-0">
             Róża Modlitewna
           </RouterLink>
           <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-sm">
             <RouterLink to="/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Użytkownika</RouterLink>
             {(user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN) && (
               <RouterLink to="/zelator-dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Zelatora</RouterLink>
             )}
             {user.role === UserRoles.ADMIN && (
               <RouterLink to="/admin-panel" className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors">Panel Admina</RouterLink>
             )}
             <button
               onClick={logout}
               className="px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 transition-colors text-xs font-medium"
             >
               Wyloguj ({user.email})
             </button>
           </div>
         </div>
       </nav>
     )}

     {/* `flex-grow` sprawia, że main wypełnia dostępną przestrzeń w kontenerze flex `App` */}
     {/* Padding jest dodawany tylko jeśli nav jest sticky, aby treść nie była zakryta */}
     <main className={`flex-grow ${user && document.querySelector('nav')?.classList.contains('sticky') ? navbarPaddingTopClass : ""}`}>
      <Routes>
        <Route 
            path="/" 
            element={
                <ProtectedRoute>
                    <Navigate to="/dashboard" replace /> 
                </ProtectedRoute>
            } 
        />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route 
            path="/dashboard" 
            element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } 
        />
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
        <Route path="*" element={
              <div className="flex flex-col items-center justify-center flex-grow h-full py-10"> {/* h-full, aby wypełnić <main> */}
                  <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
                  <p className="text-2xl text-gray-700 mb-6">Strona nie została znaleziona.</p>
                  <RouterLink to="/" className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                    Wróć na stronę główną
                  </RouterLink>
              </div>
            } />
      </Routes>
     </main>
    </div>
  );
}

export default App;