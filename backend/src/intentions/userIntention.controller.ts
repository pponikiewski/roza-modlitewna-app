// backend/src/intentions/userIntention.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import {
  validateUser,
  validateIntentionText,
  validateIntentionOwnership,
  validateSharingParameters,
  checkRoseAccessForSharing,
  checkRosePermissionForIntentions,
  findUserIntentionById,
  logUserAction,
  sendNotFoundError,
  sendBadRequestError,
  sendForbiddenError,
  sendSuccessResponse
} from '../shared/common.helpers';

export const createUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { text, isSharedWithRose, sharedWithRoseId } = req.body;
    const { userId, email, role } = req.user!;
    
    logUserAction('createUserIntention', email, { text: text?.slice(0, 50) + '...', isSharedWithRose, sharedWithRoseId });

    const textError = validateIntentionText(text);
    if (textError) {
      return sendBadRequestError(res, textError);
    }

    const sharingError = validateSharingParameters(isSharedWithRose, sharedWithRoseId);
    if (sharingError) {
      return sendBadRequestError(res, sharingError);
    }

    const dataToCreate: any = {
      authorId: userId,
      text: text.trim(),
      isSharedWithRose: Boolean(isSharedWithRose),
    };

    if (Boolean(isSharedWithRose) && sharedWithRoseId) {
      const hasAccess = await checkRoseAccessForSharing(userId, sharedWithRoseId, role);
      if (!hasAccess) {
        return sendForbiddenError(res, 'Nie możesz udostępnić intencji Róży, której nie jesteś członkiem (lub nie zarządzasz nią jako Zelator/Admin).');
      }
      dataToCreate.sharedWithRoseId = sharedWithRoseId;
    } else {
      dataToCreate.sharedWithRoseId = null;
    }

    const newIntention = await prisma.userIntention.create({
      data: dataToCreate,
      include: {
        author: { select: { id: true, name: true, email: true } },
        sharedWithRose: { select: { id: true, name: true } }
      }
    });

    console.log(`[createUserIntention] Pomyślnie utworzono intencję ${newIntention.id} przez ${userId}.`);
    sendSuccessResponse(res, newIntention, 201);
  } catch (error) {
    console.error('[createUserIntention] Błąd:', error);
    next(error);
  }
};

export const listMyIntentions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { userId, email } = req.user!;
    
    logUserAction('listMyIntentions', email, { userId });

    const intentions = await prisma.userIntention.findMany({
      where: { authorId: userId },
      include: {
        sharedWithRose: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`[listMyIntentions] Znaleziono ${intentions.length} intencji dla użytkownika ${userId}.`);
    res.json(intentions);
  } catch (error) {
    console.error('[listMyIntentions] Błąd:', error);
    next(error);
  }
};

export const updateUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { intentionId } = req.params;
    const { text, isSharedWithRose, sharedWithRoseId } = req.body;
    const { userId, email, role } = req.user!;
    
    logUserAction('updateUserIntention', email, { intentionId, hasText: !!text, isSharedWithRose });

    const intention = await findUserIntentionById(intentionId);
    if (!intention) {
      return sendNotFoundError(res, 'Intencja nie została znaleziona.');
    }

    if (!validateIntentionOwnership(intention, userId)) {
      return sendForbiddenError(res, 'Nie masz uprawnień do edycji tej intencji.');
    }

    const dataToUpdate: any = {};
    
    if (text !== undefined) {
      const textError = validateIntentionText(text);
      if (textError) {
        return sendBadRequestError(res, 'Treść intencji (text) nie może być pusta, jeśli jest aktualizowana.');
      }
      dataToUpdate.text = text.trim();
    }
    
    if (isSharedWithRose !== undefined) {
      dataToUpdate.isSharedWithRose = Boolean(isSharedWithRose);
    }

    if (dataToUpdate.isSharedWithRose === true && sharedWithRoseId !== undefined) {
      const hasAccess = await checkRoseAccessForSharing(userId, sharedWithRoseId, role);
      if (!hasAccess) {
        return sendForbiddenError(res, 'Nie możesz udostępnić intencji Róży, której nie jesteś członkiem (lub nie zarządzasz nią).');
      }
      dataToUpdate.sharedWithRoseId = sharedWithRoseId;
    } else if (dataToUpdate.isSharedWithRose === true && sharedWithRoseId === undefined && intention.sharedWithRoseId === null) {
      return sendBadRequestError(res, 'Jeśli isSharedWithRose jest ustawiane na true, sharedWithRoseId jest wymagane.');
    } else if (dataToUpdate.isSharedWithRose === false) {
      dataToUpdate.sharedWithRoseId = null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return sendBadRequestError(res, 'Nie podano żadnych danych do aktualizacji.');
    }

    const updatedIntention = await prisma.userIntention.update({
      where: { id: intentionId },
      data: dataToUpdate,
      include: {
        author: { select: { id: true, name: true, email: true } },
        sharedWithRose: { select: { id: true, name: true } }
      }
    });

    console.log(`[updateUserIntention] Pomyślnie zaktualizowano intencję ${intentionId}.`);
    res.json(updatedIntention);
  } catch (error) {
    console.error('[updateUserIntention] Błąd:', error);
    next(error);
  }
};

export const deleteUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { intentionId } = req.params;
    const { userId, email } = req.user!;
    
    logUserAction('deleteUserIntention', email, { intentionId });

    const intention = await findUserIntentionById(intentionId);
    if (!intention) {
      return sendNotFoundError(res, 'Intencja nie została znaleziona.');
    }

    if (!validateIntentionOwnership(intention, userId)) {
      return sendForbiddenError(res, 'Nie masz uprawnień do usunięcia tej intencji.');
    }

    await prisma.userIntention.delete({ where: { id: intentionId } });
    
    console.log(`[deleteUserIntention] Pomyślnie usunięto intencję ${intentionId}.`);
    sendSuccessResponse(res, { message: 'Intencja została pomyślnie usunięta.' });
  } catch (error) {
    console.error('[deleteUserIntention] Błąd:', error);
    next(error);
  }
};

export const listSharedIntentionsForRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateUser(req, res)) return;
    
    const { roseId } = req.params;
    const { userId, email, role } = req.user!;
    
    logUserAction('listSharedIntentionsForRose', email, { roseId });

    const hasPermission = await checkRosePermissionForIntentions(userId, roseId, role);
    if (!hasPermission) {
      return sendForbiddenError(res, 'Nie masz uprawnień do wyświetlania intencji tej Róży.');
    }

    const intentions = await prisma.userIntention.findMany({
      where: {
        sharedWithRoseId: roseId,
        isSharedWithRose: true
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`[listSharedIntentionsForRose] Znaleziono ${intentions.length} udostępnionych intencji dla Róży ${roseId}.`);
    res.json(intentions);
  } catch (error) {
    console.error('[listSharedIntentionsForRose] Błąd:', error);
    next(error);
  }
};