import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#07080c',
        panel: '#0f1118',
        panel2: '#161922',
        panel3: '#1f2430',
        line: '#282f40',
        lineHighlight: '#434d67',
        ink: '#f8fafc',
        inkdim: '#94a3b8',
        blood: '#e11d48',
        lava: '#ea580c',
        fire: '#f59e0b',
        amber: '#fbbf24',
        gengar: '#a855f7',
        gengarDark: '#581c87',
        gengarGlow: '#d946ef',
        volt: '#06b6d4',
        portal: '#3b82f6',
        grid: '#10b981',
        toxic: '#84cc16',
      },
      fontFamily: {
        mono: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          '"JetBrains Mono"',
          '"Fira Code"',
          'Menlo',
          'Consolas',
          'monospace',
        ],
        sans: [
          'var(--font-geist-sans)',
          'ui-sans-serif',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 0 0 1px #2a2a31, 0 20px 50px -30px rgba(0,0,0,0.9)',
      },
    },
  },
  plugins: [],
};
export default config;
