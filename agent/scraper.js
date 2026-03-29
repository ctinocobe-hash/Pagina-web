/**
 * Scraper para el portal judicial de Guanajuato
 * Sistema: SIGE - sige.poderjudicialgto.gob.mx
 */

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

    // 2. Verificar login exitoso (buscar el tab de Notificaciones)
    try {
      await page.waitForSelector('#liNE', { timeout: 10000 })
    } catch {
      const html = await page.content()
      if (html.includes('incorrecta') || html.includes('no encontrado')) {
        throw new Error('Credenciales incorrectas en el portal judicial')
      }
      throw new Error('No se pudo verificar el inicio de sesión en el portal')
    }
    console.log('[scraper] Sesión iniciada correctamente')

    // 3. Navegar a la sección de Notificaciones
    await page.waitForSelector('#liNE a', { timeout: 15000 })

    // Obtener el href del tab para navegar directamente si es un link
    const notifHref = await page.evaluate(() => {
      const el = document.querySelector('#liNE a')
      return el ? el.href : null
    })
    console.log(`[scraper] URL de Notificaciones: ${notifHref}`)

    if (notifHref && !notifHref.endsWith('#') && !notifHref.includes('javascript')) {
      // Es un link real — navegar directamente
      await page.goto(notifHref, { waitUntil: 'networkidle2', timeout: 30000 })
    } else {
      // Es un tab AJAX — hacer clic y esperar
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('#liNE a'),
      ])
      await new Promise(r => setTimeout(r, 3000))
    }

    await page.waitForSelector('#dpInicial', { timeout: 15000 })
    console.log('[scraper] Tab Notificaciones activo')

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
