import type { Context, Next } from 'hono';
import { AdminAuthService } from '../../services/admin/auth.service';
import { ApiResponse } from '../../lib';
import { authLogger } from '../../lib/logger';
import type { AdminTokenPayload, AdminRole } from '../../types/admin/auth';

// Extend Hono context with admin data
declare module 'hono' {
    interface ContextVariableMap {
        admin: AdminTokenPayload;
        geoFilter: { countryId?: string; cityId?: string };
    }
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<AdminRole, number> = {
    owner: 100,
    country_admin: 80,
    city_admin: 60,
    finance: 40,
    support: 30,
    operator: 20,
};

// Check if requester can manage target role
export const canManageRole = (requesterRole: AdminRole, targetRole: AdminRole): boolean => {
    return ROLE_HIERARCHY[requesterRole] > ROLE_HIERARCHY[targetRole];
};

// Admin authentication middleware
export const adminAuthMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        authLogger.warn('Admin auth failed: missing or invalid authorization header');
        return ApiResponse.unauthorized(c, 'Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = AdminAuthService.verifyAccessToken(token);

    if (!payload) {
        authLogger.warn('Admin auth failed: invalid or expired token');
        return ApiResponse.unauthorized(c, 'Invalid or expired token');
    }

    // Set admin data in context
    c.set('admin', payload);

    // Set geographic filter based on admin's scope
    const geoFilter = getGeoFilter(payload);
    c.set('geoFilter', geoFilter);

    await next();
};

// Get geographic filter for queries based on admin's scope
const getGeoFilter = (admin: AdminTokenPayload): { countryId?: string; cityId?: string } => {
    if (admin.role === 'owner') {
        return {}; // No filter - global access
    }

    if (admin.role === 'country_admin' && admin.countryId) {
        return { countryId: admin.countryId };
    }

    if (admin.role === 'city_admin' && admin.cityId) {
        return { countryId: admin.countryId ?? undefined, cityId: admin.cityId };
    }

    // Other roles based on their assignment
    if (admin.cityId) {
        return { countryId: admin.countryId ?? undefined, cityId: admin.cityId };
    }

    if (admin.countryId) {
        return { countryId: admin.countryId };
    }

    return {};
};

// Check if admin has geographic access to target scope
export const hasGeoAccess = (
    admin: AdminTokenPayload,
    targetCountryId?: string | null,
    targetCityId?: string | null
): boolean => {
    if (admin.role === 'owner') return true;

    if (admin.role === 'country_admin') {
        if (!admin.countryId) return false;
        if (targetCountryId && targetCountryId !== admin.countryId) return false;
        return true;
    }

    if (admin.role === 'city_admin') {
        if (!admin.cityId) return false;
        if (targetCityId && targetCityId !== admin.cityId) return false;
        if (targetCountryId && targetCountryId !== admin.countryId) return false;
        return true;
    }

    // Other roles - check their assignment
    if (admin.cityId) {
        if (targetCityId && targetCityId !== admin.cityId) return false;
    } else if (admin.countryId) {
        if (targetCountryId && targetCountryId !== admin.countryId) return false;
    }

    return true;
};

// Role-based access control middleware
export const adminRoleMiddleware = (...allowedRoles: AdminRole[]) => {
    return async (c: Context, next: Next) => {
        const admin = c.get('admin');

        if (!admin) {
            return ApiResponse.unauthorized(c, 'Authentication required');
        }

        if (!allowedRoles.includes(admin.role)) {
            authLogger.warn({ adminId: admin.adminId, role: admin.role, required: allowedRoles }, 'Admin role check failed');
            return ApiResponse.forbidden(c, 'Insufficient permissions');
        }

        await next();
    };
};

// Geographic scope middleware - extracts countryId/cityId from request and checks access
// Looks in: params, body, query for countryId and cityId
export const geoAccessMiddleware = async (c: Context, next: Next) => {
    const admin = c.get('admin');

    if (!admin) {
        return ApiResponse.unauthorized(c, 'Authentication required');
    }

    // Owner bypasses geo checks
    if (admin.role === 'owner') {
        await next();
        return;
    }

    // Extract target scope from request
    let targetCountryId: string | undefined;
    let targetCityId: string | undefined;

    // Check params
    targetCountryId = c.req.param('countryId');
    targetCityId = c.req.param('cityId');

    // Check query
    if (!targetCountryId) targetCountryId = c.req.query('countryId');
    if (!targetCityId) targetCityId = c.req.query('cityId');

    // Check body for POST/PUT/PATCH
    if (c.req.method !== 'GET' && c.req.method !== 'DELETE') {
        try {
            const body = await c.req.json();
            if (!targetCountryId && body.countryId) targetCountryId = body.countryId;
            if (!targetCityId && body.cityId) targetCityId = body.cityId;
        } catch {
            // No body or invalid JSON - continue
        }
    }

    // Check geographic access
    if (!hasGeoAccess(admin, targetCountryId, targetCityId)) {
        authLogger.warn({
            adminId: admin.adminId,
            role: admin.role,
            adminScope: { countryId: admin.countryId, cityId: admin.cityId },
            targetScope: { countryId: targetCountryId, cityId: targetCityId },
        }, 'Geographic access denied');
        return ApiResponse.forbidden(c, 'Access denied to this geographic region');
    }

    await next();
};

// Target role check middleware - for managing other admins
// Fetches target admin and checks if requester can manage them
export const targetRoleMiddleware = (getTargetRole: (c: Context) => Promise<AdminRole | null>) => {
    return async (c: Context, next: Next) => {
        const admin = c.get('admin');

        if (!admin) {
            return ApiResponse.unauthorized(c, 'Authentication required');
        }

        const targetRole = await getTargetRole(c);

        if (targetRole && !canManageRole(admin.role, targetRole)) {
            authLogger.warn({
                adminId: admin.adminId,
                role: admin.role,
                targetRole,
            }, 'Cannot manage admin with this role');
            return ApiResponse.forbidden(c, 'Cannot manage admin with this role');
        }

        await next();
    };
};

// Combined middleware factories
export const ownerOnlyMiddleware = adminRoleMiddleware('owner');
export const financeAccessMiddleware = adminRoleMiddleware('owner', 'finance');
export const countryAdminMiddleware = adminRoleMiddleware('owner', 'country_admin');
export const cityAdminMiddleware = adminRoleMiddleware('owner', 'country_admin', 'city_admin');
export const supportAccessMiddleware = adminRoleMiddleware('owner', 'country_admin', 'city_admin', 'support');
export const operatorAccessMiddleware = adminRoleMiddleware('owner', 'country_admin', 'city_admin', 'operator');

// Admin management middleware - role check + geo access
export const adminManagementMiddleware = adminRoleMiddleware('owner', 'country_admin', 'city_admin');
