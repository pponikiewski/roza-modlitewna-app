// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import { authenticateToken, AuthenticatedRequest } from './auth/auth.middleware'; // Importuj middleware i interfejs

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

app.use('/auth', authRoutes); // Trasy publiczne (rejestracja, logowanie)

// Zabezpieczony endpoint do pobierania wszystkich użytkowników
// Używamy AuthenticatedRequest dla poprawnego typowania req.user
app.get('/users', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Możemy teraz uzyskać dostęp do req.user, jeśli token był poprawny
    console.log('Zalogowany użytkownik (z tokenu):', req.user);

    // W przyszłości tutaj dodamy sprawdzanie roli, np. if (req.user?.role !== 'ADMIN') return res.sendStatus(403);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Globalny middleware do obsługi błędów
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Wystąpił błąd:", err.message);
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera.' });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
});