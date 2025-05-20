// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { assignMysteriesToAllActiveMembers } from '../services/rosary.service'; // Ważny import dla triggerMysteryAssignment

const ALLOWED_ROLES_TO_ASSIGN: UserRole[] = [UserRole.MEMBER, UserRole.ZELATOR];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[updateUserRole] Admin ${req.user?.email} próbuje zmienić rolę. Params: ${JSON.stringify(req.params)}, Body: ${JSON.stringify(req.body)}`);
  try {
    const { userIdToUpdate } = req.params;
    const { newRole } = req.body;

    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    const typedNewRole = newRole?.toUpperCase() as UserRole;
    const isValidRole = Object.values(UserRole).includes(typedNewRole);
    const isAllowedToAssign = ALLOWED_ROLES_TO_ASSIGN.includes(typedNewRole);

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
      data: { role: typedNewRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    console.log(`[updateUserRole] Pomyślnie zmieniono rolę użytkownika ${userIdToUpdate} na ${typedNewRole}.`);
    res.json({ message: 'Rola użytkownika została pomyślnie zaktualizowana.', user: updatedUser });

  } catch (error) {
    console.error('[updateUserRole] Błąd:', error);
    next(error);
  }
};

export const createRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[createRose] Admin ${req.user?.email} próbuje stworzyć Różę. Body: ${JSON.stringify(req.body)}`);
  try {
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora do tworzenia Róż.' });
        return;
    }

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
    console.log(`[createRose] Pomyślnie stworzono Różę "${name}" z Zelatorem ${zelatorUser.email}.`);
    res.status(201).json(newRose);
  } catch (error) {
    console.error('[createRose] Błąd:', error);
    next(error);
  }
};

export const listRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[listRoses] Admin ${req.user?.email} próbuje listować wszystkie Róże.`);
  try {
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora.' });
        return;
    }

    const roses = await prisma.rose.findMany({
      include: {
        zelator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          },
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
         createdAt: 'desc'
      }
    });
    console.log(`[listRoses] Znaleziono ${roses.length} Róż.`);
    res.json(roses);
  } catch (error) {
    console.error('[listRoses] Błąd:', error);
    next(error);
  }
};

// FUNKCJA DO RĘCZNEGO URUCHAMIANIA PRZYDZIELANIA TAJEMNIC
export const triggerMysteryAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[triggerMysteryAssignment] Admin ${req.user?.email} inicjuje przydzielanie tajemnic.`);
  try {
    // Sprawdzenie uprawnień Admina (już w middleware, ale dla pewności)
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora.' });
        return;
    }

    // Uruchomienie logiki w tle, aby nie blokować odpowiedzi HTTP na długo
    // Funkcja assignMysteriesToAllActiveMembers sama w sobie loguje błędy, jeśli wystąpią.
    assignMysteriesToAllActiveMembers().catch(err => {
      // Dodatkowy log, jeśli samo wywołanie assignMysteriesToAllActiveMembers rzuci błąd synchronicznie
      // lub jeśli chcemy tu coś specyficznego zrobić z błędem z promise.
      console.error("Błąd podczas wywołania assignMysteriesToAllActiveMembers z triggerMysteryAssignment:", err);
    });

    res.status(202).json({ message: 'Proces przydzielania tajemnic został zainicjowany w tle.' });
  } catch (error) {
    console.error('[triggerMysteryAssignment] Błąd w głównym bloku try-catch:', error);
    next(error); // Przekaż do globalnego error handlera, jeśli coś pójdzie nie tak tutaj
  }
};