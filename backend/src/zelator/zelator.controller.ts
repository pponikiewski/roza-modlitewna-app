// backend/src/zelator/zelator.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { UserRole } from '../types/user.types';

// Funkcja pomocnicza do sprawdzania, czy zalogowany użytkownik jest Zelatorem danej Róży
async function isUserZelatorOfRose(userId: string, roseId: string): Promise<boolean> {
  const rose = await prisma.rose.findUnique({
    where: { id: roseId },
    select: { zelatorId: true }
  });
  return rose?.zelatorId === userId;
}

// Dodawanie członka do Róży
export const addMemberToRose = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roseId } = req.params; // ID Róży z parametrów URL
    const { userIdToAdd } = req.body; // ID użytkownika do dodania z ciała żądania
    const zelatorId = req.user?.userId; // ID zalogowanego Zelatora

    if (!userIdToAdd) {
      res.status(400).json({ error: 'ID użytkownika do dodania jest wymagane.' });
      return;
    }

    if (!zelatorId) {
      // Ten błąd nie powinien wystąpić, jeśli authenticateToken działa poprawnie
      res.status(403).json({ error: 'Nie udało się zidentyfikować Zelatora.' });
      return;
    }

    // Sprawdź, czy zalogowany użytkownik jest Zelatorem tej konkretnej Róży
    const isZelator = await isUserZelatorOfRose(zelatorId, roseId);
    if (!isZelator) {
      res.status(403).json({ error: 'Nie masz uprawnień do zarządzania tą Różą.' });
      return;
    }

    // Sprawdź, czy użytkownik do dodania istnieje
    const userExists = await prisma.user.findUnique({ where: { id: userIdToAdd } });
    if (!userExists) {
      res.status(404).json({ error: 'Użytkownik, którego próbujesz dodać, nie istnieje.' });
      return;
    }
    
    // Zelator nie może dodać samego siebie jako członka (jest już zelatorem)
    if (userIdToAdd === zelatorId) {
        res.status(400).json({ error: 'Zelator nie może dodać samego siebie jako członka do Róży, którą zarządza.' });
        return;
    }

    // Sprawdź, czy użytkownik nie jest już członkiem tej Róży
    const existingMembership = await prisma.roseMembership.findUnique({
      where: { userId_roseId: { userId: userIdToAdd, roseId: roseId } },
    });

    if (existingMembership) {
      res.status(409).json({ error: 'Ten użytkownik jest już członkiem tej Róży.' });
      return;
    }

    // Dodaj użytkownika do Róży
    // Na tym etapie nie przydzielamy jeszcze tajemnicy (`assignedMystery` będzie null)
    const newMembership = await prisma.roseMembership.create({
      data: {
        user: { connect: { id: userIdToAdd } },
        rose: { connect: { id: roseId } },
        // assignedMystery: null, // Domyślnie
        // mysteryConfirmedAt: null, // Domyślnie
      },
      include: { // Dołącz dane użytkownika do odpowiedzi
         user: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    res.status(201).json({ message: 'Użytkownik został dodany do Róży.', membership: newMembership });

  } catch (error) {
    next(error);
  }
};

// Listowanie członków konkretnej Róży
export const listRoseMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roseId } = req.params;
    const requestingUserId = req.user?.userId; // Może być Zelator lub Admin

    if (!requestingUserId) {
     res.status(403).json({ error: 'Nie udało się zidentyfikować użytkownika.' });
     return;
   }

    // Sprawdź, czy Róża istnieje
    const rose = await prisma.rose.findUnique({ where: { id: roseId } });
    if (!rose) {
      res.status(404).json({ error: 'Róża nie została znaleziona.' });
      return;
    }

    // Zelator może listować członków tylko swojej Róży
    // Admin może listować członków dowolnej Róży (dla celów administracyjnych)
    if (req.user?.role !== UserRole.ADMIN && rose.zelatorId !== requestingUserId) {
      res.status(403).json({ error: 'Nie masz uprawnień do wyświetlania członków tej Róży.' });
      return;
    }

    const members = await prisma.roseMembership.findMany({
      where: { roseId: roseId },
      include: {
        user: { // Dołącz dane użytkownika (członka)
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: {
         createdAt: 'asc' // Sortuj np. po dacie dołączenia
      }
    });

    res.json(members);

  } catch (error) {
    next(error);
  }
};