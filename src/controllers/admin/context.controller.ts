import type { Context } from 'hono';
import { CountryService } from '../../services/admin/country.service';
import { CityService } from '../../services/admin/city.service';
import { SettingsService } from '../../services/admin/settings.service';
import { ApiResponse } from '../../lib';

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

        // Permissions flags based on role
        const permissions = {
            canManageCountries: role === 'owner',
            canManageCities: role === 'owner' || role === 'country_admin',
            canManageSettings: role === 'owner' || role === 'country_admin' || role === 'city_admin',
            role,
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
                settings: null,
            },
        };

        try {
            // Fetch settings based on role/scope
            let settingsData: any;
            if (role === 'owner') {
                settingsData = await SettingsService.list({});
            } else if (role === 'country_admin' && admin.countryId) {
                settingsData = await SettingsService.list({ countryId: admin.countryId });
            } else {
                settingsData = await SettingsService.getForScope(cityId || undefined, countryId || undefined);
            }

            if (role === 'owner' && !requestedCityId && !requestedCountryId) {
                // Owners get everything by default
                const [countriesResult, citiesResult] = await Promise.all([
                    CountryService.list({ limit: 1000 }),
                    CityService.list({ limit: 1000 }),
                ]);
                contextData.data.countries = countriesResult.data;
                contextData.data.cities = citiesResult.data;
                contextData.data.settings = settingsData;
            } else if (cityId) {
                // Specific city context (either city admin or owner/country_admin requested a city)
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
