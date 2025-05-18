// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import zelatorRoutes from './zelator/zelator.routes';
import { startScheduler } from './scheduler'; // Import funkcji startującej scheduler
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

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/zelator', zelatorRoutes);

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

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Wystąpił błąd na serwerze:", err.message);
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
  // Uruchom scheduler po pomyślnym starcie serwera Express
  try {
    startScheduler();
  } catch (error) {
    console.error("Nie udało się uruchomić schedulera:", error);
  }
});