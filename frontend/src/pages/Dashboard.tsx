import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, Document } from '../services/documents';
import UploadModal from '../components/UploadModal';
import DocumentCard from '../components/DocumentCard';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentsAPI.getAll();
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File, description: string) => {
    await documentsAPI.upload(file, description);
    await loadDocuments();
  };

  const handleDelete = async (id: number) => {
    try {
      await documentsAPI.delete(id);
      await loadDocuments();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleShare = (document: Document) => {
    alert(`Share feature coming soon for: ${document.filename}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={user?.full_name || ''} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader 
          documentCount={documents.length} 
          onUploadClick={() => setIsUploadModalOpen(true)} 
        />

        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <LoadingState />
        ) : documents.length === 0 ? (
          <EmptyState onUploadClick={() => setIsUploadModalOpen(true)} />
        ) : (
          <DocumentGrid 
            documents={documents} 
            onDelete={handleDelete} 
            onShare={handleShare} 
          />
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

function Header({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">🔒 DocShare</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {userName}</span>
            <button
              onClick={onLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function DashboardHeader({ documentCount, onUploadClick }: { documentCount: number; onUploadClick: () => void }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Documents</h2>
        <p className="text-gray-600 mt-1">
          {documentCount} {documentCount === 1 ? 'document' : 'documents'}
        </p>
      </div>
      <button
        onClick={onUploadClick}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
      >
        <span>+</span>
        <span>Upload Document</span>
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading documents...</p>
    </div>
  );
}

function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <p className="text-xl text-gray-600 mb-4">No documents yet</p>
      <p className="text-gray-500 mb-6">Upload your first document to get started</p>
      <button
        onClick={onUploadClick}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
      >
        Upload Document
      </button>
    </div>
  );
}

function DocumentGrid({ 
  documents, 
  onDelete, 
  onShare 
}: { 
  documents: Document[]; 
  onDelete: (id: number) => void; 
  onShare: (doc: Document) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  );
}
