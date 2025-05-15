// backend/src/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error("Błąd krytyczny: JWT_SECRET nie jest zdefiniowany w .env!");
    process.exit(1); // Zatrzymaj aplikację, jeśli sekretu nie ma
  }

  export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email i hasło są wymagane' });
        return;
      }

      // Sprawdź, czy użytkownik już istnieje
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
        return;
      }

      // Hashowanie hasła
      const hashedPassword = await bcrypt.hash(password, 10); // 10 to "salt rounds"

      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword, // Zapisz zahashowane hasło
          // role domyślnie ustawiona w modelu Prisma
        },
      });

      // Nie wysyłaj hasła w odpowiedzi!
      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
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
        res.status(401).json({ error: 'Nieprawidłowy email lub hasło' }); // Generyczny błąd
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Nieprawidłowy email lub hasło' }); // Generyczny błąd
        return;
      }

      // Generowanie tokenu JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, // Payload tokenu
        JWT_SECRET,
        { expiresIn: '1h' } // Czas ważności tokenu (np. 1 godzina)
      );

      res.json({
        message: 'Zalogowano pomyślnie',
        token,
        user: { // Opcjonalnie dane użytkownika
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });

    } catch (error) {
      next(error);
    }
  };