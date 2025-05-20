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