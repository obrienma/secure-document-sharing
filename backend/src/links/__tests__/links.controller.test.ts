import request from 'supertest';
import express from 'express';
import linksRoutes from '../links.routes';
import { LinksService } from '../links.service';
import { authenticate } from '../../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';

// Mock dependencies
jest.mock('../links.service');
jest.mock('../../middleware/auth.middleware');

const mockLinksService = LinksService as jest.Mocked<typeof LinksService>;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

// Mock authenticate to always allow requests with userId
mockAuthenticate.mockImplementation((req: AuthRequest, res: Response, next: NextFunction) => {
  req.userId = 1;
  next();
  return undefined as any;
});

const app = express();
app.use(express.json());
app.use('/api/links', linksRoutes);

describe('Links Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/links', () => {
    it('should create a shareable link', async () => {
      const mockLink = {
        id: 1,
        document_id: 1,
        link_token: 'abc123token',
        expires_at: null,
        max_views: null,
        allow_download: true,
        created_at: new Date(),
      };

      mockLinksService.createLink.mockResolvedValueOnce(mockLink as any);

      const response = await request(app)
        .post('/api/links')
        .send({
          documentId: 1,
          password: 'secret123',
          expiresIn: 24,
          maxViews: 10,
          allowDownload: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Shareable link created successfully');
      expect(response.body.link.token).toBe('abc123token');
      expect(mockLinksService.createLink).toHaveBeenCalledWith({
        documentId: 1,
        userId: 1,
        password: 'secret123',
        expiresIn: 24,
        maxViews: 10,
        allowDownload: true,
      });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/links')
        .send({
          documentId: 'invalid', // should be number
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/links', () => {
    it('should return all links for authenticated user', async () => {
      const mockLinks = [
        { id: 1, link_token: 'token1', view_count: 5 },
        { id: 2, link_token: 'token2', view_count: 10 },
      ];

      mockLinksService.getUserLinks.mockResolvedValueOnce(mockLinks as any);

      const response = await request(app).get('/api/links');

      expect(response.status).toBe(200);
      expect(response.body.links).toHaveLength(2);
      expect(mockLinksService.getUserLinks).toHaveBeenCalledWith(1);
    });
  });

  describe('DELETE /api/links/:id', () => {
    it('should deactivate a link', async () => {
      mockLinksService.deactivateLink.mockResolvedValueOnce(true);

      const response = await request(app).delete('/api/links/1');

      expect(response.status).toBe(200);
      expect(mockLinksService.deactivateLink).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 for non-existent link', async () => {
      mockLinksService.deactivateLink.mockResolvedValueOnce(false);

      const response = await request(app).delete('/api/links/999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/links/:id/logs', () => {
    it('should return access logs for a link', async () => {
      const mockLogs = [
        {
          id: 1,
          link_id: 1,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla',
          access_type: 'view',
          success: true,
          accessed_at: new Date(),
        },
        {
          id: 2,
          link_id: 1,
          ip_address: '192.168.1.2',
          user_agent: 'Chrome',
          access_type: 'download',
          success: true,
          accessed_at: new Date(),
        },
      ];

      mockLinksService.getLinkAccessLogs.mockResolvedValueOnce(mockLogs as any);

      const response = await request(app).get('/api/links/1/logs');

      expect(response.status).toBe(200);
      expect(response.body.logs).toHaveLength(2);
      expect(mockLinksService.getLinkAccessLogs).toHaveBeenCalledWith(1, 1);
    });
  });
});
