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

    // 3. Hacer clic en el tab "Notificaciones"
    await page.click('#liNE a')
    await page.waitForSelector('#dpInicial', { timeout: 10000 })
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

    // 6. Extraer resultados de la tabla
    const notificaciones = await page.evaluate(() => {
      const resultados = []

      // Buscar todas las tablas en el panel de resultados
      const tablas = document.querySelectorAll('.panel-body table, table.table, table')
      for (const tabla of tablas) {
        const filas = tabla.querySelectorAll('tbody tr')
        for (const fila of filas) {
          const celdas = fila.querySelectorAll('td')
          if (celdas.length < 2) continue

          // Extraer todos los textos de celdas
          const textos = Array.from(celdas).map(c => c.innerText?.trim() || '')

          // El portal SIGE típicamente muestra: expediente, fecha, tipo, descripción
          // Intentamos identificar cuál celda es cuál por el contenido
          let expediente = '', fecha = '', tipo = '', descripcion = ''

          for (let i = 0; i < textos.length; i++) {
            const t = textos[i]
            // Detectar número de expediente (patrón: letras/números/año)
            if (!expediente && /[A-Z]-?\d+\/\d{2,4}/.test(t)) {
              expediente = t
            }
            // Detectar fecha (patrón: DD/MM/YYYY)
            else if (!fecha && /\d{1,2}\/\d{1,2}\/\d{4}/.test(t)) {
              fecha = t
            }
            // El texto más largo es la descripción
            else if (t.length > descripcion.length) {
              if (!tipo && t.length < 50) tipo = t
              else descripcion = t
            }
          }

          // Si no detectamos expediente por patrón, usar primera celda
          if (!expediente && textos[0]) expediente = textos[0]
          if (!descripcion && textos.length > 1) descripcion = textos[textos.length - 1]

          if (expediente || descripcion) {
            resultados.push({ expediente, fecha, tipo, descripcion })
          }
        }
      }

      return resultados
    })

    // Verificar si el portal mostró "no se encontraron resultados"
    const sinResultados = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('no se encontraron resultados')
    )
    if (sinResultados && notificaciones.length === 0) {
      console.log('[scraper] El portal indica que no hay resultados para este rango de fechas')
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
