// backend/src/admin/admin.routes.ts
import { Router } from 'express';
// Upewnij się, że wszystkie potrzebne funkcje kontrolera są zaimportowane
import { 
    updateUserRole, 
    createRose, 
    listRoses, 
    triggerMysteryAssignment // Dodaj ten import
} from './admin.controller';
import { authenticateToken, isAdmin } from '../auth/auth.middleware';
// UserRole nie jest bezpośrednio potrzebny w tym pliku, jeśli używamy isAdmin

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

export default router;