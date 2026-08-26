'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { X, ShieldCheck, Cloud, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: typeof window !== 'undefined' ? window.location.origin : '/',
      });
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err?.message || 'Error al iniciar sesión con Google. Revisa tus credenciales en el .env');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-panel shadow-2xl p-6 overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gengar/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blood/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-inkdim hover:text-ink hover:bg-panel2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl border border-lineHighlight bg-panel2 flex items-center justify-center shadow-panel p-2">
            <img src="/pokedoom-logo.png" alt="PokéDOOM" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-ink uppercase tracking-wider">
              Acceso PokéDOOM
            </h2>
            <p className="text-xs font-mono text-inkdim mt-1">
              Inicia sesión con tu cuenta de Google para guardar y sincronizar tus colecciones en la nube.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-blood/10 border border-blood/40 text-blood font-mono text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-panel2 hover:bg-panel3 border border-line hover:border-lineHighlight text-ink font-mono text-xs uppercase tracking-wider font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-fire" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
            )}
            Continuar con Google
          </button>
        </div>

        {/* Benefits list */}
        <div className="mt-6 pt-5 border-t border-line flex flex-col gap-2.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-inkdim">
            Beneficios de iniciar sesión:
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-ink/80">
            <Cloud className="w-3.5 h-3.5 text-volt" />
            <span>Guarda colecciones ilimitadas en Turso DB</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink/80">
            <Sparkles className="w-3.5 h-3.5 text-fire" />
            <span>Sincroniza tus sprites y mapas entre navegadores</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink/80">
            <ShieldCheck className="w-3.5 h-3.5 text-grid" />
            <span>Modo Local-First: nunca pierdes tu trabajo offline</span>
          </div>
        </div>

        <p className="mt-5 text-[10px] font-mono text-center text-inkdim/60">
          PokéDOOM Asset Engine · Autenticación segura vía Better Auth
        </p>
      </div>
    </div>
  );
}
