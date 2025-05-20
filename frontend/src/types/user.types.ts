// frontend/src/types/user.types.ts

// 1. Definiujemy obiekt ze stałymi reprezentującymi role
export const UserRoles = {
  ADMIN: 'ADMIN',
  ZELATOR: 'ZELATOR',
  MEMBER: 'MEMBER',
} as const; // 'as const' jest ważne:
            // - czyni właściwości obiektu tylko do odczytu (readonly)
            // - zawęża typ każdej właściwości do jej dosłownej wartości stringowej (np. typ UserRoles.ADMIN to 'ADMIN', a nie ogólny string)

// 2. Definiujemy typ unii na podstawie wartości z obiektu UserRoles
// typeof UserRoles -> pobiera typ obiektu UserRoles
// keyof typeof UserRoles -> pobiera unię kluczy obiektu ('ADMIN' | 'ZELATOR' | 'MEMBER')
// typeof UserRoles[keyof typeof UserRoles] -> pobiera unię typów wartości pod tymi kluczami ('ADMIN' | 'ZELATOR' | 'MEMBER')
export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// --- Przykłady użycia (nie musisz ich tu zostawiać, to tylko dla demonstracji) ---
// let mojaRola: UserRole;
// mojaRola = UserRoles.ADMIN; // Poprawne
// mojaRola = UserRoles.MEMBER; // Poprawne
// // mojaRola = 'INNA_ROLA'; // Błąd! 'INNA_ROLA' nie jest częścią typu UserRole

// function sprawdzRole(rola: UserRole) {
//   if (rola === UserRoles.ADMIN) {
//     console.log('To jest admin!');
//   }
// }
// sprawdzRole(UserRoles.ZELATOR);