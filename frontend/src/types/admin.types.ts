// frontend/src/types/admin.types.ts

// Zaimportuj UserRole, jeśli jest zdefiniowane w osobnym pliku na frontendzie
// (np. frontend/src/types/user.types.ts)
import type { UserRole } from './user.types'; 

// --- Typy dla Zarządzania Użytkownikami ---

// Typ dla użytkownika wyświetlanego na liście w panelu Admina
// (odpowiednik danych zwracanych przez GET /users)
export interface UserAdminView {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole; // Używamy typu UserRole dla spójności
    createdAt: string; // Data jako string ISO
    updatedAt: string; // Data jako string ISO
    // Informacje o przynależności do róż
    managedRoses?: RoseMembershipInfo[]; // Róże, których użytkownik jest Zelatorem
    memberRoses?: RoseMembershipInfo[]; // Róże, w których użytkownik jest członkiem
}

// Informacje o przynależności do róży
export interface RoseMembershipInfo {
    id: string;
    name: string;
    role?: 'ZELATOR' | 'MEMBER'; // Rola w kontekście tej konkretnej róży
}

// --- Typy dla Zarządzania Różami ---

// Podstawowe informacje o Zelatorze (używane w kontekście Róży)
// Może być taki sam jak BasicUserInfo w zelator.types.ts lub nieco inny
export interface BasicZelatorAdminView {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole; // Ważne, aby Admin widział rolę przypisanego Zelatora
}

// Typ dla Róży wyświetlanej na liście w panelu Admina
// (odpowiednik danych zwracanych przez GET /admin/roses i GET /admin/roses/:roseId)
export interface RoseListItemAdmin {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;    // Data jako string ISO
  updatedAt: string;    // Data jako string ISO
  zelatorId: string;
  zelator: BasicZelatorAdminView; // Dołączone dane Zelatora
  currentRotationOffset?: number; // Jeśli Admin ma widzieć/zarządzać offsetem rotacji
  _count: {
    members: number; // Liczba członków
  };
  // Można dodać inne pola specyficzne dla widoku Admina, jeśli API je zwraca
  // np. status Róży (aktywna, nieaktywna), ostatnia data przydzielenia tajemnic itp.
}

// Typ dla danych wysyłanych przy tworzeniu nowej Róży przez Admina
// (ciało żądania dla POST /admin/roses)
export interface CreateRosePayload {
  name: string;
  description?: string;
  zelatorId: string;
}

// Typ dla danych wysyłanych przy aktualizacji Róży przez Admina
// (ciało żądania dla PATCH /admin/roses/:roseId)
// Wszystkie pola są opcjonalne, bo aktualizujemy tylko te, które się zmieniły.
export interface UpdateRosePayload {
  name?: string;
  description?: string | null; // Pozwalamy na usunięcie opisu przez przekazanie null lub pustego stringa
  zelatorId?: string;
  currentRotationOffset?: number; // Jeśli Admin może to edytować
}

// Typ dla odpowiedzi po udanej operacji (np. utworzeniu, aktualizacji)
export interface AdminActionSuccessResponse {
  message: string;
  // Można dodać inne pola, np. ID zmodyfikowanego zasobu
  // rose?: RoseListItemAdmin;
  // user?: UserAdminView;
}

// Typ dla odpowiedzi błędu z API (ogólny)
export interface ApiErrorResponse {
  error: string;
  // Można dodać inne pola, np. szczegóły błędu walidacji
  // details?: any;
}