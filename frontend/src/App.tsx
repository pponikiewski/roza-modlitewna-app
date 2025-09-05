// frontend/src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from "./contexts/AuthContext";
import { UserRoles, type UserRole } from './types/user.types';
import { Toaster } from 'sonner';

// Lazy loading komponentów stron
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ZelatorDashboardPage = lazy(() => import('./pages/ZelatorDashboardPage'));
const ManagedRoseDetailsPage = lazy(() => import('./pages/ManagedRoseDetailsPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminRosesPage = lazy(() => import('./pages/AdminRosesPage'));
const MyIntentionsPage = lazy(() => import('./pages/MyIntentionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Wydzielony komponent nawigacji
const Navigation: React.FC = React.memo(() => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const isZelatorOrAdmin = user.role === UserRoles.ZELATOR || user.role === UserRoles.ADMIN;
  const isAdmin = user.role === UserRoles.ADMIN;

  return (
    <nav className="bg-indigo-700 text-white shadow-md sticky top-0 z-50 flex-shrink-0">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <RouterLink 
            to="/dashboard" 
            className="text-lg sm:text-xl font-semibold hover:text-indigo-200 transition-colors"
          >
            🌹 Róża Modlitewna
          </RouterLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <RouterLink 
              to="/dashboard" 
              className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              Panel
            </RouterLink>
            
            <RouterLink 
              to="/my-intentions" 
              className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              Intencje
            </RouterLink>
            
            <RouterLink 
              to="/profile" 
              className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              Profil
            </RouterLink>
            
            {isZelatorOrAdmin && (
              <RouterLink 
                to="/zelator-dashboard" 
                className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                Zelator
              </RouterLink>
            )}
            
            {isAdmin && (
              <RouterLink 
                to="/admin-panel" 
                className="px-3 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                Admin
              </RouterLink>
            )}
            
            <button
              onClick={logout}
              className="ml-2 px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 transition-colors text-sm font-medium"
              title={`Wyloguj ${user.email}`}
            >
              Wyloguj
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <details className="relative">
              <summary className="cursor-pointer p-2 rounded-md hover:bg-indigo-600 transition-colors list-none">
                <span className="text-xl">☰</span>
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <RouterLink 
                  to="/dashboard" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🏠 Panel
                </RouterLink>
                <RouterLink 
                  to="/my-intentions" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🙏 Intencje
                </RouterLink>
                <RouterLink 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  👤 Profil
                </RouterLink>
                {isZelatorOrAdmin && (
                  <RouterLink 
                    to="/zelator-dashboard" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ⭐ Zelator
                  </RouterLink>
                )}
                {isAdmin && (
                  <RouterLink 
                    to="/admin-panel" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ⚙️ Admin
                  </RouterLink>
                )}
                
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  🚪 Wyloguj
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
});

// Wydzielony komponent loading spinner
const LoadingSpinner: React.FC<{ message?: string }> = React.memo(({ message = "Ładowanie..." }) => (
  <div className="flex flex-grow items-center justify-center min-h-[50vh]">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
      <span className="text-gray-700 text-sm sm:text-base">{message}</span>
    </div>
  </div>
));

// Wydzielony komponent błędu uprawnień
const UnauthorizedAccess: React.FC = () => (
  <div className="p-8 text-center flex-grow flex flex-col justify-center items-center bg-gray-100">
    <h1 className="text-3xl font-bold text-red-600 mb-4">Brak Uprawnień</h1>
    <p className="text-gray-700 mb-6">
      Przepraszamy, nie masz wystarczających uprawnień, aby wyświetlić tę stronę.
    </p>
    <RouterLink 
      to="/dashboard" 
      className="px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
    >
      Wróć do Panelu
    </RouterLink>
  </div>
);

// Wydzielony komponent 404
const NotFoundPage: React.FC = () => (
  <div className="flex flex-grow flex-col items-center justify-center py-10">
    <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
    <p className="text-2xl text-gray-700 mb-6">Strona nie została znaleziona.</p>
    <RouterLink 
      to="/" 
      className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
    >
      Wróć na stronę główną
    </RouterLink>
  </div>
);

// Zoptymalizowany komponent chronionej trasy
const ProtectedRoute: React.FC<{ 
  children: React.ReactElement; 
  allowedRoles?: UserRole[] 
}> = React.memo(({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner message="Ładowanie sesji..." />;
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return <UnauthorizedAccess />;
  }
  
  return children;
});

// Główny komponent aplikacji
function App() {
  const { isLoading, token } = useAuth();

  // Loading screen dla pierwszego ładowania aplikacji
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-medium text-gray-700">
            🌹 Ładowanie Róży Modlitewnej...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="flex-1">
          <Suspense fallback={<LoadingSpinner message="Ładowanie strony..." />}>
            <Routes>
              {/* Optimized redirects */}
              <Route 
                path="/" 
                element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
              />
              
              {/* Public routes */}
              <Route 
                path="/login" 
                element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
              />
              <Route 
                path="/register" 
                element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
              />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
              />
              <Route 
                path="/my-intentions"
                element={<ProtectedRoute><MyIntentionsPage /></ProtectedRoute>}
              />
              <Route 
                path="/profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
              
              {/* Zelator routes */}
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

              {/* Admin routes */}
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

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      
      <Toaster 
        richColors 
        closeButton 
        position="top-right"
        duration={3000}
        toastOptions={{
          style: { fontSize: '14px' }
        }}
      />
    </>
  );
}

export default App;