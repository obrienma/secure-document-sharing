import { Router } from 'express';
import { ShareController } from './share.controller';

const router = Router();

// Public routes - no authentication required

// Check link status
router.get('/:token/status', ShareController.checkLinkStatus);

// Access shared document (view or download)
router.post('/:token', ShareController.accessSharedDocument);

export default router;
