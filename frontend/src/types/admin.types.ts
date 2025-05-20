// frontend/src/types/admin.types.ts

// Zaimportuj UserRole, jeśli go tu potrzebujesz (np. dla typu Zelatora)
// Najlepiej, aby UserRole było zdefiniowane w jednym miejscu na frontendzie, np. frontend/src/types/user.types.ts
import type { UserRole } from './user.types'; 

// Prosty typ użytkownika, np. do wyświetlania Zelatora na liście Róż
export interface BasicUserAdminView {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole; // Możemy chcieć widzieć rolę Zelatora
}

// Typ dla elementu listy Róż, jak zwraca endpoint GET /admin/roses
export interface RoseListItemAdmin {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string; // Data jako string ISO
  updatedAt: string; // Data jako string ISO
  zelatorId: string;
  zelator: BasicUserAdminView; // Dołączone dane Zelatora
  _count: {
    members: number; // Liczba członków
  };
}

// Typ dla pełnych danych użytkownika, np. przy listowaniu wszystkich użytkowników przez Admina
// (jeśli będziemy mieli taki endpoint i widok)
export interface UserAdminView {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
    // można dodać inne pola, np. liczbę Róż, którymi zarządza, jeśli jest Zelatorem
}