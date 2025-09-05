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
    <nav className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg sticky top-0 z-50 flex-shrink-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <RouterLink 
            to="/dashboard" 
            className="text-xl sm:text-2xl font-bold hover:text-indigo-200 transition-colors flex items-center space-x-2"
          >
            <span className="bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
              Róża Modlitewna
            </span>
          </RouterLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <RouterLink 
              to="/dashboard" 
              className="px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1"
            >
              <span>Panel</span>
            </RouterLink>
            
            <RouterLink 
              to="/my-intentions" 
              className="px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1"
            >
              <span>Intencje</span>
            </RouterLink>
            
            {isZelatorOrAdmin && (
              <RouterLink 
                to="/zelator-dashboard" 
                className="px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1"
              >
                <span>Zelator</span>
              </RouterLink>
            )}
            
            {isAdmin && (
              <RouterLink 
                to="/admin-panel" 
                className="px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1"
              >
                <span>Admin</span>
              </RouterLink>
            )}
            
            <RouterLink 
              to="/profile" 
              className="px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1"
            >
              <span>Profil</span>
            </RouterLink>
            
            <button
              onClick={logout}
              className="ml-3 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-600 backdrop-blur-sm transition-all duration-200 text-sm font-medium flex items-center space-x-1 shadow-md"
              title={`Wyloguj ${user.email}`}
            >
              <span>Wyloguj</span>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <details className="relative">
              <summary className="cursor-pointer p-3 rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-200 list-none">
                <span className="text-xl">≡</span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl py-2 z-50 border border-white/20">
                <RouterLink 
                  to="/dashboard" 
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors"
                >
                  <span>Panel</span>
                </RouterLink>
                <RouterLink 
                  to="/my-intentions" 
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors"
                >
                  <span>Intencje</span>
                </RouterLink>
                {isZelatorOrAdmin && (
                  <RouterLink 
                    to="/zelator-dashboard" 
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors"
                  >
                    <span>Zelator</span>
                  </RouterLink>
                )}
                {isAdmin && (
                  <RouterLink 
                    to="/admin-panel" 
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors"
                  >
                    <span>Admin</span>
                  </RouterLink>
                )}
                <RouterLink 
                  to="/profile" 
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors"
                >
                  <span>Profil</span>
                </RouterLink>
                
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                >
                  <span>Wyloguj</span>
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
    <div className="text-center space-y-4 p-8">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-700 text-base">{message}</p>
    </div>
  </div>
));

// Wydzielony komponent błędu uprawnień
const UnauthorizedAccess: React.FC = () => (
  <div className="p-8 text-center flex-grow flex flex-col justify-center items-center min-h-[60vh]">
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-100 to-rose-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-red-600">!</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
        Brak Uprawnień
      </h1>
      <p className="text-gray-600 mb-8 leading-relaxed">
        Przepraszamy, nie masz wystarczających uprawnień, aby wyświetlić tę stronę.
        Skontaktuj się z administratorem, jeśli uważasz, że to błąd.
      </p>
      <RouterLink 
        to="/dashboard" 
        className="btn-primary inline-flex items-center space-x-2"
      >
        <span>Wróć do Panelu</span>
      </RouterLink>
    </div>
  </div>
);

// Wydzielony komponent 404
const NotFoundPage: React.FC = () => (
  <div className="flex flex-grow flex-col items-center justify-center py-10 min-h-[60vh]">
    <div className="text-center max-w-md mx-auto">
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-amber-600">?</span>
        </div>
      </div>
      <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-4">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Strona nie została znaleziona</h2>
      <p className="text-gray-600 mb-8 leading-relaxed">
        Przepraszamy, ale strona, której szukasz, nie istnieje lub została przeniesiona.
      </p>
      <RouterLink 
        to="/" 
        className="btn-primary inline-flex items-center space-x-2"
      >
        <span>Wróć na stronę główną</span>
      </RouterLink>
    </div>
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center p-8">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Róża Modlitewna
          </p>
          <p className="text-gray-600 mt-2">Ładowanie aplikacji...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <Navigation />
        
        <main className="flex-1 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27 width=%2732%27 height=%2732%27 fill=%27none%27 stroke=%27rgb(148 163 184 / 0.05)%27%3e%3cpath d=%27m0 .5 32 32M32 .5 0 32%27/%3e%3c/svg%3e')] opacity-30"></div>
          
          <div className="relative z-10 h-full overflow-y-auto">
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
          </div>
        </main>
      </div>
      
      <Toaster 
        richColors 
        closeButton 
        position="top-right"
        duration={4000}
        toastOptions={{
          style: { 
            fontSize: '14px',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          },
          className: 'backdrop-blur-sm',
        }}
        theme="light"
      />
    </>
  );
}

export default App;