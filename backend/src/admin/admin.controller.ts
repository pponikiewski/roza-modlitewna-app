// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
// POPRAWIONY IMPORT:
import { AuthenticatedRequest } from '../auth/auth.middleware'; // Zamiast: '../../src/auth/auth.middleware'
// POPRAWIONY IMPORT:
import prisma from '../db'; // Zamiast: '../../src/db'

const ALLOWED_ROLES_TO_ASSIGN: string[] = ['MEMBER', 'ZELATOR'];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIdToUpdate } = req.params;
    const { newRole } = req.body;

    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    if (!newRole || !ALLOWED_ROLES_TO_ASSIGN.includes(newRole.toUpperCase())) {
      res.status(400).json({ error: `Nieprawidłowa rola. Dozwolone role to: ${ALLOWED_ROLES_TO_ASSIGN.join(', ')}` });
      return;
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userIdToUpdate },
    });

    if (!userToUpdate) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika do aktualizacji.' });
      return;
    }

    if (userToUpdate.id === req.user?.userId) {
      res.status(403).json({ error: 'Administrator nie może zmienić swojej własnej roli za pomocą tego endpointu.' });
      return;
    }
    
    if (userToUpdate.role === 'ADMIN') {
        res.status(403).json({ error: 'Nie można zmienić roli innego administratora.'});
        return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: newRole.toUpperCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    res.json({ message: 'Rola użytkownika została pomyślnie zaktualizowana.', user: updatedUser });

  } catch (error) {
    next(error);
  }
};