import React from 'react';
import { useAuth } from '../contexts/AuthContext';
// Navigate nie jest tu potrzebne, bo App.tsx zarządza przekierowaniem do tej strony
const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth(); // Pobieramy usera i funkcję logout z kontekstu

    // Teoretycznie ProtectedRoute w App.tsx powinien zapobiec dostaniu się tutaj niezalogowanego użytkownika
    // ale dodatkowe sprawdzenie nie zaszkodzi.
    if (!user) {
      // Można by tu zwrócić null lub komunikat, ale ProtectedRoute powinien to obsłużyć
      return <p>Błąd: Brak danych użytkownika. Proszę się zalogować.</p>;
    }

    return (
      <div className="p-8 bg-slate-100 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Witaj, {user.name || user.email}!
            </h1>
            <button
              onClick={logout} // Funkcja wylogowania z AuthContext
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Wyloguj
            </button>
          </div>
          <p className="mb-2 text-gray-700">Twoja rola: <span className="font-semibold">{user.role}</span></p>
          <div className="mt-6 p-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Twoja Róża Różańcowa</h2>
            <p className="text-gray-600">
              Wkrótce tutaj pojawią się informacje o Twojej aktualnej tajemnicy, intencjach Róży oraz możliwość potwierdzenia modlitwy.
            </p>
            {/* Tutaj w przyszłości będą komponenty związane z Różą */}
          </div>
        </div>
      </div>
    );
  };

  export default DashboardPage;