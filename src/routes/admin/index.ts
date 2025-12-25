import { Hono } from 'hono';
import { authRoutes } from './auth.routes';
import { adminCrudRoutes } from './admin.routes';
import { countryRoutes } from './country.routes';
import { cityRoutes } from './city.routes';
import { cityZoneRoutes } from './city-zone.routes';
import { categoryRoutes } from './category.routes';
import { sectionRoutes } from './section.routes';
import { bannerRoutes } from './banner.routes';

const adminRoutes = new Hono();

// Auth
adminRoutes.route('/auth', authRoutes);

// Admin management
adminRoutes.route('/admins', adminCrudRoutes);

// Geography
adminRoutes.route('/countries', countryRoutes);
adminRoutes.route('/cities', cityRoutes);
adminRoutes.route('/city-zones', cityZoneRoutes);

// Content
adminRoutes.route('/categories', categoryRoutes);
adminRoutes.route('/sections', sectionRoutes);
adminRoutes.route('/banners', bannerRoutes);

export { adminRoutes };
