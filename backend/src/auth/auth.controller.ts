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

// Helper function dla walidacji
const validateRequiredFields = (fields: Record<string, any>, requiredFields: string[]): string | null => {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `${field} jest wymagane`;
    }
  }
  return null;
};

// Helper function dla responses
const createUserResponse = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
});

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, password } = req.body;
    
    const validationError = validateRequiredFields({ email, password }, ['email', 'password']);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    res.status(201).json(createUserResponse(newUser));
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const validationError = validateRequiredFields({ email, password }, ['email', 'password']);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      return;
    }

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
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};