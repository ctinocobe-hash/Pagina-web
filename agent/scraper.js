/**
 * Scraper para el portal judicial de Guanajuato
 * Sistema: SIGE - sige.poderjudicialgto.gob.mx
 */
console.log('[scraper] CARGADO versión 2026-03-31-v4')

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
 * Obtiene el contentFrame del iframe #frameNE (re-adquirir tras recarga)
 */
async function obtenerFrame(page) {
  await page.waitForSelector('#frameNE', { timeout: 15000 })
  const frameElement = await page.$('#frameNE')
  const frame = await frameElement.contentFrame()
  if (!frame) throw new Error('No se pudo acceder al iframe de notificaciones')
  return frame
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

    // 3. Activar tab Notificaciones Electrónicas
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

    if (tabInfo.encontrado) {
      console.log(`[scraper] Activando tab Notificaciones...`)
      await page.click('#liNE a')
      await new Promise(r => setTimeout(r, 3000))
    }

    // El contenido está dentro del iframe #frameNE
    console.log(`[scraper] Esperando iframe #frameNE...`)
    let frame = await obtenerFrame(page)
    console.log(`[scraper] Iframe encontrado: ${frame.url()}`)

    // Esperar que el formulario cargue dentro del iframe
    await frame.waitForSelector('#dpInicial', { timeout: 30000 })
    console.log('[scraper] Formulario de notificaciones listo')

    // Seleccionar "Búsqueda por fechas" (radio button)
    const radioSeleccionado = await frame.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type=radio]'))
      for (const radio of radios) {
        const label = document.querySelector(`label[for="${radio.id}"]`) ||
                      radio.closest('label') ||
                      radio.nextElementSibling
        const labelTxt = label?.innerText?.trim() || ''
        if (labelTxt.toLowerCase() === 'búsqueda por fechas') {
          radio.click()
          return `radio id=${radio.id} label="${labelTxt}"`
        }
      }
      const labels = Array.from(document.querySelectorAll('label'))
      for (const lbl of labels) {
        if (lbl.innerText?.trim().toLowerCase() === 'búsqueda por fechas') {
          lbl.click()
          return `label click: ${lbl.innerText.trim()}`
        }
      }
      return 'NO ENCONTRADO - radios: ' + radios.map(r => `id=${r.id} val=${r.value}`).join(', ')
    })
    console.log(`[scraper] Radio "Búsqueda por fechas": ${radioSeleccionado}`)
    await new Promise(r => setTimeout(r, 1000))

    // 4. Llenar fechas de búsqueda (dentro del iframe)
    const fInicio = fechaInicio ? toPortalDate(fechaInicio) : toPortalDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    const fFin = fechaFin ? toPortalDate(fechaFin) : toPortalDate(
      new Date().toISOString().split('T')[0]
    )

    // Función para llenar datepicker Angular correctamente
    async function setDateInput(frame, selector, value) {
      await frame.click(selector, { clickCount: 3 })
      await frame.type(selector, value, { delay: 50 })
      await frame.evaluate((sel, val) => {
        const el = document.querySelector(sel)
        if (!el) return
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

    const valoresForm = await frame.evaluate(() => ({
      inicio: document.querySelector('#dpInicial')?.value,
      fin:    document.querySelector('#dpFinal')?.value,
    }))
    console.log(`[scraper] Valores en form: inicio="${valoresForm.inicio}" fin="${valoresForm.fin}"`)

    // Verificar que el botón BUSCA existe y qué atributos tiene
    const botonInfo = await frame.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.map(b => ({
        name: b.name, type: b.type, text: b.innerText?.trim().substring(0, 30),
        disabled: b.disabled, id: b.id
      }))
    })
    console.log(`[scraper] Botones en iframe: ${JSON.stringify(botonInfo)}`)

    // 5. Interceptar peticiones de red para diagnóstico
    const requestsCapturados = []
    page.on('request', req => {
      if (req.url().includes('archivoelectronico') || req.url().includes('noti') ||
          req.url().includes('busca') || req.url().includes('buscar')) {
        requestsCapturados.push({
          url: req.url(),
          method: req.method(),
          post: req.postData()?.substring(0, 300)
        })
      }
    })

    // Clic en BUSCA — intentar con el botón de submit primero, fallback a evaluate
    const botonEncontrado = await frame.evaluate(() => {
      // Buscar por name="action"
      let btn = document.querySelector('button[name="action"][type="submit"]')
      if (btn) { btn.click(); return 'button[name="action"][type="submit"]' }
      // Buscar por texto BUSCA / Buscar / Consultar
      const btns = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"], button'))
      for (const b of btns) {
        const txt = (b.innerText || b.value || '').trim().toLowerCase()
        if (txt.includes('busca') || txt.includes('buscar') || txt.includes('consultar')) {
          b.click()
          return `text="${b.innerText || b.value}"`
        }
      }
      // Fallback: cualquier botón submit
      const anySubmit = document.querySelector('button[type="submit"], input[type="submit"]')
      if (anySubmit) { anySubmit.click(); return `fallback submit: ${anySubmit.outerHTML.substring(0, 100)}` }
      return 'NO ENCONTRADO'
    })
    console.log(`[scraper] Botón BUSCA clickeado via: ${botonEncontrado}`)

    // Esperar a que el iframe cargue los resultados (puede recargar su contenido)
    console.log(`[scraper] Esperando resultados (15s)...`)
    await new Promise(r => setTimeout(r, 15000))

    console.log(`[scraper] Peticiones capturadas: ${JSON.stringify(requestsCapturados)}`)

    // Re-adquirir frame tras posible recarga del iframe
    frame = await obtenerFrame(page)
    console.log(`[scraper] Frame re-adquirido: ${frame.url()}`)

    // Diagnóstico post-búsqueda
    const estadoPostBusqueda = await frame.evaluate(() => ({
      hayTabla: !!document.querySelector('table'),
      hayFilas: document.querySelectorAll('tbody tr').length,
      urlActual: window.location.href,
      texto: document.body.innerText.substring(0, 500),
    }))
    console.log(`[scraper] Post-búsqueda: tabla=${estadoPostBusqueda.hayTabla} filas=${estadoPostBusqueda.hayFilas}`)
    console.log(`[scraper] URL iframe post: ${estadoPostBusqueda.urlActual}`)
    console.log(`[scraper] Texto post: ${estadoPostBusqueda.texto}`)

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
