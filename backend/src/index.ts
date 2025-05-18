// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import zelatorRoutes from './zelator/zelator.routes';
import memberRoutes from './member/member.routes'; // Dodany import tras członka
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

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

// Kolejność rejestracji routerów
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/zelator', zelatorRoutes);
app.use('/me', memberRoutes); // Trasy dla zalogowanego użytkownika/członka

// Endpoint do pobierania wszystkich użytkowników - zabezpieczony i tylko dla Admina
// (może być również częścią adminRoutes, ale dla przykładu zostawiamy go tutaj)
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

// Globalny Error Handler - musi być na końcu, po wszystkich trasach
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Wystąpił błąd na serwerze:", err.message);
  // W środowisku deweloperskim można wysłać stack trace dla łatwiejszego debugowania
  // if (process.env.NODE_ENV === 'development') {
  //   console.error(err.stack);
  // }
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
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