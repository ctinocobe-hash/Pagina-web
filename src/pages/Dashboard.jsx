import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, db } from '../lib/supabase'

const materias = ["Administrativa", "Civil", "Mercantil", "Amparo", "Laboral", "Penal", "Familiar"]
const estadosProc = ["En trámite", "Alegatos", "Pruebas", "Sentencia", "Apelación", "Amparo", "Ejecución", "Concluido"]
const relacionesTipo = ["Apelación", "Amparo directo", "Amparo indirecto", "Incidente", "Recurso de revisión", "Queja"]
const actTipos = ["Presentación", "Acuerdo", "Auto", "Sentencia", "Notificación", "Promoción", "Contestación", "Alegatos", "Pruebas", "Recurso", "Amparo", "Otro"]
const docTipos = ["Contrato", "Recibo de pago", "Poder notarial", "Identificación", "Comprobante domicilio", "CURP", "RFC", "Escritura", "Otro"]

const estadoColors = {
  "Alegatos":   { bg: "#FFF3E0", text: "#E65100" },
  "En trámite": { bg: "#E3F2FD", text: "#1565C0" },
  "Sentencia":  { bg: "#E8F5E9", text: "#2E7D32" },
  "Amparo":     { bg: "#F3E5F5", text: "#7B1FA2" },
  "Concluido":  { bg: "#ECEFF1", text: "#546E7A" },
  "Apelación":  { bg: "#FFF8E1", text: "#F57F17" },
  "Ejecución":  { bg: "#E0F7FA", text: "#00838F" },
  "Pruebas":    { bg: "#FBE9E7", text: "#BF360C" },
}
const cobroColors = {
  "Pendiente": { bg: "#FFF8E1", text: "#F57F17" },
  "Pagado":    { bg: "#E8F5E9", text: "#2E7D32" },
  "Vencido":   { bg: "#FFEBEE", text: "#C62828" },
}

// SVG Icons
const IC = {
  Dashboard: (p={}) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Folder: (p={}) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Users: (p={}) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar: (p={}) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Dollar: (p={}) => <svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  File: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Link: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Scale: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M3 13a4 4 0 0 0 4 4"/><path d="M17 13a4 4 0 0 1 4 4"/><circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/></svg>,
}

const today = new Date().toISOString().slice(0, 10)
const formatMoney = (n) => "$" + Number(n || 0).toLocaleString("es-MX")
const formatDate = (d) => { if (!d) return "—"; const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}` }
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000)

export default function Dashboard({ session }) {
  const [section, setSection] = useState("dashboard")
  const [sidebar, setSidebar] = useState(false)
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState(null)
  const [modal, setModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [loading, setLoading] = useState(true)

  // Data state
  const [clientes, setClientes] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [actuaciones, setActuaciones] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [cobros, setCobros] = useState([])
  const [actividad, setActividad] = useState([])

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [cli, exp, act, doc, cob, actv] = await Promise.all([
        db.getClientes(), db.getExpedientes(), db.getAllActuaciones(),
        db.getAllDocumentos(), db.getCobros(), db.getActividad(30)
      ])
      setClientes(cli); setExpedientes(exp); setActuaciones(act)
      setDocumentos(doc); setCobros(cob); setActividad(actv)
    } catch (err) { console.error('Error cargando datos:', err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Helpers
  const getCli = (id) => clientes.find(c => c.id === id)
  const getExp = (id) => expedientes.find(e => e.id === id)
  const getExpActuaciones = (eid) => actuaciones.filter(a => a.expediente_id === eid)
  const getCliDocs = (cid) => documentos.filter(d => d.cliente_id === cid)
  const getCliExps = (cid) => expedientes.filter(e => e.cliente_id === cid)
  const getCliCobros = (cid) => cobros.filter(c => c.cliente_id === cid)
  const getRelacionados = (eid) => expedientes.filter(e => e.expediente_padre_id === eid)
  const getPadre = (e) => e.expediente_padre_id ? getExp(e.expediente_padre_id) : null

  // CRUD handlers
  const handleAddCliente = async (f) => {
    await db.addCliente(f); await db.addActividad(`Nuevo cliente: ${f.nombre}`, 'cliente')
    setModal(null); loadData()
  }
  const handleAddExpediente = async (f) => {
    await db.addExpediente(f); await db.addActividad(`Nuevo expediente: ${f.numero}`, 'expediente')
    setModal(null); loadData()
  }
  const handleAddCobro = async (f) => {
    await db.addCobro(f); await db.addActividad(`Nuevo cobro: ${formatMoney(f.monto)}`, 'cobro')
    setModal(null); loadData()
  }
  const handleAddActuacion = async (expId, f) => {
    const exp = getExp(expId)
    await db.addActuacion({ ...f, expediente_id: expId })
    await db.addActividad(`Actuación en ${exp?.numero}: ${f.descripcion}`, 'expediente', expId)
    setSubModal(null); loadData()
  }
  const handleAddDocumento = async (cliId, f) => {
    const cli = getCli(cliId)
    await db.addDocumento({ ...f, cliente_id: cliId })
    await db.addActividad(`Documento: ${f.nombre} — ${cli?.nombre}`, 'cliente', cliId)
    setSubModal(null); loadData()
  }
  const handleDelExp = async (id) => { await db.deleteExpediente(id); loadData() }
  const handleDelCli = async (id) => { await db.deleteCliente(id); loadData() }
  const handleDelCob = async (id) => { await db.deleteCobro(id); loadData() }
  const handleDelAct = async (id) => { await db.deleteActuacion(id); loadData() }
  const handleDelDoc = async (id) => { await db.deleteDocumento(id); loadData() }
  const handleUpdCobro = async (id, estado) => { await db.updateCobro(id, { estado }); loadData() }

  const handleLogout = async () => { await supabase.auth.signOut() }

  // Metrics
  const expActivos = expedientes.filter(e => e.estado !== "Concluido").length
  const expUrgentes = expedientes.filter(e => e.urgente).length
  const clientesActivos = clientes.filter(c => c.activo).length
  const totalPend = cobros.filter(c => c.estado === "Pendiente").reduce((s, c) => s + Number(c.monto), 0)
  const totalVenc = cobros.filter(c => c.estado === "Vencido").reduce((s, c) => s + Number(c.monto), 0)
  const totalCobrado = cobros.filter(c => c.estado === "Pagado").reduce((s, c) => s + Number(c.monto), 0)
  const in15 = new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10)
  const plazosProx = expedientes.filter(e => e.proximo_plazo >= today && e.proximo_plazo <= in15).sort((a, b) => a.proximo_plazo.localeCompare(b.proximo_plazo))
  const plazosVenc = expedientes.filter(e => e.proximo_plazo && e.proximo_plazo < today && e.estado !== "Concluido")

  // Search
  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const exps = expedientes.filter(e => e.numero.toLowerCase().includes(q) || e.tipo?.toLowerCase().includes(q) || e.juzgado?.toLowerCase().includes(q) || getCli(e.cliente_id)?.nombre.toLowerCase().includes(q))
    const clis = clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.telefono?.includes(q))
    const cobs = cobros.filter(c => c.concepto.toLowerCase().includes(q) || getCli(c.cliente_id)?.nombre.toLowerCase().includes(q))
    return { exps, clis, cobs, total: exps.length + clis.length + cobs.length }
  }, [search, expedientes, clientes, cobros])

  // ===== UI COMPONENTS =====
  const Badge = ({ children, color = "#C8B88A", bg = "rgba(200,184,138,0.12)" }) => (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>
  )
  const Stat = ({ value, label, accent = "#C8B88A", alert = false }) => (
    <div style={{ background: alert ? "rgba(198,40,40,0.08)" : "rgba(200,184,138,0.05)", border: `1px solid ${alert ? "rgba(198,40,40,0.25)" : "rgba(200,184,138,0.12)"}`, borderRadius: 14, padding: "18px 16px", flex: "1 1 130px", minWidth: 130 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: alert ? "#EF9A9A" : "rgba(200,184,138,0.5)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: alert ? "#EF9A9A" : accent, lineHeight: 1 }}>{value}</div>
    </div>
  )
  const Btn = ({ children, onClick, v = "primary", small = false }) => {
    const vs = { primary: { background: "#C8B88A", color: "#0F1923", border: "none" }, secondary: { background: "transparent", color: "#C8B88A", border: "1px solid rgba(200,184,138,0.3)" }, danger: { background: "transparent", color: "#EF9A9A", border: "1px solid rgba(239,154,154,0.3)" }, success: { background: "transparent", color: "#81C784", border: "1px solid rgba(129,199,132,0.3)" }, ghost: { background: "transparent", color: "rgba(200,184,138,0.5)", border: "none" } }
    return <button onClick={onClick} style={{ ...vs[v], borderRadius: 8, padding: small ? "5px 12px" : "10px 18px", fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", letterSpacing: .3 }}>{children}</button>
  }
  const Input = ({ label, ...p }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(200,184,138,0.5)", marginBottom: 5 }}>{label}</label>
      <input {...p} style={{ width: "100%", padding: "9px 12px", background: "rgba(200,184,138,0.06)", border: "1px solid rgba(200,184,138,0.15)", borderRadius: 8, color: "#E8E0D0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
    </div>
  )
  const Sel = ({ label, children, ...p }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(200,184,138,0.5)", marginBottom: 5 }}>{label}</label>
      <select {...p} style={{ width: "100%", padding: "9px 12px", background: "#1A2733", border: "1px solid rgba(200,184,138,0.15)", borderRadius: 8, color: "#E8E0D0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>{children}</select>
    </div>
  )
  const ModalWrap = ({ title, children, onClose, wide }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#152028", border: "1px solid rgba(200,184,138,0.15)", borderRadius: 16, padding: 24, width: "92%", maxWidth: wide ? 640 : 480, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "#C8B88A", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(200,184,138,0.5)", cursor: "pointer" }}><IC.X /></button>
        </div>
        {children}
      </div>
    </div>
  )
  const Th = ({ children, sx = {} }) => <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(200,184,138,0.4)", borderBottom: "1px solid rgba(200,184,138,0.1)", background: "rgba(200,184,138,0.03)", whiteSpace: "nowrap", ...sx }}>{children}</th>
  const Td = ({ children, sx = {} }) => <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(200,184,138,0.06)", color: "#D4CCBC", verticalAlign: "middle", fontSize: 13, ...sx }}>{children}</td>
  const Card = ({ children, style: sx = {} }) => <div style={{ background: "rgba(200,184,138,0.03)", border: "1px solid rgba(200,184,138,0.1)", borderRadius: 14, padding: 18, position: "relative", ...sx }}>{children}</div>
  const CardTitle = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: "#C8B88A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: .8 }}>{children}</div>
  const DelBtn = ({ onClick }) => <button onClick={onClick} style={{ background: "none", border: "none", color: "rgba(239,154,154,0.5)", cursor: "pointer", padding: 2 }}><IC.Trash /></button>

  // ===== FORMS =====
  const ExpForm = () => {
    const [f, sF] = useState({ numero: "", tipo: "Contencioso Administrativo", materia: "Administrativa", cliente_id: "", juzgado: "", estado: "En trámite", urgente: false, fecha_inicio: today, proximo_plazo: "", notas: "", expediente_padre_id: null, relacion: "" })
    const u = (k, v) => sF({ ...f, [k]: v })
    return <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="No. expediente" value={f.numero} onChange={e => u("numero", e.target.value)} placeholder="CA-003/2026" />
        <Sel label="Materia" value={f.materia} onChange={e => u("materia", e.target.value)}>{materias.map(m => <option key={m}>{m}</option>)}</Sel>
      </div>
      <Input label="Tipo de juicio" value={f.tipo} onChange={e => u("tipo", e.target.value)} />
      <Sel label="Cliente" value={f.cliente_id} onChange={e => u("cliente_id", e.target.value)}>
        <option value="">Seleccionar...</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </Sel>
      <Input label="Juzgado / Tribunal" value={f.juzgado} onChange={e => u("juzgado", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Sel label="Estado procesal" value={f.estado} onChange={e => u("estado", e.target.value)}>{estadosProc.map(s => <option key={s}>{s}</option>)}</Sel>
        <Input label="Próximo plazo" type="date" value={f.proximo_plazo} onChange={e => u("proximo_plazo", e.target.value)} />
      </div>
      <Input label="Notas" value={f.notas} onChange={e => u("notas", e.target.value)} />
      <Card style={{ marginBottom: 14 }}>
        <CardTitle><IC.Link /> Vincular a expediente principal</CardTitle>
        <Sel label="Expediente padre" value={f.expediente_padre_id || ""} onChange={e => u("expediente_padre_id", e.target.value || null)}>
          <option value="">Ninguno (principal)</option>
          {expedientes.map(x => <option key={x.id} value={x.id}>{x.numero} — {getCli(x.cliente_id)?.nombre}</option>)}
        </Sel>
        {f.expediente_padre_id && <Sel label="Relación" value={f.relacion} onChange={e => u("relacion", e.target.value)}>
          <option value="">Seleccionar...</option>
          {relacionesTipo.map(r => <option key={r}>{r}</option>)}
        </Sel>}
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <input type="checkbox" checked={f.urgente} onChange={e => u("urgente", e.target.checked)} id="urg" />
        <label htmlFor="urg" style={{ fontSize: 13, color: "#E8E0D0" }}>Urgente</label>
      </div>
      <Btn onClick={() => f.numero && f.cliente_id ? handleAddExpediente(f) : null}>Guardar</Btn>
    </>
  }
  const CliForm = () => {
    const [f, sF] = useState({ nombre: "", telefono: "", email: "", direccion: "", rfc: "", notas: "" })
    const u = (k, v) => sF({ ...f, [k]: v })
    return <>
      <Input label="Nombre" value={f.nombre} onChange={e => u("nombre", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Teléfono" value={f.telefono} onChange={e => u("telefono", e.target.value)} />
        <Input label="Email" value={f.email} onChange={e => u("email", e.target.value)} />
      </div>
      <Input label="Dirección" value={f.direccion} onChange={e => u("direccion", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="RFC" value={f.rfc} onChange={e => u("rfc", e.target.value)} />
        <Input label="Notas" value={f.notas} onChange={e => u("notas", e.target.value)} />
      </div>
      <Btn onClick={() => f.nombre ? handleAddCliente(f) : null}>Guardar</Btn>
    </>
  }
  const CobForm = () => {
    const [f, sF] = useState({ cliente_id: "", concepto: "", monto: 0, estado: "Pendiente", fecha_emision: today, fecha_vencimiento: "" })
    const u = (k, v) => sF({ ...f, [k]: v })
    return <>
      <Sel label="Cliente" value={f.cliente_id} onChange={e => u("cliente_id", e.target.value)}>
        <option value="">Seleccionar...</option>
        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </Sel>
      <Input label="Concepto" value={f.concepto} onChange={e => u("concepto", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Monto ($)" type="number" value={f.monto} onChange={e => u("monto", Number(e.target.value))} />
        <Input label="Vencimiento" type="date" value={f.fecha_vencimiento} onChange={e => u("fecha_vencimiento", e.target.value)} />
      </div>
      <Btn onClick={() => f.cliente_id && f.monto ? handleAddCobro(f) : null}>Guardar</Btn>
    </>
  }
  const ActForm = ({ expId }) => {
    const [f, sF] = useState({ fecha: today, tipo: "Acuerdo", descripcion: "", documento: "" })
    const u = (k, v) => sF({ ...f, [k]: v })
    return <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Fecha" type="date" value={f.fecha} onChange={e => u("fecha", e.target.value)} />
        <Sel label="Tipo" value={f.tipo} onChange={e => u("tipo", e.target.value)}>{actTipos.map(t => <option key={t}>{t}</option>)}</Sel>
      </div>
      <Input label="Descripción" value={f.descripcion} onChange={e => u("descripcion", e.target.value)} />
      <Input label="Documento (ref.)" value={f.documento} onChange={e => u("documento", e.target.value)} />
      <Btn onClick={() => f.descripcion ? handleAddActuacion(expId, f) : null}>Guardar</Btn>
    </>
  }
  const DocForm = ({ cliId }) => {
    const [f, sF] = useState({ nombre: "", tipo: "Contrato", fecha: today, notas: "" })
    const u = (k, v) => sF({ ...f, [k]: v })
    return <>
      <Input label="Nombre" value={f.nombre} onChange={e => u("nombre", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Sel label="Tipo" value={f.tipo} onChange={e => u("tipo", e.target.value)}>{docTipos.map(t => <option key={t}>{t}</option>)}</Sel>
        <Input label="Fecha" type="date" value={f.fecha} onChange={e => u("fecha", e.target.value)} />
      </div>
      <Input label="Notas" value={f.notas} onChange={e => u("notas", e.target.value)} />
      <Btn onClick={() => f.nombre ? handleAddDocumento(cliId, f) : null}>Guardar</Btn>
    </>
  }

  // ===== DETAIL VIEWS =====
  const ExpDetail = ({ exp }) => {
    const cli = getCli(exp.cliente_id); const acts = getExpActuaciones(exp.id)
    const hijos = getRelacionados(exp.id); const padre = getPadre(exp)
    const sc = estadoColors[exp.estado] || estadoColors["En trámite"]
    const days = exp.proximo_plazo ? daysUntil(exp.proximo_plazo) : null
    return <div>
      <Btn v="ghost" small onClick={() => setDetail(null)}><IC.Back /> Volver</Btn>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, margin: "16px 0 24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#E8E0D0", fontWeight: 700 }}>{exp.numero}</h2>
            {exp.urgente && <Badge color="#C62828" bg="#FFEBEE">URGENTE</Badge>}
            <Badge color={sc.text} bg={sc.bg}>{exp.estado}</Badge>
          </div>
          <div style={{ fontSize: 13, color: "rgba(200,184,138,0.5)", marginTop: 6 }}>{exp.tipo} · {exp.materia} · {exp.juzgado}</div>
        </div>
        {days !== null && <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(200,184,138,0.4)" }}>Próximo plazo</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: days < 0 ? "#EF9A9A" : days <= 5 ? "#FFD54F" : "#81C784" }}>{formatDate(exp.proximo_plazo)}</div>
          <div style={{ fontSize: 12, color: days < 0 ? "#EF9A9A" : "rgba(200,184,138,0.4)" }}>{days < 0 ? `${Math.abs(days)}d vencido` : `${days}d`}</div>
        </div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <Card style={{ cursor: "pointer" }} onClick={() => cli && setDetail({ type: "cliente", id: cli.id })}>
          <CardTitle><IC.Users s={14} /> Cliente</CardTitle>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#E8E0D0" }}>{cli?.nombre || "—"}</div>
          <div style={{ fontSize: 12, color: "rgba(200,184,138,0.4)", marginTop: 4 }}>{cli?.telefono} · {cli?.email}</div>
        </Card>
        <Card>
          <CardTitle><IC.Link /> Relaciones procesales</CardTitle>
          {padre && <div style={{ padding: "6px 0", fontSize: 13 }}>
            <span style={{ color: "rgba(200,184,138,0.4)", fontSize: 11, marginRight: 6 }}>PADRE:</span>
            <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600 }} onClick={() => setDetail({ type: "expediente", id: padre.id })}>{padre.numero}</span>
            {exp.relacion && <span style={{ color: "rgba(200,184,138,0.35)", fontSize: 11, marginLeft: 6 }}>({exp.relacion})</span>}
          </div>}
          {hijos.map(h => <div key={h.id} style={{ padding: "5px 0", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <Badge color="#CE93D8" bg="rgba(206,147,216,0.12)">{h.relacion || "Relacionado"}</Badge>
            <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600 }} onClick={() => setDetail({ type: "expediente", id: h.id })}>{h.numero}</span>
          </div>)}
          {!padre && hijos.length === 0 && <div style={{ fontSize: 12, color: "rgba(200,184,138,0.25)" }}>Sin expedientes vinculados</div>}
        </Card>
      </div>
      {exp.notas && <Card style={{ marginBottom: 20 }}><CardTitle>Notas</CardTitle><div style={{ fontSize: 13, color: "#D4CCBC", lineHeight: 1.5 }}>{exp.notas}</div></Card>}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <CardTitle><IC.Clock /> Actuaciones ({acts.length})</CardTitle>
          <Btn v="secondary" small onClick={() => setSubModal({ type: "actuacion", expId: exp.id })}><IC.Plus /> Agregar</Btn>
        </div>
        {acts.length === 0 ? <div style={{ fontSize: 12, color: "rgba(200,184,138,0.25)", padding: "10px 0" }}>Sin actuaciones</div> :
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(200,184,138,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Descripción</Th><Th>Doc</Th><Th sx={{ width: 40 }}></Th></tr></thead>
              <tbody>{acts.map(a => <tr key={a.id}>
                <Td sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: 12 }}>{formatDate(a.fecha)}</Td>
                <Td><Badge>{a.tipo}</Badge></Td>
                <Td>{a.descripcion}</Td>
                <Td sx={{ fontSize: 11, color: "rgba(200,184,138,0.4)" }}>{a.documento || "—"}</Td>
                <Td><DelBtn onClick={() => handleDelAct(a.id)} /></Td>
              </tr>)}</tbody>
            </table>
          </div>}
      </Card>
    </div>
  }

  const CliDetail = ({ cli }) => {
    const exps = getCliExps(cli.id); const docs = getCliDocs(cli.id); const cobs = getCliCobros(cli.id)
    const pendCli = cobs.filter(c => c.estado === "Pendiente").reduce((s, c) => s + Number(c.monto), 0)
    return <div>
      <Btn v="ghost" small onClick={() => setDetail(null)}><IC.Back /> Volver</Btn>
      <div style={{ margin: "16px 0 24px" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#E8E0D0", fontWeight: 700 }}>{cli.nombre}</h2>
        <div style={{ fontSize: 13, color: "rgba(200,184,138,0.5)", marginTop: 4 }}>{cli.telefono} · {cli.email} · {cli.direccion}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Stat value={exps.length} label="Expedientes" />
        <Stat value={formatMoney(cobs.reduce((s, c) => s + Number(c.monto), 0))} label="Total facturado" accent="#FFD54F" />
        <Stat value={formatMoney(pendCli)} label="Pendiente" alert={pendCli > 0} />
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <CardTitle><IC.File /> Documentos ({docs.length})</CardTitle>
          <Btn v="secondary" small onClick={() => setSubModal({ type: "documento", cliId: cli.id })}><IC.Plus /> Agregar</Btn>
        </div>
        {docs.length === 0 ? <div style={{ fontSize: 12, color: "rgba(200,184,138,0.25)" }}>Sin documentos</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {docs.map(d => <div key={d.id} style={{ background: "rgba(200,184,138,0.04)", border: "1px solid rgba(200,184,138,0.1)", borderRadius: 10, padding: 14, position: "relative" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <IC.File />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E0D0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</div>
                  <div style={{ fontSize: 11, color: "rgba(200,184,138,0.4)", marginTop: 3 }}>{d.tipo} · {formatDate(d.fecha)}</div>
                  {d.notas && <div style={{ fontSize: 11, color: "rgba(200,184,138,0.3)", marginTop: 3 }}>{d.notas}</div>}
                </div>
              </div>
              <div style={{ position: "absolute", top: 8, right: 8 }}><DelBtn onClick={() => handleDelDoc(d.id)} /></div>
            </div>)}
          </div>}
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <CardTitle><IC.Folder s={14} /> Expedientes ({exps.length})</CardTitle>
        {exps.map(e => {
          const sc = estadoColors[e.estado] || {}; const hijos = getRelacionados(e.id)
          return <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(200,184,138,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {e.urgente && <span style={{ width: 8, height: 8, borderRadius: 4, background: "#EF5350", display: "inline-block" }} />}
                <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600 }} onClick={() => setDetail({ type: "expediente", id: e.id })}>{e.numero}</span>
                <Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge>
              </div>
              <span style={{ fontSize: 11, color: "rgba(200,184,138,0.35)" }}>{e.juzgado}</span>
            </div>
            {hijos.length > 0 && <div style={{ marginLeft: 24, marginTop: 6 }}>{hijos.map(h =>
              <div key={h.id} style={{ fontSize: 12, color: "rgba(200,184,138,0.4)", display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <span style={{ color: "#CE93D8" }}>↳</span>
                <span style={{ color: "#64B5F6", cursor: "pointer" }} onClick={() => setDetail({ type: "expediente", id: h.id })}>{h.numero}</span>
                <span style={{ fontSize: 10 }}>({h.relacion})</span>
              </div>
            )}</div>}
          </div>
        })}
      </Card>
      <Card>
        <CardTitle><IC.Dollar s={14} /> Cobros ({cobs.length})</CardTitle>
        {cobs.map(c => {
          const sc = cobroColors[c.estado] || {}
          return <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(200,184,138,0.06)" }}>
            <div><div style={{ fontSize: 13 }}>{c.concepto}</div><div style={{ fontSize: 11, color: "rgba(200,184,138,0.35)", marginTop: 2 }}>Vence: {formatDate(c.fecha_vencimiento)}</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, color: "#E8E0D0" }}>{formatMoney(c.monto)}</span>
              <Badge color={sc.text} bg={sc.bg}>{c.estado}</Badge>
            </div>
          </div>
        })}
      </Card>
    </div>
  }

  // ===== SECTIONS =====
  const renderDashboard = () => <div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <Stat value={expActivos} label="Expedientes activos" />
      <Stat value={expUrgentes} label="Urgentes" alert={expUrgentes > 0} />
      <Stat value={clientesActivos} label="Clientes" />
      <Stat value={plazosVenc.length} label="Plazos vencidos" alert={plazosVenc.length > 0} />
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <Stat value={formatMoney(totalPend)} label="Pendiente" accent="#FFD54F" />
      <Stat value={formatMoney(totalVenc)} label="Vencido" alert={totalVenc > 0} />
      <Stat value={formatMoney(totalCobrado)} label="Cobrado" accent="#81C784" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <CardTitle><IC.Calendar s={14} /> Plazos próximos (15d)</CardTitle>
        {plazosProx.length === 0 ? <div style={{ fontSize: 12, color: "rgba(200,184,138,0.25)", padding: "10px 0" }}>No hay plazos próximos</div> :
          plazosProx.map(e => <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(200,184,138,0.06)", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64B5F6", cursor: "pointer" }} onClick={() => setDetail({ type: "expediente", id: e.id })}>{e.numero}</div>
              <div style={{ fontSize: 11, color: "rgba(200,184,138,0.35)", marginTop: 2 }}>{getCli(e.cliente_id)?.nombre}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: daysUntil(e.proximo_plazo) <= 3 ? "#EF9A9A" : "#C8B88A" }}>{formatDate(e.proximo_plazo)}</div>
              <div style={{ fontSize: 11, color: "rgba(200,184,138,0.35)" }}>{daysUntil(e.proximo_plazo)}d</div>
            </div>
          </div>)}
      </Card>
      <Card>
        <CardTitle>Actividad reciente</CardTitle>
        {actividad.slice(0, 8).map(a => <div key={a.id} style={{ padding: "6px 0", borderBottom: "1px solid rgba(200,184,138,0.04)", display: "flex", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: a.tipo === "expediente" ? "#64B5F6" : a.tipo === "cliente" ? "#81C784" : "#FFD54F", marginTop: 5, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, color: "#D4CCBC" }}>{a.texto}</div>
            <div style={{ fontSize: 10, color: "rgba(200,184,138,0.3)", marginTop: 2 }}>{formatDate(a.fecha)}</div>
          </div>
        </div>)}
      </Card>
    </div>
  </div>

  const renderExpedientes = () => <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 12, color: "rgba(200,184,138,0.4)" }}>{expedientes.length} expediente(s)</span>
      <Btn small onClick={() => setModal("expediente")}><IC.Plus /> Nuevo</Btn>
    </div>
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(200,184,138,0.1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr><Th>Exp.</Th><Th>Tipo</Th><Th>Cliente</Th><Th>Juzgado</Th><Th>Estado</Th><Th>Plazo</Th><Th>Relación</Th><Th sx={{ width: 40 }}></Th></tr></thead>
        <tbody>{expedientes.map(e => {
          const sc = estadoColors[e.estado] || {}; const days = e.proximo_plazo ? daysUntil(e.proximo_plazo) : null; const padre = getPadre(e)
          return <tr key={e.id}>
            <Td sx={{ fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {e.urgente && <span style={{ width: 8, height: 8, borderRadius: 4, background: "#EF5350" }} />}
                <span style={{ color: "#64B5F6", cursor: "pointer" }} onClick={() => setDetail({ type: "expediente", id: e.id })}>{e.numero}</span>
              </div>
            </Td>
            <Td sx={{ fontSize: 12 }}>{e.tipo}</Td>
            <Td><span style={{ cursor: "pointer" }} onClick={() => setDetail({ type: "cliente", id: e.cliente_id })}>{getCli(e.cliente_id)?.nombre}</span></Td>
            <Td sx={{ fontSize: 11 }}>{e.juzgado}</Td>
            <Td><Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge></Td>
            <Td sx={{ fontSize: 12, fontWeight: 600, color: days === null ? "rgba(200,184,138,0.3)" : days < 0 ? "#EF9A9A" : days <= 5 ? "#FFD54F" : "#81C784" }}>
              {e.proximo_plazo ? `${formatDate(e.proximo_plazo)} (${days < 0 ? Math.abs(days) + "d venc." : days + "d"})` : "—"}
            </Td>
            <Td sx={{ fontSize: 11 }}>{padre ? <span style={{ color: "#CE93D8", cursor: "pointer" }} onClick={() => setDetail({ type: "expediente", id: padre.id })}>↳ {padre.numero}</span> : "Principal"}</Td>
            <Td><DelBtn onClick={() => handleDelExp(e.id)} /></Td>
          </tr>
        })}</tbody>
      </table>
    </div>
  </div>

  const renderClientes = () => <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 12, color: "rgba(200,184,138,0.4)" }}>{clientes.length} cliente(s)</span>
      <Btn small onClick={() => setModal("cliente")}><IC.Plus /> Nuevo</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
      {clientes.map(c => {
        const numExp = getCliExps(c.id).length; const numDoc = getCliDocs(c.id).length
        return <Card key={c.id} style={{ cursor: "pointer" }} onClick={() => setDetail({ type: "cliente", id: c.id })}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E0D0" }}>{c.nombre}</div>
              <div style={{ fontSize: 12, color: "rgba(200,184,138,0.4)", marginTop: 3 }}>{c.telefono} · {c.email}</div>
            </div>
            <Badge color={c.activo ? "#81C784" : "#EF9A9A"} bg={c.activo ? "rgba(129,199,132,0.12)" : "rgba(239,154,154,0.12)"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(200,184,138,0.45)" }}>
            <span>{numExp} exp.</span><span>{numDoc} docs.</span>
          </div>
          <div style={{ position: "absolute", top: 10, right: 10 }} onClick={ev => { ev.stopPropagation(); handleDelCli(c.id) }}><DelBtn /></div>
        </Card>
      })}
    </div>
  </div>

  const renderVencimientos = () => {
    const sorted = [...expedientes].filter(e => e.proximo_plazo && e.estado !== "Concluido").sort((a, b) => a.proximo_plazo.localeCompare(b.proximo_plazo))
    return <div>
      {plazosVenc.length > 0 && <div style={{ background: "rgba(198,40,40,0.08)", border: "1px solid rgba(198,40,40,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#EF9A9A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><IC.Alert /> Plazos vencidos ({plazosVenc.length})</div>
        {plazosVenc.map(e => <div key={e.id} style={{ padding: "7px 0", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(198,40,40,0.1)" }}>
          <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600, fontSize: 13 }} onClick={() => setDetail({ type: "expediente", id: e.id })}>{e.numero} — {getCli(e.cliente_id)?.nombre}</span>
          <span style={{ color: "#EF9A9A", fontSize: 12, fontWeight: 600 }}>Venció {formatDate(e.proximo_plazo)}</span>
        </div>)}
      </div>}
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(200,184,138,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr><Th>Expediente</Th><Th>Cliente</Th><Th>Juzgado</Th><Th>Estado</Th><Th>Plazo</Th><Th>Días</Th></tr></thead>
          <tbody>{sorted.map(e => { const d = daysUntil(e.proximo_plazo); const sc = estadoColors[e.estado] || {}; return <tr key={e.id}>
            <Td sx={{ fontWeight: 600 }}><span style={{ color: "#64B5F6", cursor: "pointer" }} onClick={() => setDetail({ type: "expediente", id: e.id })}>{e.numero}</span></Td>
            <Td>{getCli(e.cliente_id)?.nombre}</Td><Td sx={{ fontSize: 11 }}>{e.juzgado}</Td>
            <Td><Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge></Td>
            <Td sx={{ fontWeight: 600, fontSize: 12 }}>{formatDate(e.proximo_plazo)}</Td>
            <Td sx={{ color: d < 0 ? "#EF9A9A" : d <= 5 ? "#FFD54F" : "#81C784", fontWeight: 700 }}>{d < 0 ? `${Math.abs(d)}d vencido` : `${d}d`}</Td>
          </tr> })}</tbody>
        </table>
      </div>
    </div>
  }

  const renderCobranza = () => <div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
      <Stat value={formatMoney(totalPend)} label="Pendiente" accent="#FFD54F" />
      <Stat value={formatMoney(totalVenc)} label="Vencido" alert={totalVenc > 0} />
      <Stat value={formatMoney(totalCobrado)} label="Cobrado" accent="#81C784" />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 12, color: "rgba(200,184,138,0.4)" }}>{cobros.length} cobro(s)</span>
      <Btn small onClick={() => setModal("cobro")}><IC.Plus /> Nuevo</Btn>
    </div>
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(200,184,138,0.1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr><Th>Cliente</Th><Th>Concepto</Th><Th>Monto</Th><Th>Estado</Th><Th>Vence</Th><Th sx={{ textAlign: "center" }}>Acciones</Th></tr></thead>
        <tbody>{cobros.map(c => { const sc = cobroColors[c.estado] || {}; return <tr key={c.id}>
          <Td sx={{ fontWeight: 600 }}><span style={{ cursor: "pointer" }} onClick={() => setDetail({ type: "cliente", id: c.cliente_id })}>{getCli(c.cliente_id)?.nombre}</span></Td>
          <Td>{c.concepto}</Td>
          <Td sx={{ fontWeight: 700, color: "#E8E0D0" }}>{formatMoney(c.monto)}</Td>
          <Td><Badge color={sc.text} bg={sc.bg}>{c.estado}</Badge></Td>
          <Td sx={{ fontSize: 12 }}>{formatDate(c.fecha_vencimiento)}</Td>
          <Td sx={{ textAlign: "center" }}><div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {c.estado !== "Pagado" && <Btn v="success" small onClick={() => handleUpdCobro(c.id, "Pagado")}><IC.Check /></Btn>}
            {c.estado === "Pendiente" && c.fecha_vencimiento < today && <Btn v="danger" small onClick={() => handleUpdCobro(c.id, "Vencido")}><IC.Alert /></Btn>}
            <DelBtn onClick={() => handleDelCob(c.id)} />
          </div></Td>
        </tr> })}</tbody>
      </table>
    </div>
  </div>

  // Search results
  const SearchResults = () => {
    if (!searchResults) return null
    return <Card style={{ marginBottom: 20 }}>
      <CardTitle><IC.Search /> {searchResults.total} resultado(s)</CardTitle>
      {searchResults.exps.length > 0 && <><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#C8B88A", marginTop: 12, marginBottom: 8 }}>Expedientes</div>
        {searchResults.exps.map(e => <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(200,184,138,0.06)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600 }} onClick={() => { setDetail({ type: "expediente", id: e.id }); setSearch("") }}>{e.numero} — {getCli(e.cliente_id)?.nombre}</span>
          <Badge color={(estadoColors[e.estado] || {}).text} bg={(estadoColors[e.estado] || {}).bg}>{e.estado}</Badge>
        </div>)}</>}
      {searchResults.clis.length > 0 && <><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#C8B88A", marginTop: 12, marginBottom: 8 }}>Clientes</div>
        {searchResults.clis.map(c => <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(200,184,138,0.06)" }}>
          <span style={{ color: "#64B5F6", cursor: "pointer", fontWeight: 600 }} onClick={() => { setDetail({ type: "cliente", id: c.id }); setSearch("") }}>{c.nombre}</span>
          <span style={{ color: "rgba(200,184,138,0.4)", fontSize: 12, marginLeft: 8 }}>{c.telefono}</span>
        </div>)}</>}
      {searchResults.total === 0 && <div style={{ padding: 16, textAlign: "center", color: "rgba(200,184,138,0.3)" }}>Sin resultados</div>}
    </Card>
  }

  const sections_map = { dashboard: renderDashboard, expedientes: renderExpedientes, clientes: renderClientes, vencimientos: renderVencimientos, cobranza: renderCobranza }
  const titles = { dashboard: "Dashboard", expedientes: "Expedientes", clientes: "Clientes", vencimientos: "Vencimientos", cobranza: "Cobranza" }
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: IC.Dashboard },
    { key: "expedientes", label: "Expedientes", icon: IC.Folder },
    { key: "clientes", label: "Clientes", icon: IC.Users },
    { key: "vencimientos", label: "Vencimientos", icon: IC.Calendar },
    { key: "cobranza", label: "Cobranza", icon: IC.Dollar },
  ]

  const renderContent = () => {
    if (detail) {
      if (detail.type === "expediente") { const e = getExp(detail.id); return e ? <ExpDetail exp={e} /> : <div>No encontrado</div> }
      if (detail.type === "cliente") { const c = getCli(detail.id); return c ? <CliDetail cli={c} /> : <div>No encontrado</div> }
    }
    return <>{search && <SearchResults />}{(!search || !searchResults) && sections_map[section]()}</>
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0F1923" }}>
    <div style={{ textAlign: "center", color: "#C8B88A" }}><div style={{ fontSize: 24, fontWeight: 700 }}>Cargando datos...</div></div>
  </div>

  const userName = session.user.user_metadata?.nombre || session.user.email

  return <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0F1923", color: "#E8E0D0", minHeight: "100vh", display: "flex" }}>
    {sidebar && <div onClick={() => setSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49 }} />}
    <aside style={{ width: 220, background: "#0A1219", borderRight: "1px solid rgba(200,184,138,0.08)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: sidebar ? 0 : -240, height: "100vh", zIndex: 50, transition: "left .3s" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(200,184,138,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IC.Scale />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#C8B88A" }}>Despacho Legal</div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "rgba(200,184,138,0.3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{userName}</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {navItems.map(n => {
          const act = section === n.key && !detail
          return <button key={n.key} onClick={() => { setSection(n.key); setDetail(null); setSearch(""); setSidebar(false) }} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 2,
            background: act ? "rgba(200,184,138,0.1)" : "transparent", border: act ? "1px solid rgba(200,184,138,0.15)" : "1px solid transparent",
            borderRadius: 10, color: act ? "#C8B88A" : "rgba(200,184,138,0.45)", fontSize: 13, fontWeight: act ? 600 : 500,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left"
          }}><n.icon />{n.label}</button>
        })}
      </nav>
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(200,184,138,0.08)" }}>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "1px solid rgba(200,184,138,0.08)", borderRadius: 8, color: "rgba(200,184,138,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <IC.Logout /> Cerrar sesión
        </button>
      </div>
    </aside>

    <main style={{ flex: 1, minWidth: 0 }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid rgba(200,184,138,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSidebar(!sidebar)} style={{ background: "none", border: "none", color: "#C8B88A", cursor: "pointer", padding: 4, flexShrink: 0 }}><IC.Menu /></button>
        <div style={{ flex: 1, position: "relative" }}>
          <IC.Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(200,184,138,0.3)" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); if (detail) setDetail(null) }} placeholder="Buscar expedientes, clientes, cobros..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", background: "rgba(200,184,138,0.05)", border: "1px solid rgba(200,184,138,0.1)", borderRadius: 10, color: "#E8E0D0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(200,184,138,0.4)", cursor: "pointer" }}><IC.X /></button>}
        </div>
      </header>
      <div style={{ padding: "16px 20px" }}>
        {!detail && !search && <div style={{ fontSize: 11, color: "rgba(200,184,138,0.3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1.5 }}>{titles[section]}</div>}
        {renderContent()}
      </div>
    </main>

    {modal === "expediente" && <ModalWrap title="Nuevo Expediente" wide onClose={() => setModal(null)}><ExpForm /></ModalWrap>}
    {modal === "cliente" && <ModalWrap title="Nuevo Cliente" onClose={() => setModal(null)}><CliForm /></ModalWrap>}
    {modal === "cobro" && <ModalWrap title="Nuevo Cobro" onClose={() => setModal(null)}><CobForm /></ModalWrap>}
    {subModal?.type === "actuacion" && <ModalWrap title="Nueva Actuación" onClose={() => setSubModal(null)}><ActForm expId={subModal.expId} /></ModalWrap>}
    {subModal?.type === "documento" && <ModalWrap title="Nuevo Documento" onClose={() => setSubModal(null)}><DocForm cliId={subModal.cliId} /></ModalWrap>}
  </div>
}
