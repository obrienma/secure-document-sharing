import { ShareService } from '../share.service';
import { LinksService } from '../../links/links.service';

jest.mock('../../links/links.service');

const mockLinksService = LinksService as jest.Mocked<typeof LinksService>;

describe('ShareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyLinkAccess', () => {
    it('should verify access without password', async () => {
      const mockResult = {
        valid: true,
        requiresPassword: false,
        link: { id: 1, document_id: 1 },
        document: { original_filename: 'test.pdf' },
      };

      mockLinksService.verifyLinkAccess.mockResolvedValueOnce(mockResult as any);

      const result = await ShareService.verifyLinkAccess('token123');

      expect(mockLinksService.verifyLinkAccess).toHaveBeenCalledWith('token123', undefined);
      expect(result.valid).toBe(true);
    });

    it('should verify access with correct password', async () => {
      const mockResult = {
        valid: true,
        requiresPassword: false,
        link: { id: 1 },
        document: {},
      };

      mockLinksService.verifyLinkAccess.mockResolvedValueOnce(mockResult as any);

      const result = await ShareService.verifyLinkAccess('token123', 'secret');

      expect(mockLinksService.verifyLinkAccess).toHaveBeenCalledWith('token123', 'secret');
      expect(result.valid).toBe(true);
    });

    it('should indicate when password is required', async () => {
      const mockResult = {
        valid: false,
        reason: 'Password required',
      };

      mockLinksService.verifyLinkAccess.mockResolvedValueOnce(mockResult as any);

      const result = await ShareService.verifyLinkAccess('token123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Password required');
    });
  });
});
