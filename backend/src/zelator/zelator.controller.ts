// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { MAX_ROSE_MEMBERS, findMysteryById } from '../utils/constants';

/**
 * Funkcja pomocnicza sprawdzająca, czy użytkownik ma uprawnienia do zarządzania daną Różą
 * (jest jej Zelatorem LUB jest Adminem).
 * Zakłada, że `requestingUser` nie jest null/undefined.
 */
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
    
    if (!req.user) {
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
        
    const memberCount = await prisma.roseMembership.count({
      where: { roseId: roseId },
    });

    if (memberCount >= MAX_ROSE_MEMBERS) {
      res.status(400).json({ error: `Róża osiągnęła maksymalną liczbę członków (${MAX_ROSE_MEMBERS}).` });
      return;
    }
    
    const existingMembership = await prisma.roseMembership.findUnique({
      where: { userId_roseId: { userId: userIdToAdd, roseId: roseId } },
    });

    if (existingMembership) {
      res.status(409).json({ error: 'Ten użytkownik jest już członkiem tej Róży.' });
      return;
    }

    const currentOrderIndex = memberCount; 

    const newMembership = await prisma.roseMembership.create({
      data: {
        user: { connect: { id: userIdToAdd } },
        rose: { connect: { id: roseId } },
        mysteryOrderIndex: currentOrderIndex,
      },
      include: {
         user: { select: { id: true, email: true, name: true, role: true } },
         rose: { select: { id: true, name: true, description: true } } 
      }
    });

    console.log(`[addMemberToRose] Pomyślnie dodano użytkownika ${userIdToAdd} do Róży ${roseId} z indeksem ${currentOrderIndex}.`);
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
   
    const roseData = await prisma.rose.findUnique({ 
      where: { id: roseId },
    }); 
    if (!roseData) {
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
        rose: { 
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: [
        { mysteryOrderIndex: 'asc' },
        { user: { name: 'asc' } },
        { createdAt: 'asc' }
      ]
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

export const setOrUpdateMainRoseIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const { text, isActive } = req.body;
  const requestingUser = req.user;

  console.log(`[setOrUpdateMainRoseIntention] User: ${requestingUser?.email} próbuje ustawić intencję dla Róży ${roseId}. Text: ${text}`);
  try {
    if (!requestingUser) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ error: 'Treść intencji (text) jest wymagana.' });
      return;
    }

    const hasPermission = await canManageRose(requestingUser, roseId);
    if (!hasPermission) {
      res.status(403).json({ error: 'Nie masz uprawnień do ustawiania głównej intencji dla tej Róży.' });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const intentionData = {
      text: text.trim(),
      month: currentMonth,
      year: currentYear,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      authorId: requestingUser.userId,
    };

    if (intentionData.isActive) {
        await prisma.roseMainIntention.updateMany({
            where: { roseId: roseId, month: currentMonth, year: currentYear, isActive: true },
            data: { isActive: false }
        });
    }

    const mainIntention = await prisma.roseMainIntention.upsert({
      where: { roseId_month_year: { roseId: roseId, month: currentMonth, year: currentYear } },
      update: intentionData,
      create: { roseId: roseId, ...intentionData },
      include: { 
        author: { select: { id: true, name: true, email: true } },
        rose: { select: { name: true } }
      }
    });
    
    console.log(`[setOrUpdateMainRoseIntention] Pomyślnie ustawiono/zaktualizowano główną intencję na ${currentMonth}/${currentYear} dla Róży ${roseId}.`);
    res.status(201).json(mainIntention);

  } catch (error) {
    console.error('[setOrUpdateMainRoseIntention] Błąd:', error);
    next(error);
  }
};

export const getCurrentMainRoseIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  console.log(`[getCurrentMainRoseIntention] Pobieranie aktualnej głównej intencji dla Róży ${roseId}. User: ${req.user?.email}`);
  try {
     if (!req.user) {
        res.status(403).json({ error: "Brak autoryzacji użytkownika."});
        return;
     }
     
     const now = new Date();
     const currentMonth = now.getMonth() + 1;
     const currentYear = now.getFullYear();

    const mainIntention = await prisma.roseMainIntention.findFirst({
      where: {
        roseId: roseId,
        month: currentMonth,
        year: currentYear,
        isActive: true
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        rose: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!mainIntention) {
      res.status(404).json({ message: 'Nie znaleziono aktywnej głównej intencji dla tej Róży na bieżący miesiąc.' });
      return;
    }
    
    console.log(`[getCurrentMainRoseIntention] Znaleziono aktualną główną intencję dla Róży ${roseId}.`);
    res.json(mainIntention);

  } catch (error) {
    console.error('[getCurrentMainRoseIntention] Błąd:', error);
    next(error);
  }
};

// NOWO DODANA I WYEKSPORTOWANA FUNKCJA
export const listMainIntentionsForRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const requestingUser = req.user;

  console.log(`[listMainIntentionsForRose] Użytkownik ${requestingUser?.email} pobiera historię głównych intencji dla Róży ${roseId}.`);
  try {
    if (!requestingUser) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }

    const roseExists = await prisma.rose.findUnique({ where: { id: roseId }});
    if (!roseExists) {
        res.status(404).json({ error: 'Róża o podanym ID nie istnieje.' });
        return;
    }
    
    // TODO: Dodać bardziej szczegółową logikę uprawnień, np. czy użytkownik jest członkiem tej Róży.
    // Na razie zakładamy, że zalogowany użytkownik może próbować, jeśli trasa jest chroniona ogólnie.
    // const hasPermission = await canManageRose(requestingUser, roseId) || await isMemberOfRose(requestingUser.userId, roseId);
    // if (!hasPermission) {
    //   res.status(403).json({ error: 'Nie masz uprawnień do wyświetlania intencji tej Róży.' });
    //   return;
    // }

    const intentions = await prisma.roseMainIntention.findMany({
      where: { roseId: roseId },
      orderBy: [
        { year: 'desc' }, 
        { month: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    if (!intentions || intentions.length === 0) {
      console.log(`[listMainIntentionsForRose] Nie znaleziono głównych intencji dla Róży ${roseId}.`);
      res.json([]); // Zwróć pustą tablicę, a nie 404
      return;
    }
    
    console.log(`[listMainIntentionsForRose] Znaleziono ${intentions.length} głównych intencji dla Róży ${roseId}.`);
    res.json(intentions);

  } catch (error) {
    console.error('[listMainIntentionsForRose] Błąd:', error);
    next(error);
  }
};