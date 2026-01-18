import { useState, FormEvent } from 'react';
import { linksAPI, CreateLinkData } from '../services/links';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  documentName: string;
}

export default function ShareModal({ isOpen, onClose, documentId, documentName }: ShareModalProps) {
  const [expiresInHours, setExpiresInHours] = useState<string>('24');
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const data: CreateLinkData = {
        documentId,
        allowDownload,
      };

      if (expiresInHours) {
        data.expiresInHours = parseInt(expiresInHours);
      }
      if (password) {
        data.password = password;
      }
      if (maxViews) {
        data.maxViews = parseInt(maxViews);
      }

      const link = await linksAPI.create(data);
      const shareUrl = `${window.location.origin}/share/${link.token}`;
      setGeneratedLink(shareUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setExpiresInHours('24');
    setPassword('');
    setMaxViews('');
    setAllowDownload(true);
    setGeneratedLink(null);
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <ModalHeader documentName={documentName} onClose={handleClose} disabled={isCreating} />

        {generatedLink ? (
          <GeneratedLinkView link={generatedLink} copied={copied} onCopy={handleCopyLink} onClose={handleClose} />
        ) : (
          <ShareForm
            expiresInHours={expiresInHours}
            setExpiresInHours={setExpiresInHours}
            password={password}
            setPassword={setPassword}
            maxViews={maxViews}
            setMaxViews={setMaxViews}
            allowDownload={allowDownload}
            setAllowDownload={setAllowDownload}
            error={error}
            isCreating={isCreating}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </div>
    </div>
  );
}

function ModalHeader({
  documentName,
  onClose,
  disabled
}: {
  documentName: string;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Share Document</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={disabled}>
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-1">{documentName}</p>
    </div>
  );
}

function ShareForm({
  expiresInHours,
  setExpiresInHours,
  password,
  setPassword,
  maxViews,
  setMaxViews,
  allowDownload,
  setAllowDownload,
  error,
  isCreating,
  onSubmit,
  onCancel,
}: {
  expiresInHours: string;
  setExpiresInHours: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  maxViews: string;
  setMaxViews: (val: string) => void;
  allowDownload: boolean;
  setAllowDownload: (val: boolean) => void;
  error: string;
  isCreating: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <NumberInput
        id="expiresInHours"
        label="Expires In (hours)"
        value={expiresInHours}
        onChange={setExpiresInHours}
        placeholder="24"
        helpText="Leave empty for no expiration"
      />

      <TextInput
        id="password"
        label="Password (optional)"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Optional password protection"
      />

      <NumberInput
        id="maxViews"
        label="Maximum Views (optional)"
        value={maxViews}
        onChange={setMaxViews}
        placeholder="Unlimited"
        helpText="Leave empty for unlimited views"
      />

      <CheckboxInput
        id="allowDownload"
        label="Allow Download"
        checked={allowDownload}
        onChange={setAllowDownload}
      />

      <FormActions isCreating={isCreating} onCancel={onCancel} />
    </form>
  );
}

function GeneratedLinkView({
  link,
  copied,
  onCopy,
  onClose
}: {
  link: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        Share link created successfully!
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <button
            type="button"
            onClick={onCopy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Done
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

function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  helpText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder={placeholder}
      />
      {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}

function TextInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  );
}

function CheckboxInput({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}

function FormActions({
  isCreating,
  onCancel
}: {
  isCreating: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex space-x-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isCreating}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isCreating}
        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating...' : 'Create Link'}
      </button>
    </div>
  );
}
