// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware'; // Upewnij się, że ścieżka jest poprawna
import prisma from '../db'; // Upewnij się, że ścieżka jest poprawna
import { UserRole } from '../types/user.types'; // Upewnij się, że ścieżka jest poprawna
import { assignMysteriesToAllRoses, assignAndRotateMysteriesForRose } from '../services/rosary.service'; // Poprawiona ścieżka

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

export const updateRoseDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const { name, description, zelatorId } = req.body; // Admin może zmienić nazwę, opis, Zelatora
  const adminUser = req.user;

  console.log(`[updateRoseDetails] Admin ${adminUser?.email} próbuje zaktualizować Różę ${roseId}. Dane: ${JSON.stringify(req.body)}`);
  try {
    if (adminUser?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    // Podstawowa walidacja - nazwa jest wymagana
    if (typeof name === 'string' && name.trim() === '') {
      res.status(400).json({ error: 'Nazwa Róży nie może być pusta.' });
      return;
    }

    // Sprawdź, czy Róża istnieje
    const existingRose = await prisma.rose.findUnique({ where: { id: roseId } });
    if (!existingRose) {
      res.status(404).json({ error: 'Róża o podanym ID nie została znaleziona.' });
      return;
    }

    const dataToUpdate: { name?: string; description?: string | null; zelatorId?: string } = {};

    if (name !== undefined) {
      dataToUpdate.name = name;
    }
    if (description !== undefined) { // Pozwól na ustawienie pustego opisu lub null
      dataToUpdate.description = description;
    }

    // Jeśli przekazano zelatorId, zwaliduj go
    if (zelatorId !== undefined) {
      if (zelatorId === null || zelatorId === '') { // Jeśli chcemy usunąć zelatora (choć model tego wymaga)
        // W obecnym modelu Rose.zelatorId nie jest opcjonalne.
        // Aby usunąć Zelatora, trzeba by zmienić logikę/model lub przypisać innego.
        // Na razie, jeśli zelatorId jest pusty, uznajemy to za błąd, bo model wymaga.
         res.status(400).json({ error: 'ID Zelatora jest wymagane i nie może być puste.' });
         return;
      }

      const newZelatorUser = await prisma.user.findUnique({ where: { id: zelatorId } });
      if (!newZelatorUser) {
        res.status(404).json({ error: `Użytkownik (potencjalny Zelator) o ID ${zelatorId} nie został znaleziony.` });
        return;
      }
      if (newZelatorUser.role !== UserRole.ZELATOR && newZelatorUser.role !== UserRole.ADMIN) {
        res.status(400).json({ error: `Użytkownik o ID ${zelatorId} nie ma roli ZELATOR ani ADMIN. Zmień najpierw jego rolę.` });
        return;
      }
      dataToUpdate.zelatorId = zelatorId;
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
        res.status(400).json({ error: 'Nie podano żadnych danych do aktualizacji.' });
        return;
    }

    const updatedRose = await prisma.rose.update({
      where: { id: roseId },
      data: dataToUpdate,
      include: {
        zelator: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true } }
      }
    });

    console.log(`[updateRoseDetails] Pomyślnie zaktualizowano Różę ${roseId}.`);
    res.json(updatedRose);

  } catch (error) {
    console.error(`[updateRoseDetails] Błąd podczas aktualizacji Róży ${roseId}:`, error);
    next(error);
  }
};

export const triggerMysteryAssignmentForSpecificRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const adminUser = req.user;

  console.log(`[triggerMysteryAssignmentForSpecificRose] Admin ${adminUser?.email} inicjuje przydzielanie tajemnic dla Róży ${roseId}.`);
  try {
    if (adminUser?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    // Sprawdź, czy Róża istnieje
    const roseExists = await prisma.rose.findUnique({ where: { id: roseId } });
    if (!roseExists) {
      res.status(404).json({ error: `Róża o ID ${roseId} nie została znaleziona.` });
      return;
    }

    // Uruchomienie logiki w tle dla konkretnej Róży
    assignAndRotateMysteriesForRose(roseId).catch(err => {
      console.error(`Błąd podczas asynchronicznego przydzielania tajemnic dla Róży ${roseId} (wywołane przez admina):`, err);
    });

    res.status(202).json({ message: `Proces przydzielania tajemnic dla Róży "${roseExists.name}" (ID: ${roseId}) został zainicjowany w tle.` });
  } catch (error) {
    console.error(`[triggerMysteryAssignmentForSpecificRose] Błąd w głównym bloku try-catch dla Róży ${roseId}:`, error);
    next(error);
  }
};

// NOWA FUNKCJA: Usuwanie Róży przez Admina
export const deleteRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { roseId } = req.params;
  const adminUser = req.user;

  console.log(`[deleteRose] Admin ${adminUser?.email} próbuje usunąć Różę ${roseId}.`);
  try {
    if (adminUser?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    // Sprawdź, czy Róża istnieje, zanim spróbujesz ją usunąć
    const existingRose = await prisma.rose.findUnique({ where: { id: roseId } });
    if (!existingRose) {
      res.status(404).json({ error: `Róża o ID ${roseId} nie została znaleziona.` });
      return;
    }

    // Usuwanie Róży. Dzięki onDelete: Cascade w schemacie Prisma, powiązane:
    // - RoseMembership (członkostwa)
    // - AssignedMysteryHistory (historia tajemnic, przez RoseMembership)
    // - RoseMainIntention (główne intencje Róży)
    // zostaną usunięte automatycznie.
    // UserIntention (intencje użytkowników) mają onDelete: SetNull dla sharedWithRoseId, więc stracą powiązanie.
    
    await prisma.rose.delete({
      where: { id: roseId },
    });

    console.log(`[deleteRose] Pomyślnie usunięto Różę ${roseId}.`);
    res.status(200).json({ message: `Róża "${existingRose.name}" (ID: ${roseId}) została pomyślnie usunięta.` });

  } catch (error) {
    console.error(`[deleteRose] Błąd podczas usuwania Róży ${roseId}:`, error);
    // Możliwy błąd: jeśli istnieją jeszcze jakieś relacje, które nie mają onDelete: Cascade lub SetNull,
    // a blokują usunięcie (np. jeśli User.rosesManaged nie miałoby zdefiniowanej odwrotnej relacji poprawnie).
    // W naszym schemacie powinno być OK.
    next(error);
  }
};

// NOWA FUNKCJA: Usuwanie użytkownika przez Admina
export const deleteUserByAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { userIdToDelete } = req.params;
  const adminUser = req.user;

  console.log(`[deleteUserByAdmin] Admin ${adminUser?.email} próbuje usunąć użytkownika ${userIdToDelete}.`);
  try {
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'Brak uprawnień administratora.' });
      return;
    }

    // Admin nie może usunąć samego siebie
    if (userIdToDelete === adminUser.userId) {
      res.status(400).json({ error: 'Administrator nie może usunąć swojego własnego konta.' });
      return;
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!userToDelete) {
      res.status(404).json({ error: `Użytkownik o ID ${userIdToDelete} nie został znaleziony.` });
      return;
    }

    // Admin nie może usunąć innego Admina (jeśli taka jest polityka)
    // W naszym modelu jest tylko jeden Admin, ale to zabezpieczenie na przyszłość
    if (userToDelete.role === UserRole.ADMIN) {
      res.status(403).json({ error: 'Nie można usunąć innego administratora.' });
      return;
    }

    // Rozważ konsekwencje usunięcia użytkownika:
    // - Co z Różami, których był Zelatorem? (Obecnie schemat ma relację, ale nie onDelete: Cascade/SetNull od User do Rose.zelatorId)
    //   Trzeba by to obsłużyć: albo uniemożliwić usunięcie Zelatora, jeśli zarządza Różami,
    //   albo przypisać te Róże innemu Zelatorowi/Adminowi, albo usunąć Róże.
    //   Najprościej na razie: uniemożliwić, jeśli jest Zelatorem.
    // - Członkostwa w Różach (RoseMembership) zostaną usunięte dzięki onDelete: Cascade w relacji User->RoseMembership.
    // - Historia Tajemnic (AssignedMysteryHistory) zostanie usunięta przez kaskadę z RoseMembership.
    // - Główne Intencje Róż (RoseMainIntention), których był autorem, będą miały authorId: null dzięki onDelete: SetNull.
    // - Jego Intencje Indywidualne (UserIntention) zostaną usunięte dzięki onDelete: Cascade.

    if (userToDelete.role === UserRole.ZELATOR) {
        const managedRosesCount = await prisma.rose.count({
            where: { zelatorId: userIdToDelete }
        });
        if (managedRosesCount > 0) {
            res.status(400).json({ 
                error: `Nie można usunąć użytkownika, ponieważ jest Zelatorem ${managedRosesCount} Róż. Najpierw zmień Zelatora tych Róż lub je usuń.` 
            });
            return;
        }
    }
    
    // Usunięcie użytkownika
    // To usunie też powiązane RoseMemberships, AssignedMysteryHistory, UserIntentions (dzięki onDelete: Cascade)
    // i ustawi authorId na null w RoseMainIntentions.
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    console.log(`[deleteUserByAdmin] Pomyślnie usunięto użytkownika ${userIdToDelete} przez Admina ${adminUser.email}.`);
    res.status(200).json({ message: `Użytkownik ${userToDelete.email} (ID: ${userIdToDelete}) został pomyślnie usunięty.` });

  } catch (error) {
    console.error(`[deleteUserByAdmin] Błąd podczas usuwania użytkownika ${userIdToDelete}:`, error);
    next(error);
  }
};