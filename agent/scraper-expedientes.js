/**
 * Scraper para Servicios Virtuales del Poder Judicial de Guanajuato
 * Portal: poderjudicial-gto.gob.mx/modules.php?name=Servicios_virtuales&file=index&func=suscriptores
 *
 * Este scraper:
 *  1. Inicia sesión como suscriptor en el portal de servicios virtuales
 *  2. Consulta expedientes por número
 *  3. Extrae listados de acuerdos, promociones y contestaciones
 *  4. Obtiene los enlaces a los PDFs de cada documento
 */
console.log('[scraper-expedientes] CARGADO versión 2026-04-03-v1')

const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const PORTAL_URL = 'https://www.poderjudicial-gto.gob.mx/modules.php?name=Servicios_virtuales&file=index&func=suscriptores'
const BASE_URL = 'https://www.poderjudicial-gto.gob.mx'

// Directorio para guardar PDFs descargados
const PDF_DIR = path.join(__dirname, 'pdfs')
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true })

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
 * Espera un tiempo determinado
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Inicia sesión en el portal de Servicios Virtuales
 * @param {object} page - Página de Puppeteer
 * @param {object} credenciales - { usuario, password }
 */
async function loginPortal(page, credenciales) {
  console.log(`[scraper-expedientes] Navegando a portal de servicios virtuales...`)
  await page.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)

  // El portal usa un formulario de login para suscriptores
  // Buscar campos de usuario y contraseña por varios selectores posibles
  const loginResult = await page.evaluate((usuario, password) => {
    // Buscar inputs de texto/password en la página
    const inputs = Array.from(document.querySelectorAll('input'))
    const forms = Array.from(document.querySelectorAll('form'))

    // Estrategia 1: Buscar por name/id comunes
    const userSelectors = ['#usuario', '#user', '#login', '#suscriptor', '#txtUsuario',
      'input[name="usuario"]', 'input[name="user"]', 'input[name="login"]',
      'input[name="suscriptor"]', 'input[name="txtUsuario"]', 'input[name="nombre"]']
    const passSelectors = ['#password', '#pass', '#clave', '#contrasena', '#txtPassword',
      'input[name="password"]', 'input[name="pass"]', 'input[name="clave"]',
      'input[name="contrasena"]', 'input[name="txtPassword"]']

    let userInput = null, passInput = null
    for (const sel of userSelectors) {
      userInput = document.querySelector(sel)
      if (userInput) break
    }
    for (const sel of passSelectors) {
      passInput = document.querySelector(sel)
      if (passInput) break
    }

    // Estrategia 2: Buscar por tipo de input
    if (!userInput || !passInput) {
      const textInputs = inputs.filter(i => i.type === 'text' && !i.hidden)
      const passInputs = inputs.filter(i => i.type === 'password')
      if (textInputs.length > 0 && passInputs.length > 0) {
        userInput = userInput || textInputs[0]
        passInput = passInput || passInputs[0]
      }
    }

    if (!userInput || !passInput) {
      return {
        success: false,
        error: 'No se encontraron campos de login',
        html: document.body.innerHTML.substring(0, 2000),
        inputs: inputs.map(i => ({ type: i.type, name: i.name, id: i.id })),
        forms: forms.map(f => ({ action: f.action, method: f.method, id: f.id }))
      }
    }

    return {
      success: true,
      userSelector: userInput.id ? `#${userInput.id}` : `input[name="${userInput.name}"]`,
      passSelector: passInput.id ? `#${passInput.id}` : `input[name="${passInput.name}"]`,
      formAction: userInput.closest('form')?.action || '',
      formMethod: userInput.closest('form')?.method || 'POST',
    }
  }, credenciales.usuario, credenciales.password)

  if (!loginResult.success) {
    console.error('[scraper-expedientes] Estructura de la página:', JSON.stringify(loginResult, null, 2))
    throw new Error(`No se encontraron campos de login en el portal: ${loginResult.error}`)
  }

  console.log(`[scraper-expedientes] Campos encontrados: user=${loginResult.userSelector} pass=${loginResult.passSelector}`)

  // Llenar credenciales
  await page.click(loginResult.userSelector, { clickCount: 3 })
  await page.type(loginResult.userSelector, credenciales.usuario, { delay: 50 })
  await page.click(loginResult.passSelector, { clickCount: 3 })
  await page.type(loginResult.passSelector, credenciales.password, { delay: 50 })

  // Buscar y hacer clic en el botón de envío
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"], input[type="button"], button'))
    for (const btn of btns) {
      const txt = (btn.innerText || btn.value || '').toLowerCase()
      if (txt.includes('entr') || txt.includes('ingres') || txt.includes('login') || txt.includes('acces') || txt.includes('enviar')) {
        btn.click()
        return true
      }
    }
    // Fallback: submit del form
    const form = document.querySelector('form')
    if (form) { form.submit(); return true }
    return false
  })

  await sleep(5000)

  // Verificar que el login fue exitoso
  const postLogin = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    body: document.body.innerText.substring(0, 500),
    hasError: document.body.innerText.toLowerCase().includes('error') ||
              document.body.innerText.toLowerCase().includes('incorrecto') ||
              document.body.innerText.toLowerCase().includes('inválid')
  }))

  console.log(`[scraper-expedientes] Post-login URL: ${postLogin.url}`)
  console.log(`[scraper-expedientes] Post-login título: ${postLogin.title}`)

  if (postLogin.hasError && postLogin.url.includes('suscriptores')) {
    throw new Error('Login fallido: credenciales incorrectas o cuenta inactiva')
  }

  console.log('[scraper-expedientes] Login exitoso')
  return postLogin
}

/**
 * Navega al menú de consulta de expedientes
 */
async function navegarConsulta(page) {
  console.log('[scraper-expedientes] Buscando menú de consulta de expedientes...')

  const menuInfo = await page.evaluate(() => {
    // Buscar enlaces que lleven a consulta de expedientes
    const links = Array.from(document.querySelectorAll('a'))
    const relevant = links.filter(a => {
      const txt = (a.innerText || a.textContent || '').toLowerCase()
      const href = (a.href || '').toLowerCase()
      return txt.includes('expediente') || txt.includes('consulta') ||
             txt.includes('acuerdo') || txt.includes('archivo') ||
             href.includes('expediente') || href.includes('consulta') ||
             href.includes('archivo')
    })

    return relevant.map(a => ({
      text: (a.innerText || a.textContent || '').trim().substring(0, 80),
      href: a.href,
      id: a.id,
      className: a.className
    }))
  })

  console.log(`[scraper-expedientes] Menús encontrados: ${JSON.stringify(menuInfo, null, 2)}`)
  return menuInfo
}

/**
 * Consulta un expediente específico por su número
 * @param {object} page - Página de Puppeteer
 * @param {string} numeroExpediente - Número del expediente a consultar
 * @param {string} juzgado - Nombre del juzgado (opcional)
 * @returns {object} - Datos del expediente con enlaces a PDFs
 */
async function consultarExpediente(page, numeroExpediente, juzgado = '') {
  console.log(`[scraper-expedientes] Consultando expediente: ${numeroExpediente}`)

  // Buscar formulario de consulta en la página actual
  const formInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select'))
    const forms = Array.from(document.querySelectorAll('form'))
    return {
      inputs: inputs.map(i => ({
        tag: i.tagName, type: i.type, name: i.name, id: i.id,
        placeholder: i.placeholder, options: i.tagName === 'SELECT' ?
          Array.from(i.options).map(o => ({ value: o.value, text: o.text })) : undefined
      })),
      forms: forms.map(f => ({ action: f.action, method: f.method, id: f.id })),
      pageText: document.body.innerText.substring(0, 1000)
    }
  })

  console.log(`[scraper-expedientes] Formulario encontrado: ${JSON.stringify(formInfo, null, 2)}`)

  // Buscar campo de número de expediente
  const expSelectors = [
    'input[name="expediente"]', 'input[name="numero"]', 'input[name="numExp"]',
    'input[name="num_expediente"]', 'input[name="txtExpediente"]', 'input[name="exp"]',
    '#expediente', '#numero', '#numExp', '#txtExpediente'
  ]

  let filled = false
  for (const sel of expSelectors) {
    try {
      const exists = await page.$(sel)
      if (exists) {
        await page.click(sel, { clickCount: 3 })
        await page.type(sel, numeroExpediente, { delay: 40 })
        filled = true
        console.log(`[scraper-expedientes] Expediente llenado en: ${sel}`)
        break
      }
    } catch (e) { /* continuar */ }
  }

  // Si no encontró por selectores conocidos, intentar con el primer input text visible
  if (!filled) {
    const firstInput = await page.evaluate((numExp) => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]:not([hidden])'))
      for (const inp of inputs) {
        const label = document.querySelector(`label[for="${inp.id}"]`)
        const labelTxt = label?.innerText?.toLowerCase() || ''
        const placeholder = inp.placeholder?.toLowerCase() || ''
        const name = inp.name?.toLowerCase() || ''
        if (labelTxt.includes('expediente') || labelTxt.includes('número') || labelTxt.includes('numero') ||
            placeholder.includes('expediente') || placeholder.includes('número') ||
            name.includes('exp') || name.includes('num')) {
          inp.value = numExp
          inp.dispatchEvent(new Event('input', { bubbles: true }))
          inp.dispatchEvent(new Event('change', { bubbles: true }))
          return { found: true, selector: inp.id || inp.name }
        }
      }
      // Fallback: primer input text
      if (inputs.length > 0) {
        inputs[0].value = numExp
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
        return { found: true, selector: inputs[0].id || inputs[0].name || 'first-text-input' }
      }
      return { found: false }
    }, numeroExpediente)

    if (firstInput.found) {
      filled = true
      console.log(`[scraper-expedientes] Expediente llenado en input: ${firstInput.selector}`)
    }
  }

  // Si hay select de juzgado, intentar seleccionarlo
  if (juzgado) {
    await page.evaluate((juz) => {
      const selects = Array.from(document.querySelectorAll('select'))
      for (const sel of selects) {
        const label = document.querySelector(`label[for="${sel.id}"]`)
        const labelTxt = label?.innerText?.toLowerCase() || ''
        const name = sel.name?.toLowerCase() || ''
        if (labelTxt.includes('juzgado') || labelTxt.includes('tribunal') || labelTxt.includes('sala') ||
            name.includes('juzgado') || name.includes('tribunal') || name.includes('sala')) {
          // Buscar opción que coincida
          for (const opt of sel.options) {
            if (opt.text.toLowerCase().includes(juz.toLowerCase())) {
              sel.value = opt.value
              sel.dispatchEvent(new Event('change', { bubbles: true }))
              return true
            }
          }
        }
      }
      return false
    }, juzgado)
  }

  // Click en buscar/consultar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, a.button'))
    for (const btn of btns) {
      const txt = (btn.innerText || btn.value || '').toLowerCase()
      if (txt.includes('buscar') || txt.includes('consultar') || txt.includes('busca') || txt.includes('ver')) {
        btn.click()
        return true
      }
    }
    // Fallback: submit del form
    const form = document.querySelector('form')
    if (form) { form.submit(); return true }
    return false
  })

  await sleep(5000)

  // Extraer resultados
  const resultados = await extraerResultados(page, numeroExpediente)
  return resultados
}

/**
 * Extrae resultados de la consulta: acuerdos, promociones, contestaciones con enlaces PDF
 */
async function extraerResultados(page, numeroExpediente) {
  console.log(`[scraper-expedientes] Extrayendo resultados para: ${numeroExpediente}`)

  const datos = await page.evaluate((baseUrl) => {
    const result = {
      acuerdos: [],
      promociones: [],
      contestaciones: [],
      otros: [],
      pageText: document.body.innerText.substring(0, 2000),
    }

    // Buscar todas las tablas con datos
    const tablas = document.querySelectorAll('table')
    for (const tabla of tablas) {
      const filas = tabla.querySelectorAll('tr')
      const headers = []
      const firstRow = filas[0]
      if (firstRow) {
        const ths = firstRow.querySelectorAll('th, td')
        ths.forEach(th => headers.push(th.innerText.trim().toLowerCase()))
      }

      for (let i = 1; i < filas.length; i++) {
        const celdas = filas[i].querySelectorAll('td')
        if (celdas.length < 2) continue

        const textos = Array.from(celdas).map(c => c.innerText.trim())
        const enlaces = Array.from(filas[i].querySelectorAll('a')).map(a => ({
          href: a.href,
          text: (a.innerText || a.title || '').trim(),
          isPdf: a.href?.toLowerCase().includes('.pdf') ||
                 a.href?.toLowerCase().includes('pdf') ||
                 a.href?.toLowerCase().includes('archivo') ||
                 a.href?.toLowerCase().includes('documento') ||
                 a.href?.toLowerCase().includes('descargar') ||
                 a.href?.toLowerCase().includes('download')
        }))

        // Identificar PDFs - también buscar en onclick
        const onclickLinks = Array.from(filas[i].querySelectorAll('[onclick]')).map(el => {
          const onclick = el.getAttribute('onclick') || ''
          const urlMatch = onclick.match(/['"]([^'"]*\.pdf[^'"]*)['"]/i) ||
                          onclick.match(/window\.open\(['"]([^'"]+)['"]/i) ||
                          onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/i)
          return urlMatch ? { href: urlMatch[1], text: el.innerText.trim(), isPdf: true } : null
        }).filter(Boolean)

        const allLinks = [...enlaces, ...onclickLinks]
        const pdfLinks = allLinks.filter(l => l.isPdf)

        const documento = {
          fecha: null,
          tipo: '',
          descripcion: textos.join(' | '),
          textos,
          pdfUrl: pdfLinks.length > 0 ? pdfLinks[0].href : null,
          pdfLinks: pdfLinks.map(l => l.href),
          allLinks: allLinks.map(l => ({ href: l.href, text: l.text }))
        }

        // Intentar identificar fecha
        for (const txt of textos) {
          const fechaMatch = txt.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
          if (fechaMatch) {
            documento.fecha = txt.trim()
            break
          }
        }

        // Clasificar por tipo basándose en el contenido
        const allText = textos.join(' ').toLowerCase()
        if (allText.includes('acuerdo') || allText.includes('auto') || allText.includes('resolución') || allText.includes('resolucion')) {
          documento.tipo = 'Acuerdo'
          result.acuerdos.push(documento)
        } else if (allText.includes('promoción') || allText.includes('promocion') || allText.includes('escrito') || allText.includes('demanda')) {
          documento.tipo = 'Promoción'
          result.promociones.push(documento)
        } else if (allText.includes('contestación') || allText.includes('contestacion') || allText.includes('respuesta')) {
          documento.tipo = 'Contestación'
          result.contestaciones.push(documento)
        } else if (allText.includes('sentencia')) {
          documento.tipo = 'Sentencia'
          result.otros.push(documento)
        } else if (allText.includes('notificación') || allText.includes('notificacion')) {
          documento.tipo = 'Notificación'
          result.otros.push(documento)
        } else {
          documento.tipo = 'Documento'
          result.otros.push(documento)
        }
      }
    }

    // También buscar PDFs sueltos en la página (no dentro de tablas)
    const allPdfLinks = Array.from(document.querySelectorAll('a')).filter(a =>
      a.href?.toLowerCase().includes('.pdf') ||
      a.href?.toLowerCase().includes('archivo') ||
      a.href?.toLowerCase().includes('expediente')
    ).map(a => ({
      href: a.href,
      text: (a.innerText || a.title || '').trim(),
      context: a.closest('div, p, li')?.innerText?.trim().substring(0, 200) || ''
    }))

    result.pdfLinksGeneral = allPdfLinks

    return result
  }, BASE_URL)

  console.log(`[scraper-expedientes] Encontrados: ${datos.acuerdos.length} acuerdos, ${datos.promociones.length} promociones, ${datos.contestaciones.length} contestaciones, ${datos.otros.length} otros`)
  console.log(`[scraper-expedientes] PDFs generales en página: ${datos.pdfLinksGeneral?.length || 0}`)

  // Normalizar fechas
  const normalizarDocs = (docs) => docs.map(d => ({
    ...d,
    fecha: normalizarFecha(d.fecha) || new Date().toISOString().split('T')[0]
  }))

  return {
    acuerdos: normalizarDocs(datos.acuerdos),
    promociones: normalizarDocs(datos.promociones),
    contestaciones: normalizarDocs(datos.contestaciones),
    otros: normalizarDocs(datos.otros),
    pdfLinksGeneral: datos.pdfLinksGeneral || [],
    pageText: datos.pageText,
  }
}

/**
 * Descarga un PDF y lo guarda localmente
 * @param {object} page - Página de Puppeteer
 * @param {string} pdfUrl - URL del PDF
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Ruta local del PDF descargado
 */
async function descargarPdf(page, pdfUrl, filename) {
  console.log(`[scraper-expedientes] Descargando PDF: ${pdfUrl}`)

  const sanitizedName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  const filepath = path.join(PDF_DIR, sanitizedName)

  try {
    // Usar la sesión del navegador para descargar (mantiene cookies)
    const response = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) return { error: `HTTP ${res.status}` }
        const blob = await res.blob()
        const reader = new FileReader()
        return new Promise((resolve) => {
          reader.onload = () => resolve({ data: reader.result, type: blob.type, size: blob.size })
          reader.readAsDataURL(blob)
        })
      } catch (e) {
        return { error: e.message }
      }
    }, pdfUrl)

    if (response.error) {
      console.error(`[scraper-expedientes] Error descargando PDF: ${response.error}`)
      return null
    }

    // Guardar el archivo
    const base64Data = response.data.split(',')[1]
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'))
    console.log(`[scraper-expedientes] PDF guardado: ${filepath} (${response.size} bytes)`)

    return filepath
  } catch (e) {
    console.error(`[scraper-expedientes] Error guardando PDF: ${e.message}`)
    return null
  }
}

/**
 * Función principal: Consulta masiva de expedientes
 * @param {object} credenciales - { usuario, password }
 * @param {Array} expedientes - [{ numero, juzgado }]
 * @param {object} opciones - { descargarPdfs: boolean }
 * @returns {object} - Resultados por expediente
 */
async function consultarExpedientes(credenciales, expedientes, opciones = {}) {
  const { descargarPdfs = false } = opciones
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const resultados = {}

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // 1. Login
    await loginPortal(page, credenciales)

    // 2. Navegar al menú de consulta
    const menus = await navegarConsulta(page)

    // Intentar navegar al primer enlace de consulta/expedientes
    if (menus.length > 0) {
      // Priorizar enlaces que mencionen "expediente" o "consulta"
      const best = menus.find(m =>
        m.text.toLowerCase().includes('expediente') ||
        m.text.toLowerCase().includes('consulta remota')
      ) || menus.find(m =>
        m.text.toLowerCase().includes('acuerdo')
      ) || menus[0]

      console.log(`[scraper-expedientes] Navegando a: ${best.text} (${best.href})`)
      await page.goto(best.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(3000)
    }

    // 3. Consultar cada expediente
    for (const exp of expedientes) {
      try {
        console.log(`\n[scraper-expedientes] === Consultando: ${exp.numero} ===`)
        const resultado = await consultarExpediente(page, exp.numero, exp.juzgado || '')

        // Descargar PDFs si se solicita
        if (descargarPdfs) {
          const allDocs = [...resultado.acuerdos, ...resultado.promociones, ...resultado.contestaciones, ...resultado.otros]
          for (const doc of allDocs) {
            if (doc.pdfUrl) {
              const pdfFilename = `${exp.numero.replace(/\//g, '-')}_${doc.tipo}_${doc.fecha || 'sin-fecha'}.pdf`
              doc.localPath = await descargarPdf(page, doc.pdfUrl, pdfFilename)
            }
          }
        }

        resultados[exp.numero] = {
          success: true,
          ...resultado,
          totalDocumentos: resultado.acuerdos.length + resultado.promociones.length +
                          resultado.contestaciones.length + resultado.otros.length
        }

        // Volver a la página de consulta para el siguiente expediente
        await page.goBack()
        await sleep(2000)
      } catch (e) {
        console.error(`[scraper-expedientes] Error consultando ${exp.numero}: ${e.message}`)
        resultados[exp.numero] = { success: false, error: e.message }
      }
    }
  } finally {
    await browser.close()
  }

  return resultados
}

/**
 * Consulta un solo expediente (wrapper conveniente)
 */
async function consultarUnExpediente(credenciales, numero, juzgado = '', opciones = {}) {
  const resultados = await consultarExpedientes(credenciales, [{ numero, juzgado }], opciones)
  return resultados[numero] || { success: false, error: 'Sin resultados' }
}

module.exports = { consultarExpedientes, consultarUnExpediente, descargarPdf }
