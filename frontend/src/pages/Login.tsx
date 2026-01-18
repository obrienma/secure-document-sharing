import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <AuthHeader 
          title="Sign in to your account" 
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}

          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <SubmitButton isLoading={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </SubmitButton>
        </form>

        <AuthFooter 
          text="Don't have an account?"
          linkText="Sign up"
          linkTo="/register"
        />
      </div>
    </div>
  );
}

function AuthHeader({ title }: { title: string }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🔒 DocShare</h1>
      <p className="text-gray-600">{title}</p>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {message}
    </div>
  );
}

function FormInput({ 
  id, 
  label, 
  type, 
  value, 
  onChange, 
  placeholder 
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
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  );
}

function SubmitButton({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function AuthFooter({ text, linkText, linkTo }: { text: string; linkText: string; linkTo: string }) {
  return (
    <p className="mt-6 text-center text-gray-600">
      {text}{' '}
      <Link to={linkTo} className="text-indigo-600 hover:text-indigo-700 font-medium">
        {linkText}
      </Link>
    </p>
  );
}
