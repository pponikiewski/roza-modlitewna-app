# API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication

Wszystkie chronione endpointy wymagają JWT token w header:
```
Authorization: Bearer <token>
```

## Endpoints

### 🔐 Authentication (`/auth`)

#### POST `/auth/register`
Rejestracja nowego użytkownika
```json
{
  "name": "Jan Kowalski",
  "email": "jan@example.com", 
  "password": "password123"
}
```

#### POST `/auth/login`
Logowanie użytkownika
```json
{
  "email": "jan@example.com",
  "password": "password123"
}
```

### 👤 User Management (`/users`)

#### GET `/users`
Lista wszystkich użytkowników (tylko Admin)

### 👥 Member Operations (`/me/memberships`)

#### GET `/me/memberships`
Lista członkostw zalogowanego użytkownika

#### PATCH `/me/memberships/:membershipId/confirm-mystery`
Potwierdzenie odmówienia tajemnicy

#### GET `/me/memberships/:membershipId/mystery-history`
Historia tajemnic dla członkostwa

### 🙏 Intentions (`/me/intentions`)

#### GET `/me/intentions`
Lista intencji użytkownika

#### POST `/me/intentions`
Dodanie nowej intencji

#### PUT `/me/intentions/:id`
Edycja intencji

#### DELETE `/me/intentions/:id`
Usunięcie intencji

### ⭐ Zelator Operations (`/zelator`)

#### GET `/zelator/managed-roses`
Lista róż zarządzanych przez zelatora

#### POST `/zelator/roses`
Tworzenie nowej róży

#### GET `/zelator/roses/:roseId`
Szczegóły róży

#### PUT `/zelator/roses/:roseId`
Edycja róży

#### DELETE `/zelator/roses/:roseId`
Usunięcie róży

#### POST `/zelator/roses/:roseId/members`
Dodanie członka do róży

#### DELETE `/zelator/roses/:roseId/members/:membershipId`
Usunięcie członka z róży

### ⚙️ Admin Operations (`/admin`)

#### GET `/admin/users`
Lista wszystkich użytkowników

#### PUT `/admin/users/:id/role`
Zmiana roli użytkownika

#### DELETE `/admin/users/:id`
Usunięcie użytkownika

#### GET `/admin/roses`
Lista wszystkich róż

#### DELETE `/admin/roses/:id`
Usunięcie róży

## Response Formats

### Success Response
```json
{
  "data": {...},
  "message": "Success message"
}
```

### Error Response  
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
