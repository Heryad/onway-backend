# Admin API

> Authentication & Management Endpoints

---

## Topics

- [Authentication](#authentication)
  - [Login](#post-login)
  - [Refresh Token](#post-refresh)
  - [Get Profile](#get-me-)
  - [Logout](#post-logout-)
- [Admin Management](#admin-management)
  - [List Admins](#get--)
  - [Get Admin](#get-id-)
  - [Create Admin](#post--1)
  - [Update Admin](#put-id-)
  - [Delete Admin](#delete-id-)
  - [Toggle Status](#patch-idtoggle-status-)
- [Roles & Permissions](#roles--permissions)
- [Error Codes](#error-codes)

---

## Authentication

**Base URL:** `/api/v1/admin/auth`

---

### POST `/login`

Authenticate admin and receive tokens.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "superadmin",
      "email": "admin@example.com",
      "avatar": null,
      "role": "owner",
      "countryId": null,
      "cityId": null,
      "isActive": true,
      "lastLogin": "2025-12-25T12:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-25T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### POST `/refresh`

Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### GET `/me` 🔒

Get authenticated admin profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin profile retrieved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "superadmin",
    "email": "admin@example.com",
    "avatar": null,
    "role": "owner",
    "countryId": null,
    "cityId": null,
    "isActive": true,
    "lastLogin": "2025-12-25T12:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-25T12:00:00.000Z"
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### POST `/logout` 🔒

Logout admin.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

## Admin Management

**Base URL:** `/api/v1/admin/admins`

**Access:** Requires `owner`, `country_admin`, or `city_admin` role with geographic scope enforcement.

---

### GET `/` 🔒

List admins (filtered by requester's scope).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| search | string | Search username |
| role | string | Filter by role |
| isActive | boolean | Filter by status |
| countryId | uuid | Filter by country |
| cityId | uuid | Filter by city |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 20) |
| sortBy | string | `createdAt`, `username`, `email` |
| sortOrder | string | `asc`, `desc` |

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "cityadmin1",
      "email": "cityadmin@example.com",
      "avatar": null,
      "role": "city_admin",
      "countryId": "660e8400-e29b-41d4-a716-446655440000",
      "cityId": "770e8400-e29b-41d4-a716-446655440000",
      "isActive": true,
      "country": { "id": "...", "name": "UAE" },
      "city": { "id": "...", "name": "Dubai" }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### GET `/:id` 🔒

Get admin by ID.

**Response (200):**
```json
{
  "success": true,
  "message": "Admin retrieved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "cityadmin1",
    "email": "cityadmin@example.com",
    "role": "city_admin",
    "countryId": "660e8400-e29b-41d4-a716-446655440000",
    "cityId": "770e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "country": { "id": "...", "name": "UAE" },
    "city": { "id": "...", "name": "Dubai" }
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### POST `/` 🔒

Create admin.

**Request:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword123",
  "role": "city_admin",
  "countryId": "660e8400-e29b-41d4-a716-446655440000",
  "cityId": "770e8400-e29b-41d4-a716-446655440000",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| username | Required, 3-100 chars, unique |
| email | Required, valid email, unique |
| password | Required, min 8 chars |
| role | Required: `owner`, `country_admin`, `city_admin`, `finance`, `support`, `operator` |
| countryId | Optional, UUID |
| cityId | Optional, UUID |
| avatar | Optional, URL |

**Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "username": "newadmin",
    "email": "newadmin@example.com",
    "role": "city_admin",
    "isActive": true
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Cannot create admin with role 'owner'",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (409):**
```json
{
  "success": false,
  "message": "Email already in use",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### PUT `/:id` 🔒

Update admin.

**Request:**
```json
{
  "username": "updatedname",
  "email": "updated@example.com",
  "role": "support",
  "isActive": true
}
```

All fields optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "updatedname",
    "email": "updated@example.com",
    "role": "support"
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### DELETE `/:id` 🔒

Delete admin.

**Response (200):**
```json
{
  "success": true,
  "message": "Admin deleted successfully",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete your own account",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### PATCH `/:id/toggle-status` 🔒

Toggle admin active status.

**Response (200):**
```json
{
  "success": true,
  "message": "Admin deactivated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": false
  },
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

## Roles & Permissions

| Role | Level | Scope |
|------|-------|-------|
| `owner` | 100 | Global - all operations |
| `country_admin` | 80 | Country - manages their country |
| `city_admin` | 60 | City - manages their city |
| `finance` | 40 | Financial operations only |
| `support` | 30 | Customer support only |
| `operator` | 20 | Basic operations only |

**Hierarchy Rule:** Admin can only manage roles with lower level than their own.

**Geographic Rule:** 
- `owner` → Global access
- `country_admin` → Their country only
- `city_admin` → Their city only

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Server Error |

---

🔒 = Requires `Authorization: Bearer <token>` header
