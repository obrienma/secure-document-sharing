import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logsAPI, AccessLog } from '../services/logs';
import { linksAPI, UserLink } from '../services/links';

export default function AccessLogs() {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [link, setLink] = useState<UserLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (linkId) {
      loadData();
    }
  }, [linkId]);

  const loadData = async () => {
    if (!linkId) return;

    try {
      setIsLoading(true);
      const [fetchedLogs, allLinks] = await Promise.all([
        logsAPI.getLinkLogs(parseInt(linkId)),
        linksAPI.getAll(),
      ]);
      
      setLogs(fetchedLogs);
      const foundLink = allLinks.find(l => l.id === parseInt(linkId));
      setLink(foundLink || null);
    } catch (err) {
      setError('Failed to load access logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = filterType === 'all' 
    ? logs 
    : logs.filter(log => log.access_type === filterType);

  const successCount = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={user?.full_name || ''} onLogout={logout} onNavigate={navigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => navigate('/links')} />

        {link && <LinkInfo link={link} />}

        <PageHeader 
          totalLogs={logs.length} 
          successCount={successCount}
          failedCount={failedCount}
        />

        {error && <ErrorMessage message={error} />}

        <FilterBar value={filterType} onChange={setFilterType} />

        {isLoading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <LogsTable logs={filteredLogs} />
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
              <button
                onClick={() => onNavigate('/links')}
                className="text-gray-600 hover:text-gray-900"
              >
                Links
              </button>
              <button className="text-indigo-600 font-medium">Access Logs</button>
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
    >
      ← Back to Links
    </button>
  );
}

function LinkInfo({ link }: { link: UserLink }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{link.filename}</h3>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
        <span>👁️ {link.viewCount} total views</span>
        {link.hasPassword && <span>🔒 Password protected</span>}
        {!link.allowDownload && <span>🚫 No download</span>}
      </div>
    </div>
  );
}

function PageHeader({ 
  totalLogs, 
  successCount, 
  failedCount 
}: { 
  totalLogs: number; 
  successCount: number;
  failedCount: number;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-gray-900">Access Logs</h2>
      <p className="text-gray-600 mt-1">
        {totalLogs} total accesses • {successCount} successful • {failedCount} failed
      </p>
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

function FilterBar({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="mb-6 flex gap-2">
      <button
        onClick={() => onChange('all')}
        className={`px-4 py-2 rounded-lg transition-colors ${
          value === 'all'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onChange('view')}
        className={`px-4 py-2 rounded-lg transition-colors ${
          value === 'view'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Views
      </button>
      <button
        onClick={() => onChange('download')}
        className={`px-4 py-2 rounded-lg transition-colors ${
          value === 'download'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Downloads
      </button>
      <button
        onClick={() => onChange('failed_password')}
        className={`px-4 py-2 rounded-lg transition-colors ${
          value === 'failed_password'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Failed Attempts
      </button>
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
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No access logs yet</h3>
      <p className="text-gray-600">This link hasn't been accessed yet</p>
    </div>
  );
}

function LogsTable({ logs }: { logs: AccessLog[] }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'view': return '👁️';
      case 'download': return '⬇️';
      case 'failed_password': return '🔒';
      default: return '📝';
    }
  };

  const getAccessTypeName = (type: string) => {
    switch (type) {
      case 'view': return 'View';
      case 'download': return 'Download';
      case 'failed_password': return 'Failed Password';
      default: return type;
    }
  };

  const truncateUserAgent = (ua: string) => {
    if (ua.length <= 50) return ua;
    return ua.substring(0, 50) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User Agent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className={!log.success ? 'bg-red-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(log.accessed_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="flex items-center gap-2">
                  {getAccessTypeIcon(log.access_type)}
                  {getAccessTypeName(log.access_type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                {log.ip_address}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span title={log.user_agent}>
                  {truncateUserAgent(log.user_agent)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {log.success ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Success
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Failed
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
