// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes';
import zelatorRoutes from './zelator/zelator.routes'; // Dodany import tras Zelatora
import {
  authenticateToken,
  authorizeRole,     // Ogólne middleware do autoryzacji na podstawie roli
  // isAdmin,        // Można używać tego specyficznego, jeśli jest wygodniej
  AuthenticatedRequest
} from './auth/auth.middleware';
import { UserRole } from './types/user.types'; // Import enuma UserRole

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Middleware do parsowania JSON w body requestu

// Trasa publiczna powitalna
app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

// Trasy publiczne dla autoryzacji (rejestracja, logowanie)
// Prefiks /auth jest dodawany do wszystkich tras zdefiniowanych w authRoutes
app.use('/auth', authRoutes);

// Trasy administracyjne (zarządzanie użytkownikami, Różami na poziomie globalnym)
// Prefiks /admin jest dodawany do wszystkich tras zdefiniowanych w adminRoutes
app.use('/admin', adminRoutes);

// Trasy dla Zelatorów (zarządzanie konkretnymi Różami, członkami)
// Prefiks /zelator jest dodawany do wszystkich tras zdefiniowanych w zelatorRoutes
app.use('/zelator', zelatorRoutes);


// --- Trasy Zabezpieczone (Przykłady / Dodatkowe) ---

// Endpoint do pobierania wszystkich użytkowników - zabezpieczony i tylko dla Admina
// Ta trasa może też być częścią adminRoutes, ale dla przykładu jest tutaj.
app.get(
  '/users',
  authenticateToken,       // 1. Uwierzytelnij
  authorizeRole([UserRole.ADMIN]), // 2. Autoryzuj (tylko rola ADMIN)
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log(`Dostęp do /users przez użytkownika z rolą ADMIN: ${req.user?.email}`);

      const users = await prisma.user.findMany({
        select: { // Wybieramy tylko bezpieczne pola do zwrócenia
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
      next(error); // Przekaż błąd do globalnego error handlera
    }
  }
);

// --- Globalny Error Handler ---
// Ten middleware musi być zdefiniowany jako ostatni, po wszystkich app.use() i trasach.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Wystąpił błąd na serwerze:", err.message);
  // W środowisku deweloperskim można wysłać stack trace dla łatwiejszego debugowania
  // if (process.env.NODE_ENV === 'development') {
  //   console.error(err.stack);
  // }
  
  // Dla klienta zawsze wysyłaj generyczny komunikat błędu
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
});