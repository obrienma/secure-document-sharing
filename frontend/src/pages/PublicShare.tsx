import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { shareAPI, ShareAccessResponse } from '../services/share';

export default function PublicShare() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareAccessResponse | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyAccess();
  }, [token]);

  const verifyAccess = async (pwd?: string) => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await shareAPI.verifyAccess(token, pwd);
      setData(response);
      
      if (!response.success) {
        setError(response.message || 'Access denied');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify access');
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    await verifyAccess(password);
  };

  const handleDownload = async () => {
    if (!token || !data?.document) return;

    setIsDownloading(true);
    setError('');

    try {
      const blob = await shareAPI.download(token, password || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.document.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data?.success && data?.requiresPassword) {
    return (
      <PasswordPrompt
        onSubmit={handlePasswordSubmit}
        password={password}
        setPassword={setPassword}
        isVerifying={isVerifying}
        error={error}
      />
    );
  }

  if (!data?.success || !data.document) {
    return <ErrorState message={error || 'Document not found'} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <Header />
        
        {error && <ErrorBanner message={error} />}
        
        <DocumentInfo document={data.document} link={data.link} />
        
        {data.link?.allowDownload && (
          <DownloadButton onClick={handleDownload} isDownloading={isDownloading} />
        )}
        
        <Footer viewCount={data.link?.viewCount} maxViews={data.link?.maxViews} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    </div>
  );
}

function PasswordPrompt({
  onSubmit,
  password,
  setPassword,
  isVerifying,
  error,
}: {
  onSubmit: (e: FormEvent) => void;
  password: string;
  setPassword: (val: string) => void;
  isVerifying: boolean;
  error: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 Protected Document</h1>
          <p className="text-gray-600">This document requires a password</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Access Document'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <a
          href="/"
          className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 DocShare</h1>
      <p className="text-gray-600">Secure Document Sharing</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {message}
    </div>
  );
}

function DocumentInfo({
  document,
  link,
}: {
  document: ShareAccessResponse['document'];
  link: ShareAccessResponse['link'];
}) {
  if (!document) return null;

  const formatFileSize = (sizeStr: string) => {
    const bytes = parseInt(sizeStr);
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('zip')) return '📦';
    return '📎';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="text-5xl">{getFileIcon(document.mimeType)}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{document.originalFilename}</h2>
          {document.description && (
            <p className="text-gray-600 mb-3">{document.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>📏 {formatFileSize(document.fileSize)}</span>
            <span>📊 {document.mimeType}</span>
          </div>
          {link?.expiresAt && (
            <ExpirationWarning expiresAt={link.expiresAt} />
          )}
        </div>
      </div>
    </div>
  );
}

function ExpirationWarning({ expiresAt }: { expiresAt: string }) {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (hoursLeft < 0) return null;

  return (
    <div className={`mt-3 px-3 py-2 rounded text-sm ${
      hoursLeft < 24 
        ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }`}>
      ⏰ Expires in {hoursLeft < 24 ? `${hoursLeft} hours` : `${Math.round(hoursLeft / 24)} days`}
    </div>
  );
}

function DownloadButton({
  onClick,
  isDownloading,
}: {
  onClick: () => void;
  isDownloading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isDownloading}
      className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
    >
      {isDownloading ? 'Downloading...' : '⬇️ Download Document'}
    </button>
  );
}

function Footer({
  viewCount,
  maxViews,
}: {
  viewCount?: number;
  maxViews?: number;
}) {
  if (viewCount === undefined) return null;

  return (
    <div className="mt-6 text-center text-sm text-gray-500">
      👁️ Viewed {viewCount} {maxViews ? `of ${maxViews}` : ''} time{viewCount !== 1 ? 's' : ''}
    </div>
  );
}
