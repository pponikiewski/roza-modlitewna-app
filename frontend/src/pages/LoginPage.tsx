// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // <<<< ZMIANA: Dodano import

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [error, setError] = useState<string | null>(null); // <<<< ZMIANA: Usunięto
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // setError(null); // <<<< ZMIANA: Usunięto
      setIsSubmitting(true);
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        login(response.data.token, response.data.user);
        toast.success("Zalogowano pomyślnie!"); // <<<< ZMIANA: Dodano toast (opcjonalny)
        navigate('/dashboard');
      } catch (err: any) {
        // setError(err.response?.data?.error || 'Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.'); // <<<< ZMIANA: Usunięto
        toast.error(err.response?.data?.error || 'Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.'); // <<<< ZMIANA: Dodano toast
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27 width=%2732%27 height=%2732%27 fill=%27none%27 stroke=%27rgb(255 255 255 / 0.05)%27%3e%3cpath d=%27m0 .5 32 32M32 .5 0 32%27/%3e%3c/svg%3e')] opacity-30"></div>
        
        <div className="relative z-10 w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🌹</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Róża Modlitewna</h1>
            <p className="text-indigo-200">Zaloguj się do swojego konta</p>
          </div>

          <div className="card glass p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adres email
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field" 
                  placeholder="twoj@email.com" 
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Hasło
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Logowanie...</span>
                    </>
                  ) : (
                    <>
                      <span>🔑</span>
                      <span>Zaloguj się</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Nie masz konta?{' '}
                <RouterLink 
                  to="/register" 
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Zarejestruj się
                </RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default LoginPage;