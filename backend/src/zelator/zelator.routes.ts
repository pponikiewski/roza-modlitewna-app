// backend/src/zelator/zelator.routes.ts
import { Router } from 'express';
import { addMemberToRose, listRoseMembers } from './zelator.controller';
// Potrzebujemy middleware do autentykacji i sprawdzania, czy użytkownik jest Zelatorem LUB Adminem
// Dla listowania członków dostęp może mieć też Admin. Dla dodawania członka - tylko Zelator danej Róży.
import { authenticateToken, isZelator, isAdmin, authorizeRole } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

// Dodawanie członka do Róży (tylko Zelator tej Róży)
// :roseId to ID Róży, do której dodajemy członka
router.post(
  '/roses/:roseId/members',
  authenticateToken,
  // Tutaj nie używamy ogólnego isZelator, bo musimy sprawdzić, czy jest Zelatorem *konkretnej* Róży.
  // Ta logika jest w kontrolerze (isUserZelatorOfRose).
  // Wystarczy upewnić się, że zalogowany użytkownik ma rolę, która pozwala mu być Zelatorem.
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]), // Zelator lub Admin mogą próbować dodać
  addMemberToRose
);

// Listowanie członków konkretnej Róży (Zelator tej Róży LUB Admin)
// :roseId to ID Róży, której członków listujemy
router.get(
  '/roses/:roseId/members',
  authenticateToken,
  // Zelator LUB Admin mogą listować członków
  // Sprawdzenie, czy to Zelator *tej konkretnej* Róży lub Admin jest w kontrolerze.
  authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]),
  listRoseMembers
);

// W przyszłości:
// router.delete('/roses/:roseId/members/:memberUserId', authenticateToken, /* odpowiednie uprawnienia */, removeMemberFromRose);

export default router;