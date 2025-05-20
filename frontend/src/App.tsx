// frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import ZelatorDashboardPage from './pages/ZelatorDashboardPage';
import ManagedRoseDetailsPage from './pages/ManagedRoseDetailsPage';
import { useAuth } from "./contexts/AuthContext";
import { UserRoles, type UserRole } from './types/user.types'; // Zaktualizowany import


// Komponent chronionej trasy
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Ładowanie sesji...</div>;
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // user.role z AuthContext to string. Porównujemy go z wartościami z obiektu UserRoles.
  // Rzutowanie 'user.role as UserRole' jest tu dla pewności, że TypeScript wie, że próbujemy
  // dopasować do naszego zdefiniowanego typu unii.
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


// Komponent dla stron publicznych (np. logowanie, rejestracja), przekierowuje jeśli zalogowany
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
  const { isLoading, user } = useAuth();

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
           <RouterLink to="/dashboard" className="text-xl font-semibold hover:text-indigo-200 mb-2 sm:mb-0">
             Róża Modlitewna
           </RouterLink>
           <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
             <RouterLink to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors">Panel Użytkownika</RouterLink>
             {/* Używamy teraz UserRoles.NAZWA_ROLI do porównań */}
             {(user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN) && (
               <RouterLink to="/zelator-dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors">Panel Zelatora</RouterLink>
             )}
             {user.role === UserRoles.ADMIN && (
               <RouterLink to="/admin-panel" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors">Panel Admina (TODO)</RouterLink>
             )}
           </div>
         </div>
       </nav>
     )}

     <main className={user ? "pt-контроль_wysokosci_navbara" : ""}> {/* Dodaj padding-top, jeśli navbar jest sticky */}
      <Routes>
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        
        <Route 
          path="/zelator-dashboard" 
          element={
            // Używamy UserRoles.NAZWA_ROLI w tablicy allowedRoles
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
        {/* TODO: Dodać trasę dla /admin-panel */}
        {/* <Route 
            path="/admin-panel" 
            element={
              <ProtectedRoute allowedRoles={[UserRoles.ADMIN]}>
                <AdminPanelPage /> // Przykładowy komponent
              </ProtectedRoute>
            } 
        /> */}


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