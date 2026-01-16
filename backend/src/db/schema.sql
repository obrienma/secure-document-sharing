-- DocShare Database Schema
-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS shared_links CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Create indexes for common queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Shared links table
CREATE TABLE shared_links (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_token VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    expires_at TIMESTAMP,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    allow_download BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for efficient link lookups
CREATE INDEX idx_shared_links_token ON shared_links(link_token);
CREATE INDEX idx_shared_links_document_id ON shared_links(document_id);
CREATE INDEX idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX idx_shared_links_expires_at ON shared_links(expires_at);

-- Access logs table
CREATE TABLE access_logs (
    id SERIAL PRIMARY KEY,
    shared_link_id INTEGER NOT NULL REFERENCES shared_links(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    access_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'failed_password'
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT true
);

-- Create indexes for log queries
CREATE INDEX idx_access_logs_shared_link_id ON access_logs(shared_link_id);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample user for testing (password: 'password123')
INSERT INTO users (email, password_hash, full_name) VALUES
('test@example.com', '$2b$10$rqYvKzKzKzKzKzKzKzKzK.VUhV5qVJxJxJxJxJxJxJxJxJxJxJxJx', 'Test User');

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE documents IS 'Stores metadata for uploaded documents';
COMMENT ON TABLE shared_links IS 'Stores shareable link configurations and access controls';
COMMENT ON TABLE access_logs IS 'Audit trail of all document access attempts';

COMMENT ON COLUMN shared_links.link_token IS 'Unique token used in shareable URL';
COMMENT ON COLUMN shared_links.password_hash IS 'Optional bcrypt hash for password-protected links';
COMMENT ON COLUMN shared_links.expires_at IS 'Null means no expiration';
COMMENT ON COLUMN shared_links.max_views IS 'Null means unlimited views';
