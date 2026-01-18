import { useState, useRef } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, description: string) => Promise<void>;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUpload(file, description);
      setFile(null);
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <ModalHeader onClose={onClose} disabled={isUploading} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <FileInput
            file={file}
            fileInputRef={fileInputRef}
            onChange={handleFileChange}
          />

          <DescriptionInput
            value={description}
            onChange={setDescription}
          />

          <FormActions
            onCancel={onClose}
            isUploading={isUploading}
            hasFile={!!file}
          />
        </form>
      </div>
    </div>
  );
}

function ModalHeader({ onClose, disabled }: { onClose: () => void; disabled: boolean }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700"
        disabled={disabled}
      >
        ✕
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {message}
    </div>
  );
}

function FileInput({
  file,
  fileInputRef,
  onChange
}: {
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select File
      </label>
      <input
        ref={fileInputRef}
        type="file"
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.zip"
      />
      {file && (
        <p className="mt-2 text-sm text-gray-600">
          {file.name} ({formatFileSize(file.size)})
        </p>
      )}
    </div>
  );
}

function DescriptionInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
        Description (optional)
      </label>
      <textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="What is this document about?"
      />
    </div>
  );
}

function FormActions({
  onCancel,
  isUploading,
  hasFile
}: {
  onCancel: () => void;
  isUploading: boolean;
  hasFile: boolean;
}) {
  return (
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isUploading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isUploading || !hasFile}
        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
