import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import { AuthService } from '../auth.service';

// Mock the service
jest.mock('../auth.service');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          created_at: new Date(),
        },
        token: 'mock_token',
      };

      mockAuthService.register.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token', 'mock_token');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        full_name: 'Test User',
      });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      mockAuthService.register.mockRejectedValueOnce(new Error('Email already registered'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          created_at: new Date(),
        },
        token: 'mock_token',
      };

      mockAuthService.login.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'mock_token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // missing password
        });

      expect(response.status).toBe(400);
    });
  });
});
