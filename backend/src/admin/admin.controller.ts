// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types'; // Poprawny import

// Dopuszczalne role, które Admin może przypisać
const ALLOWED_ROLES_TO_ASSIGN: UserRole[] = [UserRole.MEMBER, UserRole.ZELATOR];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIdToUpdate } = req.params;
    const { newRole } = req.body; // newRole przyjdzie jako string z requestu

    if (req.user?.role !== UserRole.ADMIN) { // Porównanie z enumem
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    // Walidacja nowej roli - sprawdzamy, czy string newRole jest jedną z wartości enuma
    const isValidRole = Object.values(UserRole).includes(newRole?.toUpperCase() as UserRole);
    const isAllowedToAssign = ALLOWED_ROLES_TO_ASSIGN.includes(newRole?.toUpperCase() as UserRole);


    if (!newRole || !isValidRole || !isAllowedToAssign) {
      res.status(400).json({ error: `Nieprawidłowa rola lub rola niedozwolona do przypisania. Dozwolone do przypisania: ${ALLOWED_ROLES_TO_ASSIGN.join(', ')}` });
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
    
    if (userToUpdate.role === UserRole.ADMIN) { // Porównanie z enumem
        res.status(403).json({ error: 'Nie można zmienić roli innego administratora.'});
        return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: newRole.toUpperCase() as UserRole }, // Rzutujemy string na UserRole (zakładając walidację)
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