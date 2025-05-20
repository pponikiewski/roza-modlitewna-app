// frontend/src/types/zelator.types.ts
import type { RosaryMysteryDetails } from './rosary.types'; // Zaimportuj typ z rosary.types

export interface RoseUser { // Prosty typ użytkownika, który jest członkiem
  id: string;
  email: string;
  name?: string | null;
  role: string; // Dodajemy rolę, może się przydać
}

export interface RoseMembershipWithUserAndMystery {
  id: string; // ID członkostwa (z tabeli RoseMembership)
  userId: string;
  roseId: string;
  currentAssignedMystery: string | null; // ID tajemnicy (np. "radosna_1")
  mysteryConfirmedAt: string | null;     // Data jako string ISO lub null
  user: RoseUser;                        // Dane użytkownika, który jest członkiem
  mysteryDetails?: RosaryMysteryDetails;  // Opcjonalnie pełne dane tajemnicy po przetworzeniu
}