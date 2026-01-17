import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentsService } from './documents.service';
import path from 'path';

const updateDocumentSchema = z.object({
  description: z.string().max(500).optional(),
});

export class DocumentsController {
  static async uploadDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const document = await DocumentsService.createDocument({
        userId: req.userId,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: req.body.description,
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        document: {
          id: document.id,
          filename: document.original_filename,
          size: document.file_size,
          type: document.mime_type,
          description: document.description,
          createdAt: document.created_at,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  static async getUserDocuments(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documents = await DocumentsService.getUserDocuments(req.userId);

      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.original_filename,
          size: doc.file_size,
          type: doc.mime_type,
          description: doc.description,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        })),
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  static async getDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      const document = await DocumentsService.getDocumentById(documentId, req.userId);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({
        document: {
          id: document.id,
          filename: document.original_filename,
          size: document.file_size,
          type: document.mime_type,
          description: document.description,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
        },
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }

  static async updateDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      const validated = updateDocumentSchema.parse(req.body);

      const document = await DocumentsService.updateDocument(
        documentId,
        req.userId,
        validated
      );

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({
        message: 'Document updated successfully',
        document: {
          id: document.id,
          filename: document.original_filename,
          description: document.description,
          updatedAt: document.updated_at,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error updating document:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }

  static async deleteDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      const deleted = await DocumentsService.deleteDocument(documentId, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const stats = await DocumentsService.getDocumentStats(req.userId);

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }
}
