import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { userId: string; name: string; email: string; apiKey: string }) => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    try {
      setLoading(true);
      const path = mode === 'signup' ? '/api/users/signup' : '/api/users/login';
      const body: any = { email };
      if (mode === 'signup') body.name = name || email.split('@')[0];
      const res = await fetch(import.meta.env.VITE_API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed');
      onSuccess(json.data);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{mode === 'signup' ? 'Create Account' : 'Sign In'}</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={submit}
            disabled={loading || !email || (mode === 'signup' && !name)}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Continue'}
          </button>
          <button
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="w-full text-sm text-blue-600 hover:underline"
          >
            {mode === 'signup' ? 'I already have an account' : "I'm new here, create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
