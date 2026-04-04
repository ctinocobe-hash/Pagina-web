/**
 * Servidor local del agente judicial
 * Puerto: 3001 (configurable con PORT en .env)
 *
 * Uso:
 *   cd agent && npm install && node server.js
 *
 * El dashboard llama a este servidor cuando pulsas "Sincronizar ahora".
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const { scrapearNotificaciones } = require('./scraper')
const { consultarExpedientes, consultarUnExpediente } = require('./scraper-expedientes')

const app = express()
const PORT = process.env.PORT || 3001

// ─── CORS: permite llamadas desde el dashboard (dev y producción) ─────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true), // acepta cualquier origen local
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// ─── Helpers ──────────────────────────────────────────────────────────────────

function supabaseConToken(token) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, agent: 'despacho-agent', version: '1.0.0' })
})

// ─── POST /sync ───────────────────────────────────────────────────────────────
// Body: { fecha_inicio?: 'YYYY-MM-DD', fecha_fin?: 'YYYY-MM-DD' }
// Header: Authorization: Bearer <supabase_jwt>
app.post('/sync', async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return res.status(401).json({ error: 'Token de autorización requerido' })
  }

  const supabase = supabaseConToken(token)

  try {
    // 1. Obtener usuario actual
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' })
    }

    // 2. Leer credenciales del portal judicial
    const { data: config, error: cfgErr } = await supabase
      .from('configuracion_portal')
      .select('portal_url, usuario, password')
      .eq('user_id', user.id)
      .single()

    if (cfgErr || !config) {
      return res.status(400).json({ error: 'No hay credenciales del portal configuradas' })
    }
    if (!config.usuario || !config.password) {
      return res.status(400).json({ error: 'Credenciales incompletas — configura usuario y contraseña' })
    }

    // 3. Parámetros de fecha
    const { fecha_inicio, fecha_fin } = req.body
    const hoy = new Date().toISOString().split('T')[0]
    const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const inicio = fecha_inicio || hace30dias
    const fin = fecha_fin || hoy
    const periodo = `${inicio} al ${fin}`

    console.log(`[sync] Usuario: ${user.email} | Período: ${periodo}`)

    // 4. Scraping
    const notificaciones = await scrapearNotificaciones(config, inicio, fin)

    if (notificaciones.length === 0) {
      // Actualizar timestamp de último sync aunque no haya notificaciones
      await supabase
        .from('configuracion_portal')
        .update({ ultimo_sync: new Date().toISOString(), ultimo_resultado: { notificaciones_encontradas: 0, actuaciones_insertadas: 0, duplicados_omitidos: 0, sin_expediente: 0 } })
        .eq('user_id', user.id)

      return res.json({
        periodo,
        notificaciones_encontradas: 0,
        actuaciones_insertadas: 0,
        duplicados_omitidos: 0,
        sin_expediente: 0,
        errores: [],
      })
    }

    // 5. Obtener expedientes del usuario para cruzar números
    const { data: expedientes } = await supabase
      .from('expedientes')
      .select('id, numero')
      .eq('user_id', user.id)

    const expMap = {}
    for (const exp of (expedientes || [])) {
      // Indexar por número completo y por número sin ceros a la izquierda
      expMap[exp.numero] = exp.id
      expMap[exp.numero.replace(/^0+/, '')] = exp.id
    }

    // 6. Insertar actuaciones (evitar duplicados)
    let insertadas = 0
    let duplicados = 0
    let sinExpediente = 0
    const errores = []

    for (const n of notificaciones) {
      // Buscar expediente por número
      const expId = expMap[n.expediente] || expMap[n.expediente.replace(/^0+/, '')]

      if (!expId) {
        sinExpediente++
        console.log(`[sync] Sin expediente: "${n.expediente}"`)
        continue
      }

      // Verificar duplicado: misma fecha + expediente + primeros 100 chars de descripción
      const { data: existe } = await supabase
        .from('actuaciones')
        .select('id')
        .eq('expediente_id', expId)
        .eq('fecha', n.fecha)
        .eq('origen', 'portal_judicial')
        .ilike('descripcion', `${n.descripcion.substring(0, 100)}%`)
        .limit(1)

      if (existe?.length > 0) {
        duplicados++
        continue
      }

      // Insertar
      const { error: insErr } = await supabase
        .from('actuaciones')
        .insert({
          user_id: user.id,
          expediente_id: expId,
          fecha: n.fecha,
          tipo: n.tipo || 'Acuerdo',
          descripcion: n.descripcion,
          origen: 'portal_judicial',
          visible_portal: true,
        })

      if (insErr) {
        errores.push(`${n.expediente}: ${insErr.message}`)
        console.error(`[sync] Error insertando: ${insErr.message}`)
      } else {
        insertadas++
      }
    }

    // 7. Guardar resultado del sync
    const resultado = {
      notificaciones_encontradas: notificaciones.length,
      actuaciones_insertadas: insertadas,
      duplicados_omitidos: duplicados,
      sin_expediente: sinExpediente,
    }
    await supabase
      .from('configuracion_portal')
      .update({ ultimo_sync: new Date().toISOString(), ultimo_resultado: resultado })
      .eq('user_id', user.id)

    console.log(`[sync] Completado: ${insertadas} insertadas, ${duplicados} duplicados, ${sinExpediente} sin expediente`)

    res.json({ periodo, errores, ...resultado })

  } catch (err) {
    console.error('[sync] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /sync-expedientes ──────────────────────────────────────────────────
// Consulta masiva de expedientes en el portal de Servicios Virtuales
// Body: { expedientes?: [{ numero, juzgado }], descargar_pdfs?: boolean }
app.post('/sync-expedientes', async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return res.status(401).json({ error: 'Token de autorización requerido' })
  }

  const supabase = supabaseConToken(token)

  try {
    // 1. Obtener usuario
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' })
    }

    // 2. Leer credenciales del portal
    const { data: config, error: cfgErr } = await supabase
      .from('configuracion_portal')
      .select('portal_url, usuario, password')
      .eq('user_id', user.id)
      .single()

    if (cfgErr || !config) {
      return res.status(400).json({ error: 'No hay credenciales del portal configuradas' })
    }
    if (!config.usuario || !config.password) {
      return res.status(400).json({ error: 'Credenciales incompletas — configura usuario y contraseña' })
    }

    // 3. Obtener expedientes a consultar
    let expsToQuery = req.body.expedientes || []
    const descargarPdfs = req.body.descargar_pdfs || false

    // Si no se especifican expedientes, consultar todos los activos del usuario
    if (expsToQuery.length === 0) {
      const { data: expsDB } = await supabase
        .from('expedientes')
        .select('id, numero, juzgado')
        .eq('user_id', user.id)
        .neq('estado', 'Concluido')

      expsToQuery = (expsDB || []).map(e => ({
        id: e.id,
        numero: e.numero,
        juzgado: e.juzgado || ''
      }))
    }

    if (expsToQuery.length === 0) {
      return res.json({ mensaje: 'No hay expedientes activos para consultar', resultados: {} })
    }

    console.log(`[sync-expedientes] Usuario: ${user.email} | ${expsToQuery.length} expedientes a consultar`)

    // 4. Ejecutar scraping
    const resultados = await consultarExpedientes(
      config,
      expsToQuery,
      { descargarPdfs }
    )

    // 5. Guardar documentos encontrados en la BD
    let totalDocumentos = 0
    let totalInsertados = 0
    let totalDuplicados = 0
    const errores = []

    for (const [numero, resultado] of Object.entries(resultados)) {
      if (!resultado.success) {
        errores.push(`${numero}: ${resultado.error}`)
        continue
      }

      // Buscar el expediente_id en la BD
      const expQuery = expsToQuery.find(e => e.numero === numero)
      let expedienteId = expQuery?.id

      if (!expedienteId) {
        // Buscar por número
        const { data: expDB } = await supabase
          .from('expedientes')
          .select('id')
          .eq('user_id', user.id)
          .eq('numero', numero)
          .limit(1)

        expedienteId = expDB?.[0]?.id
      }

      if (!expedienteId) {
        console.log(`[sync-expedientes] Expediente ${numero} no encontrado en BD, omitiendo`)
        continue
      }

      // Insertar cada documento encontrado
      const allDocs = [
        ...resultado.acuerdos,
        ...resultado.promociones,
        ...resultado.contestaciones,
        ...resultado.otros
      ]

      totalDocumentos += allDocs.length

      for (const doc of allDocs) {
        // Verificar duplicado
        const descCorta = (doc.descripcion || '').substring(0, 100)
        const { data: existe } = await supabase
          .from('documentos_judicial')
          .select('id')
          .eq('expediente_id', expedienteId)
          .eq('fecha', doc.fecha)
          .eq('tipo', doc.tipo)
          .ilike('descripcion', `${descCorta}%`)
          .limit(1)

        if (existe?.length > 0) {
          totalDuplicados++
          continue
        }

        const { error: insErr } = await supabase
          .from('documentos_judicial')
          .insert({
            user_id: user.id,
            expediente_id: expedienteId,
            fecha: doc.fecha,
            tipo: doc.tipo,
            descripcion: doc.descripcion,
            pdf_url: doc.pdfUrl || null,
            pdf_links: doc.pdfLinks || [],
            origen: 'portal_servicios_virtuales',
          })

        if (insErr) {
          errores.push(`${numero}/${doc.tipo}: ${insErr.message}`)
        } else {
          totalInsertados++
        }
      }
    }

    // 6. Actualizar timestamp de última consulta
    await supabase
      .from('configuracion_portal')
      .update({
        ultima_consulta_expedientes: new Date().toISOString(),
        ultimo_resultado_expedientes: {
          expedientes_consultados: Object.keys(resultados).length,
          documentos_encontrados: totalDocumentos,
          documentos_insertados: totalInsertados,
          duplicados_omitidos: totalDuplicados,
        }
      })
      .eq('user_id', user.id)

    console.log(`[sync-expedientes] Completado: ${totalInsertados} insertados, ${totalDuplicados} duplicados`)

    res.json({
      expedientes_consultados: Object.keys(resultados).length,
      documentos_encontrados: totalDocumentos,
      documentos_insertados: totalInsertados,
      duplicados_omitidos: totalDuplicados,
      errores,
      resultados,
    })

  } catch (err) {
    console.error('[sync-expedientes] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /consultar-expediente ──────────────────────────────────────────────
// Consulta un expediente individual
// Body: { numero: string, juzgado?: string, descargar_pdfs?: boolean }
app.post('/consultar-expediente', async (req, res) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return res.status(401).json({ error: 'Token de autorización requerido' })
  }

  const supabase = supabaseConToken(token)

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' })
    }

    const { data: config } = await supabase
      .from('configuracion_portal')
      .select('portal_url, usuario, password')
      .eq('user_id', user.id)
      .single()

    if (!config?.usuario || !config?.password) {
      return res.status(400).json({ error: 'Credenciales del portal no configuradas' })
    }

    const { numero, juzgado, descargar_pdfs } = req.body
    if (!numero) {
      return res.status(400).json({ error: 'Se requiere el número de expediente' })
    }

    console.log(`[consultar-expediente] Usuario: ${user.email} | Expediente: ${numero}`)

    const resultado = await consultarUnExpediente(config, numero, juzgado || '', { descargarPdfs: descargar_pdfs || false })

    res.json(resultado)

  } catch (err) {
    console.error('[consultar-expediente] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /pdfs/:filename ─────────────────────────────────────────────────────
// Sirve PDFs descargados localmente
const path = require('path')
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')))

// ─── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Agente judicial corriendo en http://localhost:${PORT}`)
  console.log(`  Endpoints:`)
  console.log(`    GET  /health               — verificar que el agente está activo`)
  console.log(`    POST /sync                 — sincronizar notificaciones (SIGE)`)
  console.log(`    POST /sync-expedientes     — consultar todos los expedientes activos`)
  console.log(`    POST /consultar-expediente  — consultar un expediente individual`)
  console.log(`    GET  /pdfs/:filename       — servir PDFs descargados\n`)
})
