// backend/src/auth/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser } from './auth.controller';
const router = Router();

  router.post('/register', registerUser);
  router.post('/login', loginUser);

  export default router;