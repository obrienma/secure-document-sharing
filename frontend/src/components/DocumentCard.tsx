import { Document } from '../services/documents';

interface DocumentCardProps {
  document: Document;
  onDelete: (id: number) => void;
  onShare: (document: Document) => void;
}

export default function DocumentCard({ document, onDelete, onShare }: DocumentCardProps) {
  const formatFileSize = (sizeStr: string) => {
    const bytes = parseInt(sizeStr);
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <span className="text-3xl">{getFileIcon(document.type)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {document.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(document.size)} · {formatDate(document.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {document.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{document.description}</p>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onShare(document)}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
        >
          Share
        </button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this document?')) {
              onDelete(document.id);
            }
          }}
          className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
