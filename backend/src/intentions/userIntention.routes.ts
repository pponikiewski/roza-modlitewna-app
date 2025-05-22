// backend/src/intentions/userIntention.routes.ts
import { Router } from 'express';
import {
    createUserIntention,
    listMyIntentions,
    updateUserIntention,
    deleteUserIntention,
    listSharedIntentionsForRose
} from './userIntention.controller';
import { authenticateToken } from '../auth/auth.middleware'; // Wszystkie te akcje wymagają zalogowania

const router = Router();

// Zastosuj authenticateToken do wszystkich tras w tym module
router.use(authenticateToken);

router.post('/', createUserIntention); // POST /me/intentions (zgodnie z prefiksem w index.ts)
router.get('/', listMyIntentions);   // GET /me/intentions

router.patch('/:intentionId', updateUserIntention); // PATCH /me/intentions/:intentionId
router.delete('/:intentionId', deleteUserIntention); // DELETE /me/intentions/:intentionId

// Ta trasa mogłaby być też w zelator.routes.ts lub rose.routes.ts, ale dotyczy intencji użytkowników
// GET /roses/:roseId/shared-intentions (prefiks /roses będzie z index.ts)
// Musimy inaczej to podłączyć w index.ts, jeśli chcemy taki URL,
// lub użyć np. /me/roses/:roseId/shared-intentions
// Na razie zostawmy ją tutaj, a w index.ts podłączymy pod /roses/:roseId/shared-intentions

export default router;

// Osobny router dla intencji udostępnionych w Róży, aby uzyskać ścieżkę /roses/:roseId/shared-intentions
export const roseSharedIntentionsRouter = Router();
roseSharedIntentionsRouter.use(authenticateToken); // Również wymaga autentykacji
roseSharedIntentionsRouter.get('/:roseId/shared-intentions', listSharedIntentionsForRose);