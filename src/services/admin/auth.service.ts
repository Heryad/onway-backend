import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { db, admins } from '../../db';
import { config } from '../../config';
import type { AdminTokenPayload, AdminLoginResponse } from '../../types/admin/auth';
import { toAdminSafeData } from '../../types/admin/auth';
import { authLogger } from '../../lib/logger';

export class AdminAuthService {
    // Login admin
    static async login(email: string, password: string): Promise<AdminLoginResponse | null> {
        const admin = await db.query.admins.findFirst({
            where: eq(admins.email, email.toLowerCase()),
        });

        if (!admin) {
            authLogger.warn({ email }, 'Admin login failed: email not found');
            return null;
        }

        if (!admin.isActive) {
            authLogger.warn({ adminId: admin.id }, 'Admin login failed: account inactive');
            return null;
        }

        const isValidPassword = await argon2.verify(admin.passwordHash, password);
        if (!isValidPassword) {
            authLogger.warn({ adminId: admin.id }, 'Admin login failed: invalid password');
            return null;
        }

        // Update last login
        await db.update(admins)
            .set({ lastLogin: new Date(), updatedAt: new Date() })
            .where(eq(admins.id, admin.id));

        // Generate tokens
        const tokenPayload: AdminTokenPayload = {
            adminId: admin.id,
            email: admin.email,
            role: admin.role,
            countryId: admin.countryId,
            cityId: admin.cityId,
        };

        const accessToken = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);

        authLogger.info({ adminId: admin.id, role: admin.role }, 'Admin login successful');

        return {
            admin: toAdminSafeData(admin),
            accessToken,
            refreshToken,
        };
    }

    // Generate access token
    static generateAccessToken(payload: AdminTokenPayload): string {
        return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
            expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
        });
    }

    // Generate refresh token
    static generateRefreshToken(payload: AdminTokenPayload): string {
        return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
            expiresIn: config.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
        });
    }

    // Verify access token
    static verifyAccessToken(token: string): AdminTokenPayload | null {
        try {
            return jwt.verify(token, config.JWT_ACCESS_SECRET) as AdminTokenPayload;
        } catch {
            return null;
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token: string): AdminTokenPayload | null {
        try {
            return jwt.verify(token, config.JWT_REFRESH_SECRET) as AdminTokenPayload;
        } catch {
            return null;
        }
    }

    // Refresh tokens
    static async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) {
            return null;
        }

        // Verify admin still exists and is active
        const admin = await db.query.admins.findFirst({
            where: eq(admins.id, payload.adminId),
        });

        if (!admin || !admin.isActive) {
            return null;
        }

        // Generate new tokens with fresh data
        const newPayload: AdminTokenPayload = {
            adminId: admin.id,
            email: admin.email,
            role: admin.role,
            countryId: admin.countryId,
            cityId: admin.cityId,
        };

        return {
            accessToken: this.generateAccessToken(newPayload),
            refreshToken: this.generateRefreshToken(newPayload),
        };
    }

    // Get admin by ID
    static async getById(adminId: string) {
        return db.query.admins.findFirst({
            where: eq(admins.id, adminId),
        });
    }
}
