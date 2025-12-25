import { Hono } from 'hono';
import { StoryController } from '../../controllers/admin/story.controller';
import { adminAuthMiddleware, cityAdminMiddleware, geoAccessMiddleware } from '../../middleware/admin/auth';

const storyRoutes = new Hono();

storyRoutes.use('*', adminAuthMiddleware);
storyRoutes.use('*', cityAdminMiddleware);
storyRoutes.use('*', geoAccessMiddleware);

// List stories
storyRoutes.get('/', StoryController.list);

// Get story details
storyRoutes.get('/:id', StoryController.getById);

// Create story
storyRoutes.post('/', StoryController.create);

// Update story
storyRoutes.put('/:id', StoryController.update);

// Delete story
storyRoutes.delete('/:id', StoryController.delete);

export { storyRoutes };
