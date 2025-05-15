// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express'; // Dodajemy z powrotem NextFunction
import dotenv from 'dotenv';
import prisma from './db';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

// Testowy endpoint do pobierania użytkowników
app.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Dodajemy next i : Promise<void>
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error); // Przekazujemy błąd do globalnego error handlera
  }
});

// Testowy endpoint do tworzenia użytkownika
app.post('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => { // Dodajemy next i : Promise<void>
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      // Możemy stworzyć niestandardowy błąd i przekazać go do next
      // lub po prostu zwrócić odpowiedź klienta (zależy od preferencji)
      res.status(400).json({ error: 'Email i hasło są wymagane' });
      return;
    }
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password, // PAMIĘTAJ: hasło powinno być zahashowane!
      },
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    // Specyficzna obsługa błędu unikalności emaila
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
      return;
    }
    next(error); // Inne błędy przekazujemy do globalnego error handlera
  }
});

// Globalny middleware do obsługi błędów (musi być na końcu, przed app.listen)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Wystąpił błąd:", err.message); // Logujemy komunikat błędu
  // Można dodać bardziej szczegółowe logowanie, np. err.stack w trybie deweloperskim
  // if (process.env.NODE_ENV === 'development') {
  //   console.error(err.stack);
  // }
  
  // Nie wysyłaj stack trace błędu do klienta w produkcji
  res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera.' });
});


app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
});