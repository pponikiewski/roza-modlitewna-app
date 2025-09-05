// backend/src/zelator/zelator.routes.ts
import { Router } from 'express';
import { 
    addMemberToRose, 
    listRoseMembers, 
    getMyManagedRoses, 
    removeMemberFromRose,
    setOrUpdateMainRoseIntention,
    getCurrentMainRoseIntention,
    listMainIntentionsForRose, // Dodany import dla nowej funkcji kontrolera
    getAvailableUsers // Nowy import dla funkcji pobierania dostępnych użytkowników
} from './zelator.controller';
import { authenticateToken, authorizeRole } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types'; // Upewnij się, że ten plik i enum/typ istnieją

const router = Router();

// --- Pobieranie Róż zarządzanych przez Zelatora/Admina ---
router.get(
  '/my-roses',
  authenticateToken,
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]),
  getMyManagedRoses
);

// --- Pobieranie dostępnych użytkowników (nie należących do żadnej róży) ---
router.get(
  '/available-users',
  authenticateToken,
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]),
  getAvailableUsers
);

// --- Zarządzanie Członkami Konkretnej Róży ---
// :roseId będzie parametrem URL
router.post(
  '/roses/:roseId/members',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]),
  addMemberToRose
);

router.get(
  '/roses/:roseId/members',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]),
  listRoseMembers
);

router.delete(
  '/roses/:roseId/members/:membershipId',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]),
  removeMemberFromRose
);

// --- Zarządzanie i Pobieranie Głównych Intencji Róży ---
// :roseId będzie parametrem URL

// Ustawienie lub aktualizacja głównej intencji dla Róży (przez Zelatora/Admina)
router.post(
  '/roses/:roseId/main-intention', 
  authenticateToken, 
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]),
  setOrUpdateMainRoseIntention
);

// Pobieranie AKTUALNIE aktywnej głównej intencji dla Róży (dla zalogowanych użytkowników)
router.get(
  '/roses/:roseId/main-intention/current',
  authenticateToken, 
  getCurrentMainRoseIntention
);

// NOWA TRASA: Pobieranie HISTORII głównych intencji dla Róży (dla zalogowanych użytkowników)
// Dostęp może być dalej ograniczony w kontrolerze, np. tylko dla członków tej Róży
router.get(
  '/roses/:roseId/main-intention', // Zwróć uwagę na brak '/current' - to inna trasa
  authenticateToken,
  // Można tu dodać authorizeRole, jeśli tylko określone role mają widzieć historię,
  // np. authorizeRole([UserRole.MEMBER, UserRole.ZELATOR, UserRole.ADMIN])
  // lub zostawić bardziej otwarte, a logikę dostępu umieścić w kontrolerze.
  // Na razie zakładamy, że każdy zalogowany użytkownik może próbować, a kontroler może dalej filtrować.
  listMainIntentionsForRose 
);

export default router;