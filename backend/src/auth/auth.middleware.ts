// backend/src/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Rozszerzamy interfejs Request z Express, aby dodać pole 'user'
export interface AuthenticatedRequest extends Request {
  user?: { // user może być opcjonalny, jeśli token jest nieprawidłowy lub go nie ma
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING

  if (token == null) {
    // Jeśli chcemy, aby trasa była opcjonalnie chroniona, możemy tu wywołać next()
    // i sprawdzić req.user w handlerze trasy.
    // Dla tras ściśle chronionych, zwracamy 401.
    res.sendStatus(401); // Unauthorized - brak tokenu
    return;
  }

  if (!JWT_SECRET) {
    console.error("Błąd krytyczny: JWT_SECRET nie jest zdefiniowany w .env dla weryfikacji tokenu!");
    res.sendStatus(500); // Błąd serwera
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("Błąd weryfikacji tokenu:", err.message);
      // Możemy rozróżnić błędy, np. TokenExpiredError
      if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ error: 'Token wygasł' });
      }
      return res.sendStatus(403); // Forbidden - token nieprawidłowy
    }

    // Jeśli token jest poprawny, user będzie zawierał payload, który zakodowaliśmy
    // (userId, email, role)
    req.user = user as { userId: string; email: string; role: string };
    next(); // Przejdź do następnego middleware lub handlera trasy
  });
};