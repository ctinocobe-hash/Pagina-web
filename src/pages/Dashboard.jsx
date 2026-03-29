import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, db } from '../lib/supabase'
import Portal from './portal'

const materias = ["Administrativa", "Civil", "Mercantil", "Amparo", "Laboral", "Penal", "Familiar", "Sucesorio"]
const estadosProc = ["En trámite", "Alegatos", "Pruebas", "Sentencia", "Apelación", "Amparo", "Ejecución", "Concluido"]
const estadosSucesorio = ["Radicación", "Declaratoria de herederos", "Inventarios y avalúos", "Administración de bienes", "Partición y adjudicación", "Liquidación", "Ejecución de convenio", "Concluido"]
const relacionesTipo = ["Apelación", "Amparo directo", "Amparo indirecto", "Incidente", "Recurso de revisión", "Queja"]
const actTipos = ["Presentación", "Acuerdo", "Auto", "Sentencia", "Notificación", "Promoción", "Contestación", "Alegatos", "Pruebas", "Recurso", "Amparo", "Otro"]
const incidentesSucesorio = ["Reconocimiento de heredero", "Remoción de albacea", "Rendición de cuentas del albacea", "Oposición al inventario", "Oposición al avalúo", "Nombramiento de albacea", "Sustitución de albacea", "Liquidación de sociedad conyugal", "Petición de herencia", "Intervención de acreedor", "Nulidad de inventario", "Separación de patrimonio", "Otro incidente sucesorio"]
const docTipos = ["Contrato", "Recibo de pago", "Poder notarial", "Identificación", "Comprobante domicilio", "CURP", "RFC", "Escritura", "Otro"]

const BG = "#0D0D0D"; const SURFACE = "#1A1A1A"; const GOLD = "#B8963E"; const GOLD_LIGHT = "#D4AF5C"
const TEXT = "#F5F0E8"; const MUTED = "#A09882"; const FT = "'Cormorant Garamond', serif"
const FB = "'Source Serif 4', serif"; const FU = "'DM Sans', sans-serif"

const estadoColors = {
  "Alegatos":{ bg:"#FFF3E0",text:"#E65100" },"En trámite":{ bg:"#E3F2FD",text:"#1565C0" },
  "Sentencia":{ bg:"#E8F5E9",text:"#2E7D32" },"Amparo":{ bg:"#F3E5F5",text:"#7B1FA2" },
  "Concluido":{ bg:"#ECEFF1",text:"#546E7A" },"Apelación":{ bg:"#FFF8E1",text:"#F57F17" },
  "Ejecución":{ bg:"#E0F7FA",text:"#00838F" },"Pruebas":{ bg:"#FBE9E7",text:"#BF360C" },
  "Radicación":{ bg:"#EDE7F6",text:"#4527A0" },
  "Declaratoria de herederos":{ bg:"#E8F5E9",text:"#1B5E20" },
  "Inventarios y avalúos":{ bg:"#FFF9C4",text:"#F9A825" },
  "Administración de bienes":{ bg:"#FBE9E7",text:"#BF360C" },
  "Partición y adjudicación":{ bg:"#E3F2FD",text:"#0D47A1" },
  "Liquidación":{ bg:"#E0F7FA",text:"#006064" },
  "Ejecución de convenio":{ bg:"#F1F8E9",text:"#33691E" },
}
const cobroColors = {
  "Pendiente":{ bg:"#FFF8E1",text:"#F57F17" },"Pagado":{ bg:"#E8F5E9",text:"#2E7D32" },
  "Vencido":{ bg:"#FFEBEE",text:"#C62828" },
}

const today = new Date().toISOString().slice(0,10)
const formatMoney = (n) => "$" + Number(n||0).toLocaleString("es-MX")
const formatDate = (d) => { if(!d) return "—"; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}` }
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000)

const IC = {
  Dashboard:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Folder:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Users:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Dollar:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Portal:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Plus:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Alert:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Search:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  File:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Link:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Back:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Clock:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Menu:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Logout:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Eye:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Edit:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Logo:({s=28,c=GOLD})=><svg width={s} height={s} viewBox="0 0 96 76" fill="none" stroke={c} strokeLinecap="round" strokeLinejoin="round"><line x1="48" y1="0" x2="48" y2="64" strokeWidth="3.2"/><line x1="12" y1="10" x2="84" y2="10" strokeWidth="3.2"/><circle cx="12" cy="10" r="4" strokeWidth="2.8" fill={c}/><line x1="12" y1="14" x2="12" y2="32" strokeWidth="2.6"/><line x1="0" y1="32" x2="24" y2="32" strokeWidth="3.2"/><circle cx="84" cy="10" r="4" strokeWidth="2.8" fill={c}/><line x1="84" y1="14" x2="84" y2="32" strokeWidth="2.6"/><line x1="72" y1="32" x2="96" y2="32" strokeWidth="3.2"/><line x1="36" y1="64" x2="60" y2="64" strokeWidth="3.2"/></svg>,
  Sync:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Settings:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export default function Dashboard({ session }) {
  const [section, setSection] = useState("dashboard")
  const [sidebar, setSidebar] = useState(false)
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState(null)
  const [modal, setModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [portalPreview, setPortalPreview] = useState(null)
  const [clientes, setClientes] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [actuaciones, setActuaciones] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [cobros, setCobros] = useState([])
  const [actividad, setActividad] = useState([])
  const [portalClientes, setPortalClientes] = useState([])
  const [portalConfig, setPortalConfig] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null) // { loading, result, error }
  const [agenteActivo, setAgenteActivo] = useState(null) // null=sin verificar, true/false

  const loadData = useCallback(async () => {
    try {
      const [cli,exp,act,doc,cob,actv,pc,cfg] = await Promise.all([
        db.getClientes(), db.getExpedientes(), db.getAllActuaciones(),
        db.getAllDocumentos(), db.getCobros(), db.getActividad(30),
        db.getPortalClientes(), db.getConfiguracionPortal()
      ])
      setClientes(cli); setExpedientes(exp); setActuaciones(act)
      setDocumentos(doc); setCobros(cob); setActividad(actv)
      setPortalClientes(pc); setPortalConfig(cfg)
    } catch(e){ console.error(e) }
    setLoading(false)
  }, [])
  useEffect(() => { loadData() }, [loadData])

  // Helpers
  const getCli = (id) => clientes.find(c => c.id === id)
  const getExp = (id) => expedientes.find(e => e.id === id)
  const getExpActs = (eid) => actuaciones.filter(a => a.expediente_id === eid)
  const getCliDocs = (cid) => documentos.filter(d => d.cliente_id === cid)
  const getCliExps = (cid) => expedientes.filter(e => e.cliente_id === cid)
  const getCliCobros = (cid) => cobros.filter(c => c.cliente_id === cid)
  const getRelacionados = (eid) => expedientes.filter(e => e.expediente_padre_id === eid)
  const getPadre = (e) => e.expediente_padre_id ? getExp(e.expediente_padre_id) : null
  const getPortalForCliente = (cid) => portalClientes.find(p => p.cliente_id === cid)

  // CRUD
  const handleAddCliente = async (f) => { await db.addCliente(f); await db.addActividad(`Nuevo cliente: ${f.nombre}`,'cliente'); setModal(null); loadData() }
  const handleAddExpediente = async (f) => { await db.addExpediente(f); await db.addActividad(`Nuevo expediente: ${f.numero}`,'expediente'); setModal(null); loadData() }
  const handleAddCobro = async (f) => { await db.addCobro(f); await db.addActividad(`Nuevo cobro: ${formatMoney(f.monto)}`,'cobro'); setModal(null); loadData() }
  const handleAddActuacion = async (expId, f) => { const exp=getExp(expId); await db.addActuacion({...f,expediente_id:expId}); await db.addActividad(`Actuación en ${exp?.numero}: ${f.descripcion}`,'expediente',expId); setSubModal(null); loadData() }
  const handleAddDocumento = async (cliId, f) => { const cli=getCli(cliId); await db.addDocumento({...f,cliente_id:cliId}); await db.addActividad(`Documento: ${f.nombre} — ${cli?.nombre}`,'cliente',cliId); setSubModal(null); loadData() }
  const handleDelExp = async (id) => { await db.deleteExpediente(id); loadData() }
  const handleDelCli = async (id) => { if(!window.confirm("¿Eliminar este cliente y todos sus datos?")) return; await db.deleteCliente(id); if(detail?.type==="cliente"&&detail?.id===id) setDetail(null); loadData() }
  const handleDelCob = async (id) => { await db.deleteCobro(id); loadData() }
  const handleDelAct = async (id) => { await db.deleteActuacion(id); loadData() }
  const handleDelDoc = async (id) => { await db.deleteDocumento(id); loadData() }
  const handleUpdCobro = async (id, estado) => { await db.updateCobro(id, { estado }); loadData() }
  const handleUpdateExpediente = async (id, f) => { await db.updateExpediente(id, f); await db.addActividad(`Expediente actualizado: ${f.numero}`,'expediente',id); setSubModal(null); loadData() }
  const handleUpdateCliente = async (id, f) => { await db.updateCliente(id, f); await db.addActividad(`Cliente actualizado: ${f.nombre}`,'cliente',id); setSubModal(null); loadData() }
  const handleToggleVisAct = async (id, current) => { await db.updateActuacion(id, { visible_portal: !current }); loadData() }
  const handleToggleVisDoc = async (id, current) => { await db.updateDocumento(id, { visible_portal: !current }); loadData() }
  const handleLogout = async () => { await supabase.auth.signOut() }

  // Portal account creation
  const handleCreatePortalAccount = async (email, password, clienteId) => {
    try {
      await db.createPortalAccountSimple(email, password, clienteId)
      loadData()
      return { success: true, email, password }
    } catch(e) { return { success: false, error: e.message } }
  }

  // Portal judicial sync
  const handleSavePortalConfig = async (config) => {
    try { await db.saveConfiguracionPortal(config); await loadData() } catch(e) { alert('Error al guardar: ' + e.message) }
  }
  const handleSincronizar = async (fechaInicio, fechaFin) => {
    setSyncStatus({ loading: true })
    try {
      const result = await db.sincronizarPortal(fechaInicio, fechaFin)
      setSyncStatus({ loading: false, result })
      if (result.actuaciones_insertadas > 0) loadData()
    } catch(e) { setSyncStatus({ loading: false, error: e.message }) }
  }
  const checkAgente = async () => {
    const ok = await db.verificarAgente()
    setAgenteActivo(ok)
  }

  // Metrics
  const expActivos = expedientes.filter(e=>e.estado!=="Concluido").length
  const expUrgentes = expedientes.filter(e=>e.urgente).length
  const clientesActivos = clientes.filter(c=>c.activo).length
  const totalPend = cobros.filter(c=>c.estado==="Pendiente").reduce((s,c)=>s+Number(c.monto),0)
  const totalVenc = cobros.filter(c=>c.estado==="Vencido").reduce((s,c)=>s+Number(c.monto),0)
  const totalCob = cobros.filter(c=>c.estado==="Pagado").reduce((s,c)=>s+Number(c.monto),0)
  const in15 = new Date(Date.now()+15*864e5).toISOString().slice(0,10)
  const plazosProx = expedientes.filter(e=>e.proximo_plazo>=today&&e.proximo_plazo<=in15).sort((a,b)=>a.proximo_plazo.localeCompare(b.proximo_plazo))
  const plazosVenc = expedientes.filter(e=>e.proximo_plazo&&e.proximo_plazo<today&&e.estado!=="Concluido")

  // Search
  const searchResults = useMemo(() => {
    if(!search.trim()) return null
    const q=search.toLowerCase()
    const exps=expedientes.filter(e=>e.numero.toLowerCase().includes(q)||e.tipo?.toLowerCase().includes(q)||e.juzgado?.toLowerCase().includes(q)||getCli(e.cliente_id)?.nombre.toLowerCase().includes(q))
    const clis=clientes.filter(c=>c.nombre.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q)||c.telefono?.includes(q))
    return { exps, clis, total: exps.length + clis.length }
  }, [search, expedientes, clientes])

  // UI Components
  const Badge = ({children,color=GOLD,bg="rgba(184,150,62,0.12)"}) => <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,color,background:bg,whiteSpace:"nowrap"}}>{children}</span>
  const Stat = ({value,label,accent=GOLD,alert=false}) => <div style={{background:alert?"rgba(198,40,40,0.08)":"rgba(184,150,62,0.04)",border:`1px solid ${alert?"rgba(198,40,40,0.25)":"rgba(184,150,62,0.1)"}`,borderRadius:14,padding:"18px 16px",flex:"1 1 130px",minWidth:130}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,color:alert?"#EF9A9A":MUTED,marginBottom:6}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:alert?"#EF9A9A":accent,lineHeight:1}}>{value}</div></div>
  const Btn = ({children,onClick,v="primary",small=false}) => {const vs={primary:{background:GOLD,color:BG,border:"none"},secondary:{background:"transparent",color:GOLD,border:`1px solid rgba(184,150,62,0.3)`},danger:{background:"transparent",color:"#EF9A9A",border:"1px solid rgba(239,154,154,0.3)"},success:{background:"transparent",color:"#81C784",border:"1px solid rgba(129,199,132,0.3)"},ghost:{background:"transparent",color:MUTED,border:"none"}};return<button onClick={onClick} style={{...vs[v],borderRadius:8,padding:small?"5px 12px":"10px 18px",fontSize:small?12:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",letterSpacing:.3}}>{children}</button>}
  const Input = ({label,...p}) => <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,textTransform:"uppercase",letterSpacing:1.2,color:MUTED,marginBottom:5}}>{label}</label><input {...p} style={{width:"100%",padding:"9px 12px",background:"rgba(184,150,62,0.05)",border:"1px solid rgba(184,150,62,0.15)",borderRadius:8,color:TEXT,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} /></div>
  const Sel = ({label,children,...p}) => <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,textTransform:"uppercase",letterSpacing:1.2,color:MUTED,marginBottom:5}}>{label}</label><select {...p} style={{width:"100%",padding:"9px 12px",background:SURFACE,border:"1px solid rgba(184,150,62,0.15)",borderRadius:8,color:TEXT,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}>{children}</select></div>
  const ModalWrap = ({title,children,onClose,wide}) => <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#152028",border:"1px solid rgba(184,150,62,0.15)",borderRadius:16,padding:24,width:"92%",maxWidth:wide?640:480,maxHeight:"85vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{margin:0,fontSize:17,color:GOLD,fontWeight:700}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",color:MUTED,cursor:"pointer"}}><IC.X /></button></div>{children}</div></div>
  const Th = ({children,sx={}}) => <th style={{textAlign:"left",padding:"10px 12px",fontSize:10,textTransform:"uppercase",letterSpacing:1.2,color:MUTED,borderBottom:"1px solid rgba(184,150,62,0.08)",background:"rgba(184,150,62,0.03)",whiteSpace:"nowrap",...sx}}>{children}</th>
  const Td = ({children,sx={}}) => <td style={{padding:"10px 12px",borderBottom:"1px solid rgba(184,150,62,0.04)",color:"#D4CCBC",verticalAlign:"middle",fontSize:13,...sx}}>{children}</td>
  const Card = ({children,style:sx={}}) => <div style={{background:"rgba(184,150,62,0.03)",border:"1px solid rgba(184,150,62,0.08)",borderRadius:14,padding:18,position:"relative",...sx}}>{children}</div>
  const CardTitle = ({children}) => <div style={{fontSize:12,fontWeight:700,color:GOLD,marginBottom:10,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:.8}}>{children}</div>
  const DelBtn = ({onClick}) => <button onClick={onClick} style={{background:"none",border:"none",color:"rgba(239,154,154,0.5)",cursor:"pointer",padding:2}}><IC.Trash /></button>
  const EditBtn = ({onClick}) => <button onClick={onClick} style={{background:"none",border:"none",color:"rgba(184,150,62,0.6)",cursor:"pointer",padding:2}}><IC.Edit /></button>

  // Visibility toggle button
  const VisToggle = ({visible, onClick}) => (
    <button onClick={onClick} title={visible ? "Visible en portal" : "Oculto en portal"} style={{
      background: visible ? "rgba(129,199,132,0.1)" : "rgba(200,184,138,0.05)",
      border: `1px solid ${visible ? "rgba(129,199,132,0.25)" : "rgba(200,184,138,0.1)"}`,
      borderRadius: 6, padding: "3px 8px", cursor: "pointer", display: "inline-flex",
      alignItems: "center", gap: 4, fontSize: 10, color: visible ? "#81C784" : MUTED,
      fontFamily: "inherit", transition: "all 0.15s",
    }}>
      {visible ? <IC.Eye /> : <IC.EyeOff />}
      {visible ? "Portal" : "Oculto"}
    </button>
  )

  // ===== FORMS =====
  const ExpForm = () => {
    const [f,sF]=useState({numero:"",tipo:"Contencioso Administrativo",materia:"Administrativa",cliente_id:"",juzgado:"",estado:"En trámite",urgente:false,fecha_inicio:today,proximo_plazo:"",notas:"",notas_cliente:"",expediente_padre_id:null,relacion:""})
    const u=(k,v)=>sF({...f,[k]:v})
    return <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="No. expediente" value={f.numero} onChange={e=>u("numero",e.target.value)} /><Sel label="Materia" value={f.materia} onChange={e=>{const m=e.target.value;u("materia",m);if(m==="Sucesorio")u("estado","Radicación");else if(!estadosProc.includes(f.estado))u("estado","En trámite")}}>{materias.map(m=><option key={m}>{m}</option>)}</Sel></div>
      <Input label="Tipo de juicio" value={f.tipo} onChange={e=>u("tipo",e.target.value)} />
      <Sel label="Cliente" value={f.cliente_id} onChange={e=>u("cliente_id",e.target.value)}><option value="">Seleccionar...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Sel>
      <Input label="Juzgado / Tribunal" value={f.juzgado} onChange={e=>u("juzgado",e.target.value)} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Sel label="Etapa / Estado" value={f.estado} onChange={e=>u("estado",e.target.value)}>{(f.materia==="Sucesorio"?estadosSucesorio:estadosProc).map(s=><option key={s}>{s}</option>)}</Sel><Input label="Próximo plazo" type="date" value={f.proximo_plazo} onChange={e=>u("proximo_plazo",e.target.value)} /></div>
      {f.materia==="Sucesorio"&&<div style={{background:"rgba(184,150,62,0.05)",border:"1px solid rgba(184,150,62,0.12)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:GOLD}}>Juicio sucesorio — las etapas y tipos de incidentes se adaptarán automáticamente</div>}
      <Input label="Notas internas (solo equipo)" value={f.notas} onChange={e=>u("notas",e.target.value)} />
      <Input label="Notas para el cliente (visible en portal)" value={f.notas_cliente} onChange={e=>u("notas_cliente",e.target.value)} />
      <Card style={{marginBottom:14}}><CardTitle><IC.Link /> Vincular expediente padre</CardTitle>
        <Sel label="Exp. padre" value={f.expediente_padre_id||""} onChange={e=>u("expediente_padre_id",e.target.value||null)}><option value="">Ninguno</option>{expedientes.map(x=><option key={x.id} value={x.id}>{x.numero} — {getCli(x.cliente_id)?.nombre}</option>)}</Sel>
        {f.expediente_padre_id&&<Sel label="Relación" value={f.relacion} onChange={e=>u("relacion",e.target.value)}><option value="">Seleccionar...</option>{relacionesTipo.map(r=><option key={r}>{r}</option>)}</Sel>}
      </Card>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={f.urgente} onChange={e=>u("urgente",e.target.checked)} id="urg"/><label htmlFor="urg" style={{fontSize:13,color:TEXT}}>Urgente</label></div>
      <Btn onClick={()=>f.numero&&f.cliente_id?handleAddExpediente(f):null}>Guardar</Btn>
    </>
  }
  const ExpEditForm = ({exp}) => {
    const [f,sF]=useState({
      numero:exp.numero||"",tipo:exp.tipo||"",materia:exp.materia||"Administrativa",
      cliente_id:exp.cliente_id||"",juzgado:exp.juzgado||"",estado:exp.estado||"En trámite",
      urgente:exp.urgente||false,fecha_inicio:exp.fecha_inicio||today,
      proximo_plazo:exp.proximo_plazo||"",notas:exp.notas||"",notas_cliente:exp.notas_cliente||"",
      expediente_padre_id:exp.expediente_padre_id||null,relacion:exp.relacion||""
    })
    const u=(k,v)=>sF({...f,[k]:v})
    return <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="No. expediente" value={f.numero} onChange={e=>u("numero",e.target.value)} /><Sel label="Materia" value={f.materia} onChange={e=>{const m=e.target.value;u("materia",m);if(m==="Sucesorio"&&!estadosSucesorio.includes(f.estado))u("estado","Radicación");else if(m!=="Sucesorio"&&!estadosProc.includes(f.estado))u("estado","En trámite")}}>{materias.map(m=><option key={m}>{m}</option>)}</Sel></div>
      <Input label="Tipo de juicio" value={f.tipo} onChange={e=>u("tipo",e.target.value)} />
      <Sel label="Cliente" value={f.cliente_id} onChange={e=>u("cliente_id",e.target.value)}><option value="">Seleccionar...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Sel>
      <Input label="Juzgado / Tribunal" value={f.juzgado} onChange={e=>u("juzgado",e.target.value)} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Sel label="Etapa / Estado" value={f.estado} onChange={e=>u("estado",e.target.value)}>{(f.materia==="Sucesorio"?estadosSucesorio:estadosProc).map(s=><option key={s}>{s}</option>)}</Sel><Input label="Próximo plazo" type="date" value={f.proximo_plazo} onChange={e=>u("proximo_plazo",e.target.value)} /></div>
      <Input label="Notas internas (solo equipo)" value={f.notas} onChange={e=>u("notas",e.target.value)} />
      <Input label="Notas para el cliente (visible en portal)" value={f.notas_cliente} onChange={e=>u("notas_cliente",e.target.value)} />
      <Card style={{marginBottom:14}}><CardTitle><IC.Link /> Vincular expediente padre</CardTitle>
        <Sel label="Exp. padre" value={f.expediente_padre_id||""} onChange={e=>u("expediente_padre_id",e.target.value||null)}><option value="">Ninguno</option>{expedientes.filter(x=>x.id!==exp.id).map(x=><option key={x.id} value={x.id}>{x.numero} — {getCli(x.cliente_id)?.nombre}</option>)}</Sel>
        {f.expediente_padre_id&&<Sel label="Relación" value={f.relacion} onChange={e=>u("relacion",e.target.value)}><option value="">Seleccionar...</option>{relacionesTipo.map(r=><option key={r}>{r}</option>)}</Sel>}
      </Card>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={f.urgente} onChange={e=>u("urgente",e.target.checked)} id="urg_e"/><label htmlFor="urg_e" style={{fontSize:13,color:TEXT}}>Urgente</label></div>
      <Btn onClick={()=>f.numero&&f.cliente_id?handleUpdateExpediente(exp.id,f):null}>Guardar cambios</Btn>
    </>
  }

  const CliForm = () => {
    const [f,sF]=useState({nombre:"",telefono:"",email:"",direccion:"",rfc:"",notas:""});const u=(k,v)=>sF({...f,[k]:v})
    return <><Input label="Nombre" value={f.nombre} onChange={e=>u("nombre",e.target.value)} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="Teléfono" value={f.telefono} onChange={e=>u("telefono",e.target.value)} /><Input label="Email" value={f.email} onChange={e=>u("email",e.target.value)} /></div><Input label="Dirección" value={f.direccion} onChange={e=>u("direccion",e.target.value)} /><Input label="RFC" value={f.rfc} onChange={e=>u("rfc",e.target.value)} /><Input label="Notas" value={f.notas} onChange={e=>u("notas",e.target.value)} /><Btn onClick={()=>f.nombre?handleAddCliente(f):null}>Guardar</Btn></>
  }
  const CliEditForm = ({cli}) => {
    const [f,sF]=useState({nombre:cli.nombre||"",telefono:cli.telefono||"",email:cli.email||"",direccion:cli.direccion||"",rfc:cli.rfc||"",notas:cli.notas||"",activo:cli.activo!==false})
    const u=(k,v)=>sF({...f,[k]:v})
    return <>
      <Input label="Nombre" value={f.nombre} onChange={e=>u("nombre",e.target.value)} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Teléfono" value={f.telefono} onChange={e=>u("telefono",e.target.value)} />
        <Input label="Email" value={f.email} onChange={e=>u("email",e.target.value)} />
      </div>
      <Input label="Dirección" value={f.direccion} onChange={e=>u("direccion",e.target.value)} />
      <Input label="RFC" value={f.rfc} onChange={e=>u("rfc",e.target.value)} />
      <Input label="Notas" value={f.notas} onChange={e=>u("notas",e.target.value)} />
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <input type="checkbox" checked={f.activo} onChange={e=>u("activo",e.target.checked)} id="activo_e"/>
        <label htmlFor="activo_e" style={{fontSize:13,color:TEXT}}>Cliente activo</label>
      </div>
      <Btn onClick={()=>f.nombre?handleUpdateCliente(cli.id,f):null}>Guardar cambios</Btn>
    </>
  }
  const CobForm = () => {
    const [f,sF]=useState({cliente_id:"",concepto:"",monto:0,estado:"Pendiente",fecha_emision:today,fecha_vencimiento:""});const u=(k,v)=>sF({...f,[k]:v})
    return <><Sel label="Cliente" value={f.cliente_id} onChange={e=>u("cliente_id",e.target.value)}><option value="">Seleccionar...</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Sel><Input label="Concepto" value={f.concepto} onChange={e=>u("concepto",e.target.value)} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="Monto ($)" type="number" value={f.monto} onChange={e=>u("monto",Number(e.target.value))} /><Input label="Vencimiento" type="date" value={f.fecha_vencimiento} onChange={e=>u("fecha_vencimiento",e.target.value)} /></div><Btn onClick={()=>f.cliente_id&&f.monto?handleAddCobro(f):null}>Guardar</Btn></>
  }
  const ActForm = ({expId}) => {
    const exp = getExp(expId)
    const isSucesorio = exp?.materia === "Sucesorio"
    const [f,sF]=useState({fecha:today,tipo:"Acuerdo",descripcion:"",documento:"",visible_portal:false});const u=(k,v)=>sF({...f,[k]:v})
    return <>
      {isSucesorio&&<div style={{background:"rgba(184,150,62,0.05)",border:"1px solid rgba(184,150,62,0.12)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:GOLD}}>Juicio sucesorio — puedes registrar actuaciones e incidentes sucesorios</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Fecha" type="date" value={f.fecha} onChange={e=>u("fecha",e.target.value)} />
        <Sel label="Tipo" value={f.tipo} onChange={e=>u("tipo",e.target.value)}>
          {isSucesorio
            ? <><optgroup label="Actuaciones generales">{actTipos.map(t=><option key={t}>{t}</option>)}</optgroup><optgroup label="Incidentes sucesorios">{incidentesSucesorio.map(t=><option key={t}>{t}</option>)}</optgroup></>
            : actTipos.map(t=><option key={t}>{t}</option>)
          }
        </Sel>
      </div>
      <Input label="Descripción" value={f.descripcion} onChange={e=>u("descripcion",e.target.value)} />
      <Input label="Documento (ref.)" value={f.documento} onChange={e=>u("documento",e.target.value)} />
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={f.visible_portal} onChange={e=>u("visible_portal",e.target.checked)} id="vp"/><label htmlFor="vp" style={{fontSize:13,color:TEXT}}>Visible para el cliente en el portal</label></div>
      <Btn onClick={()=>f.descripcion?handleAddActuacion(expId,f):null}>Guardar</Btn>
    </>
  }
  const DocForm = ({cliId}) => {
    const [f,sF]=useState({nombre:"",tipo:"Contrato",fecha:today,notas:"",visible_portal:false});const u=(k,v)=>sF({...f,[k]:v})
    return <><Input label="Nombre" value={f.nombre} onChange={e=>u("nombre",e.target.value)} /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Sel label="Tipo" value={f.tipo} onChange={e=>u("tipo",e.target.value)}>{docTipos.map(t=><option key={t}>{t}</option>)}</Sel><Input label="Fecha" type="date" value={f.fecha} onChange={e=>u("fecha",e.target.value)} /></div><Input label="Notas" value={f.notas} onChange={e=>u("notas",e.target.value)} /><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={f.visible_portal} onChange={e=>u("visible_portal",e.target.checked)} id="vpd"/><label htmlFor="vpd" style={{fontSize:13,color:TEXT}}>Compartir con el cliente en el portal</label></div><Btn onClick={()=>f.nombre?handleAddDocumento(cliId,f):null}>Guardar</Btn></>
  }
  // Portal judicial config form
  const PortalJudicialConfigForm = ({config, onSave}) => {
    const [f, sF] = useState({
      portal_url: config?.portal_url || '',
      usuario: config?.usuario || '',
      password: config?.password || '',
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const u = (k, v) => { sF({...f, [k]: v}); setSaved(false) }
    const save = async () => {
      if (!f.portal_url || !f.usuario || !f.password) return
      setSaving(true)
      await onSave(f)
      setSaving(false)
      setSaved(true)
    }
    return <div>
      <Input label="URL del portal judicial" value={f.portal_url} onChange={e=>u('portal_url',e.target.value)} placeholder="https://sige.poderjudicialgto.gob.mx" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Usuario" value={f.usuario} onChange={e=>u('usuario',e.target.value)} />
        <Input label="Contraseña" type="password" value={f.password} onChange={e=>u('password',e.target.value)} />
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Btn onClick={save} v="secondary" small>{saving ? 'Guardando...' : 'Guardar credenciales'}</Btn>
        {saved && <span style={{fontSize:12,color:"#81C784",display:"flex",alignItems:"center",gap:4}}><IC.Check /> Guardado</span>}
      </div>
    </div>
  }

  // Portal account form
  const PortalForm = ({cliId}) => {
    const cli = getCli(cliId)
    const [email,setEmail]=useState(cli?.email||"")
    const [password,setPassword]=useState("")
    const [loading,setLd]=useState(false)
    const [result,setResult]=useState(null)
    const create = async () => {
      setLd(true); setResult(null)
      const r = await handleCreatePortalAccount(email, password, cliId)
      setResult(r); setLd(false)
    }
    if (result?.success) return (
      <div>
        <div style={{background:"rgba(46,125,50,0.08)",border:"1px solid rgba(46,125,50,0.2)",borderRadius:10,padding:16,marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#81C784",marginBottom:12,display:"flex",alignItems:"center",gap:6}}><IC.Check /> Cuenta creada exitosamente</div>
          <div style={{fontSize:11,color:MUTED,marginBottom:8}}>Comparte estas credenciales con tu cliente:</div>
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:12,fontFamily:"monospace",fontSize:13}}>
            <div style={{color:MUTED,fontSize:10,marginBottom:4}}>CORREO</div>
            <div style={{color:TEXT,fontWeight:600,marginBottom:10}}>{result.email}</div>
            <div style={{color:MUTED,fontSize:10,marginBottom:4}}>CONTRASEÑA</div>
            <div style={{color:GOLD,fontWeight:700,letterSpacing:2}}>{result.password}</div>
          </div>
          <div style={{fontSize:11,color:"rgba(160,152,130,0.6)",marginTop:10}}>Guarda esta contraseña ahora, no se mostrará de nuevo.</div>
        </div>
        <Btn onClick={()=>setSubModal(null)}>Listo</Btn>
      </div>
    )
    return <>
      <div style={{background:"rgba(184,150,62,0.05)",borderRadius:10,padding:14,marginBottom:16}}>
        <div style={{fontSize:13,color:TEXT,fontWeight:600}}>{cli?.nombre}</div>
        <div style={{fontSize:12,color:MUTED,marginTop:2}}>Se creará una cuenta de portal para este cliente</div>
      </div>
      <Input label="Correo del cliente" value={email} onChange={e=>setEmail(e.target.value)} type="email" />
      <Input label="Contraseña temporal" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
      {result?.error&&<div style={{background:"rgba(198,40,40,0.08)",borderRadius:8,padding:10,marginBottom:14,fontSize:12,color:"#EF9A9A"}}>{result.error}</div>}
      <Btn onClick={()=>email&&password.length>=6?create():null}>{loading?"Creando...":"Crear cuenta de portal"}</Btn>
    </>
  }

  // ===== SECTIONS =====
  const renderDashboard = () => <div>
    <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:24}}>
      <Stat value={expActivos} label="Expedientes activos" /><Stat value={expUrgentes} label="Urgentes" alert={expUrgentes>0} />
      <Stat value={clientesActivos} label="Clientes" /><Stat value={plazosVenc.length} label="Plazos vencidos" alert={plazosVenc.length>0} />
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:24}}>
      <Stat value={formatMoney(totalPend)} label="Pendiente" accent={GOLD_LIGHT} /><Stat value={formatMoney(totalVenc)} label="Vencido" alert={totalVenc>0} /><Stat value={formatMoney(totalCob)} label="Cobrado" accent="#81C784" />
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card><CardTitle><IC.Calendar /> Plazos próximos (15d)</CardTitle>
        {plazosProx.length===0?<div style={{fontSize:12,color:"rgba(200,184,138,0.25)",padding:"10px 0"}}>No hay plazos próximos</div>:
        plazosProx.map(e=><div key={e.id} style={{padding:"8px 0",borderBottom:"1px solid rgba(184,150,62,0.04)",display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontSize:13,fontWeight:600,color:"#64B5F6",cursor:"pointer"}} onClick={()=>setDetail({type:"expediente",id:e.id})}>{e.numero}</div><div style={{fontSize:11,color:MUTED,marginTop:2}}>{getCli(e.cliente_id)?.nombre}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:600,color:daysUntil(e.proximo_plazo)<=3?"#EF9A9A":GOLD}}>{formatDate(e.proximo_plazo)}</div><div style={{fontSize:11,color:MUTED}}>{daysUntil(e.proximo_plazo)}d</div></div>
        </div>)}
      </Card>
      <Card><CardTitle>Actividad reciente</CardTitle>
        {actividad.slice(0,8).map(a=><div key={a.id} style={{padding:"6px 0",borderBottom:"1px solid rgba(184,150,62,0.03)",display:"flex",gap:8}}>
          <div style={{width:6,height:6,borderRadius:3,background:a.tipo==="expediente"?"#64B5F6":a.tipo==="cliente"?"#81C784":"#FFD54F",marginTop:5,flexShrink:0}} />
          <div><div style={{fontSize:12,color:"#D4CCBC"}}>{a.texto}</div><div style={{fontSize:10,color:"rgba(200,184,138,0.3)",marginTop:2}}>{formatDate(a.fecha)}</div></div>
        </div>)}
      </Card>
    </div>
  </div>

  const renderExpedientes = () => <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:12,color:MUTED}}>{expedientes.length} expediente(s)</span><Btn small onClick={()=>setModal("expediente")}><IC.Plus /> Nuevo</Btn></div>
    <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(184,150,62,0.08)"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr><Th>Exp.</Th><Th>Tipo</Th><Th>Cliente</Th><Th>Juzgado</Th><Th>Estado</Th><Th>Plazo</Th><Th sx={{width:60}}></Th></tr></thead>
      <tbody>{expedientes.map(e=>{const sc=estadoColors[e.estado]||{};const days=e.proximo_plazo?daysUntil(e.proximo_plazo):null;return<tr key={e.id}>
        <Td sx={{fontWeight:600}}><div style={{display:"flex",alignItems:"center",gap:6}}>{e.urgente&&<span style={{width:8,height:8,borderRadius:4,background:"#EF5350"}}/>}<span style={{color:"#64B5F6",cursor:"pointer"}} onClick={()=>setDetail({type:"expediente",id:e.id})}>{e.numero}</span></div></Td>
        <Td sx={{fontSize:12}}>{e.tipo}</Td>
        <Td><span style={{cursor:"pointer"}} onClick={()=>setDetail({type:"cliente",id:e.cliente_id})}>{getCli(e.cliente_id)?.nombre}</span></Td>
        <Td sx={{fontSize:11}}>{e.juzgado}</Td>
        <Td><Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge></Td>
        <Td sx={{fontSize:12,fontWeight:600,color:days===null?MUTED:days<0?"#EF9A9A":days<=5?"#FFD54F":"#81C784"}}>{e.proximo_plazo?`${formatDate(e.proximo_plazo)} (${days<0?Math.abs(days)+"d v.":days+"d"})`:"—"}</Td>
        <Td><div style={{display:"flex",gap:2}}><EditBtn onClick={()=>setSubModal({type:"editExp",exp:e})} /><DelBtn onClick={()=>handleDelExp(e.id)} /></div></Td>
      </tr>})}</tbody></table>
    </div>
  </div>

  const renderClientes = () => <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:12,color:MUTED}}>{clientes.length} cliente(s)</span><Btn small onClick={()=>setModal("cliente")}><IC.Plus /> Nuevo</Btn></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
      {clientes.map(c=>{const numExp=getCliExps(c.id).length;const portal=getPortalForCliente(c.id);return<Card key={c.id}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{cursor:"pointer",flex:1}} onClick={()=>setDetail({type:"cliente",id:c.id})}><div style={{fontSize:15,fontWeight:700,color:TEXT}}>{c.nombre}</div><div style={{fontSize:12,color:MUTED,marginTop:3}}>{c.telefono} · {c.email}</div></div>
          <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>{portal&&<Badge color="#81C784" bg="rgba(129,199,132,0.12)">Portal</Badge>}<Badge color={c.activo?"#81C784":"#EF9A9A"} bg={c.activo?"rgba(129,199,132,0.12)":"rgba(239,154,154,0.12)"}>{c.activo?"Activo":"Inactivo"}</Badge></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:MUTED}}>{numExp} expediente(s) · {getCliDocs(c.id).length} docs</div>
          <div style={{display:"flex",gap:2}}><EditBtn onClick={()=>setSubModal({type:"editCli",cli:c})} /><DelBtn onClick={()=>handleDelCli(c.id)} /></div>
        </div>
      </Card>})}
    </div>
  </div>

  const renderVencimientos = () => {
    const sorted=[...expedientes].filter(e=>e.proximo_plazo&&e.estado!=="Concluido").sort((a,b)=>a.proximo_plazo.localeCompare(b.proximo_plazo))
    return <div>
      {plazosVenc.length>0&&<div style={{background:"rgba(198,40,40,0.06)",border:"1px solid rgba(198,40,40,0.2)",borderRadius:12,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#EF9A9A",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><IC.Alert /> Plazos vencidos ({plazosVenc.length})</div>
        {plazosVenc.map(e=><div key={e.id} style={{padding:"7px 0",display:"flex",justifyContent:"space-between",borderBottom:"1px solid rgba(198,40,40,0.1)"}}>
          <span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600,fontSize:13}} onClick={()=>setDetail({type:"expediente",id:e.id})}>{e.numero} — {getCli(e.cliente_id)?.nombre}</span>
          <span style={{color:"#EF9A9A",fontSize:12,fontWeight:600}}>Venció {formatDate(e.proximo_plazo)}</span>
        </div>)}
      </div>}
      <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(184,150,62,0.08)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr><Th>Expediente</Th><Th>Cliente</Th><Th>Estado</Th><Th>Plazo</Th><Th>Días</Th></tr></thead>
        <tbody>{sorted.map(e=>{const d=daysUntil(e.proximo_plazo);const sc=estadoColors[e.estado]||{};return<tr key={e.id}>
          <Td sx={{fontWeight:600}}><span style={{color:"#64B5F6",cursor:"pointer"}} onClick={()=>setDetail({type:"expediente",id:e.id})}>{e.numero}</span></Td>
          <Td>{getCli(e.cliente_id)?.nombre}</Td>
          <Td><Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge></Td>
          <Td sx={{fontWeight:600,fontSize:12}}>{formatDate(e.proximo_plazo)}</Td>
          <Td sx={{color:d<0?"#EF9A9A":d<=5?"#FFD54F":"#81C784",fontWeight:700}}>{d<0?`${Math.abs(d)}d vencido`:`${d}d`}</Td>
        </tr>})}</tbody></table>
      </div>
    </div>
  }

  const renderCobranza = () => <div>
    <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:20}}>
      <Stat value={formatMoney(totalPend)} label="Pendiente" accent={GOLD_LIGHT} /><Stat value={formatMoney(totalVenc)} label="Vencido" alert={totalVenc>0} /><Stat value={formatMoney(totalCob)} label="Cobrado" accent="#81C784" />
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontSize:12,color:MUTED}}>{cobros.length} cobro(s)</span><Btn small onClick={()=>setModal("cobro")}><IC.Plus /> Nuevo</Btn></div>
    <div style={{overflowX:"auto",borderRadius:12,border:"1px solid rgba(184,150,62,0.08)"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr><Th>Cliente</Th><Th>Concepto</Th><Th>Monto</Th><Th>Estado</Th><Th>Vence</Th><Th sx={{textAlign:"center"}}>Acciones</Th></tr></thead>
      <tbody>{cobros.map(c=>{const sc=cobroColors[c.estado]||{};return<tr key={c.id}>
        <Td sx={{fontWeight:600}}>{getCli(c.cliente_id)?.nombre}</Td>
        <Td>{c.concepto}</Td><Td sx={{fontWeight:700,color:TEXT}}>{formatMoney(c.monto)}</Td>
        <Td><Badge color={sc.text} bg={sc.bg}>{c.estado}</Badge></Td>
        <Td sx={{fontSize:12}}>{formatDate(c.fecha_vencimiento)}</Td>
        <Td sx={{textAlign:"center"}}><div style={{display:"flex",gap:4,justifyContent:"center"}}>
          {c.estado!=="Pagado"&&<Btn v="success" small onClick={()=>handleUpdCobro(c.id,"Pagado")}><IC.Check /></Btn>}
          <DelBtn onClick={()=>handleDelCob(c.id)} />
        </div></Td>
      </tr>})}</tbody></table>
    </div>
  </div>

  // ===== PORTAL JUDICIAL SYNC =====
  const renderNotificaciones = () => {
    const cfg = portalConfig
    const ult = cfg?.ultimo_resultado
    const ultimoSync = cfg?.ultimo_sync ? new Date(cfg.ultimo_sync).toLocaleString('es-MX') : null

    return <div>
      {/* Estado de automatización */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",background:"rgba(129,199,132,0.06)",borderRadius:10,border:"1px solid rgba(129,199,132,0.2)"}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:"#81C784",flexShrink:0,boxShadow:"0 0 6px #81C78455"}} />
        <div style={{flex:1}}>
          <span style={{fontSize:12,color:TEXT,fontWeight:600}}>Sincronización automática activa </span>
          <span style={{fontSize:12,color:MUTED}}>— lunes a viernes a las 8:00 am</span>
        </div>
      </div>

      {/* Config section */}
      <Card style={{marginBottom:20}}>
        <CardTitle><IC.Settings /> Configuración del portal judicial</CardTitle>
        <div style={{fontSize:12,color:MUTED,marginBottom:14}}>
          Ingresa la URL y tus credenciales del sistema de notificaciones electrónicas de tu Poder Judicial estatal. Las credenciales se guardan de forma segura y se usan únicamente para obtener tus notificaciones.
        </div>
        <PortalJudicialConfigForm config={cfg} onSave={handleSavePortalConfig} />
      </Card>

      {/* Último sync */}
      <Card style={{marginBottom:20}}>
        <CardTitle><IC.Sync /> Última sincronización</CardTitle>
        {ultimoSync ? (
          <div>
            <div style={{fontSize:12,color:MUTED,marginBottom:12}}>Ejecutada el {ultimoSync}</div>
            {ult && (
              <div style={{display:"flex",flexWrap:"wrap",gap:16}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:GOLD}}>{ult.notificaciones_encontradas}</div><div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Encontradas</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:"#81C784"}}>{ult.actuaciones_insertadas}</div><div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Insertadas</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:MUTED}}>{ult.duplicados_omitidos}</div><div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Duplicados</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:MUTED}}>{ult.sin_expediente}</div><div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:1}}>Sin expediente</div></div>
              </div>
            )}
          </div>
        ) : (
          <div style={{fontSize:12,color:MUTED}}>
            {(!cfg?.portal_url || !cfg?.usuario)
              ? 'Configura la URL y credenciales del portal judicial para habilitar la sincronización.'
              : 'Aún no se ha ejecutado ninguna sincronización. El primer sync ocurrirá el próximo día hábil a las 8:00 am.'}
          </div>
        )}
      </Card>

      {/* Recent portal actuaciones */}
      {(() => {
        const portalActs = actuaciones.filter(a=>a.origen==='portal_judicial').slice(0,20)
        if (!portalActs.length) return null
        return <Card>
          <CardTitle><IC.Clock /> Últimas actuaciones del portal ({portalActs.length})</CardTitle>
          <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(184,150,62,0.06)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr><Th>Expediente</Th><Th>Fecha auto</Th><Th>Descripción</Th><Th>Portal</Th></tr></thead>
              <tbody>{portalActs.sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=>{
                const exp=expedientes.find(e=>e.id===a.expediente_id)
                return <tr key={a.id}>
                  <Td sx={{fontWeight:600}}><span style={{color:"#64B5F6",cursor:"pointer"}} onClick={()=>setDetail({type:"expediente",id:a.expediente_id})}>{exp?.numero||"—"}</span></Td>
                  <Td sx={{whiteSpace:"nowrap",fontSize:12}}>{formatDate(a.fecha)}</Td>
                  <Td sx={{fontSize:12}}>{a.descripcion}</Td>
                  <Td><VisToggle visible={a.visible_portal} onClick={()=>handleToggleVisAct(a.id,a.visible_portal)} /></Td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </Card>
      })()}
    </div>
  }

  // ===== PORTAL MANAGEMENT =====
  const renderPortal = () => <div>
    <div style={{marginBottom:24}}>
      <div style={{fontSize:14,color:TEXT,fontWeight:600,marginBottom:6}}>Gestión del Portal de Clientes</div>
      <div style={{fontSize:13,color:MUTED}}>Crea cuentas para que tus clientes vean el avance de sus casos. Controla la visibilidad de actuaciones y documentos desde el detalle de cada expediente o cliente.</div>
    </div>

    <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:24}}>
      <Stat value={portalClientes.length} label="Cuentas portal" />
      <Stat value={portalClientes.filter(p=>p.activo).length} label="Activas" accent="#81C784" />
      <Stat value={clientes.filter(c=>!getPortalForCliente(c.id)).length} label="Sin portal" accent={MUTED} />
    </div>

    {/* Clients without portal */}
    <Card style={{marginBottom:20}}>
      <CardTitle>Clientes sin cuenta de portal</CardTitle>
      {clientes.filter(c=>!getPortalForCliente(c.id)).length===0?
        <div style={{fontSize:12,color:MUTED,padding:"10px 0"}}>Todos los clientes tienen cuenta de portal</div>:
        clientes.filter(c=>!getPortalForCliente(c.id)).map(c=>(
          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:TEXT}}>{c.nombre}</div><div style={{fontSize:11,color:MUTED}}>{c.email||"Sin email"}</div></div>
            <Btn v="secondary" small onClick={()=>setSubModal({type:"portal",cliId:c.id})}><IC.Plus /> Crear acceso</Btn>
          </div>
        ))
      }
    </Card>

    {/* Active portal accounts */}
    <Card>
      <CardTitle>Cuentas activas del portal</CardTitle>
      {portalClientes.length===0?<div style={{fontSize:12,color:MUTED,padding:"10px 0"}}>No hay cuentas de portal creadas</div>:
      portalClientes.map(p=>{
        const cli = getCli(p.cliente_id)
        return <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:TEXT}}>{cli?.nombre||"Cliente eliminado"}</div>
            <div style={{fontSize:11,color:MUTED}}>{cli?.email} · Creado: {formatDate(p.created_at?.slice(0,10))}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Badge color={p.activo?"#81C784":"#EF9A9A"} bg={p.activo?"rgba(129,199,132,0.12)":"rgba(239,154,154,0.12)"}>{p.activo?"Activo":"Inactivo"}</Badge>
          </div>
        </div>
      })}
    </Card>
  </div>

  // ===== DETAIL VIEWS =====
  const ExpDetail = ({exp}) => {
    const cli=getCli(exp.cliente_id);const acts=getExpActs(exp.id);const hijos=getRelacionados(exp.id);const padre=getPadre(exp)
    const sc=estadoColors[exp.estado]||{};const days=exp.proximo_plazo?daysUntil(exp.proximo_plazo):null
    return <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <Btn v="ghost" small onClick={()=>setDetail(null)}><IC.Back /> Volver</Btn>
        <Btn v="secondary" small onClick={()=>setSubModal({type:"editExp",exp})}><IC.Edit /> Editar expediente</Btn>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:16,margin:"16px 0 24px"}}>
        <div><div style={{display:"flex",alignItems:"center",gap:10}}><h2 style={{margin:0,fontSize:22,color:TEXT,fontWeight:700}}>{exp.numero}</h2>{exp.urgente&&<Badge color="#C62828" bg="#FFEBEE">URGENTE</Badge>}<Badge color={sc.text} bg={sc.bg}>{exp.estado}</Badge></div><div style={{fontSize:13,color:MUTED,marginTop:6}}>{exp.tipo} · {exp.materia} · {exp.juzgado}</div></div>
        {days!==null&&<div style={{textAlign:"right"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:MUTED}}>Próximo plazo</div><div style={{fontSize:18,fontWeight:700,color:days<0?"#EF9A9A":days<=5?"#FFD54F":"#81C784"}}>{formatDate(exp.proximo_plazo)}</div></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <Card style={{cursor:"pointer"}} onClick={()=>cli&&setDetail({type:"cliente",id:cli.id})}><CardTitle><IC.Users /> Cliente</CardTitle><div style={{fontSize:15,fontWeight:600,color:TEXT}}>{cli?.nombre||"—"}</div><div style={{fontSize:12,color:MUTED,marginTop:4}}>{cli?.telefono} · {cli?.email}</div></Card>
        <Card><CardTitle><IC.Link /> Relaciones</CardTitle>
          {padre&&<div style={{padding:"6px 0",fontSize:13}}><span style={{color:MUTED,fontSize:11,marginRight:6}}>PADRE:</span><span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600}} onClick={()=>setDetail({type:"expediente",id:padre.id})}>{padre.numero}</span></div>}
          {hijos.map(h=><div key={h.id} style={{padding:"5px 0",fontSize:13,display:"flex",alignItems:"center",gap:8}}><Badge color="#CE93D8" bg="rgba(206,147,216,0.12)">{h.relacion||"Rel."}</Badge><span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600}} onClick={()=>setDetail({type:"expediente",id:h.id})}>{h.numero}</span></div>)}
          {!padre&&hijos.length===0&&<div style={{fontSize:12,color:"rgba(200,184,138,0.25)"}}>Sin vínculos</div>}
        </Card>
      </div>
      {/* Actuaciones with visibility toggle */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <CardTitle><IC.Clock /> Actuaciones ({acts.length})</CardTitle>
          <Btn v="secondary" small onClick={()=>setSubModal({type:"actuacion",expId:exp.id})}><IC.Plus /> Agregar</Btn>
        </div>
        {acts.length===0?<div style={{fontSize:12,color:"rgba(200,184,138,0.25)",padding:"10px 0"}}>Sin actuaciones</div>:
        <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(184,150,62,0.06)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr><Th>Fecha</Th><Th>Tipo</Th><Th>Descripción</Th><Th>Portal</Th><Th sx={{width:40}}></Th></tr></thead>
          <tbody>{acts.sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=><tr key={a.id}>
            <Td sx={{whiteSpace:"nowrap",fontWeight:600,fontSize:12}}>{formatDate(a.fecha)}</Td>
            <Td><Badge>{a.tipo}</Badge></Td><Td>{a.descripcion}</Td>
            <Td><VisToggle visible={a.visible_portal} onClick={()=>handleToggleVisAct(a.id,a.visible_portal)} /></Td>
            <Td><DelBtn onClick={()=>handleDelAct(a.id)} /></Td>
          </tr>)}</tbody></table>
        </div>}
      </Card>
    </div>
  }

  const CliDetail = ({cli}) => {
    const exps=getCliExps(cli.id);const docs=getCliDocs(cli.id);const cobs=getCliCobros(cli.id)
    const portal=getPortalForCliente(cli.id)
    const pendCli=cobs.filter(c=>c.estado==="Pendiente").reduce((s,c)=>s+Number(c.monto),0)
    return <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <Btn v="ghost" small onClick={()=>setDetail(null)}><IC.Back /> Volver</Btn>
        <Btn v="secondary" small onClick={()=>setSubModal({type:"editCli",cli})}><IC.Edit /> Editar cliente</Btn>
        <Btn v="danger" small onClick={()=>handleDelCli(cli.id)}><IC.Trash /> Eliminar</Btn>
      </div>
      <div style={{margin:"16px 0 24px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div><h2 style={{margin:0,fontSize:22,color:TEXT,fontWeight:700}}>{cli.nombre}</h2><div style={{fontSize:13,color:MUTED,marginTop:4}}>{cli.telefono} · {cli.email} · {cli.direccion}</div></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {portal ? <>
            <Badge color="#81C784" bg="rgba(129,199,132,0.12)">Portal activo</Badge>
            <Btn v="secondary" small onClick={()=>setPortalPreview({clienteId:cli.id,nombre:cli.nombre})}><IC.Eye /> Ver portal</Btn>
          </> :
          <Btn v="secondary" small onClick={()=>setSubModal({type:"portal",cliId:cli.id})}><IC.Portal /> Crear acceso portal</Btn>}
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:24}}>
        <Stat value={exps.length} label="Expedientes" /><Stat value={formatMoney(cobs.reduce((s,c)=>s+Number(c.monto),0))} label="Facturado" accent={GOLD_LIGHT} /><Stat value={formatMoney(pendCli)} label="Pendiente" alert={pendCli>0} />
      </div>
      {/* Docs with visibility */}
      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <CardTitle><IC.File /> Documentos ({docs.length})</CardTitle>
          <Btn v="secondary" small onClick={()=>setSubModal({type:"documento",cliId:cli.id})}><IC.Plus /> Agregar</Btn>
        </div>
        {docs.length===0?<div style={{fontSize:12,color:"rgba(200,184,138,0.25)"}}>Sin documentos</div>:
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
          {docs.map(d=><div key={d.id} style={{background:"rgba(184,150,62,0.03)",border:"1px solid rgba(184,150,62,0.08)",borderRadius:10,padding:14,position:"relative"}}>
            <div style={{display:"flex",gap:8}}><IC.File /><div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nombre}</div><div style={{fontSize:11,color:MUTED,marginTop:3}}>{d.tipo} · {formatDate(d.fecha)}</div></div></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <VisToggle visible={d.visible_portal} onClick={()=>handleToggleVisDoc(d.id,d.visible_portal)} />
              <DelBtn onClick={()=>handleDelDoc(d.id)} />
            </div>
          </div>)}
        </div>}
      </Card>
      {/* Expedientes */}
      <Card style={{marginBottom:20}}><CardTitle><IC.Folder /> Expedientes ({exps.length})</CardTitle>
        {exps.map(e=>{const sc=estadoColors[e.estado]||{};return<div key={e.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>{e.urgente&&<span style={{width:8,height:8,borderRadius:4,background:"#EF5350",display:"inline-block"}}/>}<span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600}} onClick={()=>setDetail({type:"expediente",id:e.id})}>{e.numero}</span><Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge></div>
            <span style={{fontSize:11,color:MUTED}}>{e.juzgado}</span>
          </div>
        </div>})}
      </Card>
      {/* Cobros */}
      <Card><CardTitle><IC.Dollar /> Cobros ({cobs.length})</CardTitle>
        {cobs.map(c=>{const sc=cobroColors[c.estado]||{};return<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}>
          <div><div style={{fontSize:13}}>{c.concepto}</div><div style={{fontSize:11,color:MUTED,marginTop:2}}>Vence: {formatDate(c.fecha_vencimiento)}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontWeight:700,color:TEXT}}>{formatMoney(c.monto)}</span><Badge color={sc.text} bg={sc.bg}>{c.estado}</Badge></div>
        </div>})}
      </Card>
    </div>
  }

  const SearchResults = () => {
    if(!searchResults) return null
    return <Card style={{marginBottom:20}}><CardTitle><IC.Search /> {searchResults.total} resultado(s)</CardTitle>
      {searchResults.exps.length>0&&<>{searchResults.exps.map(e=><div key={e.id} style={{padding:"8px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}><span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600}} onClick={()=>{setDetail({type:"expediente",id:e.id});setSearch("")}}>{e.numero}</span><span style={{color:MUTED,fontSize:12,marginLeft:8}}>{getCli(e.cliente_id)?.nombre}</span></div>)}</>}
      {searchResults.clis.length>0&&<>{searchResults.clis.map(c=><div key={c.id} style={{padding:"8px 0",borderBottom:"1px solid rgba(184,150,62,0.04)"}}><span style={{color:"#64B5F6",cursor:"pointer",fontWeight:600}} onClick={()=>{setDetail({type:"cliente",id:c.id});setSearch("")}}>{c.nombre}</span></div>)}</>}
      {searchResults.total===0&&<div style={{padding:16,textAlign:"center",color:MUTED}}>Sin resultados</div>}
    </Card>
  }

  const sections_map = {dashboard:renderDashboard,expedientes:renderExpedientes,clientes:renderClientes,vencimientos:renderVencimientos,cobranza:renderCobranza,portal:renderPortal,notificaciones:renderNotificaciones}
  const titles = {dashboard:"Dashboard",expedientes:"Expedientes",clientes:"Clientes",vencimientos:"Vencimientos",cobranza:"Cobranza",portal:"Portal de Clientes",notificaciones:"Portal Judicial"}
  const navItems = [
    {key:"dashboard",label:"Dashboard",icon:IC.Dashboard},{key:"expedientes",label:"Expedientes",icon:IC.Folder},{key:"clientes",label:"Clientes",icon:IC.Users},
    {key:"vencimientos",label:"Vencimientos",icon:IC.Calendar},{key:"cobranza",label:"Cobranza",icon:IC.Dollar},
    {key:"notificaciones",label:"Portal Judicial",icon:IC.Sync},{key:"portal",label:"Portal Clientes",icon:IC.Portal},
  ]

  const renderContent = () => {
    if(detail){
      if(detail.type==="expediente"){const e=getExp(detail.id);return e?<ExpDetail exp={e}/>:<div>No encontrado</div>}
      if(detail.type==="cliente"){const c=getCli(detail.id);return c?<CliDetail cli={c}/>:<div>No encontrado</div>}
    }
    return <>{search&&<SearchResults />}{(!search||!searchResults)&&sections_map[section]()}</>
  }

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:BG}}><div style={{textAlign:"center",color:GOLD}}><IC.Logo s={40}/><div style={{fontSize:13,color:MUTED,marginTop:16}}>Cargando...</div></div></div>

  const userName = session.user.user_metadata?.nombre || session.user.email

  return <div style={{fontFamily:FU,background:BG,color:TEXT,minHeight:"100vh",display:"flex"}}>
    {sidebar&&<div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:49}}/>}
    <aside style={{width:220,background:SURFACE,borderRight:"1px solid rgba(184,150,62,0.08)",display:"flex",flexDirection:"column",position:"fixed",top:0,left:sidebar?0:-240,height:"100vh",zIndex:50,transition:"left .3s"}}>
      <div style={{padding:"18px 16px",borderBottom:"1px solid rgba(184,150,62,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <IC.Logo s={28} />
          <div style={{textAlign:"center"}}><div style={{fontFamily:FT,fontSize:16,fontWeight:600,color:TEXT,letterSpacing:5}}>TINOCO</div><div style={{fontFamily:FB,fontSize:7,color:MUTED,letterSpacing:2,marginTop:1}}>FIRMA LEGAL</div></div>
        </div>
      </div>
      <nav style={{padding:"12px 10px",flex:1}}>
        {navItems.map(n=>{const act=section===n.key&&!detail;return<button key={n.key} onClick={()=>{setSection(n.key);setDetail(null);setSearch("");setSidebar(false)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:2,background:act?"rgba(184,150,62,0.08)":"transparent",border:act?`1px solid rgba(184,150,62,0.12)`:"1px solid transparent",borderRadius:10,color:act?GOLD:MUTED,fontSize:13,fontWeight:act?600:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}><n.icon />{n.label}</button>})}
      </nav>
      <div style={{padding:"12px 10px",borderTop:"1px solid rgba(184,150,62,0.08)"}}>
        <div style={{fontSize:10,color:MUTED,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px"}}>{userName}</div>
        <button onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",background:"none",border:"1px solid rgba(184,150,62,0.08)",borderRadius:8,color:MUTED,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}><IC.Logout /> Cerrar sesión</button>
      </div>
    </aside>
    <main style={{flex:1,minWidth:0}}>
      <header style={{padding:"12px 20px",borderBottom:"1px solid rgba(184,150,62,0.06)",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setSidebar(!sidebar)} style={{background:"none",border:"none",color:GOLD,cursor:"pointer",padding:4,flexShrink:0}}><IC.Menu /></button>
        <div style={{flex:1,position:"relative"}}>
          <IC.Search style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(184,150,62,0.3)"}} />
          <input value={search} onChange={e=>{setSearch(e.target.value);if(detail)setDetail(null)}} placeholder="Buscar..." style={{width:"100%",padding:"9px 12px 9px 36px",background:"rgba(184,150,62,0.04)",border:"1px solid rgba(184,150,62,0.08)",borderRadius:10,color:TEXT,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:MUTED,cursor:"pointer"}}><IC.X /></button>}
        </div>
      </header>
      <div style={{padding:"16px 20px"}}>
        {!detail&&!search&&<div style={{fontSize:11,color:"rgba(200,184,138,0.3)",marginBottom:14,textTransform:"uppercase",letterSpacing:1.5}}>{titles[section]}</div>}
        {renderContent()}
      </div>
    </main>

    {modal==="expediente"&&<ModalWrap title="Nuevo Expediente" wide onClose={()=>setModal(null)}><ExpForm /></ModalWrap>}
    {modal==="cliente"&&<ModalWrap title="Nuevo Cliente" onClose={()=>setModal(null)}><CliForm /></ModalWrap>}
    {modal==="cobro"&&<ModalWrap title="Nuevo Cobro" onClose={()=>setModal(null)}><CobForm /></ModalWrap>}
    {subModal?.type==="actuacion"&&<ModalWrap title="Nueva Actuación" onClose={()=>setSubModal(null)}><ActForm expId={subModal.expId} /></ModalWrap>}
    {subModal?.type==="documento"&&<ModalWrap title="Nuevo Documento" onClose={()=>setSubModal(null)}><DocForm cliId={subModal.cliId} /></ModalWrap>}
    {subModal?.type==="portal"&&<ModalWrap title="Crear Acceso al Portal" onClose={()=>setSubModal(null)}><PortalForm cliId={subModal.cliId} /></ModalWrap>}
    {subModal?.type==="editExp"&&<ModalWrap title="Editar Expediente" wide onClose={()=>setSubModal(null)}><ExpEditForm exp={subModal.exp} /></ModalWrap>}
    {subModal?.type==="editCli"&&<ModalWrap title="Editar Cliente" onClose={()=>setSubModal(null)}><CliEditForm cli={subModal.cli} /></ModalWrap>}

    {/* Portal preview overlay */}
    {portalPreview && (
      <div style={{position:"fixed",inset:0,zIndex:300,overflowY:"auto"}}>
        <Portal
          session={session}
          userInfo={{cliente_id: portalPreview.clienteId}}
          previewMode={true}
          previewNombre={portalPreview.nombre}
          onExitPreview={()=>setPortalPreview(null)}
        />
      </div>
    )}
  </div>
}
