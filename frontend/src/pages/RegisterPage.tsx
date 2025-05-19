import React, { useState } from 'react';
import apiClient from '../services/api';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Importuj useNavigate i RouterLink
const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);

      if (password !== confirmPassword) {
        setError('Hasła nie są identyczne.');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) { // Prosta walidacja długości hasła
        setError('Hasło musi mieć co najmniej 6 znaków.');
        setIsSubmitting(false);
        return;
      }

      try {
        await apiClient.post('/auth/register', { name, email, password });
        setSuccess('Rejestracja pomyślna! Zostaniesz przekierowany na stronę logowania...');
        setTimeout(() => {
          navigate('/login');
        }, 2500); // Przekieruj po 2.5 sekundach
      } catch (err: any) {
        setError(err.response?.data?.error || 'Nie udało się zarejestrować. Spróbuj użyć innego adresu email.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-teal-600 p-4">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-800">Stwórz konto</h2>
          {error && <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center bg-green-100 p-2 rounded">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Imię (opcjonalnie)</label>
              <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm placeholder-gray-400" placeholder="Jan Kowalski" />
            </div>
            <div>
              <label htmlFor="email-register" className="block text-sm font-medium text-gray-700">Adres email</label>
              <input id="email-register" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm placeholder-gray-400" placeholder="ty@example.com" />
            </div>
            <div>
              <label htmlFor="password-register" className="block text-sm font-medium text-gray-700">Hasło</label>
              <input id="password-register" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm placeholder-gray-400" placeholder="min. 6 znaków" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Potwierdź Hasło</label>
              <input id="confirm-password" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm placeholder-gray-400" placeholder="••••••••" />
            </div>
            <div>
              <button type="submit" disabled={isSubmitting}
                className="w-full flex justify-center px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50">
                {isSubmitting ? 'Rejestrowanie...' : 'Zarejestruj się'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-sm text-center text-gray-600">
            Masz już konto?{' '}
            <RouterLink to="/login" className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
              Zaloguj się
            </RouterLink>
          </p>
        </div>
      </div>
    );
  };

  export default RegisterPage;