// backend/src/zelator/zelator.routes.ts
import { Router } from 'express';
// Upewnij się, że getMyManagedRoses jest zaimportowane z kontrolera
import { addMemberToRose, listRoseMembers, getMyManagedRoses } from './zelator.controller';
import { authenticateToken, authorizeRole } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types'; // Zaimportuj, jeśli jeszcze nie ma

const router = Router();

// Trasa do pobierania Róż zarządzanych przez zalogowanego Zelatora/Admina
router.get(
  '/my-roses', // Ścieżka względem prefiksu /zelator zdefiniowanego w index.ts
  authenticateToken,
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]),
  getMyManagedRoses // Funkcja kontrolera
);

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

export default router;