'use client';

import { LogIn, Wand2, Sparkles } from 'lucide-react';

interface Props {
  onEnterStudio: (tab?: string) => void;
  onOpenPokeApi: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export default function LandingHero({ onEnterStudio, onOpenPokeApi, onOpenAuth, isLoggedIn }: Props) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 relative select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blood/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gengar/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-xl text-center">
        {/* Only the Logo */}
        <div className="w-80 sm:w-[440px] max-w-full drop-shadow-[0_15px_40px_rgba(225,29,72,0.45)] hover:scale-105 transition-transform duration-300">
          <img
            src="/pokedoom-logo.png"
            alt="PokéDOOM"
            className="w-full h-auto object-contain pixel-render"
          />
        </div>

        {/* Action Button */}
        <div>
          {isLoggedIn ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onEnterStudio('sprite')}
                className="px-8 py-3.5 bg-gradient-to-r from-blood via-lava to-fire text-white font-mono text-sm uppercase tracking-widest font-bold rounded-xl flex items-center gap-2.5 hover:brightness-110 active:scale-95 transition-all shadow-2xl glow-lava-orange"
              >
                <Wand2 className="w-4 h-4" />
                Abrir Studio
              </button>
              <button
                onClick={onOpenPokeApi}
                className="px-6 py-3.5 bg-panel2 hover:bg-panel3 border border-gengar/40 text-gengarGlow font-mono text-sm uppercase tracking-widest font-bold rounded-xl flex items-center gap-2 transition-all shadow-panel"
              >
                <Sparkles className="w-4 h-4" />
                PokéAPI
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-8 py-4 bg-gradient-to-r from-blood via-lava to-fire text-white font-mono text-sm uppercase tracking-widest font-bold rounded-xl flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-2xl glow-lava-orange"
            >
              <LogIn className="w-5 h-5" />
              Iniciar Sesión con Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
