import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      // Validate input
      const validated = registerSchema.parse(req.body);

      // Register user
      const { user, token } = await AuthService.register(validated);

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message === 'Email already registered') {
          return res.status(409).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Validate input
      const validated = loginSchema.parse(req.body);

      // Login user
      const { user, token } = await AuthService.login(validated);

      res.json({
        message: 'Login successful',
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
      }

      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await AuthService.getUserById(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  }
}
