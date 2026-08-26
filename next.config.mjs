/** @type {import('next').NextConfig} */
const nextConfig = {
  // Todo el motor corre en el cliente (canvas + localStorage), así que
  // se puede exportar como sitio estático y alojarlo donde quieras
  // (Vercel, GitHub Pages, un servidor propio junto al juego en Zig, etc).
  images: { unoptimized: true },
};

export default nextConfig;
