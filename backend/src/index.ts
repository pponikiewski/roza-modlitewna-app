// backend/src/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import prisma from './db';
import authRoutes from './auth/auth.routes';
import adminRoutes from './admin/admin.routes'; // <<<<<<<<<<<<<<<<<<<<<<<<<<< DODAJ IMPORT
import {
  authenticateToken,
  authorizeRole,
  // isAdmin, // Możemy nie potrzebować, jeśli używamy authorizeRole bezpośrednio lub w admin.routes
  AuthenticatedRequest
} from './auth/auth.middleware';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes); // <<<<<<<<<<<<<<<<<<<<<<<<<<< UŻYJ TRAS ADMINISTRACYJNYCH

// Endpoint do pobierania wszystkich użytkowników - zabezpieczony i tylko dla Admina
// (Pozostawiamy go tutaj lub możemy przenieść do admin.routes.ts)
app.get(
  '/users',
  authenticateToken,
  authorizeRole(['ADMIN']), // lub użyj isAdmin z auth.middleware.ts, jeśli wolisz
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log(`Dostęp do /users przez użytkownika z rolą ADMIN: ${req.user?.email}`);
      const users = await prisma.user.findMany({ /* ... select ... */ });
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

// Globalny Error Handler
// ... (pozostaje bez zmian) ...
 app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
     console.error("Wystąpił błąd na serwerze:", err.message);
     res.status(500).json({ error: 'Wystąpił wewnętrzny błąd serwera. Spróbuj ponownie później.' });
 });


app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
});