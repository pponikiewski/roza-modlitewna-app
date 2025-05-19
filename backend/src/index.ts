// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import zelatorRoutes from './zelator/zelator.routes';
import memberRoutes from './member/member.routes';
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
const allowedOrigins = ['http://localhost:5173']; // Adres Twojego frontendu Vite

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/zelator', zelatorRoutes);
app.use('/me', memberRoutes);

app.get(
  '/users',
  authenticateToken,
  authorizeRole([UserRole.ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log(`Dostęp do /users przez użytkownika z rolą ADMIN: ${req.user?.email}`);
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

// --- Globalny Error Handler ---
// Musi być zdefiniowany jako ostatni, po wszystkich app.use() i trasach.
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => { // Jawne :void dla pewności
  console.error("Wystąpił błąd na serwerze:", err.name, "-", err.message);
  // W środowisku deweloperskim można dodać logowanie stack trace dla łatwiejszego debugowania
  // if (process.env.NODE_ENV === 'development') {
  //   console.error(err.stack);
  // }
  
  // Sprawdź, czy nagłówki nie zostały już wysłane
  if (res.headersSent) {
    return next(err); // Przekaż do domyślnego error handlera Express
  }

  // Specjalna obsługa dla błędów CORS (jeśli błąd jest rzucany przez naszą logikę w corsOptions)
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Dostęp z tego źródła jest zablokowany przez politykę CORS.' });
    return; // Zakończ po wysłaniu odpowiedzi
  }

  // Dla wszystkich innych błędów, wyślij generyczną odpowiedź 500
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
  // Nie ma potrzeby 'return' tutaj, jeśli to ostatnia operacja w tej funkcji dla tej ścieżki kodu
});

// Uruchomienie serwera i schedulera
app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
  try {
    startScheduler();
  } catch (error) { 
    console.error("Nie udało się uruchomić schedulera:", error);
  }
});