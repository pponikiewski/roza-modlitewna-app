// backend/src/member/member.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { findMysteryById } from '../utils/constants';
import bcrypt from 'bcryptjs';
import {
  validateUser,
  findMembershipById,
  logUserAction,
  sendNotFoundError,
  sendBadRequestError,
  sendForbiddenError,
  sendSuccessResponse
} from '../shared/common.helpers';

console.log("ŁADOWANIE PLIKU: member.controller.ts");

export const getCurrentMysteryInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    
    logUserAction('getCurrentMysteryInfo', email, { userId });

    const membership = await prisma.roseMembership.findFirst({
      where: { userId },
      include: {
        rose: { 
          select: { 
            id: true,
            name: true,
            description: true,
            zelator: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!membership) {
      return sendNotFoundError(res, 'Nie znaleziono aktywnego członkostwa w Róży dla tego użytkownika.');
    }

    const mysteryDetails = membership.currentAssignedMystery ? findMysteryById(membership.currentAssignedMystery) : null;

    if (membership.currentAssignedMystery && !mysteryDetails) {
      console.error(`[getCurrentMysteryInfo] Nie znaleziono szczegółów dla tajemnicy o ID: ${membership.currentAssignedMystery} w członkostwie ${membership.id}.`);
    }
    
    res.json({
      membershipId: membership.id,
      rose: membership.rose,
      roseName: membership.rose.name,
      mystery: mysteryDetails,
      confirmedAt: membership.mysteryConfirmedAt
    });
  } catch (error) {
    console.error('[getCurrentMysteryInfo] Błąd:', error);
    next(error);
  }
};

export const confirmMysteryRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    const { membershipId } = req.params;
    
    logUserAction('confirmMysteryRead', email, { membershipId });

    const membershipBefore = await findMembershipById(membershipId);
    if (!membershipBefore || membershipBefore.userId !== userId) {
      return sendForbiddenError(res, 'Nie masz uprawnień do potwierdzenia tej tajemnicy lub członkostwo nie istnieje.');
    }

    if (!membershipBefore.currentAssignedMystery) {
      return sendBadRequestError(res, 'Brak aktualnie przydzielonej tajemnicy do potwierdzenia.');
    }
    
    const updatedMembership = await prisma.roseMembership.update({
      where: { id: membershipId },
      data: { mysteryConfirmedAt: new Date() },
      include: {
        rose: { 
          select: { 
            id: true, 
            name: true, 
            description: true,
            zelator: { select: { id: true, name: true, email: true } }
          } 
        },
        user: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    const mysteryDetails = updatedMembership.currentAssignedMystery ? findMysteryById(updatedMembership.currentAssignedMystery) : null;

    if (updatedMembership.currentAssignedMystery && !mysteryDetails) {
      console.error(`[confirmMysteryRead] Nie znaleziono szczegółów dla potwierdzonej tajemnicy o ID: ${updatedMembership.currentAssignedMystery} (członkostwo ${membershipId})`);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const mainIntention = await prisma.roseMainIntention.findFirst({
      where: {
        roseId: updatedMembership.roseId,
        month: currentMonth,
        year: currentYear,
        isActive: true
      },
      include: { 
        author: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`[confirmMysteryRead] Pomyślnie potwierdzono tajemnicę dla członkostwa ${membershipId}.`);
    
    const responseData = {
      id: updatedMembership.id,
      userId: updatedMembership.userId,
      roseId: updatedMembership.roseId,
      createdAt: updatedMembership.createdAt.toISOString(),
      updatedAt: updatedMembership.updatedAt.toISOString(),
      currentAssignedMystery: updatedMembership.currentAssignedMystery,
      mysteryConfirmedAt: updatedMembership.mysteryConfirmedAt ? updatedMembership.mysteryConfirmedAt.toISOString() : null,
      mysteryOrderIndex: updatedMembership.mysteryOrderIndex,
      rose: updatedMembership.rose,
      user: updatedMembership.user,
      currentMysteryFullDetails: mysteryDetails,
      currentMainIntentionForRose: mainIntention ? {
        ...mainIntention,
        createdAt: mainIntention.createdAt.toISOString(),
        updatedAt: mainIntention.updatedAt.toISOString(),
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
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    const { membershipId } = req.params;
    
    logUserAction('getMysteryHistory', email, { membershipId });

    const membership = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
      select: { userId: true, rose: { select: { name: true, id: true } } }
    });

    if (!membership || membership.userId !== userId) {
      return sendForbiddenError(res, 'Nie masz uprawnień do wyświetlenia historii dla tego członkostwa lub członkostwo nie istnieje.');
    }

    const history = await prisma.assignedMysteryHistory.findMany({
      where: { membershipId },
      orderBy: { assignedAt: 'desc' }
    });

    const historyWithDetails = history.map(entry => {
      const mysteryDetails = findMysteryById(entry.mystery);
      return {
        ...entry,
        assignedAt: entry.assignedAt.toISOString(),
        mysteryDetails: mysteryDetails || { 
          id: entry.mystery, 
          name: `Nieznana Tajemnica (ID: ${entry.mystery})`, 
          group: 'Nieznana', 
          contemplation: '', 
          imageUrl: '' 
        }
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
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    
    logUserAction('listMyMemberships', email, { userId });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const SHARED_INTENTIONS_LIMIT = 3;

    const memberships = await prisma.roseMembership.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        rose: {
          select: {
            id: true,
            name: true,
            description: true,
            zelator: { select: { id: true, name: true, email: true } },
            mainIntentions: {
              where: { month: currentMonth, year: currentYear, isActive: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { author: { select: { id: true, name: true, email: true } } }
            },
            sharedUserIntentions: {
              where: { isSharedWithRose: true },
              orderBy: { createdAt: 'desc' },
              take: SHARED_INTENTIONS_LIMIT,
              include: { author: { select: { id: true, name: true, email: true } } }
            }
          }
        },
      },
      orderBy: { rose: { name: 'asc' } }
    });

    const membershipsWithProcessedData = memberships.map(memb => {
      const mysteryDetails = memb.currentAssignedMystery ? findMysteryById(memb.currentAssignedMystery) : null;
      const currentMainIntention = memb.rose.mainIntentions && memb.rose.mainIntentions.length > 0 ? memb.rose.mainIntentions[0] : null;
      const sharedIntentionsForThisRose = memb.rose.sharedUserIntentions || [];
      const { mainIntentions, sharedUserIntentions, ...roseData } = memb.rose;

      return {
        id: memb.id,
        userId: memb.userId,
        roseId: memb.roseId,
        createdAt: memb.createdAt.toISOString(),
        updatedAt: memb.updatedAt.toISOString(),
        currentAssignedMystery: memb.currentAssignedMystery,
        mysteryConfirmedAt: memb.mysteryConfirmedAt ? memb.mysteryConfirmedAt.toISOString() : null,
        mysteryOrderIndex: memb.mysteryOrderIndex,
        user: memb.user,
        rose: roseData,
        currentMysteryFullDetails: mysteryDetails,
        currentMainIntentionForRose: currentMainIntention ? {
          ...currentMainIntention,
          createdAt: currentMainIntention.createdAt.toISOString(),
          updatedAt: currentMainIntention.updatedAt.toISOString(),
          author: currentMainIntention.authorId ? currentMainIntention.author : null,
        } : null,
        sharedIntentionsPreview: sharedIntentionsForThisRose.map(si => ({
          ...si,
          createdAt: si.createdAt.toISOString(),
          updatedAt: si.updatedAt.toISOString(),
          author: si.authorId ? si.author : null,
        }))
      };
    });

    console.log(`[listMyMemberships] Znaleziono ${membershipsWithProcessedData.length} członkostw dla użytkownika ${email}.`);
    res.json(membershipsWithProcessedData);
  } catch (error) {
    console.error('[listMyMemberships] Błąd:', error);
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    const { oldPassword, newPassword } = req.body;
    
    logUserAction('changePassword', email, { userId });

    if (!oldPassword || !newPassword) {
      return sendBadRequestError(res, 'Stare i nowe hasło są wymagane.');
    }
    
    if (newPassword.length < 6) {
      return sendBadRequestError(res, 'Nowe hasło musi mieć co najmniej 6 znaków.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendNotFoundError(res, 'Nie znaleziono użytkownika.');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Podane stare hasło jest nieprawidłowe.' });
      return;
    }
    
    if (oldPassword === newPassword) {
      return sendBadRequestError(res, 'Nowe hasło musi być inne niż stare.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log(`[changePassword] Pomyślnie zmieniono hasło dla użytkownika ${userId}.`);
    sendSuccessResponse(res, { message: 'Hasło zostało pomyślnie zmienione.' });
  } catch (error) {
    console.error('[changePassword] Błąd:', error);
    next(error);
  }
};