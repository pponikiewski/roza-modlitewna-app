// backend/src/constants.ts (lub backend/src/utils/constants.ts)

export interface RosaryMystery {
  id: string;
  group: string;
  name: string;
  contemplation: string;
  imageUrl?: string; // NOWE POLE: opcjonalna ścieżka do obrazka/grafiki
}

export const ROSARY_MYSTERIES: RosaryMystery[] = [
  // --- Tajemnice Radosne ---
  {
    id: 'radosna_1',
    group: 'Radosna',
    name: 'Zwiastowanie Najświętszej Maryi Pannie',
    contemplation: 'Rozważamy, jak Archanioł Gabriel zwiastował Maryi...',
    imageUrl: '/images/mysteries/radosna_zwiastowanie.jpg' // Przykładowa ścieżka
  },
  {
    id: 'radosna_2',
    group: 'Radosna',
    name: 'Nawiedzenie Świętej Elżbiety',
    contemplation: 'Rozważamy, jak Maryja poszła odwiedzić swoją krewną Elżbietę...',
    imageUrl: '/images/mysteries/radosna_nawiedzenie.jpg'
  },
  {
    id: 'radosna_3',
    group: 'Radosna',
    name: 'Narodzenie Pana Jezusa',
    contemplation: 'Rozważamy, jak Jezus narodził się w ubogiej stajence...',
    imageUrl: '/images/mysteries/radosna_narodzenie.jpg'
  },
  {
    id: 'radosna_4',
    group: 'Radosna',
    name: 'Ofiarowanie Pana Jezusa w Świątyni',
    contemplation: 'Rozważamy, jak Maryja i Józef ofiarowali Jezusa w świątyni...',
    imageUrl: '/images/mysteries/radosna_ofiarowanie.jpg'
  },
  {
    id: 'radosna_5',
    group: 'Radosna',
    name: 'Odnalezienie Pana Jezusa w Świątyni',
    contemplation: 'Rozważamy, jak Jezus po trzech dniach został odnaleziony...',
    imageUrl: '/images/mysteries/radosna_odnalezienie.jpg'
  },
  // --- Tajemnice Światła ---
  {
    id: 'swiatla_1',
    group: 'Światła',
    name: 'Chrzest Pana Jezusa w Jordanie',
    contemplation: 'Rozważamy, jak Jezus przyjął chrzest od Jana w Jordanie...',
    imageUrl: '/images/mysteries/swiatla_chrzest.jpg'
  },
  {
    id: 'swiatla_2',
    group: 'Światła',
    name: 'Objawienie siebie na weselu w Kanie Galilejskiej',
    contemplation: 'Rozważamy, jak Jezus na prośbę Maryi dokonał pierwszego cudu...',
    imageUrl: '/images/mysteries/swiatla_kana.jpg'
  },
  {
    id: 'swiatla_3',
    group: 'Światła',
    name: 'Głoszenie Królestwa Bożego i wzywanie do nawrócenia',
    contemplation: 'Rozważamy, jak Jezus głosił Dobrą Nowinę o Królestwie Bożym...',
    imageUrl: '/images/mysteries/swiatla_gloszenie.jpg'
  },
  {
    id: 'swiatla_4',
    group: 'Światła',
    name: 'Przemienienie na Górze Tabor',
    contemplation: 'Rozważamy, jak Jezus przemienił się na górze Tabor...',
    imageUrl: '/images/mysteries/swiatla_przemienienie.jpg'
  },
  {
    id: 'swiatla_5',
    group: 'Światła',
    name: 'Ustanowienie Eucharystii',
    contemplation: 'Rozważamy, jak Jezus podczas Ostatniej Wieczerzy ustanowił Eucharystię...',
    imageUrl: '/images/mysteries/swiatla_eucharystia.jpg'
  },
  // --- Tajemnice Bolesne ---
  {
    id: 'bolesna_1',
    group: 'Bolesna',
    name: 'Modlitwa Pana Jezusa w Ogrójcu',
    contemplation: 'Rozważamy, jak Jezus modlił się w Ogrójcu...',
    imageUrl: '/images/mysteries/bolesna_ogrojec.jpg'
  },
  {
    id: 'bolesna_2',
    group: 'Bolesna',
    name: 'Biczowanie Pana Jezusa',
    contemplation: 'Rozważamy, jak Jezus został okrutnie ubiczowany...',
    imageUrl: '/images/mysteries/bolesna_biczowanie.jpg'
  },
  {
    id: 'bolesna_3',
    group: 'Bolesna',
    name: 'Cierniem ukoronowanie Pana Jezusa',
    contemplation: 'Rozważamy, jak żołnierze nałożyli na głowę Jezusa koronę...',
    imageUrl: '/images/mysteries/bolesna_ukoronowanie.jpg'
  },
  {
    id: 'bolesna_4',
    group: 'Bolesna',
    name: 'Dźwiganie krzyża na Kalwarię',
    contemplation: 'Rozważamy, jak Jezus niósł ciężki krzyż na Kalwarię...',
    imageUrl: '/images/mysteries/bolesna_krzyz.jpg'
  },
  {
    id: 'bolesna_5',
    group: 'Bolesna',
    name: 'Ukrzyżowanie i śmierć Pana Jezusa',
    contemplation: 'Rozważamy, jak Jezus został przybity do krzyża i umarł...',
    imageUrl: '/images/mysteries/bolesna_ukrzyzowanie.jpg'
  },
  // --- Tajemnice Chwalebne ---
  {
    id: 'chwalebna_1',
    group: 'Chwalebna',
    name: 'Zmartwychwstanie Pana Jezusa',
    contemplation: 'Rozważamy, jak Jezus trzeciego dnia zmartwychwstał...',
    imageUrl: '/images/mysteries/chwalebna_zmartwychwstanie.jpg'
  },
  {
    id: 'chwalebna_2',
    group: 'Chwalebna',
    name: 'Wniebowstąpienie Pana Jezusa',
    contemplation: 'Rozważamy, jak Jezus wstąpił do nieba...',
    imageUrl: '/images/mysteries/chwalebna_wniebowstapienie.jpg'
  },
  {
    id: 'chwalebna_3',
    group: 'Chwalebna',
    name: 'Zesłanie Ducha Świętego',
    contemplation: 'Rozważamy, jak Duch Święty zstąpił na Apostołów...',
    imageUrl: '/images/mysteries/chwalebna_zeslanie.jpg'
  },
  {
    id: 'chwalebna_4',
    group: 'Chwalebna',
    name: 'Wniebowzięcie Najświętszej Maryi Panny',
    contemplation: 'Rozważamy, jak Maryja z ciałem i duszą została wzięta...',
    imageUrl: '/images/mysteries/chwalebna_wniebowziecie.jpg'
  },
  {
    id: 'chwalebna_5',
    group: 'Chwalebna',
    name: 'Ukoronowanie Najświętszej Maryi Panny na Królową Nieba i Ziemi',
    contemplation: 'Rozważamy, jak Maryja została ukoronowana w niebie...',
    imageUrl: '/images/mysteries/chwalebna_ukoronowanie.jpg'
  }
];

// Funkcje pomocnicze pozostają bez zmian
export function getRandomElement<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export function findMysteryById(id: string): RosaryMystery | undefined {
  return ROSARY_MYSTERIES.find(mystery => mystery.id === id);
}