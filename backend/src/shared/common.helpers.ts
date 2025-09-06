// backend/src/admin/admin.helpers.ts - renamed to common.helpers.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types';
import prisma from '../db';

// Sprawdzenie czy użytkownik jest zalogowany
export const validateUser = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!req.user || !req.user.userId) {
    res.status(403).json({ error: 'Sesja użytkownika wygasła lub użytkownik niezidentyfikowany.' });
    return false;
  }
  return true;
};

// Sprawdzenie uprawnień administratora
export const validateAdminPermissions = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!validateUser(req, res)) return false;
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Brak uprawnień administratora.' });
    return false;
  }
  return true;
};

// Sprawdzenie uprawnień zelatora lub admina
export const validateZelatorOrAdminPermissions = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!validateUser(req, res)) return false;
  if (req.user?.role !== UserRole.ZELATOR && req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Brak uprawnień zelatora lub administratora.' });
    return false;
  }
  return true;
};

// Sprawdzenie czy użytkownik może zarządzać różą
export const canManageRose = async (requestingUser: NonNullable<AuthenticatedRequest['user']>, roseId: string): Promise<boolean> => {
  if (requestingUser.role === UserRole.ADMIN) {
    console.log(`[canManageRose] Użytkownik ${requestingUser.email} jest ADMINEM, ma dostęp do Róży ${roseId}.`);
    return true;
  }

  if (requestingUser.role === UserRole.ZELATOR) {
    const rose = await prisma.rose.findUnique({
      where: { id: roseId },
      select: { zelatorId: true }
    });
    if (rose && rose.zelatorId === requestingUser.userId) {
      console.log(`[canManageRose] Użytkownik ${requestingUser.email} jest ZELATOREM Róży ${roseId}.`);
      return true;
    }
  }
  
  console.log(`[canManageRose] Użytkownik ${requestingUser.email} nie ma uprawnień do Róży ${roseId}.`);
  return false;
};

// Walidacja roli użytkownika
export const validateUserRole = (role: string, allowedRoles: UserRole[]): { isValid: boolean; typedRole?: UserRole } => {
  const typedRole = role?.toUpperCase() as UserRole;
  const isValid = Object.values(UserRole).includes(typedRole);
  const isAllowed = allowedRoles.includes(typedRole);
  
  return {
    isValid: isValid && isAllowed,
    typedRole: isValid ? typedRole : undefined
  };
};

// Sprawdzenie czy użytkownik istnieje
export const findUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};

// Sprawdzenie czy Róża istnieje
export const findRoseById = async (roseId: string) => {
  return await prisma.rose.findUnique({
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
};

// Znajdź członkostwo użytkownika w róży
export const findMembershipByUserAndRose = async (userId: string, roseId: string) => {
  return await prisma.roseMembership.findUnique({
    where: {
      userId_roseId: { userId, roseId }
    },
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
};

// Znajdź członkostwo po ID
export const findMembershipById = async (membershipId: string) => {
  return await prisma.roseMembership.findUnique({
    where: { id: membershipId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      rose: { select: { id: true, name: true, zelatorId: true } }
    }
  });
};

// Walidacja zelatora
export const validateZelator = async (zelatorId: string) => {
  const zelator = await findUserById(zelatorId);
  if (!zelator) {
    return { isValid: false, error: 'Nie znaleziono użytkownika, który ma zostać Zelatorem.' };
  }
  
  if (zelator.role !== UserRole.ZELATOR && zelator.role !== UserRole.ADMIN) {
    return { 
      isValid: false, 
      error: `Użytkownik o ID ${zelatorId} nie ma roli ZELATOR ani ADMIN. Zmień najpierw jego rolę.` 
    };
  }
  
  return { isValid: true, zelator };
};

// Sprawdzenie czy użytkownik może być usunięty
export const validateUserDeletion = async (userToDelete: any, adminUserId: string) => {
  if (userToDelete.id === adminUserId) {
    return { canDelete: false, error: 'Administrator nie może usunąć swojego własnego konta.' };
  }
  
  if (userToDelete.role === UserRole.ADMIN) {
    return { canDelete: false, error: 'Nie można usunąć innego administratora.' };
  }
  
  if (userToDelete.role === UserRole.ZELATOR) {
    const managedRosesCount = await prisma.rose.count({
      where: { zelatorId: userToDelete.id }
    });
    if (managedRosesCount > 0) {
      return { 
        canDelete: false, 
        error: `Nie można usunąć użytkownika, ponieważ jest Zelatorem ${managedRosesCount} Róż. Najpierw zmień Zelatora tych Róż lub je usuń.` 
      };
    }
  }
  
  return { canDelete: true };
};

// Logowanie akcji użytkownika
export const logUserAction = (action: string, userEmail: string, details?: any) => {
  const detailsStr = details ? ` Details: ${JSON.stringify(details)}` : '';
  console.log(`[${action}] Użytkownik ${userEmail}${detailsStr}`);
};

// Logowanie akcji admina (zachowane dla kompatybilności)
export const logAdminAction = (action: string, adminEmail: string, details?: any) => {
  logUserAction(action, adminEmail, details);
};

// Standardowe odpowiedzi błędów
export const sendNotFoundError = (res: Response, message: string) => {
  res.status(404).json({ error: message });
};

export const sendBadRequestError = (res: Response, message: string) => {
  res.status(400).json({ error: message });
};

export const sendForbiddenError = (res: Response, message: string) => {
  res.status(403).json({ error: message });
};

export const sendSuccessResponse = (res: Response, data: any, status: number = 200) => {
  res.status(status).json(data);
};
