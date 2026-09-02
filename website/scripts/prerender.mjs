// Genera el HTML real del sitio sin depender de Chrome ni de ningún servidor:
// compila Website.jsx a un módulo de servidor con la propia API de Vite y usa
// react-dom/server para convertir el árbol de componentes en el mismo HTML
// que el navegador terminaría pintando. Corre en CADA build, incluido el de
// Cloudflare Pages, porque no necesita nada que no traiga Node.
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ssrOutDir = path.join(ROOT, '.ssr-tmp')

await build({
  root: ROOT,
  logLevel: 'warn',
  plugins: [react()],
  build: {
    ssr: path.join(ROOT, 'src/Website.jsx'),
    outDir: path.relative(ROOT, ssrOutDir),
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'website.mjs' } },
  },
})

const { default: Website } = await import(path.join(ssrOutDir, 'website.mjs'))
const html = renderToString(createElement(Website))
fs.rmSync(ssrOutDir, { recursive: true, force: true })

const indexPath = path.join(ROOT, 'dist', 'index.html')
const marker = '<div id="root"></div>'
const shell = fs.readFileSync(indexPath, 'utf8')
if (!shell.includes(marker)) {
  console.warn('prerender: no encontré el marcador esperado en dist/index.html, no se inyectó nada.')
  process.exit(0)
}
fs.writeFileSync(indexPath, shell.replace(marker, `<div id="root">${html}</div>`), 'utf8')
console.log(`prerender: ${(html.length / 1024).toFixed(0)} KB de HTML real horneados en dist/index.html`)
