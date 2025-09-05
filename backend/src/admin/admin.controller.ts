// backend/src/admin/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';
import { assignMysteriesToAllRoses, assignAndRotateMysteriesForRose } from '../services/rosary.service';
import {
  validateAdminPermissions,
  validateUserRole,
  findUserById,
  findRoseById,
  validateZelator,
  validateUserDeletion,
  logAdminAction
} from './admin.helpers';

const ALLOWED_ROLES_TO_ASSIGN: UserRole[] = [UserRole.MEMBER, UserRole.ZELATOR];

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { userIdToUpdate } = req.params;
    const { newRole } = req.body;
    
    logAdminAction('updateUserRole', req.user!.email, { userIdToUpdate, newRole });

    const roleValidation = validateUserRole(newRole, ALLOWED_ROLES_TO_ASSIGN);
    if (!roleValidation.isValid) {
      res.status(400).json({ 
        error: `Nieprawidłowa rola lub rola niedozwolona do przypisania. Dozwolone: ${ALLOWED_ROLES_TO_ASSIGN.join(', ')}` 
      });
      return;
    }

    const userToUpdate = await findUserById(userIdToUpdate);
    if (!userToUpdate) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika do aktualizacji.' });
      return;
    }

    // Sprawdzenia bezpieczeństwa
    if (userToUpdate.id === req.user?.userId) {
      res.status(403).json({ error: 'Administrator nie może zmienić swojej własnej roli za pomocą tego endpointu.' });
      return;
    }
    
    if (userToUpdate.role === UserRole.ADMIN) {
      res.status(403).json({ error: 'Nie można zmienić roli innego administratora.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: { role: roleValidation.typedRole },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log(`[updateUserRole] Pomyślnie zmieniono rolę użytkownika ${userIdToUpdate} na ${roleValidation.typedRole}.`);
    res.json({ message: 'Rola użytkownika została pomyślnie zaktualizowana.', user: updatedUser });
  } catch (error) {
    console.error('[updateUserRole] Błąd:', error);
    next(error);
  }
};

export const createRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { name, description, zelatorId } = req.body;
    logAdminAction('createRose', req.user!.email, { name, zelatorId });

    if (!name || !zelatorId) {
      res.status(400).json({ error: 'Nazwa Róży i ID Zelatora są wymagane.' });
      return;
    }

    const zelatorValidation = await validateZelator(zelatorId);
    if (!zelatorValidation.isValid) {
      res.status(zelatorValidation.error!.includes('znaleziono') ? 404 : 400).json({ error: zelatorValidation.error });
      return;
    }

    const newRose = await prisma.rose.create({
      data: { name, description, zelator: { connect: { id: zelatorId } } },
      include: { zelator: { select: { id: true, email: true, name: true, role: true } } }
    });

    console.log(`[createRose] Pomyślnie stworzono Różę "${name}" z Zelatorem ${zelatorValidation.zelator!.email}.`);
    res.status(201).json(newRose);
  } catch (error) {
    console.error('[createRose] Błąd:', error);
    next(error);
  }
};

export const listRoses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    logAdminAction('listRoses', req.user!.email);

    const roses = await prisma.rose.findMany({
      include: {
        zelator: { select: { id: true, email: true, name: true, role: true } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[listRoses] Znaleziono ${roses.length} Róż.`);
    res.json(roses);
  } catch (error) {
    console.error('[listRoses] Błąd:', error);
    next(error);
  }
};

export const triggerMysteryAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    logAdminAction('triggerMysteryAssignment', req.user!.email);

    assignMysteriesToAllRoses().catch(err => {
      console.error("Błąd podczas asynchronicznego wywołania assignMysteriesToAllRoses:", err);
    });

    res.status(202).json({ message: 'Proces przydzielania tajemnic dla wszystkich Róż został zainicjowany w tle.' });
  } catch (error) {
    console.error('[triggerMysteryAssignment] Błąd:', error);
    next(error);
  }
};

export const getRoseDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roseId } = req.params;
    const requestingUser = req.user!;
    
    logAdminAction('getRoseDetails', requestingUser.email, { roseId });

    const rose = await findRoseById(roseId);
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
    console.error(`[getRoseDetails] Błąd:`, error);
    next(error);
  }
};

export const updateRoseDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { roseId } = req.params;
    const { name, description, zelatorId } = req.body;
    
    logAdminAction('updateRoseDetails', req.user!.email, { roseId, name, zelatorId });

    // Walidacja nazwy
    if (typeof name === 'string' && name.trim() === '') {
      res.status(400).json({ error: 'Nazwa Róży nie może być pusta.' });
      return;
    }

    const existingRose = await findRoseById(roseId);
    if (!existingRose) {
      res.status(404).json({ error: 'Róża o podanym ID nie została znaleziona.' });
      return;
    }

    const dataToUpdate: { name?: string; description?: string | null; zelatorId?: string } = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;

    // Walidacja zelatora jeśli podany
    if (zelatorId !== undefined) {
      if (!zelatorId) {
        res.status(400).json({ error: 'ID Zelatora jest wymagane i nie może być puste.' });
        return;
      }

      const zelatorValidation = await validateZelator(zelatorId);
      if (!zelatorValidation.isValid) {
        res.status(zelatorValidation.error!.includes('znaleziono') ? 404 : 400).json({ error: zelatorValidation.error });
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
    console.error(`[updateRoseDetails] Błąd:`, error);
    next(error);
  }
};

export const triggerMysteryAssignmentForSpecificRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { roseId } = req.params;
    logAdminAction('triggerMysteryAssignmentForSpecificRose', req.user!.email, { roseId });

    const roseExists = await findRoseById(roseId);
    if (!roseExists) {
      res.status(404).json({ error: `Róża o ID ${roseId} nie została znaleziona.` });
      return;
    }

    assignAndRotateMysteriesForRose(roseId).catch(err => {
      console.error(`Błąd podczas asynchronicznego przydzielania tajemnic dla Róży ${roseId}:`, err);
    });

    res.status(202).json({ 
      message: `Proces przydzielania tajemnic dla Róży "${roseExists.name}" (ID: ${roseId}) został zainicjowany w tle.` 
    });
  } catch (error) {
    console.error(`[triggerMysteryAssignmentForSpecificRose] Błąd:`, error);
    next(error);
  }
};

export const deleteRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { roseId } = req.params;
    logAdminAction('deleteRose', req.user!.email, { roseId });

    const existingRose = await findRoseById(roseId);
    if (!existingRose) {
      res.status(404).json({ error: `Róża o ID ${roseId} nie została znaleziona.` });
      return;
    }

    await prisma.rose.delete({ where: { id: roseId } });

    console.log(`[deleteRose] Pomyślnie usunięto Różę ${roseId}.`);
    res.status(200).json({ message: `Róża "${existingRose.name}" (ID: ${roseId}) została pomyślnie usunięta.` });
  } catch (error) {
    console.error(`[deleteRose] Błąd:`, error);
    next(error);
  }
};

export const deleteUserByAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!validateAdminPermissions(req, res)) return;
    
    const { userIdToDelete } = req.params;
    logAdminAction('deleteUserByAdmin', req.user!.email, { userIdToDelete });

    const userToDelete = await findUserById(userIdToDelete);
    if (!userToDelete) {
      res.status(404).json({ error: `Użytkownik o ID ${userIdToDelete} nie został znaleziony.` });
      return;
    }

    const deletionValidation = await validateUserDeletion(userToDelete, req.user!.userId);
    if (!deletionValidation.canDelete) {
      res.status(400).json({ error: deletionValidation.error });
      return;
    }

    await prisma.user.delete({ where: { id: userIdToDelete } });

    console.log(`[deleteUserByAdmin] Pomyślnie usunięto użytkownika ${userIdToDelete}.`);
    res.status(200).json({ 
      message: `Użytkownik ${userToDelete.email} (ID: ${userIdToDelete}) został pomyślnie usunięty.` 
    });
  } catch (error) {
    console.error(`[deleteUserByAdmin] Błąd:`, error);
    next(error);
  }
};

// Funkcja do pobierania wszystkich użytkowników (przeniesiona z index.ts)
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(`Dostęp do /users przez użytkownika z rolą ADMIN: ${req.user?.email}`);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Dodaj informacje o przynależności do róż dla każdego użytkownika
    const usersWithRoseInfo = await Promise.all(
      users.map(async (user) => {
        // Pobierz róże, których użytkownik jest zelatorem
        const managedRoses = await prisma.rose.findMany({
          where: { zelatorId: user.id },
          select: { id: true, name: true }
        });

        // Pobierz róże, w których użytkownik jest członkiem
        const memberRoses = await prisma.roseMembership.findMany({
          where: { userId: user.id },
          select: {
            rose: {
              select: { id: true, name: true }
            }
          }
        });

        return {
          ...user,
          managedRoses: managedRoses.map(rose => ({
            ...rose,
            role: 'ZELATOR' as const
          })),
          memberRoses: memberRoses.map(membership => ({
            ...membership.rose,
            role: 'MEMBER' as const
          }))
        };
      })
    );

    res.json(usersWithRoseInfo);
  } catch (error) {
    next(error);
  }
};