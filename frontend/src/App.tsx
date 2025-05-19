// frontend/src/App.tsx
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { user, token, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return (
    <div>
      {token && user ? (
        <div className="p-4">
          <p>Zalogowany jako: {user.email} (Rola: {user.role})</p>
          <button
             onClick={logout}
             className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
           >
             Wyloguj
           </button>
          {/* Tutaj będzie reszta aplikacji dla zalogowanego użytkownika */}
        </div>
      ) : (
        <>
          <LoginPage />
          <hr className="my-8" />
          <RegisterPage />
        </>
      )}
    </div>
  );
}

export default App;