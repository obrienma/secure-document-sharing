import pool from '../db/database';
import fs from 'fs';
import path from 'path';

export interface Document {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface CreateDocumentData {
  userId: number;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
}

export class DocumentsService {
  static async createDocument(data: CreateDocumentData): Promise<Document> {
    const result = await pool.query(
      `INSERT INTO documents
       (user_id, filename, original_filename, file_path, file_size, mime_type, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.userId,
        data.filename,
        data.originalFilename,
        data.filePath,
        data.fileSize,
        data.mimeType,
        data.description || null,
      ]
    );

    return result.rows[0];
  }

  static async getUserDocuments(userId: number): Promise<Document[]> {
    const result = await pool.query(
      `SELECT * FROM documents
       WHERE user_id = $1 AND is_deleted = false
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  static async getDocumentById(documentId: number, userId: number): Promise<Document | null> {
    const result = await pool.query(
      `SELECT * FROM documents
       WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [documentId, userId]
    );

    return result.rows[0] || null;
  }

  static async updateDocument(
    documentId: number,
    userId: number,
    updates: { description?: string }
  ): Promise<Document | null> {
    const result = await pool.query(
      `UPDATE documents
       SET description = COALESCE($1, description)
       WHERE id = $2 AND user_id = $3 AND is_deleted = false
       RETURNING *`,
      [updates.description, documentId, userId]
    );

    return result.rows[0] || null;
  }

  static async deleteDocument(documentId: number, userId: number): Promise<boolean> {
    // Soft delete - mark as deleted
    const result = await pool.query(
      `UPDATE documents
       SET is_deleted = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Optionally delete physical file
    const document = result.rows[0];
    try {
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }
    } catch (error) {
      console.error('Failed to delete physical file:', error);
      // Continue anyway - database record is marked deleted
    }

    return true;
  }

  static async getDocumentStats(userId: number) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_documents,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_uploads
       FROM documents
       WHERE user_id = $1 AND is_deleted = false`,
      [userId]
    );

    return {
      totalDocuments: parseInt(result.rows[0].total_documents),
      totalSize: parseInt(result.rows[0].total_size || '0'),
      recentUploads: parseInt(result.rows[0].recent_uploads),
    };
  }
}
