import { Router } from 'express';
import { LinksController } from './links.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create shareable link
router.post('/', LinksController.createLink);

// Get user's links
router.get('/', LinksController.getUserLinks);

// Deactivate link
router.delete('/:id', LinksController.deactivateLink);

// Get link access logs
router.get('/:id/logs', LinksController.getLinkAccessLogs);

export default router;
