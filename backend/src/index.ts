// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes'; // Importuj trasy autoryzacji

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

// Użyj tras autoryzacji pod prefiksem /auth
app.use('/auth', authRoutes);

// Testowy endpoint do pobierania wszystkich użytkowników (możemy go zostawić na razie do testów)
// PAMIĘTAJ: W produkcyjnej aplikacji ten endpoint powinien być zabezpieczony!
app.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      // Opcjonalnie wybierz tylko niektóre pola, aby nie wysyłać hashowanych haseł
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
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