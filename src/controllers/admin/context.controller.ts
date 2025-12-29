import type { Context } from 'hono';
import { CountryService } from '../../services/admin/country.service';
import { CityService } from '../../services/admin/city.service';
import { SettingsService } from '../../services/admin/settings.service';
import { ApiResponse } from '../../lib';
import { stories } from '@/db';

export class AdministrativeContextController {
    /**
     * GET /admin/context
     * Returns a consolidated context for the current user based on their role.
     * Includes user profile, permissions, and relevant geo/settings data.
     */
    static async getContext(c: Context) {
        const admin = c.get('admin');

        if (!admin) {
            return ApiResponse.unauthorized(c, 'Authentication required');
        }

        // Allow owners/country_admins to override scope via query params for previewing/context switching
        const requestedCityId = c.req.query('cityId');
        const requestedCountryId = c.req.query('countryId');

        const role = admin.role;
        // Use requested IDs if authorized, otherwise use admin's own scope
        const countryId = (role === 'owner' || (role === 'country_admin' && requestedCountryId === admin.countryId))
            ? (requestedCountryId || admin.countryId)
            : admin.countryId;

        const cityId = (role === 'owner' || role === 'country_admin' || (role === 'city_admin' && requestedCityId === admin.cityId))
            ? (requestedCityId || admin.cityId)
            : admin.cityId;

        // Helper to check role access
        const is = (roles: string[]) => roles.includes(role);
        const isOwner = role === 'owner';
        const isCountryAdmin = role === 'country_admin';
        const isCityAdmin = role === 'city_admin';

        // Simplified, broad permissions mapping
        const permissions: any = {
            role,
            isScopeOwner: is(['owner', 'country_admin', 'city_admin']),
            scope: {
                level: isOwner ? 'global' : (isCountryAdmin ? 'country' : (isCityAdmin ? 'city' : 'other')),
                countryId: admin.countryId,
                cityId: admin.cityId,
            },
            // Module-level capabilities (Broadly enabled for all "owners" of their scope)
            modules: {
                countries: { view: is(['owner', 'country_admin']), manage: is(['owner', 'country_admin']) },
                cities: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                admins: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                categories: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                sections: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                banners: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                stores: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                drivers: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                users: { view: true, manage: is(['owner', 'country_admin', 'city_admin', 'support']) },
                orders: { view: true, manage: true },
                promoCodes: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                promotions: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                settings: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                support: { view: true, manage: true },
                notifications: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) },
                auditLogs: { view: isOwner, manage: false },
                financial: { view: true, manage: is(['owner', 'finance', 'country_admin', 'city_admin']) },
                stories: { view: true, manage: is(['owner', 'country_admin', 'city_admin']) }
            }
        };

        const contextData: any = {
            user: {
                id: admin.adminId,
                email: admin.email,
                role: admin.role,
                countryId: admin.countryId,
                cityId: admin.cityId,
            },
            permissions,
            data: {
                countries: [],
                cities: [],
                settings: [],
            },
        };

        try {
            // Fetch settings based on role/scope
            let settingsData: any[] = [];
            if (isOwner) {
                settingsData = await SettingsService.list({});
            } else if (isCountryAdmin && admin.countryId) {
                settingsData = await SettingsService.list({ countryId: admin.countryId });
            } else {
                const setting = await SettingsService.getForScope(cityId || undefined, countryId || undefined);
                settingsData = setting ? [setting] : [];
            }

            if (isOwner && !requestedCityId && !requestedCountryId) {
                // Owners get everything by default
                const [countriesResult, citiesResult] = await Promise.all([
                    CountryService.list({ limit: 1000 }),
                    CityService.list({ limit: 1000 }),
                ]);
                contextData.data.countries = countriesResult.data;
                contextData.data.cities = citiesResult.data;
                contextData.data.settings = settingsData;
            } else if (cityId) {
                // Specific city context
                const [city, country] = await Promise.all([
                    CityService.getById(cityId),
                    countryId ? CountryService.getById(countryId) : Promise.resolve(null),
                ]);

                contextData.data.countries = country ? [country] : ((city as any)?.country ? [(city as any).country] : []);
                contextData.data.cities = city ? [city] : [];
                contextData.data.settings = settingsData;
            } else if (countryId) {
                // Specific country context
                const [country, citiesResult] = await Promise.all([
                    CountryService.getById(countryId),
                    CityService.list({ countryId, limit: 1000 }),
                ]);
                contextData.data.countries = country ? [country] : [];
                contextData.data.cities = citiesResult.data;
                contextData.data.settings = settingsData;
            }

            return ApiResponse.success(c, {
                message: 'Administrative context retrieved successfully',
                data: contextData,
            });
        } catch (error: any) {
            return ApiResponse.error(c, error);
        }
    }
}
