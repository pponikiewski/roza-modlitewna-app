// backend/src/constants.ts (lub backend/src/utils/constants.ts)

export const ROSARY_MYSTERIES: string[] = [
  // Tajemnice Radosne
  "Radosna: Zwiastowanie Najświętszej Maryi Pannie",
  "Radosna: Nawiedzenie Świętej Elżbiety",
  "Radosna: Narodzenie Pana Jezusa",
  "Radosna: Ofiarowanie Pana Jezusa w Świątyni",
  "Radosna: Odnalezienie Pana Jezusa w Świątyni",
  // Tajemnice Światła
  "Światła: Chrzest Pana Jezusa w Jordanie",
  "Światła: Objawienie siebie na weselu w Kanie Galilejskiej",
  "Światła: Głoszenie Królestwa Bożego i wzywanie do nawrócenia",
  "Światła: Przemienienie na Górze Tabor",
  "Światła: Ustanowienie Eucharystii",
  // Tajemnice Bolesne
  "Bolesna: Modlitwa Pana Jezusa w Ogrójcu",
  "Bolesna: Biczowanie Pana Jezusa",
  "Bolesna: Cierniem ukoronowanie Pana Jezusa",
  "Bolesna: Dźwiganie krzyża na Kalwarię",
  "Bolesna: Ukrzyżowanie i śmierć Pana Jezusa",
  // Tajemnice Chwalebne
  "Chwalebna: Zmartwychwstanie Pana Jezusa",
  "Chwalebna: Wniebowstąpienie Pana Jezusa",
  "Chwalebna: Zesłanie Ducha Świętego",
  "Chwalebna: Wniebowzięcie Najświętszej Maryi Panny",
  "Chwalebna: Ukoronowanie Najświętszej Maryi Panny na Królową Nieba i Ziemi"
];

// Możemy też dodać funkcję pomocniczą do losowania, jeśli będzie potrzebna często
export function getRandomElement<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}