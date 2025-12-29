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
- [Users](#users)
  - [List Users](#get---11)
  - [Get User](#get-id--11)
  - [Update User](#put-id--11)
  - [Toggle Status](#patch-idtoggle-status-2)
  - [Get Addresses](#get-idaddresses)
- [Orders](#orders)
  - [List Orders](#get---12)
  - [Get Order](#get-id--12)
  - [Update Status](#patch-idstatus)
  - [Cancel Order](#post-idcancel)
  - [Assign Driver](#post-idassign-driver)
  - [Initiate Refund](#post-idrefund)
- [Promo Codes](#promo-codes)
  - [List Promo Codes](#get---13)
  - [Create Promo Code](#post---13)
  - [Update Promo Code](#put-id--13)
  - [Toggle Status](#patch-idtoggle-status-3)
- [Promotions](#promotions)
  - [List Promotions](#get---14)
  - [Create Promotion](#post---14)
  - [Manage Stores](#post-idstores)
- [Support Tickets](#support-tickets)
  - [List Tickets](#get---15)
  - [Get Ticket](#get-id--15)
  - [Update Status](#patch-idstatus-2)
  - [Assign Admin](#patch-idassign)
  - [Reply to Ticket](#post-idmessages)
- [Reviews](#reviews)
  - [List Reviews](#get---16)
  - [Approve Review](#patch-idapprove)
  - [Reject Review](#patch-idreject)
  - [Delete Review](#delete-id--16)
- [Stories](#stories)
  - [List Stories](#get---17)
  - [Create Story](#post---17)
  - [Update Story](#put-id--17)
  - [Delete Story](#delete-id--17)
- [Settings](#settings)
  - [Get Global](#get-global)
  - [Get Current Scope](#get-current)
  - [List All](#get---18)
  - [Create](#post---18)
  - [Update](#put-id--18)
- [Payments](#payments)
  - [Payment Options](#get-options)
  - [List Payments](#get---19)
  - [Get Payment](#get-id--19)
  - [Payment Stats](#get-stats)
  - [Transactions](#get-transactions)
- [Notifications](#notifications)
  - [Send](#post-send)
  - [Broadcast](#post-broadcast)
- [Upload Media](#upload-media)
  - [Upload File](#post--21)
- [Audit Logs](#audit-logs)
  - [List Logs](#get---20)
  - [Get Log](#get-id--20)
  - [Record History](#get-recordtablerecordid)
  - [Admin Activity](#get-adminadminid)
- [Stores](#stores)
  - [List Stores](#get---7)
  - [Get Store](#get-id--7)
  - [Create Store](#post---7)
  - [Update Store](#put-id--7)
  - [Delete Store](#delete-id--7)
  - [Reset Password](#post-idreset-password-)
  - [Add Auth User](#post-idauth-users-)
  - [Remove Auth User](#delete-idauth-usersauthid-)
- [Store Category Assignments](#store-category-assignments)
  - [Get Store Categories](#get-storestoreid-)
  - [Assign Category](#post-storestoreid-)
  - [Remove Category](#delete-storestoreidcategorycategoryid-)
  - [Replace All Categories](#put-storestoreid-)
- [Store Menu Categories](#store-menu-categories)
  - [List Menu Categories](#get-storestoreid--1)
  - [Create Menu Category](#post-storestoreid--1)
  - [Update Menu Category](#put-id--8)
  - [Delete Menu Category](#delete-id--8)
- [Store Items](#store-items)
  - [List Items](#get-storestoreid--2)
  - [Create Item](#post-storestoreid--2)
  - [Update Item](#put-id--9)
  - [Delete Item](#delete-id--9)
- [Store Item Addons](#store-item-addons)
  - [List Addons](#get-itemitemid-)
  - [Create Addon](#post-itemitemid-)
  - [Update Addon](#put-id--10)
  - [Delete Addon](#delete-id--10)
- [Store Payouts](#store-payouts)
  - [List Payouts](#get---8)
  - [Preview Stats](#get-statspreview)
  - [Generate Payout](#post-generate)
  - [Process Payout](#patch-idprocess)
- [Drivers](#drivers)
  - [List Drivers](#get---9)
  - [Create Driver](#post---9)
  - [Update Driver](#put-id--11)
  - [Toggle Status](#patch-idtoggle-status-1)
  - [Reset Password](#post-idreset-password-1)
- [Driver Payouts](#driver-payouts)
  - [List Payouts](#get---10)
  - [Generate Payout](#post-generate-1)
  - [Process Payout](#patch-idprocess-1)
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

**Access:** 
- **List/View/Update/Toggle Status**: `owner`, `country_admin` (country admins can only access their assigned country)
- **Create/Delete**: `owner` only

---

### GET `/` 🔒

List countries.

**Access:** `owner` (all countries), `country_admin` (their assigned country only)

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
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-25T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 5 }
}
```

**Note:** Country admins will only see their assigned country in the list.

---

### GET `/:id` 🔒

Get country by ID.

**Access:** `owner` (any country), `country_admin` (their assigned country only)

**Response (200):**
```json
{
  "success": true,
  "message": "Country retrieved",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "UAE", "ar": "الإمارات" },
    "phoneCode": "+971",
    "currency": "Dirham",
    "currencyCode": "AED",
    "currencySymbol": "د.إ",
    "avatar": "https://example.com/uae.png",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this country",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

*Country admins receive 403 if attempting to access a country other than their assigned one.*

---

### POST `/` 🔒

Create country.

**Access:** `owner` only

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

**Response (201):**
```json
{
  "success": true,
  "message": "Country created successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "UAE", "ar": "الإمارات" },
    "phoneCode": "+971",
    "currency": "Dirham",
    "currencyCode": "AED",
    "currencySymbol": "د.إ",
    "avatar": "https://example.com/uae.png",
    "isActive": true
  }
}
```

---

### PUT `/:id` 🔒

Update country.

**Access:** `owner` (any country), `country_admin` (their assigned country only)

**Request:**
```json
{
  "name": { "en": "United Arab Emirates", "ar": "الإمارات العربية المتحدة" },
  "phoneCode": "+971",
  "currency": "Dirham",
  "currencyCode": "AED",
  "currencySymbol": "د.إ",
  "avatar": "https://example.com/uae-updated.png",
  "isActive": true
}
```

All fields optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Country updated successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "United Arab Emirates", "ar": "الإمارات العربية المتحدة" },
    "phoneCode": "+971",
    "currency": "Dirham",
    "currencyCode": "AED",
    "currencySymbol": "د.إ",
    "avatar": "https://example.com/uae-updated.png",
    "isActive": true,
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this country",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### DELETE `/:id` 🔒

Delete country.

**Access:** `owner` only

**Response (200):**
```json
{
  "success": true,
  "message": "Country deleted successfully",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Country not found",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### PATCH `/:id/toggle-status` 🔒

Toggle country active status.

**Access:** `owner` (any country), `country_admin` (their assigned country only)

**Response (200):**
```json
{
  "success": true,
  "message": "Country activated successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this country",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

## Cities

**Base URL:** `/api/v1/admin/cities`

**Access:** 
- **List/View/Update/Toggle Status**: `owner`, `country_admin`, `city_admin` (with geographic restrictions)
- **Create/Delete**: `owner`, `country_admin` only

---

### GET `/` 🔒

List cities.

**Access:** `owner` (all cities), `country_admin` (cities in their country), `city_admin` (their assigned city only)

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
      "country": { "id": "...", "name": { "en": "UAE" } },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-25T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 10 }
}
```

**Note:** Results are automatically filtered based on admin's geographic scope.

---

### GET `/:id` 🔒

Get city by ID.

**Access:** `owner` (any city), `country_admin` (cities in their country), `city_admin` (their assigned city only)

**Response (200):**
```json
{
  "success": true,
  "message": "City retrieved",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "Dubai", "ar": "دبي" },
    "countryId": "660e8400-e29b-41d4-a716-446655440000",
    "baseDeliveryFee": "10.00",
    "primeDeliveryFee": "5.00",
    "freeDeliveryThreshold": "100.00",
    "serviceFee": "2.00",
    "taxRate": "5.00",
    "timezone": "Asia/Dubai",
    "geoBounds": [[25.0, 55.0], [25.3, 55.3]],
    "isActive": true,
    "country": { "id": "...", "name": { "en": "UAE" } }
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this city",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### POST `/` 🔒

Create city.

**Access:** `owner`, `country_admin` only

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

**Response (201):**
```json
{
  "success": true,
  "message": "City created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "Dubai", "ar": "دبي" },
    "countryId": "660e8400-e29b-41d4-a716-446655440000",
    "baseDeliveryFee": "10.00",
    "isActive": true
  }
}
```

---

### PUT `/:id` 🔒

Update city.

**Access:** `owner` (any city), `country_admin` (cities in their country), `city_admin` (their assigned city only)

**Request:**
```json
{
  "name": { "en": "Dubai City", "ar": "مدينة دبي" },
  "baseDeliveryFee": "12.00",
  "primeDeliveryFee": "6.00",
  "serviceFee": "2.50",
  "taxRate": "5.00",
  "timezone": "Asia/Dubai",
  "isActive": true
}
```

All fields optional except `countryId` cannot be changed.

**Response (200):**
```json
{
  "success": true,
  "message": "City updated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": { "en": "Dubai City", "ar": "مدينة دبي" },
    "baseDeliveryFee": "12.00",
    "isActive": true,
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this city",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### DELETE `/:id` 🔒

Delete city.

**Access:** `owner`, `country_admin` only

**Response (200):**
```json
{
  "success": true,
  "message": "City deleted successfully",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this city",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

---

### PATCH `/:id/toggle-status` 🔒

Toggle city active status.

**Access:** `owner` (any city), `country_admin` (cities in their country), `city_admin` (their assigned city only)

**Response (200):**
```json
{
  "success": true,
  "message": "City activated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "updatedAt": "2025-12-25T12:00:00.000Z"
  }
}
```

**Response (403):**
```json
{
  "success": false,
  "message": "Access denied to this city",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

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

## Users

**Base URL:** `/api/v1/admin/users`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List users.

**Query Params:** `cityId`, `countryId`, `isPrime` (bool), `isActive`, `search` (name/email/phone).

---

### GET `/:id` 🔒

Get user details.

---

### PUT `/:id` 🔒

Update user.

**Request:**
```json
{
  "isActive": false,
  "isPrime": true,
  "email": "..."
}
```

---

### PATCH `/:id/toggle-status` 🔒

Toggle active status (Ban/Unban).

---

### GET `/:id/addresses` 🔒

Get user saved addresses.

---

## Orders

**Base URL:** `/api/v1/admin/orders`

**Access:** `owner`, `city_admin`, `support` (geo filtered)

---

### GET `/` 🔒

List orders.

**Query Params:** `storeId`, `userId`, `status`, `paymentStatus`, `dateFrom`, `dateTo`, `orderNumber`.

---

### GET `/:id` 🔒

Get order details with store and user info.

---

### GET `/:id/items` 🔒

Get order items.

---

### GET `/:id/history` 🔒

Get order status transition history.

---

### PATCH `/:id/status` 🔒

Force update order status.

**Request:**
```json
{
  "status": "delivered",
  "notes": "Manually confirmed"
}
```

---

### POST `/:id/cancel` 🔒

Cancel order.

**Request:**
```json
{
  "reason": "user_requested",
  "notes": "Customer called"
}
```

---

### POST `/:id/assign-driver` 🔒

Manually assign a driver.

**Request:**
```json
{
  "driverId": "..."
}
```

---

### POST `/:id/reassign-driver` 🔒

Reassign to different driver.

---

### POST `/:id/refund` 🔒

Initiate refund.

**Request:**
```json
{
  "type": "full",
  "amount": "25.00"
}
```

---

## Promo Codes

**Base URL:** `/api/v1/admin/promo-codes`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List promo codes.

**Query Params:** `cityId`, `isActive`, `discountType`, `expired`, `search`.

---

### GET `/:id` 🔒

Get promo code details.

---

### POST `/` 🔒

Create promo code.

**Request:**
```json
{
  "title": "Summer Sale",
  "code": "SUMMER20",
  "discountType": "percent",
  "discountAmount": "20.00",
  "maxDiscountAmount": "50.00",
  "maxUses": 1000,
  "maxUsesPerUser": 1,
  "minOrderAmount": "30.00",
  "firstOrderOnly": false,
  "startsAt": "2025-06-01",
  "expiresAt": "2025-08-31",
  "cityId": "..."
}
```

---

### PUT `/:id` 🔒

Update promo code.

---

### DELETE `/:id` 🔒

Delete promo code.

---

### PATCH `/:id/toggle-status` 🔒

Enable/Disable promo code.

---

## Promotions

**Base URL:** `/api/v1/admin/promotions`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List promotions.

**Query Params:** `cityId`, `isActive`, `hasMainView`.

---

### GET `/:id` 🔒

Get promotion details.

---

### POST `/` 🔒

Create promotion.

**Request:**
```json
{
  "title": "Free Delivery Week",
  "discountType": "free_delivery",
  "discountAmount": "0",
  "hasMainView": true,
  "thumbnail": "...",
  "startsAt": "2025-01-01",
  "expiresAt": "2025-01-07"
}
```

---

### PUT `/:id` 🔒

Update promotion.

---

### DELETE `/:id` 🔒

Delete promotion.

---

### PATCH `/:id/toggle-status` 🔒

Enable/Disable promotion.

---

### GET `/:id/stores` 🔒

Get stores linked to promotion.

---

### POST `/:id/stores` 🔒

Add store to promotion.

**Request:**
```json
{
  "storeId": "...",
  "sorting": 0
}
```

---

### DELETE `/:id/stores/:storeId` 🔒

Remove store from promotion.

---

## Support Tickets

**Base URL:** `/api/v1/admin/support-tickets`

**Access:** `owner`, `city_admin`, `support` (geo filtered)

---

### GET `/` 🔒

List support tickets.

**Query Params:** `userId`, `assignedAdminId`, `status`, `department`, `priority`, `search`.

---

### GET `/:id` 🔒

Get ticket details with user and order info.

---

### PATCH `/:id/status` 🔒

Update ticket status.

**Request:**
```json
{
  "status": "resolved"
}
```

**Statuses:** `open`, `in_progress`, `waiting_user`, `resolved`, `closed`.

---

### PATCH `/:id/assign` 🔒

Assign ticket to admin.

**Request:**
```json
{
  "adminId": "..."
}
```

---

### PATCH `/:id/priority` 🔒

Update ticket priority.

**Request:**
```json
{
  "priority": "urgent"
}
```

**Priorities:** `low`, `medium`, `high`, `urgent`.

---

### PATCH `/:id/department` 🔒

Update ticket department.

**Request:**
```json
{
  "department": "orders"
}
```

**Departments:** `orders`, `technical`, `general`, `payment`, `driver`, `store`.

---

### GET `/:id/messages` 🔒

Get ticket messages.

---

### POST `/:id/messages` 🔒

Reply to ticket.

**Request:**
```json
{
  "body": "We've resolved your issue.",
  "type": "text"
}
```

---

## Reviews

**Base URL:** `/api/v1/admin/reviews`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/pending-count` 🔒

Get count of pending reviews.

---

### GET `/` 🔒

List reviews.

**Query Params:** `type` (store/driver/support), `status`, `rating`, `storeId`, `driverId`.

---

### GET `/:id` 🔒

Get review details.

---

### PATCH `/:id/approve` 🔒

Approve review. Updates store/driver rating.

---

### PATCH `/:id/reject` 🔒

Reject review with reason.

**Request:**
```json
{
  "reason": "Contains inappropriate content"
}
```

---

### DELETE `/:id` 🔒

Delete review. Updates store/driver rating.

---

## Stories

**Base URL:** `/api/v1/admin/stories`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List stories.

**Query Params:** `storeId`, `adminId`, `expired` (bool), `type` (image/video).

---

### GET `/:id` 🔒

Get story details.

---

### POST `/` 🔒

Create admin story (platform announcement).

**Request:**
```json
{
  "type": "image",
  "mediaUrl": "https://...",
  "caption": "New feature launched!",
  "cityId": "...",
  "expiresAt": "2025-01-02T00:00:00Z"
}
```

---

### PUT `/:id` 🔒

Update story caption or expiry.

---

### DELETE `/:id` 🔒

Delete story.

---

## Settings

**Base URL:** `/api/v1/admin/settings`

**Access:** `owner`, `country_admin`, `city_admin` (with geographic restrictions)

---

### GET `/global` 🔒

Get global settings (fallback settings).

---

### GET `/current` 🔒

Get settings for admin's current scope (city > country > global fallback).

---

### GET `/` 🔒

List all settings (global + per-city/country).

**Access:** 
- `owner`: Can view all.
- `country_admin`: Can view their country and cities within it.
- `city_admin`: Can view their city only.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| countryId | uuid | Filter by country |
| cityId | uuid | Filter by city |

---

### POST `/` 🔒

Create settings for city/country.

**Access:** scope restricted by admin role.

**Request:**
```json
{
  "cityId": "...",
  "availableLanguages": ["en", "ar"],
  "defaultLanguage": "en",
  "coinRewardsEnabled": true,
  "coinsPerOrder": 10,
  "theme": {
    "primaryColor": "#FF5722",
    "secondaryColor": "#2196F3",
    "accentColor": "#4CAF50",
    "backgroundColor": "#FFFFFF"
  },
  "maintenanceMode": false
}
```

---

### PUT `/:id` 🔒

Update settings.

**Access:** scope restricted by admin role (cannot manage global settings unless owner).

---

### DELETE `/:id` 🔒

Delete city/country settings (cannot delete global).

**Access:** scope restricted by admin role.

---

## Payments

**Base URL:** `/api/v1/admin/payments`

**Access:** `owner`, `city_admin` (geo filtered)

---

### Payment Options

#### GET `/options` 🔒

List payment options.

**Query Params:** `countryId`, `isActive`, `gateway`.

#### POST `/options` 🔒

Create payment option.

**Request:**
```json
{
  "name": "Visa/Mastercard",
  "gateway": "stripe",
  "fee": "2.50",
  "feeType": "percent",
  "countryId": "..."
}
```

#### PUT `/options/:id` 🔒

Update payment option.

#### DELETE `/options/:id` 🔒

Delete payment option.

#### PATCH `/options/:id/toggle-status` 🔒

Enable/Disable payment option.

---

### Payments (Order Payments)

#### GET `/` 🔒

List payments.

**Query Params:** `orderId`, `userId`, `status`, `dateFrom`, `dateTo`.

#### GET `/:id` 🔒

Get payment details.

#### GET `/stats` 🔒

Get payment stats (totals, success rate).

---

### Transactions (Wallet/Coins)

#### GET `/transactions` 🔒

List transactions.

**Query Params:** `senderId`, `receiverId`, `type`, `status`.

**Types:** `transfer`, `withdraw`, `deposit`, `reward`, `refund`, `purchase`.

#### GET `/transactions/:id` 🔒

Get transaction details.

#### GET `/transactions/ref/:reference` 🔒

Get transaction by reference number.

---

## Notifications

**Base URL:** `/api/v1/admin/notifications`

**Access:** `owner`, `city_admin` (geo filtered)

**Real-time:** Socket.io for instant delivery when user is online.

---

### GET `/` 🔒

List user's notifications.

**Query Params:** `userId` (required), `unreadOnly`.

---

### POST `/send` 🔒

Send notification to single user.

**Request:**
```json
{
  "userId": "...",
  "type": "system",
  "title": "Welcome!",
  "body": "Thanks for joining.",
  "data": { "key": "value" },
  "actionUrl": "/home"
}
```

**Types:** `order_update`, `order_delivered`, `promotion`, `promo_code`, `chat_message`, `support_reply`, `reward`, `system`.

---

### POST `/broadcast` 🔒

Broadcast to multiple users.

**Request:**
```json
{
  "type": "promotion",
  "title": "50% Off!",
  "body": "Limited time offer.",
  "cityId": "..."
}
```

**Targeting:** `userIds` (specific) or `cityId`/`countryId` (geo).

---

## Upload Media

**Base URL:** `/api/v1/admin/upload`

**Access:** Requires admin authentication. Currently protected with `adminAuthMiddleware`.

**Purpose:** Centralized file upload service for images, documents, and other media files with automatic optimization, thumbnail generation, and S3/MinIO storage.

**Storage:** Files are stored in MinIO/S3 with the following path structure:
```
{countryId?}/uploads/{folder}/{year}/{month}/{uuid}-{filename}
```

---

### POST `/` 🔒

Upload a file to cloud storage with automatic optimization and thumbnail generation for images.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | The file to upload |
| type | string | No | Folder category (default: 'general'). Examples: 'avatars', 'products', 'banners', 'documents', 'stores' |
| countryId | uuid | No | Optional country ID for geographic isolation of files |

**File Constraints:**

| Constraint | Value |
|------------|-------|
| Max File Size | 10MB (configurable via `MAX_FILE_SIZE` env var) |
| Allowed Types | All file types (images receive special processing) |
| Image Formats | JPEG, PNG, WebP, GIF, etc. |

**Image Processing:**

For image files, the system automatically:
1. **Optimizes** the original image:
   - Resizes images wider than 2000px to 2000px width (maintains aspect ratio)
   - Compresses JPEG to 85% quality
   - Compresses PNG to 80% quality
   - Compresses WebP to 85% quality
2. **Generates thumbnail**:
   - 300x300px cover crop
   - Stored with `_thumb` suffix
   - Same format as original

**Example Request (cURL):**
```bash
curl -X POST https://api.example.com/api/v1/admin/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/image.jpg" \
  -F "type=products" \
  -F "countryId=660e8400-e29b-41d4-a716-446655440000"
```

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://s3.example.com/bucket/660e8400-e29b-41d4-a716-446655440000/uploads/products/2025/12/a1b2c3d4e5.jpg",
    "thumbnailUrl": "https://s3.example.com/bucket/660e8400-e29b-41d4-a716-446655440000/uploads/products/2025/12/a1b2c3d4e5_thumb.jpg",
    "filename": "product_image.jpg",
    "path": "660e8400-e29b-41d4-a716-446655440000/uploads/products/2025/12/a1b2c3d4e5.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  },
  "timestamp": "2025-12-29T12:00:00.000Z"
}
```

**Response (400 - No file):**
```json
{
  "success": false,
  "message": "No file provided",
  "timestamp": "2025-12-29T12:00:00.000Z"
}
```

**Response (400 - Invalid file):**
```json
{
  "success": false,
  "message": "Invalid file",
  "timestamp": "2025-12-29T12:00:00.000Z"
}
```

**Response (400 - File too large):**
```json
{
  "success": false,
  "message": "File too large. Max 10MB",
  "timestamp": "2025-12-29T12:00:00.000Z"
}
```

**Response (500 - Upload failed):**
```json
{
  "success": false,
  "message": "Upload failed",
  "error": "Connection to storage service failed",
  "timestamp": "2025-12-29T12:00:00.000Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| url | string | Public URL to access the uploaded file |
| thumbnailUrl | string | Public URL to access the thumbnail (images only) |
| filename | string | Sanitized filename as stored |
| path | string | Full object key/path in the S3 bucket |
| size | number | File size in bytes (after optimization) |
| mimeType | string | MIME type of the file |

**Environment Variables:**

The upload system requires the following environment variables:

```bash
# S3/MinIO Configuration
S3_ENDPOINT=https://s3.example.com      # MinIO/S3 endpoint URL
S3_BUCKET=onway-media                   # Bucket name
S3_ACCESS_KEY=your_access_key           # Access key
S3_SECRET_KEY=your_secret_key           # Secret key
S3_REGION=us-east-1                     # Region (default: us-east-1)
S3_PUBLIC_URL=https://s3.example.com    # Public URL for accessing files

# Upload Limits
MAX_FILE_SIZE=10485760                  # Max file size in bytes (default: 10MB)
```

**Usage Examples:**

1. **Upload Store Avatar:**
```bash
curl -X POST /api/v1/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@store-logo.png" \
  -F "type=avatars"
```

2. **Upload Product Image:**
```bash
curl -X POST /api/v1/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@product.jpg" \
  -F "type=products" \
  -F "countryId=<country-uuid>"
```

3. **Upload Banner:**
```bash
curl -X POST /api/v1/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@banner.jpg" \
  -F "type=banners"
```

4. **Upload Document:**
```bash
curl -X POST /api/v1/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "type=documents"
```

**Notes:**

- Files are automatically organized by upload date (year/month) for better storage management
- Filenames are sanitized to remove special characters and prevent path traversal
- Each file gets a unique 10-character ID to prevent naming conflicts
- Images are automatically optimized to reduce storage costs and improve load times
- Thumbnails are generated for all images for use in lists and previews
- The bucket is initialized with public read policy on first use
- Country-specific isolation is optional but recommended for multi-tenant scenarios
- Future updates may support User, Driver, and Store authentication tokens

---

## Audit Logs

**Base URL:** `/api/v1/admin/audit-logs`

**Access:** `owner` only

---

### GET `/` 🔒

List audit logs.

**Query Params:** `actorType`, `actorId`, `action`, `tableName`, `recordId`, `dateFrom`, `dateTo`.

**Actor Types:** `admin`, `user`, `driver`, `store`, `system`.

**Action Types:** `create`, `update`, `delete`, `login`, `logout`, `password_change`, `status_change`, `payment`, `refund`, `assign`, `export`.

---

### GET `/:id` 🔒

Get audit log details.

---

### GET `/record/:table/:recordId` 🔒

Get audit history for a specific record.

Example: `/record/orders/uuid` - Get all changes to an order.

---

### GET `/admin/:adminId` 🔒

Get activity log for a specific admin.

---

## Stores

**Base URL:** `/api/v1/admin/stores`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List stores.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| cityId | uuid | Filter by city |
| countryId | uuid | Filter by country |
| search | string | Search by name |
| isActive | boolean | Filter by status |
| isPrime | boolean | Filter prime stores |
| isSponsored | boolean | Filter sponsored |
| isFeatured | boolean | Filter featured |
| page | number | Page (default: 1) |
| limit | number | Per page (default: 20) |
| sortBy | string | `createdAt`, `rating`, `sorting` |
| sortOrder | string | `asc`, `desc` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": { "en": "Pizza Palace", "ar": "قصر البيتزا" },
      "description": { "en": "Best pizza in town" },
      "avatar": "https://example.com/logo.png",
      "thumbnail": "https://example.com/cover.jpg",
      "rating": "4.8",
      "totalReviews": 150,
      "isPrime": true,
      "isSponsored": false,
      "isFeatured": true,
      "isActive": true,
      "city": { "id": "...", "name": { "en": "Dubai" } },
      "country": { "id": "...", "name": { "en": "UAE" } }
    }
  ]
}
```

---

### GET `/:id` 🔒

Get store with auth users.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": { "en": "Pizza Palace" },
    "description": { "en": "Best pizza in town" },
    "avatar": "https://example.com/logo.png",
    "thumbnail": "https://example.com/cover.jpg",
    "thumbnailType": "image",
    "hasSpecialDeliveryFee": true,
    "specialDeliveryFee": "5.00",
    "minOrderAmount": "20.00",
    "discountType": "percent",
    "discountAmount": "10.00",
    "maxDiscountAmount": "50.00",
    "sorting": 1,
    "isPrime": true,
    "isSponsored": false,
    "isFeatured": true,
    "workingHours": {
      "monday": { "open": "09:00", "close": "23:00" },
      "tuesday": { "open": "09:00", "close": "23:00" }
    },
    "preparationTime": 30,
    "rating": "4.8",
    "totalReviews": 150,
    "geoLocation": { "lat": 25.2048, "lng": 55.2708 },
    "address": "123 Main St, Dubai",
    "categoryDisplaySetting": "expanded",
    "canPlaceOrder": true,
    "acceptsScheduledOrders": true,
    "commissionRate": "15.00",
    "cityId": "...",
    "countryId": "...",
    "isActive": true,
    "auth": [
      {
        "id": "...",
        "username": "pizzapalace",
        "email": "owner@pizzapalace.com",
        "phone": "+971501234567",
        "role": "owner",
        "lastLogin": "2025-12-25T10:00:00Z"
      }
    ]
  }
}
```

---

### POST `/` 🔒

Create store with owner credentials.

**Request:**
```json
{
  "name": { "en": "Pizza Palace", "ar": "قصر البيتزا" },
  "description": { "en": "Best pizza in town" },
  "avatar": "https://example.com/logo.png",
  "cityId": "...",
  "countryId": "...",
  "auth": {
    "username": "pizzapalace",
    "email": "owner@pizzapalace.com",
    "phone": "+971501234567",
    "password": "securepassword123"
  }
}
```

**All Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| name | ✅ | Multi-language name |
| cityId | ✅ | City UUID |
| countryId | ✅ | Country UUID |
| auth | ✅ | Owner credentials |
| description | ❌ | Multi-language description |
| avatar | ❌ | Logo URL |
| thumbnail | ❌ | Cover image URL |
| thumbnailType | ❌ | `image` or `video` |
| hasSpecialDeliveryFee | ❌ | Override city fee |
| specialDeliveryFee | ❌ | Custom delivery fee |
| minOrderAmount | ❌ | Minimum order |
| discountType | ❌ | `percent` or `fixed` |
| discountAmount | ❌ | Discount value |
| maxDiscountAmount | ❌ | Max discount cap |
| sorting | ❌ | Display order |
| isPrime | ❌ | Prime store flag |
| isSponsored | ❌ | Sponsored flag |
| isFeatured | ❌ | Featured flag |
| workingHours | ❌ | Hours by day |
| preparationTime | ❌ | Minutes (default: 30) |
| geoLocation | ❌ | `{ lat, lng }` |
| address | ❌ | Street address |
| commissionRate | ❌ | Platform commission % |

---

### PUT `/:id` 🔒

Update store. All fields optional.

---

### DELETE `/:id` 🔒

Delete store.

---

### PATCH `/:id/toggle-status` 🔒

Toggle store active status.

---

### POST `/:id/reset-password` 🔒

Reset auth user password.

**Request:**
```json
{
  "authId": "...",
  "newPassword": "newpassword123"
}
```

---

### POST `/:id/auth-users` 🔒

Add auth user to store.

**Request:**
```json
{
  "username": "manager1",
  "email": "manager@pizzapalace.com",
  "phone": "+971501234568",
  "password": "securepassword123",
  "role": "manager"
}
```

**Roles:** `owner`, `manager`, `staff`

---

### DELETE `/:id/auth-users/:authId` 🔒

Remove auth user from store.

---

## Store Category Assignments

**Base URL:** `/api/v1/admin/store-categories`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

Manages which platform categories a store belongs to.

---

### GET `/store/:storeId` 🔒

Get all categories assigned to a store.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "storeId": "...",
      "categoryId": "...",
      "sorting": 0,
      "isSponsored": false,
      "category": {
        "id": "...",
        "name": { "en": "Restaurants", "ar": "مطاعم" }
      }
    },
    {
      "id": "...",
      "storeId": "...",
      "categoryId": "...",
      "sorting": 1,
      "isSponsored": true,
      "category": {
        "id": "...",
        "name": { "en": "Pizza", "ar": "بيتزا" }
      }
    }
  ]
}
```

---

### GET `/category/:categoryId` 🔒

Get all stores in a category.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "storeId": "...",
      "categoryId": "...",
      "sorting": 0,
      "isSponsored": true,
      "store": {
        "id": "...",
        "name": { "en": "Pizza Palace" }
      }
    }
  ]
}
```

---

### POST `/store/:storeId` 🔒

Assign a category to store.

**Request:**
```json
{
  "categoryId": "...",
  "sorting": 0,
  "isSponsored": false
}
```

---

### POST `/store/:storeId/bulk` 🔒

Bulk assign categories (adds to existing).

**Request:**
```json
{
  "categoryIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

### PUT `/store/:storeId` 🔒

Replace all categories for a store.

**Request:**
```json
{
  "categoryIds": ["uuid1", "uuid2"]
}
```

---

### PATCH `/:assignmentId` 🔒

Update assignment (sorting, sponsored).

**Request:**
```json
{
  "sorting": 1,
  "isSponsored": true
}
```

---

### DELETE `/store/:storeId/category/:categoryId` 🔒

Remove a category from store.

---

## Store Menu Categories

**Base URL:** `/api/v1/admin/store-menu`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/store/:storeId` 🔒

List menu categories.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": { "en": "Burgers" },
      "sorting": 0
    }
  ]
}
```

---

### POST `/store/:storeId` 🔒

Create menu category.

**Request:**
```json
{
  "name": { "en": "Burgers" },
  "description": { "en": "Juicy burgers" },
  "avatar": "url",
  "sorting": 0
}
```

---

### PUT `/:id` 🔒

Update menu category.

---

### DELETE `/:id` 🔒

Delete menu category.

---

### POST `/store/:storeId/reorder` 🔒

Reorder categories.

**Request:**
```json
{
  "categoryIds": ["uuid1", "uuid2"]
}
```

---

## Store Items

**Base URL:** `/api/v1/admin/store-items`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/store/:storeId` 🔒

List items.

**Query Params:** `categoryId` (uuid), `search` (string), `outOfStock` (boolean)

---

### POST `/store/:storeId` 🔒

Create item.

**Request:**
```json
{
  "categoryId": "...",
  "name": { "en": "Cheeseburger" },
  "price": "10.00",
  "photos": ["url1"],
  "nutritionInfo": { "calories": 500 }
}
```

---

### PUT `/:id` 🔒

Update item.

---

### PATCH `/:id/toggle-stock` 🔒

Toggle item stock status.

---

### POST `/bulk-stock` 🔒

Bulk update stock.

**Request:**
```json
{
  "itemIds": ["uuid1", "uuid2"],
  "outOfStock": true
}
```

---

## Store Item Addons

**Base URL:** `/api/v1/admin/store-addons`

**Access:** `owner`, `country_admin`, `city_admin` (geo filtered)

---

### GET `/item/:itemId` 🔒

List addons for an item.

---

### POST `/item/:itemId` 🔒

Create addon.

**Request:**
```json
{
  "name": { "en": "Size" },
  "options": [
    { "name": { "en": "Regular" }, "price": 0, "isDefault": true },
    { "name": { "en": "Large" }, "price": 2 }
  ],
  "isRequired": true,
  "maxSelections": 1
}
```

---

### POST `/item/:itemId/duplicate` 🔒

Duplicate addons from one item to another.

**Request:**
```json
{
  "targetItemId": "..."
}
```

---

## Store Payouts

**Base URL:** `/api/v1/admin/store-payouts`

**Access:** `owner`, `finance`

---

### GET `/` 🔒

List payouts.

**Query Params:** `storeId`, `status`, `periodStart` (date), `periodEnd` (date).

---

### GET `/stats/preview` 🔒

Get live calculations (Dry Run).

**Query Params:** `storeId`, `periodStart` (YYYY-MM-DD), `periodEnd` (YYYY-MM-DD).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 100,
    "completedOrders": 95,
    "cancelledOrders": 5,
    "grossAmount": 1000.00,
    "commissionAmount": 150.00,
    "netAmount": 850.00
  }
}
```

---

### POST `/generate` 🔒

Manual generation (Calculates and saves DB record).

**Request:**
```json
{
  "storeId": "...",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-07"
}
```

---

### POST `/generate-batch` 🔒

Manual batch generation for all active stores (Cron simulation).

**Request:**
```json
{
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-07",
  "confirm": true
}
```

---

### PATCH `/:id/process` 🔒

Mark as Paid or Failed.

**Request (Paid):**
```json
{
  "status": "paid",
  "transactionReference": "tx_12345"
}
```

**Request (Failed):**
```json
{
  "status": "failed",
  "failureReason": "Bank account invalid"
}
```

---

## Drivers

**Base URL:** `/api/v1/admin/drivers`

**Access:** `owner`, `city_admin` (geo filtered)

---

### GET `/` 🔒

List drivers.

**Query Params:** `cityId`, `vehicleType`, `isOnline` (bool), `search` (string).

---

### POST `/` 🔒

Create driver.

**Request:**
```json
{
  "username": "John Doe",
  "email": "john@driver.com",
  "phone": "+1234567890",
  "password": "password123",
  "vehicleType": "bike",
  "cityId": "...",
  "countryId": "..."
}
```

---

### PUT `/:id` 🔒

Update driver.

---

### PATCH `/:id/toggle-status` 🔒

Toggle active status.

---

### POST `/:id/reset-password` 🔒

Reset driver password.

**Request:**
```json
{
  "password": "newpassword123"
}
```

---

## Driver Payouts

**Base URL:** `/api/v1/admin/driver-payouts`

**Access:** `owner`, `finance`

---

### GET `/` 🔒

List payouts.

**Query Params:** `driverId`, `status`, `periodStart` (YYYY-MM-DD), `periodEnd`.

---

### GET `/stats/preview` 🔒

Preview calculations.

---

### POST `/generate` 🔒

Manual generation.

**Request:**
```json
{
  "driverId": "...",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-07"
}
```

---

### PATCH `/:id/process` 🔒

Mark as Paid or Failed.

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
