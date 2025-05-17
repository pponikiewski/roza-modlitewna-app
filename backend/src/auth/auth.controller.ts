// backend/src/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/user.types'; // Poprawny import

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Błąd krytyczny: JWT_SECRET nie jest zdefiniowany w .env!");
  process.exit(1);
}

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email i hasło są wymagane' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // rola jest ustawiana na UserRole.MEMBER (czyli 'MEMBER') domyślnie przez schemat Prisma
      },
    });

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role, // Baza zwraca string, np. 'MEMBER'
      createdAt: newUser.createdAt,
    };

    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email i hasło są wymagane' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      return;
    }

    // user.role to string z bazy. Możemy go rzutować na UserRole, jeśli jesteśmy pewni,
    // że wartości w bazie odpowiadają enumowi (co powinny, jeśli dbamy o spójność).
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role as UserRole },
      JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Zalogowano pomyślnie',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // Nadal string z bazy
      }
    });

  } catch (error) {
    next(error);
  }
};