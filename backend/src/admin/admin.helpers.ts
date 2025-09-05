// backend/src/admin/admin.helpers.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { UserRole } from '../types/user.types';
import prisma from '../db';

// Sprawdzenie uprawnień administratora
export const validateAdminPermissions = (req: AuthenticatedRequest, res: Response): boolean => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Brak uprawnień administratora.' });
    return false;
  }
  return true;
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

// Logowanie akcji admina
export const logAdminAction = (action: string, adminEmail: string, details?: any) => {
  const detailsStr = details ? ` Details: ${JSON.stringify(details)}` : '';
  console.log(`[${action}] Admin ${adminEmail} - ${detailsStr}`);
};
