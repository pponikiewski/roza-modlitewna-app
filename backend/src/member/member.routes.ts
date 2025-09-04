// backend/src/member/member.routes.ts
import { Router } from 'express';
console.log(">>>> ŁADOWANIE PLIKU: member.routes.ts (START)"); // Log startu ładowania pliku

import { 
    confirmMysteryRead, 
    getMysteryHistory, 
    listMyMemberships,
    changePassword // Upewnij się, że ta funkcja jest poprawnie zaimportowana
} from './member.controller'; 
// getCurrentMysteryInfo można usunąć, jeśli listMyMemberships dostarcza wystarczająco
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();

console.log(">>>> member.routes.ts: Router stworzony");

// Zastosuj middleware autentykacji do wszystkich tras w tym routerze
router.use(authenticateToken);
console.log(">>>> member.routes.ts: Middleware authenticateToken dodane do routera");

// Ta trasa będzie odpowiadać na GET /me/memberships (bo prefiks jest w index.ts)
router.get('/', (req, res, next) => { // Dodaj log w samej definicji trasy
  console.log(`>>>> member.routes.ts: Żądanie GET na '/' (czyli /me/memberships)`);
  listMyMemberships(req, res, next);
});
console.log(">>>> member.routes.ts: Trasa GET '/' zarejestrowana dla listMyMemberships");

// Operacje na konkretnym członkostwie
router.patch('/:membershipId/confirm-mystery', confirmMysteryRead);
console.log(">>>> member.routes.ts: Trasa PATCH '/:membershipId/confirm-mystery' zarejestrowana");

router.get('/:membershipId/mystery-history', getMysteryHistory);
console.log(">>>> member.routes.ts: Trasa GET '/:membershipId/mystery-history' zarejestrowana");

// NOWA TRASA: Zmiana hasła
router.post('/change-password', changePassword); // Używamy POST lub PATCH

export default router;
console.log(">>>> ŁADOWANIE PLIKU: member.routes.ts (KONIEC)");