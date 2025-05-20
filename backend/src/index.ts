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
import { UserRole } from './types/user.types'; // Upewnij się, że ten plik istnieje i enum jest poprawny

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// --- Konfiguracja CORS ---
const allowedOrigins = ['http://localhost:5173']; 

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

app.use(express.json());

// --- Definicje Tras ---
console.log('Rejestrowanie tras...'); // Log do sprawdzenia, czy ten fragment jest wykonywany

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

app.use('/auth', authRoutes);
console.log('Trasy /auth zarejestrowane.');

app.use('/admin', adminRoutes);
console.log('Trasy /admin zarejestrowane.');

app.use('/zelator', zelatorRoutes); // Upewnij się, że to jest poprawnie skonfigurowane
console.log('Trasy /zelator zarejestrowane.');

app.use('/me', memberRoutes);
console.log('Trasy /me zarejestrowane.');


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
console.log('Trasa /users zarejestrowana.');

// --- Globalny Error Handler ---
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
  } catch (error) {
    console.error("Nie udało się uruchomić schedulera:", error);
  }
});