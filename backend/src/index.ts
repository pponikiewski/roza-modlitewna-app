// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import zelatorRoutes from './zelator/zelator.routes';
import memberRoutes from './member/member.routes'; // Trasy dla operacji na członkostwach zalogowanego użytkownika
import userIntentionRoutes, { roseSharedIntentionsRouter } from './intentions/userIntention.routes'; // Trasy dla intencji
import { startScheduler } from './scheduler';
import {
  authenticateToken,
  authorizeRole,
  AuthenticatedRequest
} from './auth/auth.middleware';
import { UserRole } from './types/user.types';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// --- Konfiguracja CORS ---
const allowedOrigins = [
  'http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173',
  'http://192.168.50.58:3000', 'http://192.168.50.58:3002', 'http://192.168.50.58:3003'
]; 

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS: Zablokowano origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware do parsowania JSON
app.use(express.json());

// --- Definicje Tras ---
console.log('Rejestrowanie tras...');

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

// Trasy publiczne dla autoryzacji
app.use('/auth', authRoutes);
console.log('Trasy /auth zarejestrowane.');

// Trasy administracyjne
app.use('/admin', adminRoutes);
console.log('Trasy /admin zarejestrowane.');

// Trasy dla Zelatorów (zarządzanie Różami, do których mają uprawnienia)
app.use('/zelator', zelatorRoutes);
console.log('Trasy /zelator zarejestrowane.');

// Trasy dla zalogowanego użytkownika dotyczące jego członkostw w Różach
// np. /me/memberships (lista moich członkostw), /me/memberships/:id/confirm-mystery
app.use('/me/memberships', memberRoutes);
console.log('Trasy /me/memberships zarejestrowane.');

// Trasy dla zalogowanego użytkownika dotyczące jego indywidualnych intencji
// np. /me/intentions (lista moich intencji, tworzenie nowej), /me/intentions/:id (edycja, usuwanie)
app.use('/me/intentions', userIntentionRoutes);
console.log('Trasy /me/intentions zarejestrowane.');

// Trasy do pobierania intencji udostępnionych dla konkretnej Róży
// np. /roses/:roseId/shared-intentions
app.use('/roses', roseSharedIntentionsRouter);
console.log('Trasy /roses (dla shared-intentions) zarejestrowane.');


// Endpoint do pobierania wszystkich użytkowników (Admin) - przeniesiony do adminRoutes
// Trasa /admin/users jest już obsługiwana przez adminRoutes
console.log('Trasa GET /admin/users obsługiwana przez adminRoutes.');

// --- Globalny Error Handler ---
// Musi być zdefiniowany jako ostatni, po wszystkich app.use() i trasach.
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("GLOBAL ERROR HANDLER:", err.name, "-", err.message, err.stack ? `\nStack: ${err.stack}`: '');
  
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Dostęp z tego źródła jest zablokowany przez politykę CORS.' });
    return;
  }

  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
});
console.log('Globalny error handler zarejestrowany.');

// Uruchomienie serwera i schedulera
app.listen(port, () => {
  console.log(`⚡️[server]: Serwer Express uruchomiony na http://localhost:${port}`);
  try {
    startScheduler();
    console.log('Scheduler zainicjowany.');
  } catch (error) {
    console.error("Nie udało się uruchomić schedulera:", error);
  }
});