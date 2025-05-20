// backend/src/admin/admin.routes.ts
import { Router } from 'express';
// Upewnij się, że wszystkie potrzebne funkcje kontrolera są zaimportowane
import { 
    updateUserRole, 
    createRose, 
    listRoses, 
    triggerMysteryAssignment, // Dodaj ten import
    getRoseDetails // <<<< DODAJ IMPORT
} from './admin.controller';
import { authenticateToken, isAdmin, authorizeRole  } from '../auth/auth.middleware';
// UserRole nie jest bezpośrednio potrzebny w tym pliku, jeśli używamy isAdmin
import { UserRole } from '../types/user.types'; // Dodaj, jeśli potrzebne

const router = Router();

// --- Zarządzanie Użytkownikami ---
router.patch(
  '/users/:userIdToUpdate/role',
  authenticateToken,
  isAdmin,
  updateUserRole
);

// --- Zarządzanie Różami ---
router.post(
  '/roses',
  authenticateToken,
  isAdmin,
  createRose
);

router.get(
  '/roses',
  authenticateToken,
  isAdmin,
  listRoses
);

// --- Inne Akcje Administracyjne ---
router.post(
  '/trigger-mystery-assignment', // Trasa do ręcznego wywołania przydzielania tajemnic
  authenticateToken,
  isAdmin,
  triggerMysteryAssignment
);

// NOWA TRASA: Pobieranie szczegółów pojedynczej Róży
router.get(
  '/roses/:roseId', // Ta trasa już mogła istnieć, jeśli nie, dodaj ją
  authenticateToken,
  // Dostęp dla Admina LUB Zelatora (logika sprawdzająca, czy to Zelator *tej* Róży jest w kontrolerze)
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]), 
  getRoseDetails
);

export default router;