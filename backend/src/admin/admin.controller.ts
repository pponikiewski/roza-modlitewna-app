// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { assignMysteriesToAllActiveMembers } from '../services/rosary.service';

const ALLOWED_ROLES_TO_ASSIGN: UserRole[] = [UserRole.MEMBER, UserRole.ZELATOR];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIdToUpdate } = req.params;
    const { newRole } = req.body;

    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

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
    
    if (userToUpdate.role === UserRole.ADMIN) {
        res.status(403).json({ error: 'Nie można zmienić roli innego administratora.'});
        return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: newRole.toUpperCase() as UserRole },
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

// NOWA FUNKCJA: Tworzenie Róży
export const createRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, zelatorId } = req.body;

    if (!name || !zelatorId) {
      res.status(400).json({ error: 'Nazwa Róży i ID Zelatora są wymagane.' });
      return;
    }

    const zelatorUser = await prisma.user.findUnique({
      where: { id: zelatorId },
    });

    if (!zelatorUser) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika, który ma zostać Zelatorem.' });
      return;
    }

    if (zelatorUser.role !== UserRole.ZELATOR && zelatorUser.role !== UserRole.ADMIN) {
      res.status(400).json({ error: `Użytkownik o ID ${zelatorId} nie ma roli ZELATOR ani ADMIN. Zmień najpierw jego rolę.` });
      return;
    }

    const newRose = await prisma.rose.create({
      data: {
        name,
        description,
        zelator: {
          connect: { id: zelatorId },
        },
      },
      include: {
         zelator: {
             select: { id: true, email: true, name: true, role: true }
         }
      }
    });

    res.status(201).json(newRose);
  } catch (error) {
    next(error);
  }
};

// NOWA FUNKCJA: Listowanie Róż
export const listRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roses = await prisma.rose.findMany({
      include: {
        zelator: {
          select: { id: true, email: true, name: true, role: true },
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
         createdAt: 'desc'
      }
    });
    res.json(roses);
  } catch (error) {
    next(error);
  }
};
  export const triggerMysteryAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Uruchomienie logiki w tle, aby nie blokować odpowiedzi HTTP na długo
      assignMysteriesToAllActiveMembers().catch((err: any) => {
        console.error("Błąd podczas asynchronicznego przydzielania tajemnic:", err);
      });
      res.status(202).json({ message: 'Proces przydzielania tajemnic został zainicjowany w tle.' });
    } catch (error) {
      next(error);
    }
  };