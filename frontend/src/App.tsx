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
import { UserRoles, type UserRole } from './types/user.types'; // Upewnij się, że ten plik istnieje i poprawnie eksportuje typy/enumy


// Komponent chronionej trasy
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex flex-grow items-center justify-center text-xl">Ładowanie sesji...</div>; // flex-grow, aby zajął dostępną przestrzeń
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="p-8 text-center flex-grow flex flex-col justify-center items-center bg-gray-100">
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
  return children; // Dziecko samo powinno zarządzać swoim rozciąganiem (np. flex-grow jeśli jest częścią flex layoutu)
};


// Komponent dla stron publicznych
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    // flex-grow, aby zajął dostępną przestrzeń w głównym kontenerze flex
    return <div className="flex flex-grow items-center justify-center text-xl">Ładowanie sesji...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  // Dziecko (np. LoginPage) samo zarządza swoim wyglądem (np. min-h-screen, jeśli ma zajmować cały ekran)
  return children;
};


function App() {
  const { isLoading, user, logout } = useAuth();

  if (isLoading && !user) { // Pokaż pełnoekranowe ładowanie tylko na początku, gdy nie ma jeszcze usera
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl font-semibold text-gray-700 bg-slate-100">
        Ładowanie aplikacji Róży Modlitewnej...
      </div>
    );
  }

  // Główny kontener aplikacji
  return (
    <div className="flex flex-col min-h-screen bg-slate-100"> {/* Tło dla całej aplikacji, jeśli nie jest pokryte przez <main> */}
     {user && ( // Wyświetl nawigację tylko jeśli użytkownik jest zalogowany
       <nav className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-50 flex-shrink-0"> {/* flex-shrink-0 zapobiega kurczeniu się navbara */}
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

     {/* Główna treść strony - powinna się rozciągnąć */}
     {/* Jeśli navbar jest sticky, nie potrzebujemy paddingu, jeśli <main> jest kontenerem flex i sam się rozciąga */}
     {/* Jeśli <main> nie jest flex-grow w kontenerze flex, to padding jest potrzebny */}
     <main className="flex-grow"> {/* flex-grow jest kluczowe, aby <main> wypełniło resztę przestrzeni */}
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
              <div className="flex flex-grow flex-col items-center justify-center py-10"> {/* flex-grow tutaj, jeśli to jedyny element w main */}
                  <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
                  <p className="text-2xl text-gray-700 mb-6">Strona nie została znaleziona.</p>
                  <RouterLink to="/" className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                    Wróć na stronę główną
                  </RouterLink>
              </div>
            } />
      </Routes>
     </main>
     {/* Można dodać globalną stopkę tutaj, jeśli potrzebna */}
     {/* <footer className="bg-gray-200 text-center p-4 text-sm text-gray-600 flex-shrink-0">Stopka aplikacji</footer> */}
    </div>
  );
}

export default App;