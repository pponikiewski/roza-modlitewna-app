// frontend/src/pages/AdminRosesPage.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import type { RoseListItemAdmin } from '../types/admin.types'; // Zaimportuj typy

const AdminRosesPage: React.FC = () => {
  const [roses, setRoses] = useState<RoseListItemAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Funkcja do pobierania Róż
   useEffect(() => {
     const fetchRoses = async () => {
         setIsLoading(true);
         setError(null);
         try {
             const response = await apiClient.get<RoseListItemAdmin[]>('/admin/roses');
             setRoses(response.data);
         } catch (err:any) {
             setError(err.response?.data?.error || "Nie udało się pobrać listy Róż.");
         } finally {
             setIsLoading(false);
         }
     };
     fetchRoses();
  }, []);


  if (isLoading) return <p className="text-gray-600">Ładowanie listy Róż...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Lista Wszystkich Róż w Systemie</h2>
      {/* TODO: Przycisk do tworzenia nowej Róży */}
      {/* TODO: Przycisk do ręcznego wywołania przydzielania tajemnic */}

      {roses.length === 0 ? (
         <p>Brak Róż w systemie.</p>
      ) : (
         <div className="space-y-4">
             {roses.map(rose => (
                 <div key={rose.id} className="bg-gray-50 p-4 rounded-md border">
                     <h3 className="text-lg font-semibold text-indigo-700">{rose.name}</h3>
                     <p className="text-sm text-gray-600">{rose.description || "Brak opisu."}</p>
                     <p className="text-xs text-gray-500 mt-1">
                         Zelator: {rose.zelator.name || rose.zelator.email} (ID: {rose.zelator.id}, Rola: {rose.zelator.role})
                     </p>
                     <p className="text-xs text-gray-500">Liczba członków: {rose._count.members}</p>
                     <p className="text-xs text-gray-500">Utworzono: {new Date(rose.createdAt).toLocaleDateString('pl-PL')}</p>
                     {/* TODO: Przyciski do edycji, usuwania, zarządzania członkami tej Róży */}
                 </div>
             ))}
         </div>
      )}
    </div>
  );
};

export default AdminRosesPage;