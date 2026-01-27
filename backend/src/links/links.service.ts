import pool from '../db/database';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export interface SharedLink {
  id: number;
  document_id: number;
  user_id: number;
  link_token: string;
  password_hash?: string;
  expires_at?: Date;
  max_views?: number;
  view_count: number;
  allow_download: boolean;
  created_at: Date;
  last_accessed?: Date;
  is_active: boolean;
}

export interface CreateLinkData {
  documentId: number;
  userId: number;
  password?: string;
  expiresIn?: number; // hours
  maxViews?: number;
  allowDownload?: boolean;
}

export class LinksService {
  static async createLink(data: CreateLinkData): Promise<SharedLink> {
    // Verify document belongs to user
    const docCheck = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2 AND is_deleted = false',
      [data.documentId, data.userId]
    );

    if (docCheck.rows.length === 0) {
      throw new Error('Document not found or access denied');
    }

    // Generate unique token
    const linkToken = crypto.randomBytes(32).toString('hex');

    // Hash password if provided
    let passwordHash = null;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Calculate expiration
    let expiresAt = null;
    if (data.expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + data.expiresIn);
    }

    const result = await pool.query(
      `INSERT INTO shared_links
       (document_id, user_id, link_token, password_hash, expires_at, max_views, allow_download)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.documentId,
        data.userId,
        linkToken,
        passwordHash,
        expiresAt,
        data.maxViews || null,
        data.allowDownload !== false, // default true
      ]
    );

    return result.rows[0];
  }

  static async getUserLinks(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        sl.*,
        d.original_filename,
        d.file_size,
        d.mime_type
       FROM shared_links sl
       JOIN documents d ON sl.document_id = d.id
       WHERE sl.user_id = $1 AND sl.is_active = true
       ORDER BY sl.created_at DESC`,
      [userId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      filename: row.original_filename,
      linkToken: row.link_token,
      hasPassword: !!row.password_hash,
      expiresAt: row.expires_at,
      maxViews: row.max_views,
      viewCount: row.view_count,
      allowDownload: row.allow_download,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed,
      isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
    }));
  }

  static async getLinkByToken(token: string): Promise<SharedLink | null> {
    const result = await pool.query(
      'SELECT * FROM shared_links WHERE link_token = $1 AND is_active = true',
      [token]
    );

    return result.rows[0] || null;
  }

  static async verifyLinkAccess(token: string, password?: string): Promise<{
    valid: boolean;
    reason?: string;
    link?: SharedLink;
    document?: any;
  }> {
    const link = await this.getLinkByToken(token);

    if (!link) {
      return { valid: false, reason: 'Link not found' };
    }

    // Check if expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { valid: false, reason: 'Link has expired' };
    }

    // Check view limit
    if (link.max_views && link.view_count >= link.max_views) {
      return { valid: false, reason: 'Maximum views reached' };
    }

    // Check password
    if (link.password_hash) {
      if (!password) {
        return { valid: false, reason: 'Password required' };
      }

      const isValidPassword = await bcrypt.compare(password, link.password_hash);
      if (!isValidPassword) {
        return { valid: false, reason: 'Invalid password' };
      }
    }

    // Get document details
    const docResult = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND is_deleted = false',
      [link.document_id]
    );

    if (docResult.rows.length === 0) {
      return { valid: false, reason: 'Document not found' };
    }

    return {
      valid: true,
      link,
      document: docResult.rows[0],
    };
  }

  static async recordAccess(
    linkId: number,
    ipAddress: string,
    userAgent: string,
    accessType: 'view' | 'download' | 'failed_password',
    success: boolean = true
  ): Promise<void> {
    // Record access log
    await pool.query(
      `INSERT INTO access_logs
       (shared_link_id, ip_address, user_agent, access_type, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [linkId, ipAddress, userAgent, accessType, success]
    );

    // Update link stats if successful
    if (success && (accessType === 'view' || accessType === 'download')) {
      await pool.query(
        `UPDATE shared_links
         SET view_count = view_count + 1, last_accessed = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [linkId]
      );
    }
  }

  static async deactivateLink(linkId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'UPDATE shared_links SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [linkId, userId]
    );

    return result.rows.length > 0;
  }

  static async getLinkAccessLogs(linkId: number, userId: number): Promise<any[]> {
    // Verify ownership
    const linkCheck = await pool.query(
      'SELECT id FROM shared_links WHERE id = $1 AND user_id = $2',
      [linkId, userId]
    );

    if (linkCheck.rows.length === 0) {
      throw new Error('Link not found or access denied');
    }

    const result = await pool.query(
      `SELECT * FROM access_logs
       WHERE shared_link_id = $1
       ORDER BY accessed_at DESC
       LIMIT 100`,
      [linkId]
    );

    return result.rows;
  }
}
