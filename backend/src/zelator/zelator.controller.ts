// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { MAX_ROSE_MEMBERS } from '../utils/constants';

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
         // Dołączamy dane Róży do odpowiedzi, aby frontend miał od razu nazwę Róży
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
   
    const roseData = await prisma.rose.findUnique({ // Zmieniono nazwę zmiennej dla jasności
      where: { id: roseId },
      // Możemy od razu pobrać nazwę róży tutaj, jeśli będziemy ją zwracać w ogólnej odpowiedzi
      // select: { name: true, zelatorId: true } // ZelatorId potrzebny dla canManageRose
    }); 
    if (!roseData) { // Używamy roseData
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
        rose: { // <<< DOŁĄCZAMY DANE RÓŻY DO KAŻDEGO CZŁONKOSTWA
          select: {
            id: true,
            name: true,
            description: true,
            // Możesz też dołączyć Zelatora Róży, jeśli potrzebujesz
            // zelator: { select: { id: true, name: true, email: true } } 
          }
        }
      },
      orderBy: [
        { mysteryOrderIndex: 'asc' },
        { user: { name: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    console.log(`[listRoseMembers] Znaleziono ${members.length} członków dla Róży ${roseId}.`);
    // Jeśli chcesz zwrócić również nazwę róży na najwyższym poziomie odpowiedzi:
    // res.json({ roseName: roseData.name, members: members });
    // Ale skoro każdy członek ma teraz dane róży, wystarczy:
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