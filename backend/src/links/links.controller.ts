import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { LinksService } from './links.service';

const createLinkSchema = z.object({
  documentId: z.number().int().positive(),
  password: z.string().min(4).max(100).optional(),
  expiresIn: z.number().int().positive().max(8760).optional(), // max 1 year in hours
  maxViews: z.number().int().positive().optional(),
  allowDownload: z.boolean().optional(),
});

export class LinksController {
  static async createLink(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validated = createLinkSchema.parse(req.body);

      const link = await LinksService.createLink({
        ...validated,
        userId: req.userId,
      });

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${link.link_token}`;

      res.status(201).json({
        message: 'Shareable link created successfully',
        link: {
          id: link.id,
          token: link.link_token,
          shareUrl,
          hasPassword: !!link.password_hash,
          expiresAt: link.expires_at,
          maxViews: link.max_views,
          allowDownload: link.allow_download,
          createdAt: link.created_at,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message === 'Document not found or access denied') {
          return res.status(404).json({ error: error.message });
        }
      }

      console.error('Error creating link:', error);
      res.status(500).json({ error: 'Failed to create link' });
    }
  }

  static async getUserLinks(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const links = await LinksService.getUserLinks(req.userId);

      res.json({ links });
    } catch (error) {
      console.error('Error fetching links:', error);
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  }

  static async deactivateLink(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const linkId = parseInt(req.params.id);

      if (isNaN(linkId)) {
        return res.status(400).json({ error: 'Invalid link ID' });
      }

      const deactivated = await LinksService.deactivateLink(linkId, req.userId);

      if (!deactivated) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.json({ message: 'Link deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating link:', error);
      res.status(500).json({ error: 'Failed to deactivate link' });
    }
  }

  static async getLinkAccessLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const linkId = parseInt(req.params.id);

      if (isNaN(linkId)) {
        return res.status(400).json({ error: 'Invalid link ID' });
      }

      const logs = await LinksService.getLinkAccessLogs(linkId, req.userId);

      res.json({ logs });
    } catch (error) {
      if (error instanceof Error && error.message === 'Link not found or access denied') {
        return res.status(404).json({ error: error.message });
      }

      console.error('Error fetching access logs:', error);
      res.status(500).json({ error: 'Failed to fetch access logs' });
    }
  }
}
