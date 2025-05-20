// frontend/src/types/rosary.types.ts
export interface RosaryMysteryDetails { // <<<< UPEWNIJ SIĘ, ŻE JEST EXPORT I NAZWA JEST POPRAWNA
  id: string;
  group: string;
  name: string;
  contemplation: string;
  imageUrl?: string;
}

export interface CurrentMysteryInfo {
  membershipId: string;
  roseName: string;
  mystery: RosaryMysteryDetails | null;
  confirmedAt: string | null;
}

export interface MysteryHistoryEntry {
  id: string;
  membershipId: string;
  mystery: string; // ID tajemnicy
  assignedMonth: number;
  assignedYear: number;
  assignedAt: string;
  mysteryDetails?: RosaryMysteryDetails;
}

export interface MysteryHistoryResponse {
  roseName: string;
  history: MysteryHistoryEntry[];
}

export interface BasicZelatorInfo {
    id: string;
    name?: string | null;
    email: string;
}

export interface BasicRoseInfo {
    id: string;
    name: string;
    description?: string | null;
    zelator: BasicZelatorInfo;
}

export interface UserMembership {
    id: string; // ID członkostwa (RoseMembership.id)
    userId: string;
    roseId: string;
    createdAt: string;
    updatedAt: string;
    currentAssignedMystery: string | null; // ID tajemnicy
    mysteryConfirmedAt: string | null;
    rose: BasicRoseInfo; // Dane Róży
    currentMysteryFullDetails: RosaryMysteryDetails | null; // Pełne dane aktualnej tajemnicy
}

// NOWY TYP lub aktualizacja istniejącego, jeśli podobny już był:
// Typ dla odpowiedzi z endpointu GET /zelator/roses/:roseId/main-intention/current
export interface RoseMainIntentionData {
  id: string;
  roseId: string;
  text: string;
  month: number;
  year: number;
  isActive: boolean;
  createdAt: string; // Data jako string ISO
  updatedAt: string; // Data jako string ISO
  authorId?: string | null;
  author?: { // Opcjonalne dane autora
    id: string;
    name?: string | null;
    email: string;
  } | null;
  rose?: { // Opcjonalne dane Róży (backend może je dołączać)
    name: string;
  } | null;
}
export interface BasicRoseInfo {
    id: string;
    name: string;
    description?: string | null;
    zelator: BasicZelatorInfo;
    // Usuniemy mainIntentions stąd, bo będzie na poziomie UserMembership
}

export interface UserMembership {
    id: string;
    userId: string;
    roseId: string;
    createdAt: string;
    updatedAt: string;
    currentAssignedMystery: string | null;
    mysteryConfirmedAt: string | null;
    rose: BasicRoseInfo; 
    currentMysteryFullDetails: RosaryMysteryDetails | null;
    currentMainIntentionForRose: RoseMainIntentionData | null; // <<<< NOWE POLE
}