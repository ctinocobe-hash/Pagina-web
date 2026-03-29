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
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    await page.waitForSelector('#txtSuscriptor', { timeout: 15000 })
    await page.type('#txtSuscriptor', credenciales.usuario, { delay: 40 })
    await page.type('#txtContrasena', credenciales.password, { delay: 40 })
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
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

    if (!tabInfo.encontrado) {
      const dpExiste = await page.$('#dpInicial')
      if (!dpExiste) throw new Error('No se encontró el tab de Notificaciones ni el formulario')
    } else {
      // Tab Bootstrap con AJAX — click real + esperar red inactiva
      console.log(`[scraper] Haciendo clic en tab Notificaciones...`)
      await page.click('#liNE a')
      // Esperar que la red esté inactiva (AJAX completado)
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {})
      await new Promise(r => setTimeout(r, 1000))
      console.log(`[scraper] URL tras clic: ${page.url()}`)
    }

    const urlTrasTab = page.url()
    console.log(`[scraper] URL tras navegar a notificaciones: ${urlTrasTab}`)

    await page.waitForSelector('#dpInicial', { timeout: 20000 })
    console.log('[scraper] Formulario de notificaciones listo')

    // 4. Llenar fechas de búsqueda
    const fInicio = fechaInicio ? toPortalDate(fechaInicio) : toPortalDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    const fFin = fechaFin ? toPortalDate(fechaFin) : toPortalDate(
      new Date().toISOString().split('T')[0]
    )

    // Limpiar y escribir fecha inicial
    await page.$eval('#dpInicial', el => el.value = '')
    await page.type('#dpInicial', fInicio, { delay: 40 })

    // Limpiar y escribir fecha final
    await page.$eval('#dpFinal', el => el.value = '')
    await page.type('#dpFinal', fFin, { delay: 40 })

    console.log(`[scraper] Buscando del ${fInicio} al ${fFin}`)

    // 5. Clic en BUSCA y esperar resultados
    await page.click('button[name="action"][type="submit"]')
    await new Promise(r => setTimeout(r, 3000)) // esperar respuesta AJAX

    // 6. Extraer resultados con paginación
    // Columnas del portal SIGE:
    // 0=Juzgado, 1=Expediente, 2=Resumen, 3=Fecha Auto, 4=Fecha Notificación, 5=Doc, 6=Rec
    const notificaciones = []
    let pagina = 1

    while (true) {
      console.log(`[scraper] Extrayendo página ${pagina}...`)

      // Esperar que la tabla cargue
      await new Promise(r => setTimeout(r, 1500))

      // Verificar si hay resultados
      const sinResultados = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes('no se encontraron resultados')
      )
      if (sinResultados) {
        console.log('[scraper] No se encontraron resultados para este rango de fechas')
        break
      }

      const filas = await page.evaluate(() => {
        const resultados = []
        // La tabla de resultados tiene encabezado oscuro
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

      // Intentar ir a la siguiente página
      const siguientePagina = await page.evaluate(() => {
        // Buscar botón "siguiente" en la paginación
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

      await page.evaluate(() => {
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
