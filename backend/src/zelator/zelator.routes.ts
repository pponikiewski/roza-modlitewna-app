// backend/src/zelator/zelator.routes.ts
import { Router } from 'express';
// Dodaj removeMemberFromRose do importów
import { addMemberToRose, listRoseMembers, getMyManagedRoses, removeMemberFromRose } from './zelator.controller';
import { authenticateToken, authorizeRole } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

router.get(
  '/my-roses',
  authenticateToken,
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]),
  getMyManagedRoses
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

// NOWA TRASA: Usuwanie członka z Róży
// :membershipId to ID rekordu z tabeli RoseMembership
router.delete(
  '/roses/:roseId/members/:membershipId',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]), // Admin LUB Zelator tej Róży (sprawdzane w kontrolerze)
  removeMemberFromRose
);

export default router;