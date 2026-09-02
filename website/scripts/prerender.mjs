// Genera el HTML real de cada página del sitio sin depender de Chrome ni de
// ningún servidor: compila cada componente de página a un módulo de
// servidor con la propia API de Vite y usa react-dom/server para
// convertirlo en el mismo HTML que el navegador terminaría pintando.
// Corre en CADA build, incluido el de Cloudflare Pages, porque no necesita
// nada que no traiga Node.
//
// Agregar una página nueva = agregar una entrada a PAGES.
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PAGES = [
  { component: 'src/Website.jsx',         distHtml: 'dist/index.html',                     entry: 'main.mjs' },
  { component: 'src/AreasDePractica.jsx', distHtml: 'dist/areas-de-practica/index.html',   entry: 'areas.mjs' },
]

for (const page of PAGES) {
  const ssrOutDir = path.join(ROOT, '.ssr-tmp')

  await build({
    root: ROOT,
    logLevel: 'warn',
    plugins: [react()],
    build: {
      ssr: path.join(ROOT, page.component),
      outDir: path.relative(ROOT, ssrOutDir),
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: page.entry } },
    },
  })

  const { default: PageComponent } = await import(path.join(ssrOutDir, page.entry))
  const html = renderToString(createElement(PageComponent))
  fs.rmSync(ssrOutDir, { recursive: true, force: true })

  const indexPath = path.join(ROOT, page.distHtml)
  const marker = '<div id="root"></div>'
  if (!fs.existsSync(indexPath)) {
    console.warn(`prerender: no existe ${page.distHtml}, ¿corriste "vite build" antes? Se omite esta página.`)
    continue
  }
  const shell = fs.readFileSync(indexPath, 'utf8')
  if (!shell.includes(marker)) {
    console.warn(`prerender: no encontré el marcador esperado en ${page.distHtml}, no se inyectó nada.`)
    continue
  }
  fs.writeFileSync(indexPath, shell.replace(marker, `<div id="root">${html}</div>`), 'utf8')
  console.log(`prerender: ${(html.length / 1024).toFixed(0)} KB horneados en ${page.distHtml}`)
}
