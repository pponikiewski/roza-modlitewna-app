// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware'; // Upewnij się, że ścieżka jest poprawna
import prisma from '../db'; // Upewnij się, że ścieżka jest poprawna
import { UserRole } from '../types/user.types'; // Upewnij się, że ścieżka jest poprawna
import { assignMysteriesToAllRoses } from '../services/rosary.service'; // Poprawiona ścieżka

const ALLOWED_ROLES_TO_ASSIGN: UserRole[] = [UserRole.MEMBER, UserRole.ZELATOR];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[updateUserRole] Admin ${req.user?.email} próbuje zmienić rolę. Params: ${JSON.stringify(req.params)}, Body: ${JSON.stringify(req.body)}`);
  try {
    // Sprawdzenie uprawnień Admina jest już w middleware (isAdmin), ale można zostawić jako dodatkowe zabezpieczenie.
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    const { userIdToUpdate } = req.params;
    const { newRole } = req.body;


    const typedNewRole = newRole?.toUpperCase() as UserRole; // Rzutujemy po walidacji
    const isValidRole = Object.values(UserRole).includes(typedNewRole);
    const isAllowedToAssign = ALLOWED_ROLES_TO_ASSIGN.includes(typedNewRole);

    if (!newRole || !isValidRole || !isAllowedToAssign) {
      res.status(400).json({ error: `Nieprawidłowa rola lub rola niedozwolona do przypisania. Dozwolone do przypisania: ${ALLOWED_ROLES_TO_ASSIGN.join(', ')}` });
      return;
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userIdToUpdate },
    });

    if (!userToUpdate) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika do aktualizacji.' });
      return;
    }

    // Admin nie może zmienić swojej własnej roli przez ten endpoint
    if (userToUpdate.id === req.user?.userId) { // req.user na pewno istnieje po middleware
      res.status(403).json({ error: 'Administrator nie może zmienić swojej własnej roli za pomocą tego endpointu.' });
      return;
    }
    
    // Admin nie może zmienić roli innego Admina (jeśli w przyszłości byliby inni admini)
    if (userToUpdate.role === UserRole.ADMIN) {
        res.status(403).json({ error: 'Nie można zmienić roli innego administratora.'});
        return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: typedNewRole }, // Używamy zwalidowanej i skonwertowanej roli
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    console.log(`[updateUserRole] Pomyślnie zmieniono rolę użytkownika ${userIdToUpdate} na ${typedNewRole}.`);
    res.json({ message: 'Rola użytkownika została pomyślnie zaktualizowana.', user: updatedUser });

  } catch (error) {
    console.error('[updateUserRole] Błąd:', error);
    next(error);
  }
};

export const createRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[createRose] Admin ${req.user?.email} próbuje stworzyć Różę. Body: ${JSON.stringify(req.body)}`);
  try {
    // Sprawdzenie uprawnień Admina (już w middleware)
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora do tworzenia Róż.' });
        return;
    }

    const { name, description, zelatorId } = req.body;

    if (!name || !zelatorId) {
      res.status(400).json({ error: 'Nazwa Róży i ID Zelatora są wymagane.' });
      return;
    }

    const zelatorUser = await prisma.user.findUnique({
      where: { id: zelatorId },
    });

    if (!zelatorUser) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika, który ma zostać Zelatorem.' });
      return;
    }

    // Zelator może mieć rolę ZELATOR lub ADMIN (Admin też może być zelatorem)
    if (zelatorUser.role !== UserRole.ZELATOR && zelatorUser.role !== UserRole.ADMIN) {
      res.status(400).json({ error: `Użytkownik o ID ${zelatorId} nie ma roli ZELATOR ani ADMIN. Zmień najpierw jego rolę.` });
      return;
    }

    const newRose = await prisma.rose.create({
      data: {
        name,
        description,
        zelator: { // Łączenie z istniejącym użytkownikiem Zelatorem
          connect: { id: zelatorId },
        },
      },
      include: { // Dołącz dane Zelatora do odpowiedzi
         zelator: {
             select: { id: true, email: true, name: true, role: true }
         }
      }
    });
    console.log(`[createRose] Pomyślnie stworzono Różę "${name}" z Zelatorem ${zelatorUser.email}.`);
    res.status(201).json(newRose);
  } catch (error) {
    console.error('[createRose] Błąd:', error);
    next(error);
  }
};

export const listRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[listRoses] Admin ${req.user?.email} próbuje listować wszystkie Róże.`);
  try {
    // Sprawdzenie uprawnień Admina (już w middleware)
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora.' });
        return;
    }

    const roses = await prisma.rose.findMany({
      include: {
        zelator: { // Dołączamy pełne dane Zelatora
          select: {
            id: true,
            email: true,
            name: true,
            role: true // Może być przydatne, aby zobaczyć, czy Zelator nadal ma odpowiednią rolę
          },
        },
        _count: { // Policz członków każdej Róży
          select: { members: true }
        }
      },
      orderBy: {
         createdAt: 'desc' // Sortuj od najnowszych
      }
    });
    console.log(`[listRoses] Znaleziono ${roses.length} Róż.`);
    res.json(roses);
  } catch (error) {
    console.error('[listRoses] Błąd:', error);
    next(error);
  }
};

export const triggerMysteryAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[triggerMysteryAssignment] Admin ${req.user?.email} inicjuje przydzielanie tajemnic dla wszystkich Róż.`);
  try {
    // Sprawdzenie uprawnień Admina (już w middleware)
    if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Brak uprawnień administratora.' });
        return;
    }

    // Wywołujemy funkcję w tle i nie czekamy na jej zakończenie, aby odpowiedź HTTP była szybka.
    // Błędy z assignMysteriesToAllRoses będą logowane przez tę funkcję.
    assignMysteriesToAllRoses().catch(err => {
      console.error("Błąd podczas asynchronicznego wywołania assignMysteriesToAllRoses z triggerMysteryAssignment:", err);
      // Tutaj nie możemy już wysłać odpowiedzi HTTP, bo status 202 został już wysłany.
      // Można by tu zaimplementować np. system powiadomień dla admina o błędach w tle.
    });

    res.status(202).json({ message: 'Proces przydzielania tajemnic dla wszystkich Róż został zainicjowany w tle.' });
  } catch (error) {
    // Ten blok catch złapie błędy tylko z synchronicznej części powyższego kodu,
    // np. jeśli req.user?.role rzuciłoby błąd (co nie powinno się zdarzyć po middleware).
    console.error('[triggerMysteryAssignment] Błąd w głównym bloku try-catch (synchroniczny):', error);
    next(error);
  }
};

// NOWA LUB ZMODYFIKOWANA FUNKCJA: Pobieranie szczegółów pojedynczej Róży
export const getRoseDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const requestingUser = req.user;

  console.log(`[getRoseDetails] Użytkownik ${requestingUser?.email} próbuje pobrać szczegóły Róży ${roseId}`);
  try {
    if (!requestingUser) {
      res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
      return;
    }

    const rose = await prisma.rose.findUnique({
      where: { id: roseId },
      include: {
        zelator: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    if (!rose) {
      res.status(404).json({ error: 'Róża o podanym ID nie została znaleziona.' });
      return;
    }

    // Sprawdzenie uprawnień: Admin może zobaczyć każdą Różę, Zelator tylko swoją
    if (requestingUser.role !== UserRole.ADMIN && rose.zelatorId !== requestingUser.userId) {
      res.status(403).json({ error: 'Nie masz uprawnień do wyświetlenia szczegółów tej Róży.' });
      return;
    }

    console.log(`[getRoseDetails] Pomyślnie pobrano szczegóły Róży ${roseId}.`);
    res.json(rose);

  } catch (error) {
    console.error(`[getRoseDetails] Błąd podczas pobierania szczegółów Róży ${roseId}:`, error);
    next(error);
  }
};