import { Router } from 'express';
import { ShareController } from './share.controller';

const router = Router();

// Public routes - no authentication required

// Verify access (returns document info if valid)
router.post('/:token/verify', ShareController.verifyAccess);

// Download document
router.post('/:token/download', ShareController.downloadDocument);

export default router;
