// frontend/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import apiClient from '../services/api';
// import { useNavigate } from 'react-router-dom'; // Jeśli będziesz używać react-router-dom

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.');
      return;
    }

    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      console.log('Zarejestrowano:', response.data);
      setSuccess('Rejestracja pomyślna! Możesz się teraz zalogować.');
      // Po pomyślnej rejestracji można przekierować na stronę logowania
      // navigate('/login');
      // Lub zresetować formularz
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Błąd rejestracji:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Nie udało się zarejestrować. Spróbuj ponownie.');
    }
  };

  return (
   <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
     <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
       <h2 className="text-2xl font-bold text-center text-gray-700">Rejestracja</h2>
       {error && <p className="text-red-500 text-sm text-center">{error}</p>}
       {success && <p className="text-green-500 text-sm text-center">{success}</p>}
       <form onSubmit={handleSubmit} className="space-y-6">
         <div>
           <label htmlFor="name" className="block text-sm font-medium text-gray-700">Imię (opcjonalnie)</label>
           <input id="name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
             className="block w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         </div>
         <div>
           <label htmlFor="email-register" className="block text-sm font-medium text-gray-700">Email</label>
           <input id="email-register" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
             className="block w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         </div>
         <div>
           <label htmlFor="password-register" className="block text-sm font-medium text-gray-700">Hasło</label>
           <input id="password-register" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
             className="block w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         </div>
         <div>
           <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Potwierdź Hasło</label>
           <input id="confirm-password" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
             className="block w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
         </div>
         <div>
           <button type="submit"
             className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
             Zarejestruj się
           </button>
         </div>
       </form>
     </div>
   </div>
  );
};

export default RegisterPage;