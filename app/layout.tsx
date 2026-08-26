import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PokéDOOM Asset Studio — Raycasting Asset Creation Suite',
  description:
    'Suite profesional de creación y modificación de sprites Pokémon con PokéAPI, texturas, HUD y mapas ASCII para motores raycast estilo DOOM en Zig.',
  icons: {
    icon: '/pokedoom-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="font-sans antialiased bg-void text-ink">{children}</body>
    </html>
  );
}
