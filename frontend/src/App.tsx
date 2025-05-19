import React, { type JSX } from 'react'; // Dodaj import React, jeśli go nie ma
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom'; // Zmieniono nazwę Link na RouterLink, aby uniknąć konfliktu, jeśli masz inny komponent Link
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import { useAuth } from "./contexts/AuthContext";
// Komponent chronionej trasy
  const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { token, isLoading } = useAuth();
    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-xl">Ładowanie sesji...</div>;
    return token ? children : <Navigate to="/login" replace />;
  };

  // Komponent dla stron publicznych (logowanie, rejestracja)
  const PublicRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { token, isLoading } = useAuth();
    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-xl">Ładowanie sesji...</div>;
    return token ? <Navigate to="/dashboard" replace /> : children;
  };

  function App() {
    const { isLoading } = useAuth(); // Pobieramy isLoading z kontekstu

    // Główny ekran ładowania, jeśli kontekst autoryzacji jeszcze się nie załadował
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-2xl font-semibold text-gray-700">
          Ładowanie aplikacji Róży Modlitewnej...
        </div>
      );
    }

    return (
      <Routes>
        {/* Strona główna - jeśli zalogowany, idź do dashboardu, jeśli nie, do logowania */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />

        {/* Strony publiczne - jeśli zalogowany, idź do dashboardu */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />

        {/* Strony chronione */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* Strona 404 */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
              <p className="text-2xl text-gray-700 mb-6">Strona nie została znaleziona.</p>
              <RouterLink to="/" className="px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Wróć na stronę główną
              </RouterLink>
          </div>
        } />
      </Routes>
    );
  }

  export default App;