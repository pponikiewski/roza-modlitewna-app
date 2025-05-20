// backend/src/member/member.routes.ts
import { Router } from 'express';
// Dodaj listMyMemberships do importów
import { getCurrentMysteryInfo, confirmMysteryRead, getMysteryHistory, listMyMemberships } from './member.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();

router.use(authenticateToken); // Stosujemy middleware do wszystkich tras w tym routerze

// NOWA TRASA: Listowanie Róż (członkostw) zalogowanego użytkownika
router.get('/my-memberships', listMyMemberships);

router.get('/current-mystery', getCurrentMysteryInfo); // Ta trasa może wymagać modyfikacji lub ID członkostwa
router.patch('/memberships/:membershipId/confirm-mystery', confirmMysteryRead);
router.get('/memberships/:membershipId/mystery-history', getMysteryHistory);

export default router;