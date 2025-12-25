import type { Admin } from '../../db';
import type { AdminRole } from '../../db/schema/admins';

export type { AdminRole };

// Admin JWT payload
export interface AdminTokenPayload {
    adminId: string;
    email: string;
    role: AdminRole;
    countryId: string | null;
    cityId: string | null;
}

// Admin login request
export interface AdminLoginRequest {
    email: string;
    password: string;
}

// Admin login response
export interface AdminLoginResponse {
    admin: AdminSafeData;
    accessToken: string;
    refreshToken: string;
}

// Admin data without sensitive fields
export interface AdminSafeData {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    role: AdminRole;
    countryId: string | null;
    cityId: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// Admin refresh token request
export interface AdminRefreshRequest {
    refreshToken: string;
}

// Convert Admin to safe data (exclude passwordHash)
export const toAdminSafeData = (admin: Admin): AdminSafeData => ({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    avatar: admin.avatar,
    role: admin.role,
    countryId: admin.countryId,
    cityId: admin.cityId,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
});
