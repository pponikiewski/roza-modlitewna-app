import React, { useState } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Importuj useNavigate i RouterLink
const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Stan do obsługi ładowania
    const { login } = useAuth();
    const navigate = useNavigate(); // Hook do programatycznej nawigacji

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        login(response.data.token, response.data.user);
        navigate('/dashboard'); // Przekieruj na dashboard po pomyślnym logowaniu
      } catch (err: any) {
        setError(err.response?.data?.error || 'Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 p-4">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-800">Zaloguj się</h2>
          {error && <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adres email</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400" placeholder="ty@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Hasło</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400" placeholder="••••••••" />
            </div>
            <div>
              <button type="submit" disabled={isSubmitting}
                className="w-full flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-sm text-center text-gray-600">
            Nie masz jeszcze konta?{' '}
            <RouterLink to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Zarejestruj się
            </RouterLink>
          </p>
        </div>
      </div>
    );
  };

  export default LoginPage;