/**
 * Scraper para el portal judicial de Guanajuato
 * Sistema: SIGE - sige.poderjudicialgto.gob.mx
 *
 * AJUSTE DE SELECTORES:
 * Abre el portal en Chrome, inicia sesión manualmente y usa las DevTools
 * (F12 > Inspector) para verificar que los selectores coincidan.
 * Busca los elementos por id, name, o clase CSS.
 */

const puppeteer = require('puppeteer')

// ─── Configura aquí los selectores del portal ────────────────────────────────
const SEL = {
  // Página de login
  loginUrl: 'https://sige.poderjudicialgto.gob.mx',
  inputUsuario: '#txtSuscriptor',
  inputPassword: '#txtContrasena',
  btnLogin: '#btnIngresar',

  // Indicador de sesión iniciada (algo que sólo aparece al estar autenticado)
  indicadorLogueado: '.menu-principal, #menu-principal, nav.navbar, .usuario-logueado',

  // Navegación a notificaciones electrónicas
  // Puede ser un link en el menú principal — ajusta el texto/href
  linkNotificaciones: 'a[href*="notificaciones"], a[href*="acuerdos"], a:contains("Notificaciones")',

  // Tabla de notificaciones
  tablaNotificaciones: 'table.tabla-notificaciones, table#tblNotificaciones, table',
  filaNotificacion: 'tbody tr',

  // Columnas de la tabla (índice base 0)
  // Ajusta según las columnas reales del portal
  colExpediente: 0,   // Número de expediente
  colFecha: 1,        // Fecha del acuerdo/notificación
  colTipo: 2,         // Tipo de actuación
  colDescripcion: 3,  // Descripción / texto del acuerdo

  // Paginación (si aplica)
  btnSiguiente: 'a.siguiente, a[aria-label="Siguiente"], .pagination .next a',
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrae el texto de una celda de tabla de forma segura
 */
function celda(fila, idx) {
  const celdas = fila.querySelectorAll('td')
  return celdas[idx]?.innerText?.trim() || ''
}

/**
 * Normaliza una fecha del portal al formato YYYY-MM-DD
 * El portal usa DD/MM/YYYY — ajusta si es diferente
 */
function normalizarFecha(str) {
  if (!str) return null
  // Formato DD/MM/YYYY
  const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // Formato YYYY-MM-DD ya correcto
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return null
}

/**
 * Scraper principal
 * @param {object} credenciales - { portal_url, usuario, password }
 * @param {string|null} fechaInicio - YYYY-MM-DD (opcional)
 * @param {string|null} fechaFin    - YYYY-MM-DD (opcional)
 * @returns {Array} notificaciones - [{ expediente, fecha, tipo, descripcion }]
 */
async function scrapearNotificaciones(credenciales, fechaInicio = null, fechaFin = null) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // 1. Ir a la página de login
    const loginUrl = credenciales.portal_url || SEL.loginUrl
    console.log(`[scraper] Navegando a ${loginUrl}`)
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // 2. Iniciar sesión
    await page.waitForSelector(SEL.inputUsuario, { timeout: 15000 })
    await page.type(SEL.inputUsuario, credenciales.usuario, { delay: 40 })
    await page.type(SEL.inputPassword, credenciales.password, { delay: 40 })
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click(SEL.btnLogin),
    ])

    // 3. Verificar que el login fue exitoso
    try {
      await page.waitForSelector(SEL.indicadorLogueado, { timeout: 10000 })
    } catch {
      const html = await page.content()
      if (html.includes('contraseña incorrecta') || html.includes('usuario no encontrado')) {
        throw new Error('Credenciales incorrectas en el portal judicial')
      }
      throw new Error('No se pudo verificar el inicio de sesión en el portal')
    }
    console.log('[scraper] Sesión iniciada correctamente')

    // 4. Navegar a notificaciones
    // Intenta hacer click en el link de notificaciones del menú
    try {
      await page.click(SEL.linkNotificaciones)
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    } catch {
      // Si no hay link de navegación, podría ser una URL directa
      // Ajusta esta URL según el portal real
      await page.goto(`${loginUrl}/notificaciones`, { waitUntil: 'networkidle2', timeout: 20000 })
    }

    // 5. Aplicar filtro de fechas si el portal lo permite
    if (fechaInicio && fechaFin) {
      console.log(`[scraper] Filtrando del ${fechaInicio} al ${fechaFin}`)
      // TODO: Ajustar según los controles de filtro del portal
      // Ejemplo:
      // await page.type('#fechaInicio', fechaInicio.split('-').reverse().join('/'))
      // await page.type('#fechaFin', fechaFin.split('-').reverse().join('/'))
      // await page.click('#btnFiltrar')
      // await page.waitForNavigation({ waitUntil: 'networkidle2' })
    }

    // 6. Extraer notificaciones (con paginación)
    const notificaciones = []
    let pagina = 1
    let hayMasPaginas = true

    while (hayMasPaginas) {
      console.log(`[scraper] Extrayendo página ${pagina}...`)
      await page.waitForSelector(SEL.tablaNotificaciones, { timeout: 10000 })

      const filas = await page.evaluate((sel) => {
        const tabla = document.querySelector(sel.tablaNotificaciones)
        if (!tabla) return []
        const filas = tabla.querySelectorAll(sel.filaNotificacion)
        return Array.from(filas).map(fila => {
          const celdas = fila.querySelectorAll('td')
          return {
            expediente: celdas[sel.colExpediente]?.innerText?.trim() || '',
            fecha:      celdas[sel.colFecha]?.innerText?.trim() || '',
            tipo:       celdas[sel.colTipo]?.innerText?.trim() || '',
            descripcion: celdas[sel.colDescripcion]?.innerText?.trim() || '',
          }
        }).filter(r => r.expediente || r.descripcion)
      }, SEL)

      notificaciones.push(...filas)

      // Siguiente página
      const btnSig = await page.$(SEL.btnSiguiente)
      if (btnSig) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          btnSig.click(),
        ])
        pagina++
      } else {
        hayMasPaginas = false
      }
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
