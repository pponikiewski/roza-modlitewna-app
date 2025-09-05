# Róża Modlitewna App

Aplikacja webowa do zarządzania różami modlitebnymi - wspólnotami modlitewnymi organizującymi cykliczne odmawianie różańca.

## 📋 Opis Projektu

Róża Modlitewna to aplikacja umożliwiająca:
- Tworzenie i zarządzanie różami modlitebnymi
- Przypisywanie członków do tajemnic różańca
- Śledzenie postępów modlitw
- Zarządzanie intencjami modlitewnymi
- Panel administracyjny i panel zelatora

## 🏗️ Architektura

Projekt składa się z dwóch głównych części:

### Backend (Node.js + TypeScript + Express + Prisma)
- **Port**: 3001
- **Database**: PostgreSQL z Prisma ORM
- **Autoryzacja**: JWT tokens
- **API**: RESTful endpoints

### Frontend (React + TypeScript + Vite + Tailwind CSS)
- **Port**: 3000+ (auto-assign)
- **Framework**: React 19 z TypeScript
- **Styling**: Tailwind CSS
- **Bundler**: Vite
- **State Management**: Context API

## 🚀 Uruchomienie Projektu

### Wymagania
- Node.js 18+
- PostgreSQL
- npm lub yarn

### Instalacja

1. **Klonowanie repozytorium**
```bash
git clone <repository-url>
cd roza-modlitewna-app
```

2. **Instalacja dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Konfiguracja bazy danych**
```bash
cd backend
# Skopiuj .env.example do .env i skonfiguruj
# Uruchom migracje
npm run migrate
```

4. **Uruchomienie aplikacji**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📁 Struktura Projektu

```
roza-modlitewna-app/
├── backend/                 # Serwer API
│   ├── prisma/             # Schema bazy danych i migracje
│   ├── src/                # Kod źródłowy backendu
│   │   ├── auth/           # Autoryzacja i middleware
│   │   ├── admin/          # Endpointy administracyjne
│   │   ├── zelator/        # Endpointy zelatora
│   │   ├── member/         # Endpointy członków
│   │   ├── intentions/     # Zarządzanie intencjami
│   │   ├── services/       # Logika biznesowa
│   │   └── types/          # Definicje typów TypeScript
│   └── package.json
├── frontend/               # Aplikacja React
│   ├── public/            # Statyczne pliki
│   ├── src/               # Kod źródłowy frontendu
│   │   ├── components/    # Komponenty wielokrotnego użytku
│   │   ├── contexts/      # Context API providers
│   │   ├── pages/         # Komponenty stron
│   │   ├── services/      # API calls i usługi
│   │   ├── types/         # Definicje typów TypeScript
│   │   └── utils/         # Funkcje pomocnicze
│   └── package.json
├── docs/                  # Dokumentacja projektu
├── tests/                 # Kompleksowy zestaw testów
│   ├── backend/              # Testy backendu
│   │   ├── auth.test.js         # Testy autentykacji (JS)
│   │   └── api.test.ts          # Testy API endpoints (TS)
│   ├── frontend/             # Testy frontendu
│   │   └── components.test.ts   # Testy komponentów React
│   ├── integration/          # Testy integracyjne
│   │   └── system.test.ts       # Testy całego systemu
│   ├── performance/          # Testy wydajności
│   │   └── performance.test.ts  # Testy obciążeniowe
│   ├── package.json          # Konfiguracja testów
│   ├── README.md             # Dokumentacja testów
│   └── run-tests.js          # Runner testów
└── README.md             # Ten plik
```

## 🔧 Skrypty NPM

### Backend
- `npm run dev` - Uruchomienie w trybie deweloperskim
- `npm run build` - Budowanie dla produkcji
- `npm run start` - Uruchomienie produkcji
- `npm run migrate` - Uruchomienie migracji bazy danych

### Frontend
- `npm run dev` - Uruchomienie serwera deweloperskiego
- `npm run build` - Budowanie dla produkcji
- `npm run preview` - Podgląd buildu produkcyjnego
- `npm run lint` - Sprawdzenie kodu ESLintem

### Testy
- `cd tests && node test-overview.js` - Przegląd dostępnych testów
- `cd tests && node backend/auth.test.js` - Testy autentykacji
- `cd tests && node run-tests.js` - Uruchomienie wszystkich testów
- `cd tests && npm test` - Uruchomienie testów z Jest (po instalacji)

## 🧪 Testowanie

Projekt zawiera kompleksowy zestaw testów obejmujący:

### Backend Tests
- **Autentykacja** (8 testów): Rejestracja, logowanie, walidacja
- **API Endpoints** (17 testów): REST API, autoryzacja, obsługa błędów

### Frontend Tests  
- **Komponenty React** (7 testów): State management, formularze, lifecycle

### Integration Tests
- **System** (7 testów): End-to-end workflows, integralność danych

### Performance Tests
- **Wydajność** (15 testów): Czasy odpowiedzi, zużycie pamięci, testy obciążeniowe

**Szybki start z testami:**
```bash
cd tests
node test-overview.js    # Przegląd testów
node backend/auth.test.js # Uruchom testy autentykacji
```

Więcej informacji w [`tests/README.md`](tests/README.md)

## 🔑 Zmienne Środowiskowe

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/roza_modlitewna"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:3001"
```

## 👥 Role Użytkowników

1. **Member** - Podstawowy członek róży
2. **Zelator** - Zarządza różą modlitewną
3. **Admin** - Pełne uprawnienia administracyjne

## 🔐 Autoryzacja

Aplikacja używa JWT (JSON Web Tokens) do autoryzacji:
- Tokeny są przechowywane w localStorage
- Automatyczne odświeżanie sesji
- Middleware autoryzacyjny na backendzie

## 🎯 Główne Funkcjonalności

- **Zarządzanie różami**: Tworzenie, edycja, usuwanie
- **Członkowie**: Przypisywanie do tajemnic, śledzenie postępów
- **Intencje**: Dodawanie i zarządzanie intencjami modlitewnymi
- **Harmonogram**: Automatyczne przełączanie tajemnic
- **Powiadomienia**: System powiadomień dla użytkowników
- **Panel admina**: Zarządzanie użytkownikami i różami

## 🚀 Deployment

[Instrukcje deployment będą dodane później]

## 📄 Licencja

[Licencja do określenia]

## 🤝 Contributing

[Wytyczne dla kontrybutorów do dodania]
