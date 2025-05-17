// backend/src/auth/auth.middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/user.types'; // <<<<<<<<<<<< DODAJ IMPORT


const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
      res.status(401).json({ error: 'Brak tokenu uwierzytelniającego.' });
      return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
    }

    if (!JWT_SECRET) {
      console.error("Błąd krytyczny: JWT_SECRET nie jest zdefiniowany...");
      res.status(500).json({ error: 'Błąd konfiguracji serwera.' });
      return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
    }

    jwt.verify(token, JWT_SECRET, (err: any, userPayload: any) => {
      if (err) {
        console.error("Błąd weryfikacji tokenu:", err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token uwierzytelniający wygasł.' });
            return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
        }
        res.status(403).json({ error: 'Token uwierzytelniający jest nieprawidłowy.' });
        return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
      }
      req.user = userPayload as { userId: string; email: string; role: string };
      next();
    });
};

export const authorizeRole = (allowedRoles: string[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      console.warn('Brak informacji o użytkowniku lub roli w żądaniu...');
      res.status(403).json({ error: 'Brak informacji o użytkowniku do autoryzacji.' });
      return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`Odmowa dostępu dla użytkownika ${req.user.email}...`);
      res.status(403).json({ error: 'Brak wystarczających uprawnień do wykonania tej akcji.' });
      return; // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ RETURN
    }
    next();
  };
};

export const isAdmin: RequestHandler = authorizeRole([UserRole.ADMIN]);
export const isZelator: RequestHandler = authorizeRole([UserRole.ZELATOR, UserRole.ADMIN]);