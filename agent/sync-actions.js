/**
 * Script de sincronización para GitHub Actions
 * Corre en los servidores de GitHub — no requiere computadora local.
 *
 * Variables de entorno necesarias (GitHub Secrets):
 *   SUPABASE_URL            — URL de tu proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — Clave de servicio (Settings → API en Supabase)
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { scrapearNotificaciones } = require('./scraper')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncUsuario(config) {
  const { user_id, portal_url, usuario, password } = config
  console.log(`\n[sync] Usuario: ${user_id}`)

  // Rango: del mismo día del mes anterior al día de hoy (hora de México)
  function fechaMexico(date) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
    return fmt.format(date) // retorna YYYY-MM-DD
  }

  const hoy = new Date()
  const hoyStr = fechaMexico(hoy)
  const [anio, mes, dia] = hoyStr.split('-').map(Number)

  const prevMes  = mes === 1 ? 12 : mes - 1
  const prevAnio = mes === 1 ? anio - 1 : anio
  // Crear fecha con mismo día en mes anterior (en UTC para evitar DST issues)
  let inicioDate = new Date(Date.UTC(prevAnio, prevMes - 1, dia))
  // Si el día no existe (ej: 31 en febrero), usar el último día de ese mes
  if (inicioDate.getUTCMonth() !== prevMes - 1) {
    inicioDate = new Date(Date.UTC(prevAnio, prevMes, 0))
  }
  const fechaFin    = hoyStr
  const fechaInicio = inicioDate.toISOString().split('T')[0]
  console.log(`[sync] Rango: ${fechaInicio} → ${fechaFin} (hora México)`)

  let notificaciones
  try {
    notificaciones = await scrapearNotificaciones({ portal_url, usuario, password }, fechaInicio, fechaFin)
  } catch (err) {
    console.error(`[sync] Error en scraping: ${err.message}`)
    console.error(`[sync] Stack: ${err.stack}`)
    return
  }

  console.log(`[sync] ${notificaciones.length} notificaciones encontradas`)
  if (notificaciones.length === 0) return

  // Obtener expedientes del usuario
  const { data: expedientes } = await supabase
    .from('expedientes')
    .select('id, numero')
    .eq('user_id', user_id)

  console.log(`[sync] Expedientes en BD: ${(expedientes || []).map(e => e.numero).join(', ')}`)

  // Genera todas las variantes de normalización de un número de expediente
  function variantes(num) {
    if (!num) return []
    const v = new Set()
    v.add(num)
    // Quitar espacios y guiones extra
    const limpio = num.trim()
    v.add(limpio)
    // Quitar prefijo de letra (C-, P-, etc.)
    const sinPrefijo = limpio.replace(/^[A-Za-z][-\s]?/, '')
    v.add(sinPrefijo)
    // Quitar ceros iniciales del número antes de /
    v.add(limpio.replace(/^0+/, ''))
    v.add(sinPrefijo.replace(/^0+/, ''))
    // Normalizar año: 24 → 2024 y 2024 → 24
    const expandirAnio = (s) => s.replace(/\/(\d{2})$/, (_, y) => `/20${y}`)
    const contraerAnio = (s) => s.replace(/\/(20)(\d{2})$/, '/$2')
    for (const base of [...v]) {
      v.add(expandirAnio(base))
      v.add(contraerAnio(base))
    }
    return [...v].filter(Boolean)
  }

  // Mapa: variante → expediente_id
  const expMap = {}
  for (const exp of (expedientes || [])) {
    for (const v of variantes(exp.numero)) {
      expMap[v] = exp.id
      expMap[v.toLowerCase()] = exp.id
    }
  }

  let insertadas = 0, duplicados = 0, sinExp = 0

  for (const n of notificaciones) {
    console.log(`[sync] Notificación del portal: expediente="${n.expediente}" fecha="${n.fecha}" tipo="${n.tipo}"`)
    const buscar = variantes(n.expediente)
    const expId = buscar.map(v => expMap[v] || expMap[v.toLowerCase()]).find(Boolean)
    let resolvedExpId = expId
    if (!resolvedExpId) {
      console.log(`[sync]   → Sin coincidencia en BD. Creando expediente automáticamente...`)
      // Normalizar número: quitar ceros iniciales del número, expandir año
      const numeroNorm = n.expediente
        .replace(/^([A-Za-z]+)-?(\d+)\/(\d{2})$/, (_, letra, num, anio) =>
          `${letra}-${parseInt(num, 10)}/${anio}`)
        .replace(/^(\d+)\/(\d{2})$/, (_, num, anio) => `${parseInt(num, 10)}/${anio}`)
      const { data: nuevo, error: errExp } = await supabase
        .from('expedientes')
        .insert({
          user_id,
          equipo_id: config.equipo_id || null,
          numero: numeroNorm || n.expediente,
          tipo: 'Por definir',
          materia: 'Civil',
          estado: 'En trámite',
        })
        .select('id')
        .single()
      if (errExp) {
        console.error(`[sync]   → Error creando expediente: ${errExp.message}`)
        sinExp++; continue
      }
      resolvedExpId = nuevo.id
      // Agregar al mapa para siguientes iteraciones
      expMap[n.expediente] = resolvedExpId
      expMap[n.expediente.toLowerCase()] = resolvedExpId
      console.log(`[sync]   → Expediente creado: ${numeroNorm} (id=${resolvedExpId})`)
    } else {
      console.log(`[sync]   → Coincide con expediente_id=${resolvedExpId}`)
    }

    const { data: existe } = await supabase
      .from('actuaciones')
      .select('id')
      .eq('expediente_id', resolvedExpId)
      .eq('fecha', n.fecha)
      .eq('origen', 'portal_judicial')
      .ilike('descripcion', `${n.descripcion.substring(0, 100)}%`)
      .limit(1)

    if (existe?.length > 0) { duplicados++; continue }

    const { error } = await supabase.from('actuaciones').insert({
      user_id,
      expediente_id: resolvedExpId,
      fecha: n.fecha,
      tipo: 'Acuerdo',
      descripcion: n.descripcion,
      origen: 'portal_judicial',
      visible_portal: true,
    })

    if (error) console.error(`[sync] Error insertando: ${error.message}`)
    else insertadas++
  }

  // Guardar resultado
  await supabase.from('configuracion_portal').update({
    ultimo_sync: new Date().toISOString(),
    ultimo_resultado: {
      notificaciones_encontradas: notificaciones.length,
      actuaciones_insertadas: insertadas,
      duplicados_omitidos: duplicados,
      sin_expediente: sinExp,
    }
  }).eq('user_id', user_id)

  console.log(`[sync] Listo: ${insertadas} insertadas, ${duplicados} duplicados, ${sinExp} sin expediente`)
}

async function main() {
  console.log('[sync-actions] Iniciando sincronización del portal judicial...')

  const { data: configs, error } = await supabase
    .from('configuracion_portal')
    .select('*')
    .not('usuario', 'is', null)
    .not('password', 'is', null)
    .not('portal_url', 'is', null)

  if (error) { console.error('Error leyendo configuraciones:', error.message); process.exit(1) }
  if (!configs?.length) { console.log('No hay usuarios con portal configurado.'); process.exit(0) }

  console.log(`[sync-actions] ${configs.length} usuario(s) con portal configurado`)

  for (const config of configs) {
    await syncUsuario(config)
  }

  console.log('\n[sync-actions] Sincronización completada.')
}

main().catch(err => { console.error(err); process.exit(1) })
