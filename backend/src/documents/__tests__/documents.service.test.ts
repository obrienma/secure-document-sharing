import { DocumentsService } from '../documents.service';
import pool from '../../db/database';
import fs from 'fs/promises';

jest.mock('../../db/database', () => ({
  query: jest.fn(),
}));
jest.mock('fs/promises');

const mockPool = pool as jest.Mocked<typeof pool>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocumentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should create a document with file details', async () => {
      const mockDocument = {
        id: 1,
        user_id: 1,
        original_filename: 'test.pdf',
        file_path: '/uploads/test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        created_at: new Date(),
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockDocument] } as any);

      const result = await DocumentsService.createDocument({
        userId: 1,
        filename: 'test.pdf',
        originalFilename: 'test.pdf',
        filePath: '/uploads/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documents'),
        [1, 'test.pdf', 'test.pdf', '/uploads/test.pdf', 1024, 'application/pdf', null]
      );
      expect(result).toMatchObject(mockDocument);
    });
  });

  describe('getUserDocuments', () => {
    it('should return all documents for a user', async () => {
      const mockDocuments = [
        { id: 1, original_filename: 'doc1.pdf', file_size: 1024 },
        { id: 2, original_filename: 'doc2.pdf', file_size: 2048 },
      ];

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: mockDocuments } as any);

      const result = await DocumentsService.getUserDocuments(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM documents'),
        [1]
      );
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockDocuments);
    });

    it('should return empty array for user with no documents', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await DocumentsService.getUserDocuments(1);

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentById', () => {
    it('should return document if user has access', async () => {
      const mockDocument = {
        id: 1,
        user_id: 1,
        original_filename: 'test.pdf',
        file_path: '/uploads/test.pdf',
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockDocument] } as any);

      const result = await DocumentsService.getDocumentById(1, 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND user_id = $2'),
        [1, 1]
      );
      expect(result).toMatchObject(mockDocument);
    });

    it('should return null if document not found or access denied', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await DocumentsService.getDocumentById(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete document', async () => {
      const mockDocument = {
        id: 1,
        user_id: 1,
        is_deleted: true,
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockDocument] } as any);

      const result = await DocumentsService.deleteDocument(1, 1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE documents'),
        [1, 1]
      );
      expect(result).toBe(true);
    });

    it('should return false if document not found', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await DocumentsService.deleteDocument(1, 999);

      expect(result).toBe(false);
    });
  });
});
