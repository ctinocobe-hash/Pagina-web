import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// API helpers para cada tabla
// ============================================

export const db = {
  // --- Clientes ---
  async getClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('nombre')
    if (error) throw error
    return data
  },
  async addCliente(cliente) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('clientes').insert({ ...cliente, user_id: user.id }).select().single()
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('expedientes').insert({ ...exp, user_id: user.id }).select().single()
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('actuaciones').insert({ ...act, user_id: user.id }).select().single()
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('documentos_cliente').insert({ ...doc, user_id: user.id }).select().single()
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('cobros').insert({ ...cobro, user_id: user.id }).select().single()
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
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('actividad').insert({
      user_id: user.id,
      fecha: new Date().toISOString().slice(0, 10),
      texto, tipo,
      referencia_id: referenciaId
    })
  },
}
