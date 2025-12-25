import type { Context } from 'hono';
import { z } from 'zod';
import { AdminService } from '../../services/admin/admin.service';
import { ApiResponse } from '../../lib';
import { adminRoles } from '../../db/schema/admins';
import { canManageRole } from '../../middleware/admin/auth';

// Validation schemas
const createAdminSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(adminRoles),
    avatar: z.string().url().optional(),
    countryId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
});

const updateAdminSchema = z.object({
    username: z.string().min(3).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(adminRoles).optional(),
    avatar: z.string().url().optional(),
    countryId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
});

const listAdminsSchema = z.object({
    search: z.string().optional(),
    role: z.enum(adminRoles).optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
    countryId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    sortBy: z.enum(['createdAt', 'username', 'email']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class AdminController {
    // GET /admin/admins
    static async list(c: Context) {
        const query = c.req.query();
        const validation = listAdminsSchema.safeParse(query);
        const geoFilter = c.get('geoFilter');

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        // Merge user filters with geo restrictions
        const filters = {
            ...validation.data,
            countryId: geoFilter.countryId ?? validation.data.countryId,
            cityId: geoFilter.cityId ?? validation.data.cityId,
        };

        const { data, total } = await AdminService.list(filters);

        return ApiResponse.paginated(c, data, {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
        });
    }

    // GET /admin/admins/:id
    static async getById(c: Context) {
        const id = c.req.param('id');

        const admin = await AdminService.getById(id);

        if (!admin) {
            return ApiResponse.notFound(c, 'Admin not found');
        }

        return ApiResponse.success(c, {
            message: 'Admin retrieved',
            data: admin,
        });
    }

    // POST /admin/admins
    static async create(c: Context) {
        const body = await c.req.json();
        const validation = createAdminSchema.safeParse(body);
        const requestingAdmin = c.get('admin');

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const { username, email, role } = validation.data;

        // Check if requester can create this role
        if (!canManageRole(requestingAdmin.role, role)) {
            return ApiResponse.forbidden(c, `Cannot create admin with role '${role}'`);
        }

        // Check uniqueness
        const [emailExists, usernameExists] = await Promise.all([
            AdminService.getByEmail(email),
            AdminService.getByUsername(username),
        ]);

        if (emailExists) {
            return ApiResponse.conflict(c, 'Email already in use');
        }

        if (usernameExists) {
            return ApiResponse.conflict(c, 'Username already in use');
        }

        const admin = await AdminService.create(validation.data);

        return ApiResponse.created(c, admin, 'Admin created successfully');
    }

    // PUT /admin/admins/:id
    static async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const validation = updateAdminSchema.safeParse(body);
        const requestingAdmin = c.get('admin');

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors as Record<string, string[]>;
            return ApiResponse.validationError(c, errors);
        }

        const existing = await AdminService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Admin not found');
        }

        // Check if requester can manage this admin's role
        if (!canManageRole(requestingAdmin.role, existing.role)) {
            return ApiResponse.forbidden(c, 'Cannot modify admin with this role');
        }

        // If changing role, check if allowed
        if (validation.data.role && !canManageRole(requestingAdmin.role, validation.data.role)) {
            return ApiResponse.forbidden(c, `Cannot assign role '${validation.data.role}'`);
        }

        // Check email uniqueness if changing
        if (validation.data.email && validation.data.email !== existing.email) {
            const emailExists = await AdminService.getByEmail(validation.data.email);
            if (emailExists) {
                return ApiResponse.conflict(c, 'Email already in use');
            }
        }

        // Check username uniqueness if changing
        if (validation.data.username && validation.data.username !== existing.username) {
            const usernameExists = await AdminService.getByUsername(validation.data.username);
            if (usernameExists) {
                return ApiResponse.conflict(c, 'Username already in use');
            }
        }

        const admin = await AdminService.update(id, validation.data);

        return ApiResponse.success(c, {
            message: 'Admin updated successfully',
            data: admin,
        });
    }

    // DELETE /admin/admins/:id
    static async delete(c: Context) {
        const id = c.req.param('id');
        const requestingAdmin = c.get('admin');

        if (requestingAdmin.adminId === id) {
            return ApiResponse.badRequest(c, 'Cannot delete your own account');
        }

        const existing = await AdminService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Admin not found');
        }

        if (!canManageRole(requestingAdmin.role, existing.role)) {
            return ApiResponse.forbidden(c, 'Cannot delete admin with this role');
        }

        await AdminService.delete(id);

        return ApiResponse.success(c, {
            message: 'Admin deleted successfully',
        });
    }

    // PATCH /admin/admins/:id/toggle-status
    static async toggleStatus(c: Context) {
        const id = c.req.param('id');
        const requestingAdmin = c.get('admin');

        if (requestingAdmin.adminId === id) {
            return ApiResponse.badRequest(c, 'Cannot change your own status');
        }

        const existing = await AdminService.getById(id);
        if (!existing) {
            return ApiResponse.notFound(c, 'Admin not found');
        }

        if (!canManageRole(requestingAdmin.role, existing.role)) {
            return ApiResponse.forbidden(c, 'Cannot modify admin with this role');
        }

        const admin = await AdminService.update(id, {
            isActive: !existing.isActive,
        });

        return ApiResponse.success(c, {
            message: `Admin ${admin?.isActive ? 'activated' : 'deactivated'} successfully`,
            data: admin,
        });
    }
}
