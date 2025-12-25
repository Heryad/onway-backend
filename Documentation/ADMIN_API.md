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
- [Countries](#countries)
  - [List Countries](#get---1)
  - [Get Country](#get-id--1)
  - [Create Country](#post---1)
  - [Update Country](#put-id--1)
  - [Delete Country](#delete-id--1)
- [Cities](#cities)
  - [List Cities](#get---2)
  - [Get City](#get-id--2)
  - [Create City](#post---2)
  - [Update City](#put-id--2)
  - [Delete City](#delete-id--2)
- [City Zones](#city-zones)
  - [List Zones](#get---3)
  - [Get Zone](#get-id--3)
  - [Create Zone](#post---3)
  - [Update Zone](#put-id--3)
  - [Delete Zone](#delete-id--3)
- [Categories](#categories)
  - [List Categories](#get---4)
  - [Create Category](#post---4)
  - [Update Category](#put-id--4)
  - [Delete Category](#delete-id--4)
- [Sections](#sections)
  - [List Sections](#get---5)
  - [Create Section](#post---5)
  - [Update Section](#put-id--5)
  - [Delete Section](#delete-id--5)
- [Banners](#banners)
  - [List Banners](#get---6)
  - [Create Banner](#post---6)
  - [Update Banner](#put-id--6)
  - [Delete Banner](#delete-id--6)
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

## Countries

**Base URL:** `/api/v1/admin/countries`

**Access:** `owner` only (countries are global)

---

### GET `/` 🔒

List all countries.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name |
| isActive | boolean | Filter by status |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |
| sortOrder | string | `asc`, `desc` |

**Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": { "en": "UAE", "ar": "الإمارات" },
      "phoneCode": "+971",
      "currency": "Dirham",
      "currencyCode": "AED",
      "currencySymbol": "د.إ",
      "avatar": "https://example.com/uae.png",
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 5 }
}
```

---

### GET `/:id` 🔒

Get country by ID.

---

### POST `/` 🔒

Create country.

**Request:**
```json
{
  "name": { "en": "UAE", "ar": "الإمارات" },
  "phoneCode": "+971",
  "currency": "Dirham",
  "currencyCode": "AED",
  "currencySymbol": "د.إ",
  "avatar": "https://example.com/uae.png"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| name | Required, object with language keys |
| phoneCode | Required, max 10 chars |
| currency | Required, max 50 chars |
| currencyCode | Required, max 10 chars |
| currencySymbol | Required, max 10 chars |
| avatar | Optional, URL |

---

### PUT `/:id` 🔒

Update country. All fields optional.

---

### DELETE `/:id` 🔒

Delete country.

---

### PATCH `/:id/toggle-status` 🔒

Toggle country active status.

---

## Cities

**Base URL:** `/api/v1/admin/cities`

**Access:** `owner`, `country_admin` (filtered by their country)

---

### GET `/` 🔒

List cities.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| countryId | uuid | Filter by country |
| search | string | Search by name |
| isActive | boolean | Filter by status |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": { "en": "Dubai", "ar": "دبي" },
      "countryId": "660e8400-e29b-41d4-a716-446655440000",
      "baseDeliveryFee": "10.00",
      "primeDeliveryFee": "5.00",
      "freeDeliveryThreshold": "100.00",
      "serviceFee": "2.00",
      "taxRate": "5.00",
      "timezone": "Asia/Dubai",
      "isActive": true,
      "country": { "id": "...", "name": { "en": "UAE" } }
    }
  ]
}
```

---

### GET `/:id` 🔒

Get city by ID.

---

### POST `/` 🔒

Create city.

**Request:**
```json
{
  "name": { "en": "Dubai", "ar": "دبي" },
  "countryId": "660e8400-e29b-41d4-a716-446655440000",
  "baseDeliveryFee": "10.00",
  "primeDeliveryFee": "5.00",
  "freeDeliveryThreshold": "100.00",
  "serviceFee": "2.00",
  "taxRate": "5.00",
  "timezone": "Asia/Dubai",
  "geoBounds": [[25.0, 55.0], [25.3, 55.3], [25.1, 55.1]]
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| name | Required, object with language keys |
| countryId | Required, UUID |
| baseDeliveryFee | Optional, decimal string |
| primeDeliveryFee | Optional, decimal string |
| serviceFee | Optional, decimal string |
| taxRate | Optional, decimal string (percentage) |
| timezone | Optional, string |
| geoBounds | Optional, array of [lat, lng] coordinates |

---

### PUT `/:id` 🔒

Update city. All fields optional except `countryId` cannot be changed.

---

### DELETE `/:id` 🔒

Delete city.

---

### PATCH `/:id/toggle-status` 🔒

Toggle city active status.

---

## City Zones

**Base URL:** `/api/v1/admin/city-zones`

**Access:** `owner`, `country_admin`, `city_admin` (filtered by their city)

---

### GET `/` 🔒

List city zones.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| cityId | uuid | Filter by city (required for non-owners) |
| isActive | boolean | Filter by status |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "name": "Marina Area",
      "cityId": "770e8400-e29b-41d4-a716-446655440000",
      "extraDeliveryFee": "5.00",
      "geoPolygon": [[25.0, 55.0], [25.1, 55.1], [25.0, 55.1]],
      "isActive": true,
      "city": { "id": "...", "name": { "en": "Dubai" } }
    }
  ]
}
```

---

### GET `/:id` 🔒

Get zone by ID.

---

### POST `/` 🔒

Create city zone.

**Request:**
```json
{
  "name": "Marina Area",
  "cityId": "770e8400-e29b-41d4-a716-446655440000",
  "extraDeliveryFee": "5.00",
  "geoPolygon": [[25.0, 55.0], [25.1, 55.1], [25.0, 55.1]]
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| name | Required, max 255 chars |
| cityId | Required, UUID |
| extraDeliveryFee | Optional, decimal string |
| geoPolygon | Required, array of min 3 [lat, lng] coordinates |

---

### PUT `/:id` 🔒

Update zone. All fields optional except `cityId` cannot be changed.

---

### DELETE `/:id` 🔒

Delete zone.

---

### PATCH `/:id/toggle-status` 🔒

Toggle zone active status.

---

## Categories

**Base URL:** `/api/v1/admin/categories`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List categories.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| cityId | uuid | Filter by city |
| countryId | uuid | Filter by country |
| search | string | Search by name |
| isActive | boolean | Filter by status |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |
| sortOrder | string | `asc`, `desc` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": { "en": "Restaurants", "ar": "مطاعم" },
      "description": { "en": "Food delivery", "ar": "توصيل الطعام" },
      "avatar": "https://example.com/restaurant.png",
      "sorting": 1,
      "cityId": "...",
      "countryId": "...",
      "isActive": true
    }
  ]
}
```

---

### POST `/` 🔒

Create category.

**Request:**
```json
{
  "name": { "en": "Restaurants", "ar": "مطاعم" },
  "description": { "en": "Food delivery" },
  "avatar": "https://example.com/restaurant.png",
  "sorting": 1,
  "cityId": "...",
  "countryId": "..."
}
```

---

### PUT `/:id` 🔒

Update category.

---

### DELETE `/:id` 🔒

Delete category.

---

### PATCH `/:id/toggle-status` 🔒

Toggle category status.

---

## Sections

**Base URL:** `/api/v1/admin/sections`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List sections.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| cityId | uuid | Filter by city |
| countryId | uuid | Filter by country |
| search | string | Search by name |
| isActive | boolean | Filter by status |
| comingSoon | boolean | Filter coming soon |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": { "en": "Food Delivery", "ar": "توصيل الطعام" },
      "description": { "en": "Order food from restaurants" },
      "avatar": "https://example.com/food.png",
      "sorting": 1,
      "comingSoon": false,
      "cityId": "...",
      "isActive": true
    },
    {
      "id": "...",
      "name": { "en": "Grocery", "ar": "بقالة" },
      "description": { "en": "Fresh groceries delivered" },
      "avatar": "https://example.com/grocery.png",
      "sorting": 2,
      "comingSoon": false,
      "isActive": true
    },
    {
      "id": "...",
      "name": { "en": "Taxi", "ar": "تاكسي" },
      "description": { "en": "Book a ride" },
      "avatar": "https://example.com/taxi.png",
      "sorting": 3,
      "comingSoon": true,
      "isActive": true
    }
  ]
}
```

---

### POST `/` 🔒

Create section.

**Request:**
```json
{
  "name": { "en": "Food Delivery", "ar": "توصيل الطعام" },
  "description": { "en": "Order food from restaurants" },
  "avatar": "https://example.com/food.png",
  "sorting": 1,
  "comingSoon": false,
  "cityId": "...",
  "countryId": "..."
}
```

---

### PUT `/:id` 🔒

Update section.

---

### DELETE `/:id` 🔒

Delete section.

---

### PATCH `/:id/toggle-status` 🔒

Toggle section status.

---

## Banners

**Base URL:** `/api/v1/admin/banners`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List banners.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| cityId | uuid | Filter by city |
| countryId | uuid | Filter by country |
| type | enum | `view`, `clickable`, `url` |
| isActive | boolean | Filter by status |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "thumbnail": "https://example.com/banner.jpg",
      "sorting": 1,
      "type": "clickable",
      "clickUrl": null,
      "storeId": "...",
      "impressions": 1500,
      "clicks": 120,
      "startsAt": "2025-01-01T00:00:00Z",
      "expiresAt": "2025-01-31T23:59:59Z",
      "isActive": true,
      "store": { "id": "...", "name": { "en": "Pizza Place" } }
    }
  ]
}
```

---

### POST `/` 🔒

Create banner.

**Request:**
```json
{
  "thumbnail": "https://example.com/banner.jpg",
  "sorting": 1,
  "type": "clickable",
  "storeId": "...",
  "cityId": "...",
  "countryId": "...",
  "startsAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-31T23:59:59Z"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| thumbnail | Required, URL |
| type | `view` (display only), `clickable` (opens store), `url` (external link) |
| clickUrl | Required for `url` type |
| storeId | Required for `clickable` type |
| startsAt | Optional, ISO datetime |
| expiresAt | Optional, ISO datetime |

---

### PUT `/:id` 🔒

Update banner.

---

### DELETE `/:id` 🔒

Delete banner.

---

### PATCH `/:id/toggle-status` 🔒

Toggle banner status.

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
