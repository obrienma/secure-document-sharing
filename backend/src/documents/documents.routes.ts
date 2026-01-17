import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload document
router.post('/upload', upload.single('file'), DocumentsController.uploadDocument);

// Get user's documents
router.get('/', DocumentsController.getUserDocuments);

// Get specific document
router.get('/:id', DocumentsController.getDocument);

// Update document metadata
router.patch('/:id', DocumentsController.updateDocument);

// Delete document
router.delete('/:id', DocumentsController.deleteDocument);

// Get user stats
router.get('/stats/summary', DocumentsController.getStats);

export default router;
