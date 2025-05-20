// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';

async function canManageRose(requestingUser: NonNullable<AuthenticatedRequest['user']>, roseId: string): Promise<boolean> {
  if (requestingUser.role === UserRole.ADMIN) {
    console.log(`[canManageRose] Użytkownik ${requestingUser.email} jest ADMINEM, ma dostęp do Róży ${roseId}.`);
    return true;
  }

  if (requestingUser.role === UserRole.ZELATOR) {
    const rose = await prisma.rose.findUnique({
      where: { id: roseId },
      select: { zelatorId: true }
    });
    if (rose && rose.zelatorId === requestingUser.userId) {
      console.log(`[canManageRose] Użytkownik ${requestingUser.email} jest ZELATOREM Róży ${roseId}.`);
      return true;
    } else {
      console.log(`[canManageRose] Użytkownik ${requestingUser.email} (ZELATOR) nie jest Zelatorem Róży ${roseId}. Oczekiwany Zelator: ${rose?.zelatorId}, Rzeczywisty Zelator (zalogowany): ${requestingUser.userId}`);
      return false;
    }
  }
  
  console.log(`[canManageRose] Użytkownik ${requestingUser.email} z rolą ${requestingUser.role} nie ma uprawnień do Róży ${roseId}.`);
  return false;
}

export const addMemberToRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[addMemberToRose] Próba dodania członka. User: ${req.user?.email}. Params: ${JSON.stringify(req.params)}, Body: ${JSON.stringify(req.body)}`);
  try {
    const { roseId } = req.params;
    const { userIdToAdd } = req.body;
    
    if (!req.user) { // Sprawdzenie, czy obiekt użytkownika istnieje
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const requestingUser = req.user;

    if (!userIdToAdd) {
      res.status(400).json({ error: 'ID użytkownika do dodania jest wymagane.' });
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

    console.log(`[addMemberToRose] Pomyślnie dodano użytkownika ${userIdToAdd} do Róży ${roseId}.`);
    res.status(201).json({ message: 'Użytkownik został dodany do Róży.', membership: newMembership });

  } catch (error) {
    console.error('[addMemberToRose] Błąd:', error);
    next(error);
  }
};

export const listRoseMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[listRoseMembers] Próba listowania członków Róży. User: ${req.user?.email}. Params: ${JSON.stringify(req.params)}`);
  try {
    const { roseId } = req.params;

    if (!req.user) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const requestingUser = req.user;
   
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
        // Można rozważyć dołączenie `currentAssignedMystery` i `mysteryConfirmedAt`
        // currentAssignedMystery: true, 
        // mysteryConfirmedAt: true,
      },
      orderBy: {
         user: { name: 'asc' } 
      }
    });

    console.log(`[listRoseMembers] Znaleziono ${members.length} członków dla Róży ${roseId}.`);
    res.json(members);

  } catch (error) {
    console.error('[listRoseMembers] Błąd:', error);
    next(error);
  }
};

export const getMyManagedRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[getMyManagedRoses] Próba pobrania Róż dla użytkownika: ${req.user?.email}`);
  try {
    if (!req.user) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const userId = req.user.userId;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    let roses;
    if (userRole === UserRole.ADMIN) {
      console.log(`[getMyManagedRoses] Użytkownik ${userEmail} jest ADMINEM, pobieranie wszystkich Róż.`);
      roses = await prisma.rose.findMany({
        include: {
          _count: { select: { members: true } },
          zelator: { select: { id: true, email: true, name: true } }
        },
        orderBy: { name: 'asc' }
      });
    } else if (userRole === UserRole.ZELATOR) {
      console.log(`[getMyManagedRoses] Użytkownik ${userEmail} jest ZELATOREM, pobieranie jego Róż.`);
      roses = await prisma.rose.findMany({
        where: { zelatorId: userId },
        include: {
          _count: { select: { members: true } },
          zelator: { select: { id: true, email: true, name: true } }
        },
        orderBy: { name: 'asc' }
      });
    } else {
      console.log(`[getMyManagedRoses] Użytkownik ${userEmail} z rolą ${userRole} nie ma odpowiednich uprawnień.`);
      res.status(403).json({ error: 'Brak odpowiednich uprawnień do wykonania tej akcji.' });
      return;
    }
    
    console.log(`[getMyManagedRoses] Znaleziono ${roses ? roses.length : 0} Róż.`);
    res.json(roses);
  } catch (error) {
    console.error('[getMyManagedRoses] Błąd:', error);
    next(error);
  }
};

// NOWA FUNKCJA: Usuwanie członka z Róży
export const removeMemberFromRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[removeMemberFromRose] Próba usunięcia członkostwa. User: ${req.user?.email}. Params: ${JSON.stringify(req.params)}`);
  try {
    const { roseId, membershipId } = req.params;
    
    if (!req.user) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const requestingUser = req.user;

    const roseExists = await prisma.rose.findUnique({ where: { id: roseId }});
    if (!roseExists) {
        res.status(404).json({ error: 'Róża o podanym ID nie istnieje.' });
        return;
    }

    const hasPermission = await canManageRose(requestingUser, roseId);
    if (!hasPermission) {
      res.status(403).json({ error: 'Nie masz uprawnień do usuwania członków z tej Róży.' });
      return;
    }

    const membershipToDelete = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
      select: { id: true, roseId: true, userId: true }
    });

    if (!membershipToDelete) {
      res.status(404).json({ error: 'Nie znaleziono członkostwa do usunięcia.' });
      return;
    }

    if (membershipToDelete.roseId !== roseId) {
      res.status(400).json({ error: 'Podane członkostwo nie należy do tej Róży.' });
      return;
    }

    // Usuwanie członkostwa (dzięki onDelete: Cascade w schemacie Prisma,
    // powiązane wpisy w AssignedMysteryHistory zostaną usunięte automatycznie)
    await prisma.roseMembership.delete({
      where: { id: membershipId },
    });

    console.log(`[removeMemberFromRose] Pomyślnie usunięto członkostwo ${membershipId} z Róży ${roseId}.`);
    res.status(200).json({ message: 'Członek został pomyślnie usunięty z Róży.' });

  } catch (error) {
    console.error('[removeMemberFromRose] Błąd:', error);
    next(error);
  }
};