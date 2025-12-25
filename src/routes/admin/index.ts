import { Hono } from 'hono';
import { authRoutes } from './auth.routes';
import { adminCrudRoutes } from './admin.routes';
import { countryRoutes } from './country.routes';
import { cityRoutes } from './city.routes';
import { cityZoneRoutes } from './city-zone.routes';
import { categoryRoutes } from './category.routes';
import { sectionRoutes } from './section.routes';
import { bannerRoutes } from './banner.routes';
import { storeRoutes } from './store.routes';
import { storeCategoryAssignmentRoutes } from './store-category-assignment.routes';
import { storeMenuCategoryRoutes } from './store-menu-category.routes';
import { storeItemRoutes } from './store-item.routes';
import { storeItemAddonRoutes } from './store-item-addon.routes';
import { storePayoutRoutes } from './store-payout.routes';
import { driverRoutes } from './driver.routes';
import { driverPayoutRoutes } from './driver-payout.routes';
import { userRoutes } from './user.routes';
import { orderRoutes } from './order.routes';
import { promoCodeRoutes } from './promo-code.routes';
import { promotionRoutes } from './promotion.routes';
import { supportRoutes } from './support.routes';
import { reviewRoutes } from './review.routes';
import { storyRoutes } from './story.routes';

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

// Users
adminRoutes.route('/users', userRoutes);

// Orders
adminRoutes.route('/orders', orderRoutes);

// Stores
adminRoutes.route('/stores', storeRoutes);
adminRoutes.route('/store-categories', storeCategoryAssignmentRoutes);
adminRoutes.route('/store-menu', storeMenuCategoryRoutes);
adminRoutes.route('/store-items', storeItemRoutes);
adminRoutes.route('/store-addons', storeItemAddonRoutes);

// Drivers
adminRoutes.route('/drivers', driverRoutes);

// Financials
adminRoutes.route('/store-payouts', storePayoutRoutes);
adminRoutes.route('/driver-payouts', driverPayoutRoutes);

// Marketing
adminRoutes.route('/promo-codes', promoCodeRoutes);
adminRoutes.route('/promotions', promotionRoutes);

// Support
adminRoutes.route('/support-tickets', supportRoutes);

// Reviews
adminRoutes.route('/reviews', reviewRoutes);

// Stories
adminRoutes.route('/stories', storyRoutes);

export { adminRoutes };
