// frontend/src/types/rosary.types.ts
export interface RosaryMysteryDetails {
id: string;
group: string;
name: string;
contemplation: string;
imageUrl?: string;
}
export interface CurrentMysteryInfo {
    membershipId: string;
    roseName: string;
    mystery: RosaryMysteryDetails | null; // Może być null, jeśli tajemnica nie jest jeszcze przydzielona
    confirmedAt: string | null; // Data jako string lub null
  }

  export interface MysteryHistoryEntry {
    id: string;
    membershipId: string;
    mystery: string; // ID tajemnicy
    assignedMonth: number;
    assignedYear: number;
    assignedAt: string; // Data jako string
    mysteryDetails?: RosaryMysteryDetails; // Opcjonalnie pełne detale
  }
  
  export interface MysteryHistoryResponse {
    roseName: string;
    history: MysteryHistoryEntry[];
  }
