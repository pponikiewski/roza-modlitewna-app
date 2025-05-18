// backend/src/member/member.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { findMysteryById, RosaryMystery } from '../utils/constants'; // Importujemy definicję tajemnic i funkcję pomocniczą

// Wyświetlanie informacji o aktualnie przydzielonej tajemnicy dla zalogowanego użytkownika
// (zakładamy, że użytkownik może być w wielu Różach - na razie wyświetlimy dla pierwszej znalezionej lub można by wymagać ID Róży)
// UPROSZCZENIE: Na razie zakładamy, że użytkownik jest w JEDNEJ Róży, lub chcemy info z pierwszego członkostwa.
// W przyszłości można rozbudować, aby użytkownik wybierał, dla której Róży chce zobaczyć info.
export const getCurrentMysteryInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
      return;
    }

    // Znajdź aktywne członkostwo użytkownika
    // TODO: Jeśli użytkownik może być w wielu Różach, potrzebujemy sposobu na identyfikację, o którą Różę chodzi.
    // Na razie bierzemy pierwsze znalezione aktywne członkostwo.
    const membership = await prisma.roseMembership.findFirst({
      where: { userId: userId }, // Można dodać warunek na aktywną Różę, jeśli taki status będzie
      include: {
        rose: { select: { name: true } } // Dołącz nazwę Róży
      }
    });

    if (!membership) {
      res.status(404).json({ error: 'Nie znaleziono aktywnego członkostwa w Róży dla tego użytkownika.' });
      return;
    }

    if (!membership.currentAssignedMystery) {
      res.status(200).json({ 
         message: 'Nie masz jeszcze przydzielonej tajemnicy w tej Róży.',
         roseName: membership.rose.name,
         membershipId: membership.id 
     });
      return;
    }

    const mysteryDetails = findMysteryById(membership.currentAssignedMystery);
    if (!mysteryDetails) {
      console.error(`Nie znaleziono szczegółów dla tajemnicy o ID: ${membership.currentAssignedMystery}`);
      res.status(500).json({ error: 'Błąd podczas pobierania szczegółów tajemnicy.' });
      return;
    }
    
    res.json({
      membershipId: membership.id,
      roseName: membership.rose.name,
      mystery: mysteryDetails, // Pełny obiekt tajemnicy (name, contemplation, imageUrl)
      confirmedAt: membership.mysteryConfirmedAt,
    });

  } catch (error) {
    next(error);
  }
};

// Potwierdzanie zapoznania się z tajemnicą
export const confirmMysteryRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    // Klient będzie musiał przesłać ID członkostwa, dla którego potwierdza tajemnicę,
    // zwłaszcza jeśli użytkownik może być w wielu Różach.
    const { membershipId } = req.params; // Pobieramy ID członkostwa z parametrów URL

    if (!userId) {
      res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
      return;
    }

    const membership = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
    });

    // Sprawdź, czy członkostwo należy do zalogowanego użytkownika
    if (!membership || membership.userId !== userId) {
      res.status(403).json({ error: 'Nie masz uprawnień do potwierdzenia tej tajemnicy lub członkostwo nie istnieje.' });
      return;
    }

    if (!membership.currentAssignedMystery) {
        res.status(400).json({ error: 'Brak aktualnie przydzielonej tajemnicy do potwierdzenia.' });
        return;
    }
    
    // Można dodać logikę, aby nie pozwalać na potwierdzenie, jeśli już potwierdzono,
    // ale ponowne potwierdzenie po prostu nadpisze datę, co jest OK.

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

    const mysteryDetails = findMysteryById(updatedMembership.currentAssignedMystery!);


    res.json({ 
        message: 'Zapoznanie z tajemnicą zostało potwierdzone.', 
        membershipId: updatedMembership.id,
        roseName: updatedMembership.rose.name,
        mystery: mysteryDetails,
        confirmedAt: updatedMembership.mysteryConfirmedAt
     });

  } catch (error) {
    next(error);
  }
};

// Wyświetlanie historii tajemnic dla zalogowanego użytkownika dla konkretnego członkostwa
export const getMysteryHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
     const userId = req.user?.userId;
     const { membershipId } = req.params; // ID członkostwa z parametrów URL

     if (!userId) {
         res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
         return;
     }

     // Sprawdź, czy członkostwo należy do zalogowanego użytkownika
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
         orderBy: { assignedAt: 'desc' }, // Najnowsze na górze
     });

     // Mapuj historię, aby dołączyć pełne dane tajemnicy
     const historyWithDetails = history.map(entry => {
         const mysteryDetails = findMysteryById(entry.mystery);
         return {
             ...entry,
             mysteryDetails: mysteryDetails || { id: entry.mystery, name: 'Nieznana Tajemnica', group: 'Nieznana', contemplation: '', imageUrl: '' } // Fallback
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