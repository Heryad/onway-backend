import { Hono } from 'hono';
import { authRoutes } from './auth.routes';
import { adminCrudRoutes } from './admin.routes';
import { countryRoutes } from './country.routes';
import { cityRoutes } from './city.routes';
import { cityZoneRoutes } from './city-zone.routes';

const adminRoutes = new Hono();

// Auth
adminRoutes.route('/auth', authRoutes);

// Admin management
adminRoutes.route('/admins', adminCrudRoutes);

// Geography
adminRoutes.route('/countries', countryRoutes);
adminRoutes.route('/cities', cityRoutes);
adminRoutes.route('/city-zones', cityZoneRoutes);

export { adminRoutes };
