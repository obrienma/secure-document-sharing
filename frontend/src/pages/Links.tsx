import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { linksAPI, UserLink } from '../services/links';

export default function Links() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDocument, setFilterDocument] = useState<string>('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      const fetchedLinks = await linksAPI.getAll();
      setLinks(fetchedLinks);
    } catch (err) {
      setError('Failed to load links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (linkId: number) => {
    if (!confirm('Are you sure you want to deactivate this link?')) return;

    try {
      await linksAPI.delete(linkId);
      await loadLinks();
    } catch (err) {
      alert('Failed to delete link');
    }
  };

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    // Could add a toast notification here
  };

  const filteredLinks = filterDocument
    ? links.filter(link => link.filename.toLowerCase().includes(filterDocument.toLowerCase()))
    : links;

  const activeLinks = filteredLinks.filter(link => !link.isExpired);
  const expiredLinks = filteredLinks.filter(link => link.isExpired);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={user?.full_name || ''} onLogout={logout} onNavigate={navigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader linkCount={activeLinks.length} />

        {error && <ErrorMessage message={error} />}

        <SearchBar value={filterDocument} onChange={setFilterDocument} />

        {isLoading ? (
          <LoadingState />
        ) : links.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {activeLinks.length > 0 && (
              <LinkSection
                title="Active Links"
                links={activeLinks}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
            )}

            {expiredLinks.length > 0 && (
              <LinkSection
                title="Expired Links"
                links={expiredLinks}
                onCopy={handleCopy}
                onDelete={handleDelete}
                isExpired
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Header({
  userName,
  onLogout,
  onNavigate,
}: {
  userName: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">🔒 DocShare</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Documents
              </button>
              <button className="text-indigo-600 font-medium">Links</button>
            </div>
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

function PageHeader({ linkCount }: { linkCount: number }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-gray-900">My Share Links</h2>
      <p className="text-gray-600 mt-1">{linkCount} active share links</p>
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

function SearchBar({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Filter by document name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-6xl mb-4">🔗</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No share links yet</h3>
      <p className="text-gray-600">
        Create a share link from your documents to get started
      </p>
    </div>
  );
}

function LinkSection({
  title,
  links,
  onCopy,
  onDelete,
  isExpired = false,
}: {
  title: string;
  links: UserLink[];
  onCopy: (token: string) => void;
  onDelete: (id: number) => void;
  isExpired?: boolean;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {links.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            onCopy={onCopy}
            onDelete={onDelete}
            isExpired={isExpired}
          />
        ))}
      </div>
    </div>
  );
}

function LinkCard({
  link,
  onCopy,
  onDelete,
  isExpired,
}: {
  link: UserLink;
  onCopy: (token: string) => void;
  onDelete: (id: number) => void;
  isExpired: boolean;
}) {
  const navigate = useNavigate();
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpirationStatus = () => {
    if (!link.expiresAt) return null;

    const expiryDate = new Date(link.expiresAt);
    const now = new Date();
    const hoursLeft = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursLeft < 0) return { text: 'Expired', color: 'text-red-600' };
    if (hoursLeft < 24) return { text: `${hoursLeft}h left`, color: 'text-orange-600' };
    return { text: `${Math.round(hoursLeft / 24)}d left`, color: 'text-green-600' };
  };

  const expirationStatus = getExpirationStatus();

  return (
    <div
      className={`bg-white border rounded-lg p-4 ${
        isExpired ? 'border-gray-300 opacity-60' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 truncate">{link.filename}</h4>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            <span>👁️ {link.viewCount} views</span>
            {link.maxViews && <span>📊 Max: {link.maxViews}</span>}
            {link.hasPassword && <span>🔒 Password protected</span>}
            {!link.allowDownload && <span>🚫 No download</span>}
            {expirationStatus && (
              <span className={expirationStatus.color}>⏰ {expirationStatus.text}</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Created: {formatDate(link.createdAt)}
            {link.lastAccessed && <> • Last accessed: {formatDate(link.lastAccessed)}</>}
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => navigate(`/links/${link.id}/logs`)}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
          >
            View Logs
          </button>
          {!isExpired && (
            <button
              onClick={() => onCopy(link.linkToken)}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
            >
              Copy Link
            </button>
          )}
          <button
            onClick={() => onDelete(link.id)}
            className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
