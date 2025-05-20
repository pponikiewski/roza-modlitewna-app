// backend/src/member/member.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { findMysteryById, RosaryMystery } from '../utils/constants'; // Upewnij się, że RosaryMystery jest tu dostępne jako typ

export const getCurrentMysteryInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[getCurrentMysteryInfo] Użytkownik ${req.user?.email} pobiera aktualną tajemnicę (pierwsze członkostwo).`);
  try {
    if (!req.user || !req.user.userId) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const userId = req.user.userId;

    const membership = await prisma.roseMembership.findFirst({
      where: { userId: userId },
      include: {
        rose: { select: { name: true } }
      }
    });

    if (!membership) {
      res.status(404).json({ error: 'Nie znaleziono aktywnego członkostwa w Róży dla tego użytkownika.' });
      return;
    }

    const mysteryDetails = membership.currentAssignedMystery ? findMysteryById(membership.currentAssignedMystery) : null;

    if (membership.currentAssignedMystery && !mysteryDetails) {
      console.error(`[getCurrentMysteryInfo] Nie znaleziono szczegółów dla tajemnicy o ID: ${membership.currentAssignedMystery} w członkostwiem ${membership.id}.`);
      res.json({
        membershipId: membership.id,
        roseName: membership.rose.name,
        mystery: null,
        confirmedAt: membership.mysteryConfirmedAt,
      });
      return;
    }
    
    res.json({
      membershipId: membership.id,
      roseName: membership.rose.name,
      mystery: mysteryDetails,
      confirmedAt: membership.mysteryConfirmedAt,
    });

  } catch (error) {
    console.error('[getCurrentMysteryInfo] Błąd:', error);
    next(error);
  }
};

export const confirmMysteryRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[confirmMysteryRead] Użytkownik ${req.user?.email} potwierdza tajemnicę dla członkostwa ${req.params.membershipId}.`);
  try {
    if (!req.user || !req.user.userId) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const userId = req.user.userId;
    const { membershipId } = req.params;

    const membership = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.userId !== userId) {
      res.status(403).json({ error: 'Nie masz uprawnień do potwierdzenia tej tajemnicy lub członkostwo nie istnieje.' });
      return;
    }

    if (!membership.currentAssignedMystery) {
        res.status(400).json({ error: 'Brak aktualnie przydzielonej tajemnicy do potwierdzenia.' });
        return;
    }
    
    const updatedMembership = await prisma.roseMembership.update({
      where: { id: membershipId },
      data: { mysteryConfirmedAt: new Date() },
      select: { 
         id: true, 
         currentAssignedMystery: true, 
         mysteryConfirmedAt: true,
         rose: { select: { name: true } }
     }
    });

    const mysteryDetails = updatedMembership.currentAssignedMystery ? findMysteryById(updatedMembership.currentAssignedMystery) : null;

    if (updatedMembership.currentAssignedMystery && !mysteryDetails) {
        console.error(`[confirmMysteryRead] Nie znaleziono szczegółów dla potwierdzonej tajemnicy o ID: ${updatedMembership.currentAssignedMystery} (członkostwo ${membershipId})`);
    }

    console.log(`[confirmMysteryRead] Pomyślnie potwierdzono tajemnicę dla członkostwa ${membershipId}.`);
    res.json({ 
        message: 'Zapoznanie z tajemnicą zostało potwierdzone.', 
        membershipId: updatedMembership.id,
        roseName: updatedMembership.rose.name,
        mystery: mysteryDetails,
        confirmedAt: updatedMembership.mysteryConfirmedAt
     });

  } catch (error) {
    console.error('[confirmMysteryRead] Błąd:', error);
    next(error);
  }
};

export const getMysteryHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[getMysteryHistory] Użytkownik ${req.user?.email} pobiera historię dla członkostwa ${req.params.membershipId}.`);
  try {
    if (!req.user || !req.user.userId) {
        res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
        return;
    }
    const userId = req.user.userId;
    const { membershipId } = req.params;

    const membership = await prisma.roseMembership.findUnique({
        where: { id: membershipId },
        select: { userId: true, rose: { select: { name: true } } }
    });

    if (!membership || membership.userId !== userId) {
        res.status(403).json({ error: 'Nie masz uprawnień do wyświetlenia historii dla tego członkostwa lub członkostwo nie istnieje.' });
        return;
    }

    const history = await prisma.assignedMysteryHistory.findMany({
        where: { membershipId: membershipId },
        orderBy: { assignedAt: 'desc' },
    });

    const historyWithDetails = history.map(entry => {
        const mysteryDetails = findMysteryById(entry.mystery);
        return {
            ...entry,
            mysteryDetails: mysteryDetails || { id: entry.mystery, name: `Nieznana Tajemnica (ID: ${entry.mystery})`, group: 'Nieznana', contemplation: '', imageUrl: '' }
        };
    });
    console.log(`[getMysteryHistory] Znaleziono ${historyWithDetails.length} wpisów historii dla członkostwa ${membershipId}.`);
    res.json({
        roseName: membership.rose.name,
        history: historyWithDetails
    });

  } catch (error) {
    console.error('[getMysteryHistory] Błąd:', error);
    next(error);
  }
};

// NOWA FUNKCJA: Listowanie Róż (członkostw) zalogowanego użytkownika
export const listMyMemberships = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[listMyMemberships] Użytkownik ${req.user?.email} pobiera listę swoich członkostw w Różach.`);
  try {
    if (!req.user || !req.user.userId) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const userId = req.user.userId;

    const memberships = await prisma.roseMembership.findMany({
      where: { userId: userId },
      include: {
        rose: {
          select: {
            id: true,
            name: true,
            description: true,
            zelator: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        // Pola `currentAssignedMystery` i `mysteryConfirmedAt` są automatycznie dołączane,
        // ponieważ są bezpośrednimi polami modelu RoseMembership
      },
      orderBy: {
        rose: { name: 'asc' }
      }
    });

    // Przetwórz odpowiedź, aby dołączyć pełne dane tajemnicy, jeśli jest przydzielona
    const membershipsWithMysteryDetails = memberships.map(memb => {
      // Upewnij się, że currentAssignedMystery nie jest null przed wywołaniem findMysteryById
      const mysteryDetails = memb.currentAssignedMystery ? findMysteryById(memb.currentAssignedMystery) : null;
      
      // Dodatkowe sprawdzenie, jeśli ID tajemnicy jest, ale nie ma jej w constants.ts
      if (memb.currentAssignedMystery && !mysteryDetails) {
        console.warn(`[listMyMemberships] Nie znaleziono szczegółów dla tajemnicy o ID: ${memb.currentAssignedMystery} w członkostwiem ${memb.id}.`);
      }

      return {
        ...memb, // Zachowaj wszystkie pola z członkostwa (w tym currentAssignedMystery jako ID)
        currentMysteryFullDetails: mysteryDetails // Może być null
      };
    });

    console.log(`[listMyMemberships] Znaleziono ${membershipsWithMysteryDetails.length} członkostw dla użytkownika ${req.user.email}.`);
    res.json(membershipsWithMysteryDetails);

  } catch (error) {
    console.error('[listMyMemberships] Błąd:', error);
    next(error);
  }
};