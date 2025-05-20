// frontend/src/types/admin.types.ts
// Prosty typ dla Róży, może być rozbudowany
export interface Rose {
  id: string;
  name: string;
  description?: string | null;
  zelatorId: string;
  zelator?: { // Opcjonalnie dane zelatora
    id: string;
    email: string;
    name?: string | null;
  };
  _count?: { // Opcjonalnie liczba członków
    members: number;
  };
  // inne pola, jeśli API je zwraca
}