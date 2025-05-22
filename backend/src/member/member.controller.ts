// backend/src/member/member.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { findMysteryById, RosaryMystery } from '../utils/constants'; // Upewnij się, że RosaryMystery jest tu typem obiektu

console.log("ŁADOWANIE PLIKU: member.controller.ts"); // <<<< DODAJ TEN LOG


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
        rose: { 
          select: { 
            id: true, // Dodajmy ID Róży
            name: true,
            description: true,
            zelator: { select: {id: true, name: true, email: true }}
            // Można by też dołączyć aktualną główną intencję Róży, jeśli ten endpoint ma być głównym źródłem
            // mainIntentions: {
            //   where: { isActive: true, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
            //   orderBy: { createdAt: 'desc' },
            //   take: 1,
            //   include: { author: { select: { id: true, name: true, email: true } } }
            // }
          } 
        }
      }
    });

    if (!membership) {
      res.status(404).json({ error: 'Nie znaleziono aktywnego członkostwa w Róży dla tego użytkownika.' });
      return;
    }

    const mysteryDetails = membership.currentAssignedMystery ? findMysteryById(membership.currentAssignedMystery) : null;
    
    // Jeśli chcesz dołączyć intencję, odkomentuj i dostosuj poniżej:
    // const currentMainIntention = membership.rose.mainIntentions && membership.rose.mainIntentions.length > 0 ? membership.rose.mainIntentions[0] : null;
    // const { mainIntentions, ...roseDataOnly } = membership.rose; // Aby usunąć zagnieżdżone mainIntentions z rose


    if (membership.currentAssignedMystery && !mysteryDetails) {
      console.error(`[getCurrentMysteryInfo] Nie znaleziono szczegółów dla tajemnicy o ID: ${membership.currentAssignedMystery} w członkostwiem ${membership.id}.`);
      res.json({
        membershipId: membership.id,
        // rose: roseDataOnly, // Jeśli dołączasz intencję
        rose: membership.rose, // Jeśli nie dołączasz intencji bezpośrednio tutaj
        roseName: membership.rose.name, // Dla uproszczenia, jeśli nie wysyłasz całego obiektu rose
        mystery: null,
        confirmedAt: membership.mysteryConfirmedAt,
        // currentMainIntentionForRose: currentMainIntention // Jeśli dołączasz
      });
      return;
    }
    
    res.json({
      membershipId: membership.id,
      // rose: roseDataOnly, // Jeśli dołączasz intencję
      rose: membership.rose, // Jeśli nie dołączasz intencji bezpośrednio tutaj
      roseName: membership.rose.name, // Dla uproszczenia
      mystery: mysteryDetails,
      confirmedAt: membership.mysteryConfirmedAt,
      // currentMainIntentionForRose: currentMainIntention // Jeśli dołączasz
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

    const membershipBeforeUpdate = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membershipBeforeUpdate || membershipBeforeUpdate.userId !== userId) {
      res.status(403).json({ error: 'Nie masz uprawnień do potwierdzenia tej tajemnicy lub członkostwo nie istnieje.' });
      return;
    }

    if (!membershipBeforeUpdate.currentAssignedMystery) {
        res.status(400).json({ error: 'Brak aktualnie przydzielonej tajemnicy do potwierdzenia.' });
        return;
    }
    
    const updatedMembershipData = await prisma.roseMembership.update({
      where: { id: membershipId },
      data: { mysteryConfirmedAt: new Date() },
      include: { // Dołączamy potrzebne dane do skonstruowania pełnej odpowiedzi
         rose: { 
            select: { 
                id: true, 
                name: true, 
                description: true,
                zelator: { select: {id: true, name: true, email: true}}
            } 
        },
        user: { // Dla spójności z UserMembership, choć userId już mamy
            select: { id: true, email: true, name: true, role: true}
        }
     }
    });

    const mysteryDetails = updatedMembershipData.currentAssignedMystery ? findMysteryById(updatedMembershipData.currentAssignedMystery) : null;

    if (updatedMembershipData.currentAssignedMystery && !mysteryDetails) {
        console.error(`[confirmMysteryRead] Nie znaleziono szczegółów dla potwierdzonej tajemnicy o ID: ${updatedMembershipData.currentAssignedMystery} (członkostwo ${membershipId})`);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const mainIntention = await prisma.roseMainIntention.findFirst({
        where: {
            roseId: updatedMembershipData.roseId, // Używamy roseId z zaktualizowanego członkostwa
            month: currentMonth,
            year: currentYear,
            isActive: true
        },
        include: { 
            author: {select: {id: true, name: true, email: true}}
        }
    });

    console.log(`[confirmMysteryRead] Pomyślnie potwierdzono tajemnicę dla członkostwa ${membershipId}.`);
    
    // Konstruujemy odpowiedź zgodną z typem UserMembership używanym na frontendzie
    const responseData = {
        id: updatedMembershipData.id,
        userId: updatedMembershipData.userId,
        roseId: updatedMembershipData.roseId,
        createdAt: updatedMembershipData.createdAt.toISOString(),
        updatedAt: updatedMembershipData.updatedAt.toISOString(),
        currentAssignedMystery: updatedMembershipData.currentAssignedMystery,
        mysteryConfirmedAt: updatedMembershipData.mysteryConfirmedAt ? updatedMembershipData.mysteryConfirmedAt.toISOString() : null,
        mysteryOrderIndex: updatedMembershipData.mysteryOrderIndex, // Jeśli to pole istnieje w modelu
        rose: { // Struktura zgodna z BasicRoseInfo
            id: updatedMembershipData.rose.id,
            name: updatedMembershipData.rose.name,
            description: updatedMembershipData.rose.description,
            zelator: updatedMembershipData.rose.zelator
        },
        user: updatedMembershipData.user, // Dołączyliśmy całego użytkownika
        currentMysteryFullDetails: mysteryDetails,
        currentMainIntentionForRose: mainIntention ? {
            ...mainIntention,
            createdAt: mainIntention.createdAt.toISOString(),
            updatedAt: mainIntention.updatedAt.toISOString(),
            // Upewnij się, że autor jest null, jeśli authorId był null
            author: mainIntention.authorId ? mainIntention.author : null,
        } : null,
    };
    
    res.json(responseData);

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
        select: { userId: true, rose: { select: { name: true, id: true } } }
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
            // Konwertuj daty na stringi ISO dla spójności JSON
            assignedAt: entry.assignedAt.toISOString(),
            mysteryDetails: mysteryDetails || { id: entry.mystery, name: `Nieznana Tajemnica (ID: ${entry.mystery})`, group: 'Nieznana', contemplation: '', imageUrl: '' }
        };
    });
    console.log(`[getMysteryHistory] Znaleziono ${historyWithDetails.length} wpisów historii dla członkostwa ${membershipId}.`);
    res.json({
        roseId: membership.rose.id,
        roseName: membership.rose.name,
        history: historyWithDetails
    });

  } catch (error) {
    console.error('[getMysteryHistory] Błąd:', error);
    next(error);
  }
};

export const listMyMemberships = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[listMyMemberships] Użytkownik ${req.user?.email} pobiera listę swoich członkostw w Różach.`);
  try {
    if (!req.user || !req.user.userId) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }
    const userId = req.user.userId;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const memberships = await prisma.roseMembership.findMany({
      where: { userId: userId },
      include: {
        user: { // Dołącz dane użytkownika (chociaż to userId zalogowanego)
            select: {id: true, email: true, name: true, role: true}
        },
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
            },
            mainIntentions: {
              where: {
                month: currentMonth,
                year: currentYear,
                isActive: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                  author: {select: {id: true, name: true, email: true}}
              }
            }
          }
        },
      },
      orderBy: {
        rose: { name: 'asc' }
      }
    });

    const membershipsWithMysteryDetails = memberships.map(memb => {
      const mysteryDetails = memb.currentAssignedMystery ? findMysteryById(memb.currentAssignedMystery) : null;
      const currentMainIntention = memb.rose.mainIntentions && memb.rose.mainIntentions.length > 0 
                                  ? memb.rose.mainIntentions[0] 
                                  : null;
      const { mainIntentions, ...roseData } = memb.rose;

      return {
        id: memb.id,
        userId: memb.userId,
        roseId: memb.roseId,
        createdAt: memb.createdAt.toISOString(),
        updatedAt: memb.updatedAt.toISOString(),
        currentAssignedMystery: memb.currentAssignedMystery,
        mysteryConfirmedAt: memb.mysteryConfirmedAt ? memb.mysteryConfirmedAt.toISOString() : null,
        mysteryOrderIndex: memb.mysteryOrderIndex,
        user: memb.user, // Dane użytkownika z include
        rose: roseData,
        currentMysteryFullDetails: mysteryDetails,
        currentMainIntentionForRose: currentMainIntention ? {
            ...currentMainIntention,
            createdAt: currentMainIntention.createdAt.toISOString(),
            updatedAt: currentMainIntention.updatedAt.toISOString(),
            author: currentMainIntention.authorId ? currentMainIntention.author : null,
        } : null,
      };
    });

    console.log(`[listMyMemberships] Znaleziono ${membershipsWithMysteryDetails.length} członkostw dla użytkownika ${req.user.email}.`);
    res.json(membershipsWithMysteryDetails);

  } catch (error) {
    console.error('[listMyMemberships] Błąd:', error);
    next(error);
  }
};