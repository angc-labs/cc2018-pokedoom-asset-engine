'use client';

import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { User, LogOut, Cloud, ShieldAlert, LogIn, ChevronDown, CheckCircle2 } from 'lucide-react';
import AuthModal from './AuthModal';

interface Props {
  onOpenCollections?: () => void;
}

export default function UserNav({ onOpenCollections }: Props) {
  const { data: session, isPending } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isPending) {
    return (
      <div className="h-8 w-24 bg-panel2 animate-pulse rounded-lg border border-line" />
    );
  }

  const user = session?.user;

  return (
    <>
      <div className="relative">
        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-line bg-panel2 hover:bg-panel3 hover:border-lineHighlight transition-all"
            >
              {user.image ? (
                <img src={user.image} alt={user.name || 'User'} className="w-5 h-5 rounded-full border border-line" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gengar text-void flex items-center justify-center font-mono text-[10px] font-bold">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-mono text-xs text-ink max-w-28 truncate">{user.name || user.email}</span>
              <ChevronDown className="w-3 h-3 text-inkdim" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-panel2 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-line mb-1">
                  <p className="font-mono text-xs font-bold text-ink truncate">{user.name}</p>
                  <p className="font-mono text-[10px] text-inkdim truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-grid">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Nube activa (Turso)</span>
                  </div>
                </div>

                {onOpenCollections && (
                  <button
                    onClick={onOpenCollections}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs text-ink hover:bg-panel3 text-left transition-colors"
                  >
                    <Cloud className="w-3.5 h-3.5 text-volt" />
                    <span>Mis Colecciones</span>
                  </button>
                )}

                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs text-blood hover:bg-blood/10 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-lava to-blood text-white font-mono text-xs uppercase tracking-wider font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
