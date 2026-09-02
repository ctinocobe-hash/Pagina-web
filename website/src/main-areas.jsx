import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import AreasDePractica from './AreasDePractica.jsx'
import './global.css'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <AreasDePractica />
  </StrictMode>
)

if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
