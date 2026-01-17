import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/database';

const SALT_ROUNDS = 10;

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const { email, password, fullName } = data;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
      [email, passwordHash, fullName]
    );

    const user = result.rows[0];
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  static async login(data: LoginData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = this.generateToken(user.id, user.email);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  static async getUserById(userId: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    return result.rows[0] || null;
  }

  private static generateToken(userId: number, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn: '7d' }
    );
  }
}
