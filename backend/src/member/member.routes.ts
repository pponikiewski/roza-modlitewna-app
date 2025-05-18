// backend/src/member/member.routes.ts
import { Router } from 'express';
import { getCurrentMysteryInfo, confirmMysteryRead, getMysteryHistory } from './member.controller';
import { authenticateToken } from '../auth/auth.middleware'; // Tylko uwierzytelnienie jest potrzebne

const router = Router();

// Wszystkie te trasy wymagają, aby użytkownik był zalogowany
router.use(authenticateToken); // Stosujemy middleware do wszystkich tras w tym routerze

// Pobranie aktualnej tajemnicy (na razie dla pierwszego członkostwa)
// TODO: W przyszłości można by tu przekazać ID członkostwa, jeśli użytkownik jest w wielu Różach
router.get('/current-mystery', getCurrentMysteryInfo);

// Potwierdzenie zapoznania się z tajemnicą dla konkretnego członkostwa
// Używamy ID członkostwa w ścieżce, aby było jasne, którego członkostwa dotyczy potwierdzenie.
router.patch('/memberships/:membershipId/confirm-mystery', confirmMysteryRead);

// Pobranie historii tajemnic dla konkretnego członkostwa
router.get('/memberships/:membershipId/mystery-history', getMysteryHistory);


export default router;