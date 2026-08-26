# PokeDoom · Asset Engine

Herramienta en Next.js para crear y exportar los assets de tu clon de Doom:
sprites billboard de Pokémon, texturas de pared, íconos de HUD y mapas de
nivel en ASCII. Todo corre en el navegador (canvas + `localStorage`), no hay
backend.

## Arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Compilar como sitio estático

```bash
npm run build
```

Genera la carpeta `out/` (gracias a `output: 'export'` en `next.config.mjs`),
lista para subir a cualquier hosting estático o abrir localmente.

## Qué incluye

- **Sprites** (`Sprites`): editor de píxeles a 56×56 / 64×64 / 128×128,
  fondo transparente, con guías de centrado horizontal y línea de suelo
  (los pies deben tocar el borde inferior).
- **Paredes** (`Paredes`): 32 / 64 / 128 px, sin canal alfa, con
  validación de potencia de 2 y una vista de repetición 3×3 para detectar
  costuras.
- **HUD** (`HUD`): 128×128 / 256×256, con guía de "pantalla" para ubicar el
  arma/Pokéball abajo-centro.
- **Mapas** (`Mapas`): grilla ASCII pintable con la simbología exacta del
  motor (`+ - | * # @`), autoborde y exportación a `.txt`.
- **Biblioteca** (`Biblioteca`): todos los assets guardados, con export
  individual (`.png`, `.rgba`, `.txt`) o **todo en un `.zip`** con la
  estructura `assets/*.png|.rgba` + `src/maps/*.txt`.
- **Vista previa en motor**: un raycaster real (columna por columna, igual
  que `asset_loader.zig`) que renderiza en vivo la pared, el sprite y el HUD
  que estés editando.

## Formato `.rgba`

El botón "`.rgba`" exporta exactamente `width * height * 4` bytes crudos
(RGBA, sin cabecera, sin compresión, fila por fila) — el mismo layout que
lee tu `asset_loader.zig` cuando encuentra `assets/<nombre>.rgba` junto al
`.png`.

## Notas

- Todo se guarda en `localStorage` de tu navegador; usa "Exportar todo" con
  frecuencia si quieres respaldar tu trabajo.
- El botón "Importar imagen…" dentro de cada editor te deja convertir un PNG
  que ya tengas (de Aseprite, Piskel, etc.) directamente a `.rgba` sin
  redibujar nada.
