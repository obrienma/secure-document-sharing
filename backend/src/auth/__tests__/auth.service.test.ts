import { AuthService } from '../auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/database';

// Mock dependencies
jest.mock('../../db/database', () => ({
  query: jest.fn(),
}));
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPool = pool as jest.Mocked<typeof pool>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        created_at: new Date(),
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // Check for existing user
      mockBcrypt.hash.mockResolvedValueOnce('hashed_password' as never);
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any); // Insert user
      mockJwt.sign.mockReturnValueOnce('mock_token' as never);

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPool.query).toHaveBeenCalledWith(D
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'hashed_password', 'Test User']
      );
      expect(result).toHaveProperty('token', 'mock_token');
      expect(result.user).toMatchObject({
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
      });
    });

    it('should throw error if email already exists', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any); // User exists

      await expect(
        AuthService.register({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Test User',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        created_at: new Date(),
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      mockJwt.sign.mockReturnValueOnce('mock_token' as never);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toHaveProperty('token', 'mock_token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error for invalid email', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        AuthService.login({
          email: 'wrong@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrong_password',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        created_at: new Date(),
      };

      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await AuthService.getUserById(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(result).toMatchObject(mockUser);
    });

    it('should return null for non-existent user', async () => {
      // @ts-ignore
      // @ts-ignore
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await AuthService.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
