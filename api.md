# 🚀 OnWay API Documentation

**Base URL**: `http://localhost:3000/api/v1`

## 📚 Table of Contents

- [Authentication](#-authentication)
  - [Login](#post-authlogin)
  - [Refresh Token](#post-authrefresh)
  - [Get Profile](#get-authprofile)
  - [Logout](#post-authlogout)
- [Profile Management](#-profile-management)
  - [Update Profile](#patch-profile)
  - [Change Password](#post-profilechange-password)
- [Media Service](#-media-service)
  - [Upload File](#post-mediaupload)
- [User Management](#-user-management-owners--country-admins)
  - [Create Admin](#post-users)
  - [List Admins](#get-users)
  - [Toggle Active Status](#patch-usersidtoggle)

---

## 🔐 Authentication
**Base Path**: `/admin/auth`

### `POST /auth/login`
Admin login using email and password.

<details>
<summary><b>Request Body & Response</b></summary>

**Request:**
```json
{
  "email": "admin@onway.com",
  "password": "your_secure_password"
}
```

**Response (200 OK):**
```json
{
  "admin": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@onway.com",
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```
</details>

---

### `POST /auth/refresh`
Refresh your access token using a refresh token.

<details>
<summary><b>Request Body & Response</b></summary>

**Request:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "new_access_token...",
  "refreshToken": "new_refresh_token..."
}
```
</details>

---

### `GET /auth/profile`
Get details of the currently logged-in admin.

<details>
<summary><b>Response</b></summary>

**Headers:**
`Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "admin": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@onway.com",
    "role": "owner",
    "countryId": null,
    "cityId": null
  }
}
```
</details>

---

## 👤 Profile Management
**Base Path**: `/admin/profile`

### `PATCH /profile`
Update your own profile details.

<details>
<summary><b>Request Body & Response</b></summary>

**Request:**
```json
{
  "username": "new_username",
  "avatar": "https://example.com/me.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "new_username",
  "avatar": "https://example.com/me.jpg",
  "updatedAt": "2024-..."
}
```
</details>

---

### `POST /profile/change-password`
Change your login password.

<details>
<summary><b>Request Body & Response</b></summary>

**Request:**
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```
</details>

---

## � Media Service
**Base Path**: `/media`

### `POST /upload`
Upload a file (image, document) to MinIO storage.
*   **Auth Required**: Yes (Bearer Token).

<details>
<summary><b>Request Body & Response</b></summary>

**Request (Multipart Form-Data):**
*   `file`: (Binary) The file to upload.
*   `folder`: (String) Optional folder name (e.g., "avatars", "products").

**Response (201 Created):**
```json
{
  "url": "http://localhost:9000/onway-uploads/avatars/abc-123.png",
  "key": "avatars/abc-123.png",
  "bucket": "onway-uploads"
}
```
</details>

---

## �👥 User Management (Owners & Country Admins)
**Base Path**: `/admin/users`

### `POST /users`
Create a new admin account. 
*   **Owners** can create `country_admin`.
*   **Country Admins** can create `city_admin` (in their country).

<details>
<summary><b>Request Body & Response</b></summary>

**Request:**
```json
{
  "username": "riyadh_manager",
  "email": "riyadh@onway.com",
  "password": "temp_password_123",
  "role": "city_admin",
  "cityId": "uuid-for-riyadh",
  "countryId": "uuid-for-saudi" 
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "username": "riyadh_manager",
  "role": "city_admin",
  "isActive": true
}
```
</details>

---

### `GET /users`
List all admins you are allowed to see.
*   **Owners**: See everyone.
*   **Country Admins**: See everyone in their country.
*   **City Admins**: See everyone in their city.

<details>
<summary><b>Response</b></summary>

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "username": "saudi_admin",
    "role": "country_admin",
    "country": { "name": "Saudi Arabia" },
    "city": null
  },
  {
    "id": "uuid",
    "username": "riyadh_admin",
    "role": "city_admin",
    "country": { "name": "Saudi Arabia" },
    "city": { "name": "Riyadh" }
  }
]
```
</details>

---

### `PATCH /users/:id/toggle`
Activate or Deactivate an admin account.

<details>
<summary><b>Response</b></summary>

**Response (200 OK):**
```json
{
  "id": "uuid",
  "isActive": false
}
```
</details>
