// backend/src/admin/admin.routes.ts
import { Router } from 'express';
import { updateUserRole } from './admin.controller';
import { authenticateToken, isAdmin } from '../auth/auth.middleware'; // Potrzebujemy middleware

const router = Router();

// Trasa do zmiany roli użytkownika przez Admina
// Używamy PATCH, ponieważ aktualizujemy część zasobu użytkownika
// :userIdToUpdate to parametr trasy
router.patch(
  '/users/:userIdToUpdate/role',
  authenticateToken, // Najpierw uwierzytelnij
  isAdmin,           // Potem sprawdź, czy to Admin
  updateUserRole
);

// W przyszłości tutaj mogą być inne trasy administracyjne, np.:
// router.delete('/users/:userId', authenticateToken, isAdmin, deleteUser);
// router.get('/users', authenticateToken, isAdmin, listUsers); // Już mamy w index.ts, ale można przenieść

export default router;