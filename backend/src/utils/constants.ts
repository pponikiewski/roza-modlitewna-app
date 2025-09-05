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
    contemplation: '"Oto ja Służebnica Pańska, niech mi się stanie według Twego Słowa" (Łk 1,38). Tak odpowiedziała Maryja na propozycję przedstawioną Jej przez Anioła, by - przez włączenie się w zbawcze plany Boże - została Matką Mesjasza i Zbawiciela całej ludzkości. Wspieraj nas, Maryjo, abyśmy umieli podejmować zawsze Boże wezwania i świadomie współpracować w dziele zbawienia świata.',
    imageUrl: '/images/mysteries/radosna_zwiastowanie.jpg' // Przykładowa ścieżka
  },
  {
    id: 'radosna_2',
    group: 'Radosna',
    name: 'Nawiedzenie Świętej Elżbiety',
    contemplation: '"A skąd mi to, że Matka mojego Pana przychodzi do mnie?" (Łk 1,44). Te słowa wypowiedziała Elżbieta na widok Maryi wstępującej w jej dom i przynoszącej pomoc oraz samego Chrystusa i Jego błogosławieństwo. Maryjo, naucz nas nieść ludziom prawdziwą pomoc, jakiej w danej chwili potrzebują, oraz Boży pokój..',
    imageUrl: '/images/mysteries/radosna_nawiedzenie.jpg'
  },
  {
    id: 'radosna_3',
    group: 'Radosna',
    name: 'Narodzenie Pana Jezusa',
    contemplation: '"Dziś narodził się wam Zbawiciel, którym jest Mesjasz Pan" (Łk 2,11). Tymi słowami obwieszczona została światu radosna nowina: Bóg stał się człowiekiem i narodził się w ludzkiej postaci po to, aby nas zbawić, aby stworzyć każdemu człowiekowi możliwość sięgania aż do Bożej rzeczywistości. Maryjo, rodząca światu Zbawiciela, naucz nas nieustannie rozpoznawać Boga i przyjmować Go zawsze, gdy do nas przychodzi.',
    imageUrl: '/images/mysteries/radosna_narodzenie.jpg'
  },
  {
    id: 'radosna_4',
    group: 'Radosna',
    name: 'Ofiarowanie Pana Jezusa w Świątyni',
    contemplation: '"Oto ten przeznaczony jest na znak, któremu sprzeciwiać się będą" (Łk 2,34). Te prorocze słowa o Jezusie wypowiedział Symeon podczas ofiarowania w świątyni jerozolimskiej. Życie potwierdzi później ich całkowitą prawdziwość. Jedni będą wołać: "Witaj Królu", a inni będą krzyczeć: "Na Krzyż z nim". Maryjo, naucz nas rozpoznawać Chrystusa, który na zawsze pozostaje dla nas światłem rozjaśniającym mroki naszego pogańskiego myślenia i pogańskiego rozumienia życia.',
    imageUrl: '/images/mysteries/radosna_ofiarowanie.jpg'
  },
  {
    id: 'radosna_5',
    group: 'Radosna',
    name: 'Odnalezienie Pana Jezusa w Świątyni',
    contemplation: '"Dopiero po trzech dniach odnaleźli Go w świątyni" (Łk 2,46). Maryja i Józef wracali do Nazaretu z pielgrzymki do Świątyni Jerozolimskiej. Szli w przekonaniu, że Jezus jest także w grupie pielgrzymów. Dopiero po pewnym czasie spostrzegli, że Jezusa wśród powracających do Nazaretu pielgrzymów nie ma. Podjęli natychmiast poszukiwania i odnaleźli Go tam, gdzie po raz ostatni Go widzieli i z Nim byli: w Świątyni. Tam Jezus słuchał uczonych w Piśmie i zadawał im pytania. Maryjo, pomagaj nam zawsze, gdy zagubimy w życiu Chrystusa, poszukując Go skutecznie, aż do ponownego z Nim spotkania i zabrania Go znowu w naszą codzienność.',
    imageUrl: '/images/mysteries/radosna_odnalezienie.jpg'
  },
  // --- Tajemnice Światła ---
  {
    id: 'swiatla_1',
    group: 'Światła',
    name: 'Chrzest Pana Jezusa w Jordanie',
    contemplation: '"A gdy Jezus został ochrzczony... głos z nieba mówił: \'Ten jest mój Syn umiłowany, w którym mam upodobanie\'" (Mt 3,16). Janowi Chrzcicielowi przypadło zadanie bezpośredniego wskazania światu osoby Zbawiciela. Doszło więc do szczególnego spotkania Jezusa i Jana w miejscu, gdzie Jan chrzcił i przez chrzest pokuty przygotowywał naród wybrany na spotkanie z Mesjaszem. Przyjmując chrzest Janowy wszedł Jezus jeszcze pełniej w nasz ludzki świat znaczony grzechem, aby go z grzechu wyzwolić.',
    imageUrl: '/images/mysteries/swiatla_chrzest.jpg'
  },
  {
    id: 'swiatla_2',
    group: 'Światła',
    name: 'Objawienie siebie na weselu w Kanie Galilejskiej',
    contemplation: '"Odbywało się wesele w Kanie Galilejskiej i była tam Matka Jezusa. Zaproszono na to wesele także Jezusa i Jego uczniów" (J 2,2). Podczas uroczystości weselnych, w pewnym momencie spostrzegła Maryja zakłopotanie gospodarzy, bo zabrakło wina. Zwraca się więc Maryja do Syna ze słowami "Wina nie mają", a do pozostałych mówi: "Zróbcie wszystko, cokolwiek wam powie". Tu w Kanie Galilejskiej po raz pierwszy tak widocznie i czytelnie objawił Chrystus swoją Boską Moc przemieniając wodę w wino. Uczynił to na prośbę i przez wstawiennictwo swojej Matki.',
    imageUrl: '/images/mysteries/swiatla_kana.jpg'
  },
  {
    id: 'swiatla_3',
    group: 'Światła',
    name: 'Głoszenie Królestwa Bożego i wzywanie do nawrócenia',
    contemplation: '"Jezus przyszedł do Galilei i głosił tam Ewangelię Bożą. Mówił: Czas się wypełnił i bliskie jest Królestwo Boże. Nawracajcie się i wierzcie w Ewangelię" (Mk 1,14). Wypełnił się czas obietnic dotyczących przyjścia Mesjasza. Nadszedł już czas realizacji zbawienia poprzez przyjęcie ogłoszonej prawdy. Z daru zbawienia skorzystać mogą ci, którzy uwierzą w Ewangelię, nawrócą się i podejmą życie znaczone nauką i przykładem Zbawiciela, Jezusa Chrystusa.',
    imageUrl: '/images/mysteries/swiatla_gloszenie.jpg'
  },
  {
    id: 'swiatla_4',
    group: 'Światła',
    name: 'Przemienienie na Górze Tabor',
    contemplation: '"Jezus wziął ze sobą Piotra, Jana i Jakuba i wszedł na górę... Gdy się modlił, wygląd Jego twarzy odmienił się, a Jego odzienie stało się lśniąco białe... Z obłoku odezwał się głos: to jest Syn mój umiłowany, Jego słuchajcie" (Łk 9,28). Zbliżała się męka i śmierć Chrystusa, chwila wielkiej próby wiary dla apostołów i uczniów Chrystusa. Jezus wziął niektórych na górę, by tam ukazać im inny jeszcze niż ludzki wymiar swego istnienia. Apostołowie dostrzegli w przemienionym na ich oczach Chrystusie Boga i dowiedzieli się od samego Ojca, że Jezus jest Synem Bożym, którego należy słuchać.',
    imageUrl: '/images/mysteries/swiatla_przemienienie.jpg'
  },
  {
    id: 'swiatla_5',
    group: 'Światła',
    name: 'Ustanowienie Eucharystii',
    contemplation: '"To jest Ciało moje, które za was będzie wydane" (Łk 22,19). Wypowiadając te słowa w Wieczerniku Chrystus ustanowił sakrament Eucharystii, a nam polecił sprawować go na Jego pamiątkę. W taki to też sposób zrealizował Chrystus swoją obietnicę, że nie pozostawi nas samych. Pozostał z nami w eucharystycznych postaciach, byśmy się Nim karmili i zdobywali moc potrzebną nam podczas naszego pielgrzymowania i byśmy w drodze nie ustali.',
    imageUrl: '/images/mysteries/swiatla_eucharystia.jpg'
  },
  // --- Tajemnice Bolesne ---
  {
    id: 'bolesna_1',
    group: 'Bolesna',
    name: 'Modlitwa Pana Jezusa w Ogrójcu',
    contemplation: '"Ojcze mój, jeśli to możliwe, niech ominie mnie ten kielich" (Mt 26,39). Tak modlił się Chrystus w Ogrójcu na krótko przed swoją męką i śmiercią. Przywoływał też apostołów i wszystkich nas, abyśmy z Nim czuwali, bo jest to jedyne zabezpieczenie przed upadkiem w godzinie pokusy i próby. Mój Mistrzu, naucz i mnie wraz z Tobą przyjmować wolę Ojca. Tak bowiem dokonuje się zbawienie świata i moje własne.',
    imageUrl: '/images/mysteries/bolesna_ogrojec.jpg'
  },
  {
    id: 'bolesna_2',
    group: 'Bolesna',
    name: 'Biczowanie Pana Jezusa',
    contemplation: '"Piłat kazał Jezusa ubiczować" (J 19,1). Co chciał osiągnąć Piłat skazując Jezusa na dodatkowe cierpienia, jakim było biczowanie? Być może spodziewał się, że ocali Jezusa od śmierci, że widok ubiczowanego położy kres dalszym żądaniom tłumu, który domagał się Jezusowej śmierci i to śmierci krzyżowej. Tak jednak się nie stało. Przepraszam Cię, Panie Jezu, za to, że zgadzam się niekiedy na zło i cierpienie bliźnich i tłumaczę sobie, że w ten sposób mogę osiągnąć większe dobro i coś w ogóle ocalić.',
    imageUrl: '/images/mysteries/bolesna_biczowanie.jpg'
  },
  {
    id: 'bolesna_3',
    group: 'Bolesna',
    name: 'Cierniem ukoronowanie Pana Jezusa',
    contemplation: '"Ja na to przyszedłem na świat, aby dać świadectwo prawdzie" (J 18,17). Tak określił swą misję Chrystus zapytany przez Piłata, czy jest królem. Ludzie nie zrozumieli tej misji, ani Chrystusowej odpowiedzi. Poprzez ukoronowanie cierniową koroną zakpili sobie z królewskiej godności Chrystusa. Ale to jednak nie zmienia faktu. Odrzucony przez ludzi Król pozostaje nim nadal, bo to On przynosi zbuntowanej ludzkości zbawienie i pokój. Przynosi prawdę i nadzieję wiecznego życia.',
    imageUrl: '/images/mysteries/bolesna_ukoronowanie.jpg'
  },
  {
    id: 'bolesna_4',
    group: 'Bolesna',
    name: 'Dźwiganie krzyża na Kalwarię',
    contemplation: '"Jeśli kto chce iść za mną, niech weźmie swój krzyż i niech mnie naśladuje" (Mk 8,34). Te słowa Chrystusa stanowią gorące zaproszenie każdego człowieka, by krzyż swej codzienności związał z Chrystusem, z krzyżem swojego Zbawiciela. Wtedy wszystko nabiera nowego sensu i nowego znaczenia. Idę więc ze swoim krzyżem, a obok mnie idzie mój brat i moja siostra, mój bliźni i też niesie swój krzyż. Czy potrafię znaleźć się w roli Szymona z Cyreny czy Weroniki, by choć odrobinę ulgi i pomocy dać mojemu bliźniemu?',
    imageUrl: '/images/mysteries/bolesna_krzyz.jpg'
  },
  {
    id: 'bolesna_5',
    group: 'Bolesna',
    name: 'Ukrzyżowanie i śmierć Pana Jezusa',
    contemplation: '"Gdy przyszli na miejsce zwane Golgotą, ukrzyżowali tam Jezusa" (Łk 23,33). Zanim jednak nastąpił prawdziwy kres dramatu i wypowiedziane zostały przez Chrystusa ostatnie słowa: "Wykonało się", na Wzgórzu Kalwarii działo się jeszcze bardzo wiele ważnych spraw. "Ojcze przebacz im, bo nie wiedzą, co czynią" - uczył nas z Krzyża Chrystus. Do skruszonego i żałującego za swe winy współtowarzysza umierania powiedział: "Dziś będziesz ze mną w raju". Na koniec zostawił nam testament: "Niewiasto oto syn Twój" "Oto Matka twoja" i powierzył macierzyńskiej opiece Maryi całą ludzkość i każdego z nas. Panie Jezu, niech wydarzenia z Kalwarii nauczą i mnie przebaczenia oraz miłości do Twojej i mojej Matki.',
    imageUrl: '/images/mysteries/bolesna_ukrzyzowanie.jpg'
  },
  // --- Tajemnice Chwalebne ---
  {
    id: 'chwalebna_1',
    group: 'Chwalebna',
    name: 'Zmartwychwstanie Pana Jezusa',
    contemplation: '"Wtedy oświecił ich umysły, aby zrozumieli Pisma i rzekł do Nich: Tak jest napisane. Mesjasz będzie cierpiał i trzeciego dnia zmartwychwstanie, w imię Jego głoszone będzie nawrócenie i odpuszczenie grzechów wszystkim narodom" (Łk 24,45). Wydarzenia zapowiadane przez Pisma, a realizowane w życiu i przez życie Jezusa z Nazaretu, zmieniły bieg historii, a ludzkości dały nadzieję życia wiecznego. Każdy człowiek został zaproszony do uczestnictwa w Zmartwychwstaniu Chrystusa. Współuczestniczyć w Zmartwychwstaniu Chrystusa może ten, kto Go w życiu naśladuje w dźwiganiu krzyża i razem z Nim umiera. Umocnij, Panie, moje kroki na Twoich ścieżkach, abym nigdy z nich nie zszedł, ale wiernie trwał przy Tobie.',
    imageUrl: '/images/mysteries/chwalebna_zmartwychwstanie.jpg'
  },
  {
    id: 'chwalebna_2',
    group: 'Chwalebna',
    name: 'Wniebowstąpienie Pana Jezusa',
    contemplation: '"W domu Ojca mego jest mieszkań wiele. Idę przygotować wam mieszkanie" (J 14,2). Tak zapowiedział Chrystus swoje Wniebowstąpienie i jego znaczenie dla każdego z nas. Miejsce w domu Ojca jest przydzielone tym, którzy uwierzyli i rozpoznali Chrystusa w głodnym, bezdomnym, cierpiącym i udzielili Mu pomocy. Ci usłyszą: "Pójdźcie, błogosławieni Ojca mego, weźcie w posiadanie Królestwo przygotowane wam od założenia świata". Panie mój i Mistrzu, naucz mnie widzieć i słyszeć Twój głos prośby o moją pomoc wypowiadanej ludzkim głosem i poprzez ludzkie biedy.',
    imageUrl: '/images/mysteries/chwalebna_wniebowstapienie.jpg'
  },
  {
    id: 'chwalebna_3',
    group: 'Chwalebna',
    name: 'Zesłanie Ducha Świętego',
    contemplation: '"I wszyscy zostali napełnieni Duchem Świętym" (Dz 2,4). Przestraszona wydarzeniami związanymi z męką i śmiercią Chrystusa wspólnota apostołów spotykała się w ukryciu na modlitwie razem z Maryją, Matką Jezusa. Wydarzyło się coś szczególnego, co przemieniło ich serca i zmieniło ich życiowe postawy. Zaczęli odważnie głosić, że Jezus żyje, bo prawdziwie zmartwychwstał i że tylko On, Jezus jest Panem i nadzieją każdego człowieka. A wszystko to stało się dzięki darom, które otrzymali Apostołowie w dniu zesłania Ducha św. Panie ześlij Ducha św. i na nas, abyśmy umieli spełnić Twoje polecenie dzisiaj: "Będziecie mi świadkami aż po krańce świata".',
    imageUrl: '/images/mysteries/chwalebna_zeslanie.jpg'
  },
  {
    id: 'chwalebna_4',
    group: 'Chwalebna',
    name: 'Wniebowzięcie Najświętszej Maryi Panny',
    contemplation: '"Ojcze, chcę, aby także ci, których mi dałeś, byli ze mną, gdzie Ja jestem" (J 17,24). Konsekwentnie do słów wcześniej wypowiedzianych postąpił Chrystus wobec Maryi, swojej Matki, która przecież została mu dana. Była z Nim we wszystkich sprawach: w Betlejem, gdzie się rodził, w Nazarecie, gdzie wzrastał w łasce u Boga i ludzi, na Kalwarii, gdzie realizował najważniejszy etap swej misji - zbawienie świata. Przez Niepokalane Poczęcie Maryja wolna od jakiegokolwiek grzechu, uwolniona została także od długiego oczekiwania w grobie na dzień zmartwychwstania. Jej zaśnięcie, była zarazem przejściem do zmartwychwstania i pełnym wejściem do chwały z duszą i ciałem. Wielkie rzeczy uczynił Ci, Maryjo, Wszechmocny, bo byłaś Mu wierna i całkowicie oddana.',
    imageUrl: '/images/mysteries/chwalebna_wniebowziecie.jpg'
  },
  {
    id: 'chwalebna_5',
    group: 'Chwalebna',
    name: 'Ukoronowanie Najświętszej Maryi Panny na Królową Nieba i Ziemi',
    contemplation: '"Zwycięzcy dam zasiąść ze Mną na Moim tronie" (Ap 3,21). Maryja odniosła zwycięstwo. Pokonała grzech i śmierć a także ludzką słabość. W Liście św. Pawła (2 Tm 2,11) czytamy: "Jeżeliśmy bowiem z Nim współumarli, wespół też z Nim żyć będziemy. Jeśli trwamy w cierpliwości, wespół z Nim też królować będziemy". Królowanie Maryi oznacza świadczenie miłości i opieki tym, dla których stała się Matką, oraz troska o to, by nikt z odkupionych przez Jej syna nie zginął, ale doszedł do pełni życia wiecznego. Maryjo, nasza Matko i Królowo, prowadź nas bezpiecznie do Swego Syna.',
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

// NOWA STAŁA
export const MAX_ROSE_MEMBERS = 20;