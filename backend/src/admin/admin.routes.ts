// backend/src/admin/admin.routes.ts
import { Router } from 'express';
import { updateUserRole, createRose, listRoses } from './admin.controller';
import { authenticateToken, isAdmin } from '../auth/auth.middleware';
import {triggerMysteryAssignment } from './admin.controller';

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
  '/roses', // Tworzenie nowej Róży
  authenticateToken,
  isAdmin,
  createRose
);

router.get(
  '/roses', // Listowanie wszystkich Róż
  authenticateToken,
  isAdmin,
  listRoses
);

  router.post(
    '/trigger-mystery-assignment',
    authenticateToken,
    isAdmin,
    triggerMysteryAssignment
  );

export default router;