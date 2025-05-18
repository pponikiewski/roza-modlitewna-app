// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';

async function canManageRose(requestingUser: AuthenticatedRequest['user'], roseId: string): Promise<boolean> {
  if (!requestingUser) return false;
  if (requestingUser.role === UserRole.ADMIN) return true;
  if (requestingUser.role === UserRole.ZELATOR) {
    const rose = await prisma.rose.findUnique({
      where: { id: roseId },
      select: { zelatorId: true }
    });
    return rose?.zelatorId === requestingUser.userId;
  }
  return false;
}

export const addMemberToRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roseId } = req.params;
    const { userIdToAdd } = req.body;
    const requestingUser = req.user;

    if (!userIdToAdd) {
      res.status(400).json({ error: 'ID użytkownika do dodania jest wymagane.' });
      return;
    }

    if (!requestingUser) {
      res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika wysyłającego żądanie.' });
      return;
    }
    
    const roseExists = await prisma.rose.findUnique({ where: { id: roseId }});
    if (!roseExists) {
        res.status(404).json({ error: 'Róża o podanym ID nie istnieje.' });
        return;
    }

    const hasPermission = await canManageRose(requestingUser, roseId);
    if (!hasPermission) {
      res.status(403).json({ error: 'Nie masz uprawnień do dodawania członków do tej Róży.' });
      return;
    }

    const userExists = await prisma.user.findUnique({ where: { id: userIdToAdd } });
    if (!userExists) {
      res.status(404).json({ error: 'Użytkownik, którego próbujesz dodać, nie istnieje.' });
      return;
    }
    
    // USUWAMY LUB KOMENTUJEMY PONIŻSZY BLOK:
    /*
    if (userIdToAdd === roseExists.zelatorId) {
        res.status(400).json({ error: 'Użytkownik jest już Zelatorem tej Róży i nie może być dodany jako członek.' });
        return;
    }
    */
    // Jeśli Zelator może być członkiem, to powyższe ograniczenie jest niepotrzebne.
    // Jednak nadal musimy upewnić się, że nie dodajemy go dwa razy (raz jako Zelator - co jest relacją w modelu Rose,
    // a drugi raz jako wpis w RoseMembership). Logika sprawdzająca existingMembership poniżej powinna to obsłużyć.

    const existingMembership = await prisma.roseMembership.findUnique({
      where: { userId_roseId: { userId: userIdToAdd, roseId: roseId } },
    });

    if (existingMembership) {
      res.status(409).json({ error: 'Ten użytkownik jest już członkiem tej Róży.' });
      return;
    }

    const newMembership = await prisma.roseMembership.create({
      data: {
        user: { connect: { id: userIdToAdd } },
        rose: { connect: { id: roseId } },
      },
      include: {
         user: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    res.status(201).json({ message: 'Użytkownik został dodany do Róży.', membership: newMembership });

  } catch (error) {
    next(error);
  }
};

// Funkcja listRoseMembers pozostaje bez zmian
export const listRoseMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
 try {
   const { roseId } = req.params;
   const requestingUser = req.user;

   if (!requestingUser) {
    res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
    return;
  }
  
  const roseExists = await prisma.rose.findUnique({ where: { id: roseId }});
  if (!roseExists) {
      res.status(404).json({ error: 'Róża o podanym ID nie istnieje.' });
      return;
  }

   const hasPermission = await canManageRose(requestingUser, roseId);
   if (!hasPermission) {
     res.status(403).json({ error: 'Nie masz uprawnień do wyświetlania członków tej Róży.' });
     return;
   }

   const members = await prisma.roseMembership.findMany({
     where: { roseId: roseId },
     include: {
       user: {
         select: { id: true, email: true, name: true, role: true },
       },
     },
     orderBy: {
        createdAt: 'asc'
     }
   });

   res.json(members);

 } catch (error) {
   next(error);
 }
};