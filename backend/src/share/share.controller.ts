import { Request, Response } from 'express';
import { LinksService } from '../links/links.service';
import fs from 'fs';
import path from 'path';

export class ShareController {
  static async accessSharedDocument(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const action = req.query.action as string; // 'view' or 'download'

      // Get client info
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Verify link access
      const verification = await LinksService.verifyLinkAccess(token, password);

      if (!verification.valid) {
        // Log failed attempt
        if (verification.link) {
          await LinksService.recordAccess(
            verification.link.id,
            ipAddress,
            userAgent,
            'failed_password',
            false
          );
        }

        return res.status(403).json({ error: verification.reason });
      }

      const { link, document } = verification;

      if (!link || !document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check download permission
      if (action === 'download' && !link.allow_download) {
        return res.status(403).json({ error: 'Download not allowed for this link' });
      }

      // Check if file exists
      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      // Record access
      const accessType = action === 'download' ? 'download' : 'view';
      await LinksService.recordAccess(
        link.id,
        ipAddress,
        userAgent,
        accessType,
        true
      );

      // Return document info for view, or serve file for download
      if (action === 'download') {
        res.download(document.file_path, document.original_filename);
      } else {
        // Return document metadata
        res.json({
          document: {
            filename: document.original_filename,
            size: document.file_size,
            type: document.mime_type,
            allowDownload: link.allow_download,
            viewCount: link.view_count + 1,
          },
        });
      }
    } catch (error) {
      console.error('Error accessing shared document:', error);
      res.status(500).json({ error: 'Failed to access document' });
    }
  }

  static async checkLinkStatus(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const link = await LinksService.getLinkByToken(token);

      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
      const hasReachedMaxViews = link.max_views ? link.view_count >= link.max_views : false;

      res.json({
        valid: !isExpired && !hasReachedMaxViews,
        requiresPassword: !!link.password_hash,
        expiresAt: link.expires_at,
        viewCount: link.view_count,
        maxViews: link.max_views,
        allowDownload: link.allow_download,
      });
    } catch (error) {
      console.error('Error checking link status:', error);
      res.status(500).json({ error: 'Failed to check link status' });
    }
  }
}
