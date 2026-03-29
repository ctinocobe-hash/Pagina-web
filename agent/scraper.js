/**
 * Scraper para el portal judicial de Guanajuato
 * Sistema: SIGE - sige.poderjudicialgto.gob.mx
 */
console.log('[scraper] CARGADO versión 2026-03-29-v3')

const puppeteer = require('puppeteer')

/**
 * Convierte YYYY-MM-DD → DD/MM/YYYY (formato que usa el portal)
 */
function toPortalDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Normaliza una fecha del portal al formato YYYY-MM-DD
 */
function normalizarFecha(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return null
}

/**
 * Scraper principal para SIGE Guanajuato
 * @param {object} credenciales - { portal_url, usuario, password }
 * @param {string|null} fechaInicio - YYYY-MM-DD
 * @param {string|null} fechaFin    - YYYY-MM-DD
 * @returns {Array} notificaciones - [{ expediente, fecha, tipo, descripcion }]
 */
async function scrapearNotificaciones(credenciales, fechaInicio = null, fechaFin = null) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })

    // 1. Ir al portal y hacer login
    const loginUrl = credenciales.portal_url || 'https://sige.poderjudicialgto.gob.mx'
    console.log(`[scraper] Navegando a ${loginUrl}`)
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

    await page.waitForSelector('#txtSuscriptor', { timeout: 15000 })
    await page.type('#txtSuscriptor', credenciales.usuario, { delay: 40 })
    await page.type('#txtContrasena', credenciales.password, { delay: 40 })
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
      page.click('#btnIngresar'),
    ])

    // 2. Verificar login exitoso
    const urlTrasLogin = page.url()
    const tituloTrasLogin = await page.title()
    console.log(`[scraper] URL tras login: ${urlTrasLogin}`)
    console.log(`[scraper] Título: ${tituloTrasLogin}`)

    // Verificar sesión activa: esperar que aparezca el tab de Notificaciones
    try {
      await page.waitForSelector('#liNE', { timeout: 10000 })
      console.log('[scraper] Sesión iniciada correctamente')
    } catch {
      throw new Error('Login fallido: no se encontró el menú del portal tras el inicio de sesión')
    }

    // 3. Intentar navegar a Notificaciones Electrónicas
    // Primero intentar activar el tab via JavaScript (más confiable en headless)
    const tabInfo = await page.evaluate(() => {
      const el = document.querySelector('#liNE a')
      if (!el) return { encontrado: false }
      return {
        encontrado: true,
        href: el.href,
        texto: el.innerText?.trim(),
        dataTarget: el.getAttribute('data-target') || el.getAttribute('href'),
      }
    })
    console.log(`[scraper] Tab info: ${JSON.stringify(tabInfo)}`)

    // 3b. Activar tab y obtener el iframe interno
    if (tabInfo.encontrado) {
      console.log(`[scraper] Activando tab Notificaciones...`)
      await page.click('#liNE a')
      await new Promise(r => setTimeout(r, 3000))
    }

    // El contenido está dentro del iframe #frameNE
    console.log(`[scraper] Esperando iframe #frameNE...`)
    await page.waitForSelector('#frameNE', { timeout: 15000 })
    const frameElement = await page.$('#frameNE')
    const frame = await frameElement.contentFrame()
    if (!frame) throw new Error('No se pudo acceder al iframe de notificaciones')
    console.log(`[scraper] Iframe encontrado: ${frame.url()}`)

    // Esperar que el formulario cargue dentro del iframe
    await frame.waitForSelector('#dpInicial', { timeout: 30000 })
    console.log('[scraper] Formulario de notificaciones listo')

    // 4. Llenar fechas de búsqueda (dentro del iframe)
    const fInicio = fechaInicio ? toPortalDate(fechaInicio) : toPortalDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    const fFin = fechaFin ? toPortalDate(fechaFin) : toPortalDate(
      new Date().toISOString().split('T')[0]
    )

    // Función para llenar datepicker Angular correctamente
    async function setDateInput(frame, selector, value) {
      await frame.click(selector, { clickCount: 3 }) // seleccionar todo
      await frame.type(selector, value, { delay: 50 })
      // Disparar eventos que Angular necesita para detectar el cambio
      await frame.evaluate((sel, val) => {
        const el = document.querySelector(sel)
        if (!el) return
        // Setter nativo para React/Angular
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        if (nativeSetter) nativeSetter.call(el, val)
        el.dispatchEvent(new Event('input',  { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        el.dispatchEvent(new Event('blur',   { bubbles: true }))
      }, selector, value)
    }

    await setDateInput(frame, '#dpInicial', fInicio)
    await new Promise(r => setTimeout(r, 300))
    await setDateInput(frame, '#dpFinal', fFin)
    await new Promise(r => setTimeout(r, 300))

    // Verificar que los valores quedaron
    const valoresForm = await frame.evaluate(() => ({
      inicio: document.querySelector('#dpInicial')?.value,
      fin:    document.querySelector('#dpFinal')?.value,
    }))
    console.log(`[scraper] Valores en form: inicio="${valoresForm.inicio}" fin="${valoresForm.fin}"`)

    // 5. Clic en BUSCA y esperar resultados (dentro del iframe)
    // Primero verificar que el botón existe
    const btnInfo = await frame.evaluate(() => {
      const btn = document.querySelector('button[name="action"][type="submit"]')
      if (!btn) {
        // Buscar cualquier botón en el iframe
        const btns = Array.from(document.querySelectorAll('button,input[type=submit]'))
        return { encontrado: false, alternativas: btns.map(b => ({ tag: b.tagName, name: b.name, type: b.type, text: b.innerText?.trim() })) }
      }
      return { encontrado: true, texto: btn.innerText?.trim() }
    })
    console.log(`[scraper] Botón BUSCA: ${JSON.stringify(btnInfo)}`)

    if (!btnInfo.encontrado) throw new Error('No se encontró el botón BUSCA en el iframe')

    await frame.click('button[name="action"][type="submit"]')
    console.log(`[scraper] Clic en BUSCA realizado`)
    await new Promise(r => setTimeout(r, 8000))

    // Diagnóstico post-búsqueda
    const estadoPostBusqueda = await frame.evaluate(() => ({
      textoResumen: document.body.innerText.substring(0, 500),
      hayTabla: !!document.querySelector('table'),
      hayFilas: document.querySelectorAll('tbody tr').length,
    }))
    console.log(`[scraper] Post-búsqueda: tabla=${estadoPostBusqueda.hayTabla} filas=${estadoPostBusqueda.hayFilas}`)
    console.log(`[scraper] Texto: ${estadoPostBusqueda.textoResumen.substring(0, 200)}`)

    // 6. Extraer resultados con paginación (dentro del iframe)
    const notificaciones = []
    let pagina = 1

    while (true) {
      console.log(`[scraper] Extrayendo página ${pagina}...`)
      await new Promise(r => setTimeout(r, 1500))

      const sinResultados = await frame.evaluate(() =>
        document.body.innerText.toLowerCase().includes('no se encontraron resultados') &&
        !document.querySelector('tbody tr')
      )
      if (sinResultados) {
        console.log('[scraper] No se encontraron resultados para este rango de fechas')
        break
      }

      const filas = await frame.evaluate(() => {
        const resultados = []
        const tabla = document.querySelector('table')
        if (!tabla) return resultados
        const filas = tabla.querySelectorAll('tbody tr')
        for (const fila of filas) {
          const celdas = fila.querySelectorAll('td')
          if (celdas.length < 4) continue
          const juzgado    = celdas[0]?.innerText?.trim() || ''
          const expediente = celdas[1]?.innerText?.trim() || ''
          const resumen    = celdas[2]?.innerText?.trim() || ''
          const fechaAuto  = celdas[3]?.innerText?.trim() || ''
          if (!expediente && !resumen) continue
          resultados.push({ expediente, fecha: fechaAuto, tipo: juzgado, descripcion: resumen })
        }
        return resultados
      })
      notificaciones.push(...filas)

      const siguientePagina = await frame.evaluate(() => {
        const links = document.querySelectorAll('a, button')
        for (const el of links) {
          const txt = el.innerText?.trim().toLowerCase()
          if (txt === '>' || txt === 'siguiente' || txt === '›') {
            const disabled = el.disabled || el.classList.contains('disabled') ||
              el.parentElement?.classList.contains('disabled')
            if (!disabled) return true
          }
        }
        return false
      })
      if (!siguientePagina) break

      await frame.evaluate(() => {
        const links = document.querySelectorAll('a, button')
        for (const el of links) {
          const txt = el.innerText?.trim().toLowerCase()
          if (txt === '>' || txt === 'siguiente' || txt === '›') {
            const disabled = el.disabled || el.classList.contains('disabled') ||
              el.parentElement?.classList.contains('disabled')
            if (!disabled) { el.click(); return }
          }
        }
      })
      pagina++
    }

    console.log(`[scraper] ${notificaciones.length} notificaciones encontradas`)

    // 7. Normalizar fechas
    return notificaciones.map(n => ({
      ...n,
      fecha: normalizarFecha(n.fecha) || new Date().toISOString().split('T')[0],
    }))

  } finally {
    await browser.close()
  }
}

module.exports = { scrapearNotificaciones }
