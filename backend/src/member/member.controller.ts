// backend/src/member/member.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { findMysteryById } from '../utils/constants'; // Zakładam, że RosaryMysteryDetails jest tam też lub nie jest potrzebne do importu tutaj
// Jeśli RosaryMysteryDetails jest potrzebne jako typ, zaimportuj:
// import { RosaryMysteryDetails } from '../constants';

export const getCurrentMysteryInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
      return;
    }

    // Znajdź aktywne członkostwo użytkownika
    // UPROSZCZENIE: Bierzemy pierwsze znalezione aktywne członkostwo.
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

    // Jeśli nie ma przydzielonej tajemnicy, mysteryDetails będzie null
    const mysteryDetails = membership.currentAssignedMystery ? findMysteryById(membership.currentAssignedMystery) : null;

    // Sytuacja błędu: ID tajemnicy jest w bazie, ale nie ma jej w constants.ts (np. po zmianie constants)
    if (membership.currentAssignedMystery && !mysteryDetails) {
      console.error(`Nie znaleziono szczegółów dla tajemnicy o ID: ${membership.currentAssignedMystery} w członkostwiem ${membership.id}. Sprawdź spójność danych w constants.ts.`);
      // Zwracamy tak, jakby tajemnicy nie było, aby frontend nie próbował renderować czegoś, czego nie ma.
      // Frontend powinien obsłużyć przypadek, gdy mystery jest null.
      res.json({
        membershipId: membership.id,
        roseName: membership.rose.name,
        mystery: null, // Kluczowe: zwracamy null, jeśli nie ma szczegółów
        confirmedAt: membership.mysteryConfirmedAt,
      });
      return;
    }
    
    res.json({
      membershipId: membership.id,
      roseName: membership.rose.name,
      mystery: mysteryDetails, // mysteryDetails będzie null, jeśli currentAssignedMystery jest null lub nie znaleziono w constants
      confirmedAt: membership.mysteryConfirmedAt,
    });

  } catch (error) {
    next(error);
  }
};

export const confirmMysteryRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { membershipId } = req.params;

    if (!userId) {
      res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
      return;
    }

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

    // Upewnij się, że currentAssignedMystery nie jest null przed wywołaniem findMysteryById
    const mysteryDetails = updatedMembership.currentAssignedMystery ? findMysteryById(updatedMembership.currentAssignedMystery) : null;

    if (updatedMembership.currentAssignedMystery && !mysteryDetails) {
        console.error(`Nie znaleziono szczegółów dla potwierdzonej tajemnicy o ID: ${updatedMembership.currentAssignedMystery} (członkostwo ${membershipId})`);
        // Mimo to wyślij odpowiedź, ale frontend może mieć problem z wyświetleniem detali tajemnicy
    }

    res.json({ 
        message: 'Zapoznanie z tajemnicą zostało potwierdzone.', 
        membershipId: updatedMembership.id,
        roseName: updatedMembership.rose.name,
        mystery: mysteryDetails, // Może być null, jeśli coś poszło nie tak z ID
        confirmedAt: updatedMembership.mysteryConfirmedAt
     });

  } catch (error) {
    next(error);
  }
};

export const getMysteryHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
     const userId = req.user?.userId;
     const { membershipId } = req.params;

     if (!userId) {
         res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
         return;
     }

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

     res.json({
         roseName: membership.rose.name,
         history: historyWithDetails
     });

  } catch (error) {
    next(error);
  }
};