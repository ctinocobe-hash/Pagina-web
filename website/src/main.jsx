import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Website from './Website.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <Website />
  </StrictMode>
)

// Si dist/index.html ya trae contenido horneado por scripts/prerender.mjs,
// hidrata sobre él en vez de montar desde cero (así el usuario no ve un parpadeo
// a página vacía). En dev (vite) el div siempre llega vacío, así que cae a
// createRoot como siempre.
if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
