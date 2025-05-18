// backend/src/zelator/zelator.routes.ts
import { Router } from 'express';
import { addMemberToRose, listRoseMembers } from './zelator.controller';
import { authenticateToken, authorizeRole } from '../auth/auth.middleware'; // authorizeRole jest bardziej ogólne
import { UserRole } from '../types/user.types';

const router = Router();

router.post(
  '/roses/:roseId/members',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]), // Admin LUB Zelator mogą wywołać ten endpoint
  addMemberToRose
);

router.get(
  '/roses/:roseId/members',
  authenticateToken,
  authorizeRole([UserRole.ADMIN, UserRole.ZELATOR]), // Admin LUB Zelator mogą wywołać ten endpoint
  listRoseMembers
);

export default router;