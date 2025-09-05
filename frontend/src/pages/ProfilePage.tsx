// frontend/src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('Nowe hasła nie są identyczne.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Endpoint: POST /me/memberships/change-password
      // (lub PATCH - POST jest OK dla akcji)
      const response = await apiClient.post('/me/memberships/change-password', {
        oldPassword,
        newPassword,
      });
      setSuccess(response.data.message || 'Hasło zostało pomyślnie zmienione!');
      // Wyczyść pola formularza
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas zmiany hasła.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <p className="text-xl text-gray-700">Ładowanie danych profilu...</p>
    </div>
  );

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">Mój Profil</h1>
        
        <section className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Informacje o Koncie</h2>
          <p className="text-sm text-gray-600"><strong>Email:</strong> {user.email}</p>
          <p className="text-sm text-gray-600"><strong>Imię:</strong> {user.name || 'Nie podano'}</p>
          <p className="text-sm text-gray-600"><strong>Rola:</strong> {user.role}</p>
          {/* TODO: Możliwość edycji imienia */}
        </section>

        <section className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Zmień Hasło</h2>
          {error && <p className="mb-3 p-2 text-sm text-red-600 bg-red-100 rounded">{error}</p>}
          {success && <p className="mb-3 p-2 text-sm text-green-600 bg-green-100 rounded">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">Stare Hasło <span className="text-red-500">*</span></label>
              <input
                type="password" id="oldPassword" value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nowe Hasło <span className="text-red-500">*</span></label>
              <input
                type="password" id="newPassword" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Potwierdź Nowe Hasło <span className="text-red-500">*</span></label>
              <input
                type="password" id="confirmNewPassword" value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)} required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <button
                type="submit" disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
                {isSubmitting ? 'Zmienianie...' : 'Zmień Hasło'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;