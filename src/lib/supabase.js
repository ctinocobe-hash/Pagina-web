import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const db = {
  // --- Equipo ---
  async getEquipo() {
    const { data, error } = await supabase.from('equipo_miembros').select('equipo_id, rol, equipos(id, nombre)').limit(1).single()
    if (error) return null
    return data
  },
  async getEquipoId() {
    const equipo = await this.getEquipo()
    return equipo?.equipo_id || null
  },
  async getUserAndEquipo() {
    const { data: { user } } = await supabase.auth.getUser()
    const equipoId = await this.getEquipoId()
    return { user, equipoId }
  },

  // --- Detect user type ---
  async getUserType() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { type: null, user: null }
    // Check if admin/team member
    const { data: team } = await supabase.from('equipo_miembros').select('equipo_id, rol').eq('user_id', user.id).limit(1).single()
    if (team) return { type: 'admin', user, equipo_id: team.equipo_id, rol: team.rol }
    // Check if portal client
    const { data: portal } = await supabase.from('portal_clientes').select('id, cliente_id, equipo_id, activo').eq('user_id', user.id).limit(1).single()
    if (portal && portal.activo) return { type: 'portal', user, cliente_id: portal.cliente_id, equipo_id: portal.equipo_id }
    return { type: 'unknown', user }
  },

  // --- Clientes ---
  async getClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('nombre')
    if (error) throw error
    return data
  },
  async addCliente(cliente) {
    const { user, equipoId } = await this.getUserAndEquipo()
    const { data, error } = await supabase.from('clientes').insert({ ...cliente, user_id: user.id, equipo_id: equipoId }).select().single()
    if (error) throw error
    return data
  },
  async updateCliente(id, updates) {
    const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
  },

  // --- Expedientes ---
  async getExpedientes() {
    const { data, error } = await supabase.from('expedientes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async addExpediente(exp) {
    const { user, equipoId } = await this.getUserAndEquipo()
    const { data, error } = await supabase.from('expedientes').insert({ ...exp, user_id: user.id, equipo_id: equipoId }).select().single()
    if (error) throw error
    return data
  },
  async updateExpediente(id, updates) {
    const { data, error } = await supabase.from('expedientes').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteExpediente(id) {
    const { error } = await supabase.from('expedientes').delete().eq('id', id)
    if (error) throw error
  },

  // --- Actuaciones ---
  async getActuaciones(expedienteId) {
    const { data, error } = await supabase.from('actuaciones').select('*').eq('expediente_id', expedienteId).order('fecha', { ascending: false })
    if (error) throw error
    return data
  },
  async getAllActuaciones() {
    const { data, error } = await supabase.from('actuaciones').select('*').order('fecha', { ascending: false })
    if (error) throw error
    return data
  },
  async addActuacion(act) {
    const { user, equipoId } = await this.getUserAndEquipo()
    const { data, error } = await supabase.from('actuaciones').insert({ ...act, user_id: user.id, equipo_id: equipoId }).select().single()
    if (error) throw error
    return data
  },
  async updateActuacion(id, updates) {
    const { data, error } = await supabase.from('actuaciones').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteActuacion(id) {
    const { error } = await supabase.from('actuaciones').delete().eq('id', id)
    if (error) throw error
  },

  // --- Documentos Cliente ---
  async getDocumentos(clienteId) {
    const { data, error } = await supabase.from('documentos_cliente').select('*').eq('cliente_id', clienteId).order('fecha', { ascending: false })
    if (error) throw error
    return data
  },
  async getAllDocumentos() {
    const { data, error } = await supabase.from('documentos_cliente').select('*').order('fecha', { ascending: false })
    if (error) throw error
    return data
  },
  async addDocumento(doc) {
    const { user, equipoId } = await this.getUserAndEquipo()
    const { data, error } = await supabase.from('documentos_cliente').insert({ ...doc, user_id: user.id, equipo_id: equipoId }).select().single()
    if (error) throw error
    return data
  },
  async updateDocumento(id, updates) {
    const { data, error } = await supabase.from('documentos_cliente').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteDocumento(id) {
    const { error } = await supabase.from('documentos_cliente').delete().eq('id', id)
    if (error) throw error
  },

  // --- Cobros ---
  async getCobros() {
    const { data, error } = await supabase.from('cobros').select('*').order('fecha_vencimiento')
    if (error) throw error
    return data
  },
  async addCobro(cobro) {
    const { user, equipoId } = await this.getUserAndEquipo()
    const { data, error } = await supabase.from('cobros').insert({ ...cobro, user_id: user.id, equipo_id: equipoId }).select().single()
    if (error) throw error
    return data
  },
  async updateCobro(id, updates) {
    const { data, error } = await supabase.from('cobros').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteCobro(id) {
    const { error } = await supabase.from('cobros').delete().eq('id', id)
    if (error) throw error
  },

  // --- Actividad ---
  async getActividad(limit = 20) {
    const { data, error } = await supabase.from('actividad').select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return data
  },
  async addActividad(texto, tipo = 'general', referenciaId = null) {
    const { user, equipoId } = await this.getUserAndEquipo()
    await supabase.from('actividad').insert({
      user_id: user.id, equipo_id: equipoId,
      fecha: new Date().toISOString().slice(0, 10),
      texto, tipo, referencia_id: referenciaId
    })
  },

  // ============================================
  // PORTAL DE CLIENTES
  // ============================================

  // Create a portal account for a client
  async createPortalAccount(email, password, clienteId) {
    const { user, equipoId } = await this.getUserAndEquipo()
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin
      ? await supabase.auth.admin.createUser({ email, password, email_confirm: true })
      : await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ email, password })
        }).then(r => r.json())

    const newUserId = authData?.user?.id || authData?.id
    if (!newUserId) throw new Error('Error creando usuario: ' + JSON.stringify(authData))

    // Link to portal_clientes
    const { data, error } = await supabase.from('portal_clientes').insert({
      user_id: newUserId, cliente_id: clienteId, equipo_id: equipoId, activo: true
    }).select().single()
    if (error) throw error

    await this.addActividad(`Portal activado para cliente`, 'cliente', clienteId)
    return data
  },

  // Simple portal account creation via Edge Function (no confirmation email)
  async createPortalAccountSimple(email, password, clienteId) {
    const equipoId = await this.getEquipoId()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No hay sesión activa')

    const { data, error } = await supabase.functions.invoke('crear-usuario-portal', {
      body: { email, password, cliente_id: clienteId, equipo_id: equipoId }
    })

    if (error) throw new Error(error.message || 'Error creando cuenta')
    if (data?.error) throw new Error(data.error)

    await this.addActividad(`Portal activado para cliente`, 'cliente', clienteId)
    return data
  },

  // Get all portal client links
  async getPortalClientes() {
    const { data, error } = await supabase.from('portal_clientes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Toggle portal client active status
  async togglePortalCliente(id, activo) {
    const { data, error } = await supabase.from('portal_clientes').update({ activo }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  // Delete portal client link
  async deletePortalCliente(id) {
    const { error } = await supabase.from('portal_clientes').delete().eq('id', id)
    if (error) throw error
  },

  // --- Portal client data fetching ---
  async getPortalExpedientes(clienteId) {
    const { data, error } = await supabase.from('expedientes').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getPortalActuaciones(expedienteId) {
    const { data, error } = await supabase.from('actuaciones').select('*').eq('expediente_id', expedienteId).eq('visible_portal', true).order('fecha', { ascending: false })
    if (error) throw error
    return data
  },

  async getPortalDocumentos(clienteId) {
    const { data, error } = await supabase.from('documentos_cliente').select('*').eq('cliente_id', clienteId).eq('visible_portal', true).order('fecha', { ascending: false })
    if (error) throw error
    return data
  },

  async getPortalCobros(clienteId) {
    const { data, error } = await supabase.from('cobros').select('*').eq('cliente_id', clienteId).eq('visible_portal', true).order('fecha_vencimiento')
    if (error) throw error
    return data
  },

  async getPortalClienteInfo(clienteId) {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', clienteId).single()
    if (error) throw error
    return data
  },

  // ============================================
  // SINCRONIZACIÓN CON PORTAL JUDICIAL
  // ============================================

  async getConfiguracionPortal() {
    // No traer el campo password al frontend — solo se necesita para el agent server
    const { data, error } = await supabase.from('configuracion_portal')
      .select('id, portal_url, usuario, ultimo_sync, ultimo_resultado, equipo_id, created_at, updated_at')
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async saveConfiguracionPortal(config) {
    const { data: { user } } = await supabase.auth.getUser()
    const equipoId = await this.getEquipoId()
    // No enviar password vacío (preservar el existente si no se cambia)
    const payload = { portal_url: config.portal_url, usuario: config.usuario, user_id: user.id, equipo_id: equipoId }
    if (config.password) {
      payload.password = config.password
    }
    const { data, error } = await supabase
      .from('configuracion_portal')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id, portal_url, usuario, ultimo_sync, ultimo_resultado, created_at, updated_at')
      .single()
    if (error) throw error
    return data
  },

  async sincronizarPortal(fechaInicio, fechaFin) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No hay sesión activa')

    const agentUrl = import.meta.env.VITE_AGENT_URL || 'http://localhost:3001'
    const body = {}
    if (fechaInicio) body.fecha_inicio = fechaInicio
    if (fechaFin) body.fecha_fin = fechaFin

    let res
    try {
      res = await fetch(`${agentUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new Error('No se pudo conectar con el agente local. Asegúrate de que esté corriendo: cd agent && node server.js')
    }

    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al sincronizar')
    return json
  },

  async verificarAgente() {
    const agentUrl = import.meta.env.VITE_AGENT_URL || 'http://localhost:3001'
    try {
      const res = await fetch(`${agentUrl}/health`, { signal: AbortSignal.timeout(3000) })
      return res.ok
    } catch {
      return false
    }
  },
}
