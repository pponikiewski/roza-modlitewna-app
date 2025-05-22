// backend/src/member/member.routes.ts
import { Router } from 'express';
console.log('ŁADOWANIE PLIKU member.routes.ts'); // <<<< DODAJ TEN LOG

// Upewnij się, że listMyMemberships jest tu poprawnie zaimportowane
import { confirmMysteryRead, getMysteryHistory, listMyMemberships } from './member.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();
router.use(authenticateToken); // Stosuje authenticateToken do wszystkich poniższych tras

// Ta trasa będzie dostępna jako GET http://localhost:3001/me/memberships
router.get('/', listMyMemberships); 
    
// Operacje na konkretnym członkostwie
router.patch('/:membershipId/confirm-mystery', confirmMysteryRead);
router.get('/:membershipId/mystery-history', getMysteryHistory);

export default router;