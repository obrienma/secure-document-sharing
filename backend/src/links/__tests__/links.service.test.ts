import { LinksService } from '../links.service';
import pool from '../../db/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

jest.mock('../../db/database', () => ({
  query: jest.fn(),
}));
jest.mock('bcrypt');
jest.mock('crypto');

const mockPool = pool as jest.Mocked<typeof pool>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('LinksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('should create a shareable link with all options', async () => {
      const mockDocument = { id: 1 };
      const mockLink = {
        id: 1,
        document_id: 1,
        user_id: 1,
        link_token: 'abc123token',
        password_hash: 'hashed_password',
        expires_at: new Date('2026-01-25'),
        max_views: 10,
        view_count: 0,
        allow_download: true,
        created_at: new Date(),
      };

      // @ts-ignore
      mockPool.query
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockDocument] } as any) // doc check
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any); // insert link

      mockCrypto.randomBytes = jest.fn().mockReturnValue({
        toString: () => 'abc123token',
      } as any);
      mockBcrypt.hash.mockResolvedValueOnce('hashed_password' as never);

      const result = await LinksService.createLink({
        documentId: 1,
        userId: 1,
        password: 'secret123',
        expiresIn: 24,
        maxViews: 10,
        allowDownload: true,
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('secret123', 10);
      expect(result).toMatchObject({
        id: 1,
        link_token: 'abc123token',
      });
    });

    it('should throw error for non-existent document', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query// @ts-ignore
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        LinksService.createLink({
          documentId: 999,
          userId: 1,
        })
      ).rejects.toThrow('Document not found or access denied');
    });

    it('should create link without optional parameters', async () => {
      const mockDocument = { id: 1 };
      const mockLink = {
        id: 1,
        document_id: 1,
        link_token: 'token123',
        password_hash: null,
        expires_at: null,
        max_views: null,
        allow_download: true,
      };

      // @ts-ignore
      mockPool.query
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockDocument] } as any)
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any);

      mockCrypto.randomBytes = jest.fn().mockReturnValue({
        toString: () => 'token123',
      } as any);

      const result = await LinksService.createLink({
        documentId: 1,
        userId: 1,
      });

      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(result.password_hash).toBeNull();
      expect(result.expires_at).toBeNull();
    });
  });

  describe('verifyLinkAccess', () => {
    it('should verify valid link access', async () => {
      const mockLink = {
        id: 1,
        document_id: 1,
        link_token: 'token123',
        password_hash: null,
        expires_at: null,
        max_views: null,
        view_count: 5,
        allow_download: true,
      };

      const mockDocument = {
        id: 1,
        original_filename: 'test.pdf',
        file_path: '/uploads/test.pdf',
      };

      // @ts-ignore
      mockPool.query
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any) // get link
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockDocument] } as any); // get document

      const result = await LinksService.verifyLinkAccess('token123');

      expect(result.valid).toBe(true);
      expect(result.link).toMatchObject(mockLink);
      expect(result.document).toMatchObject(mockDocument);
    });

    it('should reject expired link', async () => {
      const mockLink = {
        id: 1,
        expires_at: new Date('2020-01-01'), // expired
        max_views: null,
        view_count: 0,
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query// @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any);

      const result = await LinksService.verifyLinkAccess('token123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Link has expired');
    });

    it('should reject link that reached max views', async () => {
      const mockLink = {
        id: 1,
        expires_at: null,
        max_views: 10,
        view_count: 10, // reached limit
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query// @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any);

      const result = await LinksService.verifyLinkAccess('token123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Maximum views reached');
    });

    it('should reject link with incorrect password', async () => {
      const mockLink = {
        id: 1,
        password_hash: 'hashed_password',
        expires_at: null,
        max_views: null,
        view_count: 0,
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query// @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any);
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      const result = await LinksService.verifyLinkAccess('token123', 'wrong_password');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid password');
    });

    it('should accept link with correct password', async () => {
      const mockLink = {
        id: 1,
        document_id: 1,
        password_hash: 'hashed_password',
        expires_at: null,
        max_views: null,
        view_count: 0,
      };

      const mockDocument = { id: 1, original_filename: 'test.pdf' };

      // @ts-ignore
      mockPool.query
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockLink] } as any)
        // @ts-ignore
        .mockResolvedValueOnce({ rows: [mockDocument] } as any);
      
      mockBcrypt.compare.mockResolvedValueOnce(true as never);

      const result = await LinksService.verifyLinkAccess('token123', 'correct_password');

      expect(result.valid).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('correct_password', 'hashed_password');
    });
  });

  describe('recordAccess', () => {
    it('should record access and increment view count', async () => {
      // @ts-ignore
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await LinksService.recordAccess(1, '192.168.1.1', 'Mozilla', 'view', true);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO access_logs'),
        [1, '192.168.1.1', 'Mozilla', 'view', true]
      );
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE shared_links'),
        [1]
      );
    });

    it('should not increment view count for failed access', async () => {
      // @ts-ignore
      mockPool.query.mockResolvedValue({ rows: [] } as any);

      await LinksService.recordAccess(1, '192.168.1.1', 'Mozilla', 'failed_password', false);

      expect(mockPool.query).toHaveBeenCalledTimes(1); // only log, no update
    });
  });
});
