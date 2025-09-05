// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { MAX_ROSE_MEMBERS } from '../utils/constants';
import {
  validateUser,
  canManageRose,
  findUserById,
  findRoseById,
  findMembershipByUserAndRose,
  logUserAction,
  sendNotFoundError,
  sendBadRequestError,
  sendForbiddenError,
  sendSuccessResponse
} from '../shared/common.helpers';

export const addMemberToRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    const { userIdToAdd } = req.body;
    
    logUserAction('addMemberToRose', req.user!.email, { roseId, userIdToAdd });

    if (!userIdToAdd) {
      return sendBadRequestError(res, 'ID użytkownika do dodania jest wymagane.');
    }

    const requestingUser = req.user!;
    const hasPermission = await canManageRose(requestingUser, roseId);
    if (!hasPermission) {
      return sendForbiddenError(res, 'Nie masz uprawnień do zarządzania tą Różą.');
    }

    const userToAdd = await findUserById(userIdToAdd);
    if (!userToAdd) {
      return sendNotFoundError(res, 'Użytkownik do dodania nie został znaleziony.');
    }

    if (userToAdd.role !== UserRole.MEMBER && userToAdd.role !== UserRole.ZELATOR) {
      return sendBadRequestError(res, 'Tylko użytkownicy z rolą MEMBER lub ZELATOR mogą być dodani do Róży.');
    }

    const existingMembership = await findMembershipByUserAndRose(userIdToAdd, roseId);
    if (existingMembership) {
      return sendBadRequestError(res, 'Użytkownik już jest członkiem tej Róży.');
    }

    const currentMembersCount = await prisma.roseMembership.count({ where: { roseId } });
    if (currentMembersCount >= MAX_ROSE_MEMBERS) {
      return sendBadRequestError(res, `Róża osiągnęła maksymalną liczbę członków (${MAX_ROSE_MEMBERS}).`);
    }

    const newMembership = await prisma.roseMembership.create({
      data: { 
        userId: userIdToAdd, 
        roseId,
        mysteryOrderIndex: currentMembersCount
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        rose: { select: { id: true, name: true, description: true } }
      }
    });

    console.log(`[addMemberToRose] Pomyślnie dodano użytkownika ${userToAdd.email} do Róży ${roseId}.`);
    sendSuccessResponse(res, { message: 'Użytkownik został pomyślnie dodany do Róży.', membership: newMembership }, 201);
  } catch (error) {
    console.error('[addMemberToRose] Błąd:', error);
    next(error);
  }
};

export const listRoseMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    
    logUserAction('listRoseMembers', req.user!.email, { roseId });

    const rose = await findRoseById(roseId);
    if (!rose) {
      return sendNotFoundError(res, 'Róża o podanym ID nie istnieje.');
    }

    const hasPermission = await canManageRose(req.user!, roseId);
    if (!hasPermission) {
      return sendForbiddenError(res, 'Nie masz uprawnień do wyświetlania członków tej Róży.');
    }

    const members = await prisma.roseMembership.findMany({
      where: { roseId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        rose: { select: { id: true, name: true, description: true } }
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

export const getAvailableUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const requestingUser = req.user!;
    
    logUserAction('getAvailableUsers', requestingUser.email, {});

    // Sprawdź czy użytkownik ma uprawnienia (Admin lub Zelator)
    if (requestingUser.role !== UserRole.ADMIN && requestingUser.role !== UserRole.ZELATOR) {
      return sendForbiddenError(res, 'Brak odpowiednich uprawnień do wykonania tej akcji.');
    }

    // Pobierz użytkowników, którzy nie są w żadnej róży (nie mają RoseMembership)
    const availableUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            // Tylko użytkownicy z rolą MEMBER lub ZELATOR
            role: {
              in: [UserRole.MEMBER, UserRole.ZELATOR]
            }
          },
          {
            // Nie mają żadnego członkostwa w róży
            roseMemberships: {
              none: {}
            }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' }
      ]
    });

    console.log(`[getAvailableUsers] Znaleziono ${availableUsers.length} dostępnych użytkowników.`);
    res.json(availableUsers);
  } catch (error) {
    console.error('[getAvailableUsers] Błąd:', error);
    next(error);
  }
};

export const getMyManagedRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, role, email } = req.user!;
    
    logUserAction('getMyManagedRoses', email, { role });

    let roses;
    if (role === UserRole.ADMIN) {
      console.log(`[getMyManagedRoses] Użytkownik ${email} jest ADMINEM, pobieranie wszystkich Róż.`);
      roses = await prisma.rose.findMany({
        include: {
          _count: { select: { members: true } },
          zelator: { select: { id: true, email: true, name: true } }
        },
        orderBy: { name: 'asc' }
      });
    } else if (role === UserRole.ZELATOR) {
      console.log(`[getMyManagedRoses] Użytkownik ${email} jest ZELATOREM, pobieranie jego Róż.`);
      roses = await prisma.rose.findMany({
        where: { zelatorId: userId },
        include: {
          _count: { select: { members: true } },
          zelator: { select: { id: true, email: true, name: true } }
        },
        orderBy: { name: 'asc' }
      });
    } else {
      return sendForbiddenError(res, 'Brak odpowiednich uprawnień do wykonania tej akcji.');
    }
    
    console.log(`[getMyManagedRoses] Znaleziono ${roses.length} Róż.`);
    res.json(roses);
  } catch (error) {
    console.error('[getMyManagedRoses] Błąd:', error);
    next(error);
  }
};

export const removeMemberFromRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId, membershipId } = req.params;
    
    logUserAction('removeMemberFromRose', req.user!.email, { roseId, membershipId });

    const rose = await findRoseById(roseId);
    if (!rose) {
      return sendNotFoundError(res, 'Róża o podanym ID nie istnieje.');
    }

    const hasPermission = await canManageRose(req.user!, roseId);
    if (!hasPermission) {
      return sendForbiddenError(res, 'Nie masz uprawnień do usuwania członków z tej Róży.');
    }

    const membershipToDelete = await prisma.roseMembership.findUnique({
      where: { id: membershipId },
      select: { id: true, roseId: true, userId: true }
    });

    if (!membershipToDelete) {
      return sendNotFoundError(res, 'Nie znaleziono członkostwa do usunięcia.');
    }

    if (membershipToDelete.roseId !== roseId) {
      return sendBadRequestError(res, 'Podane członkostwo nie należy do tej Róży.');
    }

    await prisma.roseMembership.delete({
      where: { id: membershipId }
    });

    console.log(`[removeMemberFromRose] Pomyślnie usunięto członkostwo ${membershipId} z Róży ${roseId}.`);
    sendSuccessResponse(res, { message: 'Członek został pomyślnie usunięty z Róży.' });
  } catch (error) {
    console.error('[removeMemberFromRose] Błąd:', error);
    next(error);
  }
};

export const setOrUpdateMainRoseIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    const { text, isActive } = req.body;
    
    logUserAction('setOrUpdateMainRoseIntention', req.user!.email, { roseId, text });

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return sendBadRequestError(res, 'Treść intencji (text) jest wymagana.');
    }

    const hasPermission = await canManageRose(req.user!, roseId);
    if (!hasPermission) {
      return sendForbiddenError(res, 'Nie masz uprawnień do ustawiania głównej intencji dla tej Róży.');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const intentionData = {
      text: text.trim(),
      month: currentMonth,
      year: currentYear,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      authorId: req.user!.userId,
    };

    if (intentionData.isActive) {
      await prisma.roseMainIntention.updateMany({
        where: { roseId, month: currentMonth, year: currentYear, isActive: true },
        data: { isActive: false }
      });
    }

    const mainIntention = await prisma.roseMainIntention.upsert({
      where: { roseId_month_year: { roseId, month: currentMonth, year: currentYear } },
      update: intentionData,
      create: { roseId, ...intentionData },
      include: { 
        author: { select: { id: true, name: true, email: true } },
        rose: { select: { name: true } }
      }
    });
    
    console.log(`[setOrUpdateMainRoseIntention] Pomyślnie ustawiono/zaktualizowano główną intencję na ${currentMonth}/${currentYear} dla Róży ${roseId}.`);
    sendSuccessResponse(res, mainIntention, 201);
  } catch (error) {
    console.error('[setOrUpdateMainRoseIntention] Błąd:', error);
    next(error);
  }
};

export const getCurrentMainRoseIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    
    logUserAction('getCurrentMainRoseIntention', req.user!.email, { roseId });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const mainIntention = await prisma.roseMainIntention.findFirst({
      where: {
        roseId,
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

export const listMainIntentionsForRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    
    logUserAction('listMainIntentionsForRose', req.user!.email, { roseId });

    const rose = await findRoseById(roseId);
    if (!rose) {
      return sendNotFoundError(res, 'Róża o podanym ID nie istnieje.');
    }

    const intentions = await prisma.roseMainIntention.findMany({
      where: { roseId },
      orderBy: [
        { year: 'desc' }, 
        { month: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`[listMainIntentionsForRose] Znaleziono ${intentions.length} głównych intencji dla Róży ${roseId}.`);
    res.json(intentions);
  } catch (error) {
    console.error('[listMainIntentionsForRose] Błąd:', error);
    next(error);
  }
};