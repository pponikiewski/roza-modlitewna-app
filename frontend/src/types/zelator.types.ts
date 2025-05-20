// frontend/src/types/zelator.types.ts

import type { RosaryMysteryDetails } from './rosary.types'; // Zakładamy, że ten plik istnieje i eksportuje RosaryMysteryDetails
import type { UserRole } from './user.types';     // Zakładamy, że ten plik istnieje i eksportuje UserRole (enum lub typ unii)

// Podstawowe informacje o Róży, używane np. w liście członkostw
// lub jako część danych na stronie ManagedRoseDetailsPage
export interface BasicRoseInfo {
  id: string;
  name: string;
  description?: string | null;
  // Można by tu dodać ID zelatora, jeśli potrzebne bezpośrednio w tym typie
  // zelatorId: string; 
}

// Podstawowe informacje o użytkowniku (członku lub Zelatorze)
export interface BasicUserInfo {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole; // Dodajemy rolę, może się przydać do wyświetlania
}

// Typ dla elementu listy Róż zarządzanych przez Zelatora
// (odpowiedź z GET /zelator/my-roses)
export interface ManagedRose {
  id: string;
  name: string;
  description?: string | null;
  zelatorId: string; // ID Zelatora tej Róży (czyli zalogowanego użytkownika)
  zelator?: BasicUserInfo; // Opcjonalnie pełniejsze dane Zelatora (jeśli API zwraca)
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

// Typ dla członkostwa w Róży, wraz z danymi użytkownika i danymi Róży
// Odpowiedź z GET /zelator/roses/:roseId/members powinna zwracać tablicę takich obiektów
export interface RoseMembershipWithDetails {
  // Pola z modelu RoseMembership
  id: string; // ID samego członkostwa
  userId: string;
  roseId: string;
  currentAssignedMystery: string | null; // ID tajemnicy (np. "radosna_1")
  mysteryConfirmedAt: string | null;     // Data jako string ISO lub null
  mysteryOrderIndex?: number | null;    // Jeśli używamy i zwracamy
  createdAt: string;
  updatedAt: string;

  // Dołączone dane użytkownika (członka)
  user: BasicUserInfo;

  // Dołączone dane Róży (do której należy to członkostwo)
  rose: BasicRoseInfo;

  // Opcjonalnie przetworzone, pełne dane tajemnicy (dodawane na frontendzie)
  mysteryDetails?: RosaryMysteryDetails | null; 
}

// Możesz chcieć użyć bardziej specyficznej nazwy zamiast ogólnego RoseMembershipWithUserAndMystery
// np. RoseMemberView dla ManagedRoseDetailsPage.tsx. Poniżej zostawiam oryginalną nazwę,
// ale zaktualizowałem ją, aby zawierała pole 'rose'.
export type RoseMembershipWithUserAndMystery = RoseMembershipWithDetails;