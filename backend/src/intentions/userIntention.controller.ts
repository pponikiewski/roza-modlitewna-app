// backend/src/intentions/userIntention.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';

// Tworzenie nowej intencji przez zalogowanego użytkownika
export const createUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { text, isSharedWithRose, sharedWithRoseId } = req.body;
  const authorId = req.user?.userId;

  console.log(`[createUserIntention] User ${authorId} tworzy intencję. Dane: ${JSON.stringify(req.body)}`);
  try {
    if (!authorId) {
      res.status(403).json({ error: 'Użytkownik niezidentyfikowany.' });
      return;
    }
    if (!text || typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ error: 'Treść intencji (text) jest wymagana.' });
      return;
    }

    const dataToCreate: any = {
      authorId,
      text: text.trim(),
      isSharedWithRose: Boolean(isSharedWithRose),
    };

    if (Boolean(isSharedWithRose) && sharedWithRoseId) {
      // Sprawdź, czy Róża istnieje i czy użytkownik jest jej członkiem (lub Zelatorem/Adminem)
      const membership = await prisma.roseMembership.findFirst({
        where: { userId: authorId, roseId: sharedWithRoseId }
      });
      const rose = await prisma.rose.findFirst({
         where: {id: sharedWithRoseId, OR: [{zelatorId: authorId}]}
      });


      if (!membership && !(req.user?.role === UserRole.ADMIN || rose )) { // Admin lub Zelator mogą udostępniać do Róż, których nie są członkami
        res.status(403).json({ error: 'Nie możesz udostępnić intencji Róży, której nie jesteś członkiem (lub nie zarządzasz nią jako Zelator/Admin).' });
        return;
      }
      dataToCreate.sharedWithRoseId = sharedWithRoseId;
    } else if (Boolean(isSharedWithRose) && !sharedWithRoseId) {
      res.status(400).json({ error: 'Jeśli isSharedWithRose jest true, sharedWithRoseId jest wymagane.' });
      return;
    } else {
      dataToCreate.sharedWithRoseId = null; // Upewnij się, że jest null, jeśli nie udostępniamy
    }

    const newIntention = await prisma.userIntention.create({
      data: dataToCreate,
      include: {
        author: { select: { id: true, name: true, email: true } },
        sharedWithRose: { select: { id: true, name: true } }
      }
    });

    console.log(`[createUserIntention] Pomyślnie utworzono intencję ${newIntention.id} przez ${authorId}.`);
    res.status(201).json(newIntention);

  } catch (error) {
    console.error('[createUserIntention] Błąd:', error);
    next(error);
  }
};

// Listowanie intencji zalogowanego użytkownika (jego prywatnych i tych, które udostępnił)
export const listMyIntentions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authorId = req.user?.userId;
  console.log(`[listMyIntentions] Użytkownik ${authorId} pobiera swoje intencje.`);
  try {
    if (!authorId) {
      res.status(403).json({ error: 'Użytkownik niezidentyfikowany.' });
      return;
    }

    const intentions = await prisma.userIntention.findMany({
      where: { authorId: authorId },
      include: {
        sharedWithRose: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`[listMyIntentions] Znaleziono ${intentions.length} intencji dla użytkownika ${authorId}.`);
    res.json(intentions);

  } catch (error) {
    console.error('[listMyIntentions] Błąd:', error);
    next(error);
  }
};

// Edycja własnej intencji
export const updateUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { intentionId } = req.params;
  const { text, isSharedWithRose, sharedWithRoseId } = req.body;
  const authorId = req.user?.userId;

  console.log(`[updateUserIntention] Użytkownik ${authorId} edytuje intencję ${intentionId}. Dane: ${JSON.stringify(req.body)}`);
  try {
    if (!authorId) {
      res.status(403).json({ error: 'Użytkownik niezidentyfikowany.' });
      return;
    }

    const intention = await prisma.userIntention.findUnique({ where: { id: intentionId } });
    if (!intention) {
      res.status(404).json({ error: 'Intencja nie została znaleziona.' });
      return;
    }
    if (intention.authorId !== authorId) {
      res.status(403).json({ error: 'Nie masz uprawnień do edycji tej intencji.' });
      return;
    }

    const dataToUpdate: any = {};
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim() === '') {
         res.status(400).json({ error: 'Treść intencji (text) nie może być pusta, jeśli jest aktualizowana.' });
         return;
      }
      dataToUpdate.text = text.trim();
    }
    if (isSharedWithRose !== undefined) {
      dataToUpdate.isSharedWithRose = Boolean(isSharedWithRose);
    }

    if (dataToUpdate.isSharedWithRose === true && sharedWithRoseId !== undefined) {
      // Walidacja, jeśli zmieniamy/ustawiamy udostępnianie
      const membership = await prisma.roseMembership.findFirst({
        where: { userId: authorId, roseId: sharedWithRoseId }
      });
      const rose = await prisma.rose.findFirst({
         where: {id: sharedWithRoseId, OR: [{zelatorId: authorId}]}
      });
      if (!membership && !(req.user?.role === UserRole.ADMIN || rose)) {
        res.status(403).json({ error: 'Nie możesz udostępnić intencji Róży, której nie jesteś członkiem (lub nie zarządzasz nią).' });
        return;
      }
      dataToUpdate.sharedWithRoseId = sharedWithRoseId;
    } else if (dataToUpdate.isSharedWithRose === true && sharedWithRoseId === undefined && intention.sharedWithRoseId === null) {
      // Próba ustawienia isShared na true bez podania Rose ID, a wcześniej nie było udostępnione
      res.status(400).json({ error: 'Jeśli isSharedWithRose jest ustawiane na true, sharedWithRoseId jest wymagane.' });
      return;
    } else if (dataToUpdate.isSharedWithRose === false) {
      dataToUpdate.sharedWithRoseId = null; // Jeśli cofamy udostępnienie
    }
    // Jeśli isSharedWithRose nie jest zmieniane, a sharedWithRoseId jest, to logika też powinna to obsłużyć (np. zmiana Róży)

    if (Object.keys(dataToUpdate).length === 0) {
         res.status(400).json({ error: 'Nie podano żadnych danych do aktualizacji.' });
         return;
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

// Usuwanie własnej intencji
export const deleteUserIntention = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { intentionId } = req.params;
  const authorId = req.user?.userId;
  console.log(`[deleteUserIntention] Użytkownik ${authorId} usuwa intencję ${intentionId}.`);
  try {
    if (!authorId) {
      res.status(403).json({ error: 'Użytkownik niezidentyfikowany.' });
      return;
    }

    const intention = await prisma.userIntention.findUnique({ where: { id: intentionId } });
    if (!intention) {
      res.status(404).json({ error: 'Intencja nie została znaleziona.' });
      return;
    }
    if (intention.authorId !== authorId) {
      // Dodatkowe sprawdzenie, czy Admin może usuwać czyjeś intencje (na razie nie)
      res.status(403).json({ error: 'Nie masz uprawnień do usunięcia tej intencji.' });
      return;
    }

    await prisma.userIntention.delete({ where: { id: intentionId } });
    console.log(`[deleteUserIntention] Pomyślnie usunięto intencję ${intentionId}.`);
    res.status(200).json({ message: 'Intencja została pomyślnie usunięta.' });

  } catch (error) {
    console.error('[deleteUserIntention] Błąd:', error);
    next(error);
  }
};

// Listowanie intencji udostępnionych DANEJ Róży (dla członków tej Róży, Zelatora, Admina)
export const listSharedIntentionsForRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const { roseId } = req.params;
    const userId = req.user?.userId;
    console.log(`[listSharedIntentionsForRose] Użytkownik ${userId} pobiera udostępnione intencje dla Róży ${roseId}.`);
    try {
        if (!userId) {
          res.status(403).json({ error: 'Użytkownik niezidentyfikowany.' });
          return;
        }

        // Sprawdzenie, czy użytkownik jest członkiem tej Róży lub Zelatorem/Adminem (aby mógł widzieć intencje)
        const membership = await prisma.roseMembership.findFirst({
          where: { userId: userId, roseId: roseId }
        });
        const rose = await prisma.rose.findFirst({
          where: {id: roseId, OR: [{zelatorId: userId}]}
        });

        if (!membership && !(req.user?.role === UserRole.ADMIN || rose)) {
          res.status(403).json({ error: 'Nie masz uprawnień do wyświetlania intencji tej Róży.' });
          return;
        }

        const intentions = await prisma.userIntention.findMany({
            where: {
                sharedWithRoseId: roseId,
                isSharedWithRose: true // Upewniamy się, że faktycznie są udostępnione
            },
            include: {
                author: { select: { id: true, name: true, email: true } } // Dołączamy autora
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