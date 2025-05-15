// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
// Importuj wszystkie potrzebne elementy z auth.middleware.ts
import {
  authenticateToken,
  authorizeRole, // Możesz importować ogólne authorizeRole, jeśli chcesz go używać bezpośrednio
  isAdmin,       // Lub bardziej specyficzne, jak isAdmin
  // isZelator,  // Jeśli będziesz używać, odkomentuj
  AuthenticatedRequest
} from './auth/auth.middleware';

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

// --- Trasy Zabezpieczone ---

// Przykład trasy zabezpieczonej tokenem, ale dostępnej dla każdego zalogowanego użytkownika
// (możemy dodać taką trasę później, np. do pobierania profilu zalogowanego użytkownika)
/*
app.get('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // req.user jest dostępne i zawiera dane zalogowanego użytkownika
  if (req.user) {
    res.json({ message: "To jest twój profil", user: req.user });
  } else {
    res.status(403).json({ error: "Nie udało się zidentyfikować użytkownika."})
  }
});
*/

// Endpoint do pobierania wszystkich użytkowników - zabezpieczony i tylko dla Admina
app.get(
  '/users',
  authenticateToken, // 1. Sprawdź, czy użytkownik jest zalogowany (ważny token)
  isAdmin,           // 2. Sprawdź, czy zalogowany użytkownik ma rolę 'ADMIN'
  // Alternatywnie, można by użyć: authorizeRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // W tym miejscu req.user jest na pewno dostępne i ma rolę ADMIN
      // dzięki poprzednim middleware'om.
      console.log(`Dostęp do /users przez Admina: ${req.user?.email} (ID: ${req.user?.userId}, Rola: ${req.user?.role})`);

      const users = await prisma.user.findMany({
        select: { // Wybieramy tylko bezpieczne pola do zwrócenia
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true, // Możemy też dodać updatedAt, jeśli jest potrzebne
        },
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