// Genera public/og/tinoco-legal.png (1200x630) para las meta tags Open Graph
// y Twitter Card. Corre una sola vez (o cuando quieras cambiar el diseño de
// la tarjeta), no forma parte del build normal.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
]
const chromePath = CHROME_PATHS.find((p) => fs.existsSync(p))
if (!chromePath) { console.error('No encontré Chrome instalado.'); process.exit(1) }

const logoPath = path.join(ROOT, 'public/logo/logo-horizontal.png')
const template = fs.readFileSync(path.join(HERE, 'og-card.html'), 'utf8').replace('__LOGO__', logoPath)
const tmpHtml = path.join(HERE, '_og-card-tmp.html')
fs.writeFileSync(tmpHtml, template)

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630 })
await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0' })
const outDir = path.join(ROOT, 'public/og')
fs.mkdirSync(outDir, { recursive: true })
await page.screenshot({ path: path.join(outDir, 'tinoco-legal.png') })
await browser.close()
fs.unlinkSync(tmpHtml)
console.log('Generado public/og/tinoco-legal.png')
