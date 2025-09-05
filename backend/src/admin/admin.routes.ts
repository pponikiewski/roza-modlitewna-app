// backend/src/admin/admin.routes.ts
import { Router } from 'express';
// Upewnij się, że wszystkie potrzebne funkcje kontrolera są zaimportowane
import { 
    updateUserRole, 
    createRose, 
    listRoses, 
    triggerMysteryAssignment, // Dodaj ten import
    getRoseDetails,
    updateRoseDetails,
    triggerMysteryAssignmentForSpecificRose,
    deleteRose,
    deleteUserByAdmin,   // <<<< DODAJ IMPORT
    getAllUsers          // Nowa funkcja
} from './admin.controller';
import { authenticateToken, isAdmin, authorizeRole  } from '../auth/auth.middleware';
// UserRole nie jest bezpośrednio potrzebny w tym pliku, jeśli używamy isAdmin
import { UserRole } from '../types/user.types'; // Dodaj, jeśli potrzebne

const router = Router();

// --- Zarządzanie Użytkownikami ---

// Pobieranie wszystkich użytkowników (przeniesione z index.ts)
router.get(
  '/users',
  authenticateToken,
  isAdmin,
  getAllUsers
);

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

// NOWA TRASA: Ręczne uruchomienie przydzielania tajemnic dla KONKRETNEJ Róży
router.post(
  '/roses/:roseId/trigger-mystery-assignment',
  authenticateToken,
  isAdmin,
  triggerMysteryAssignmentForSpecificRose
);

// NOWA TRASA: Pobieranie szczegółów pojedynczej Róży
router.get(
  '/roses/:roseId', // Ta trasa już mogła istnieć, jeśli nie, dodaj ją
  authenticateToken,
  // Dostęp dla Admina LUB Zelatora (logika sprawdzająca, czy to Zelator *tej* Róży jest w kontrolerze)
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]), 
  getRoseDetails
);

router.patch(
  '/roses/:roseId', // Używamy PATCH, bo aktualizujemy część zasobu
  authenticateToken,
  isAdmin, // Tylko Admin może edytować dowolną Różę
  updateRoseDetails
);

// NOWA TRASA: Usuwanie Róży przez Admina
router.delete(
  '/roses/:roseId', // Używamy DELETE
  authenticateToken,
  isAdmin,
  deleteRose
);

// --- Zarządzanie Użytkownikami ---
router.patch('/users/:userIdToUpdate/role', authenticateToken, isAdmin, updateUserRole);
// NOWA TRASA: Usuwanie użytkownika przez Admina
router.delete(
  '/users/:userIdToDelete',
  authenticateToken,
  isAdmin,
  deleteUserByAdmin
);

export default router;