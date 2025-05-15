// backend/src/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../db'; // Zakładamy, że db.ts eksportuje instancję PrismaClient
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client'; // Importujemy enum UserRole wygenerowany przez Prismę

// Pobieramy sekret JWT ze zmiennych środowiskowych
const JWT_SECRET = process.env.JWT_SECRET;

// Krytyczne sprawdzenie: jeśli JWT_SECRET nie jest ustawiony, aplikacja nie powinna działać poprawnie.
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the .env file.");
  process.exit(1); // Zakończ proces, jeśli sekretu brakuje
}

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, password } = req.body;

    // Podstawowa walidacja danych wejściowych
    if (!email || !password) {
      res.status(400).json({ error: 'Email i hasło są wymagane.' });
      return;
    }
    // Można dodać bardziej szczegółową walidację emaila i siły hasła

    // Sprawdzenie, czy użytkownik o podanym emailu już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
      return;
    }

    // Hashowanie hasła przed zapisaniem do bazy
    const saltRounds = 10; // Zalecana liczba rund dla bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tworzenie nowego użytkownika w bazie danych
    // Rola zostanie automatycznie ustawiona na MEMBER dzięki @default(MEMBER) w schema.prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null, // Jeśli name nie jest podane, ustaw na null
        password: hashedPassword,
        // role: UserRole.MEMBER // Nie trzeba jawnie ustawiać, Prisma zrobi to na podstawie @default
      },
    });

    // Przygotowanie odpowiedzi - nigdy nie odsyłaj hasła!
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role, // Rola będzie typu UserRole
      createdAt: newUser.createdAt,
    };

    res.status(201).json(userResponse);
  } catch (error) {
    next(error); // Przekazanie błędu do globalnego error handlera
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email i hasło są wymagane.' });
      return;
    }

    // Znalezienie użytkownika po emailu
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Jeśli użytkownik nie istnieje lub hasło jest nieprawidłowe, zwróć generyczny błąd
    if (!user) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
      return;
    }

    // Przygotowanie payloadu dla tokenu JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role, // Rola będzie typu UserRole
    };

    // Generowanie tokenu JWT
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET, // Sekret pobrany z .env (sprawdzony na początku pliku)
      { expiresIn: '1h' } // Czas ważności tokenu, np. 1 godzina
    );

    // Przygotowanie odpowiedzi
    res.json({
      message: 'Zalogowano pomyślnie.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    next(error); // Przekazanie błędu do globalnego error handlera
  }
};