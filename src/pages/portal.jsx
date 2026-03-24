import { useState, useEffect, useCallback } from 'react'
import { supabase, db } from '../lib/supabase'

const BG = "#0D0D0D"
const SURFACE = "#1A1A1A"
const SURFACE2 = "#222222"
const GOLD = "#B8963E"
const GOLD_LIGHT = "#D4AF5C"
const TEXT = "#F5F0E8"
const MUTED = "#A09882"
const FT = "'Cormorant Garamond', serif"
const FB = "'Source Serif 4', serif"
const FU = "'DM Sans', sans-serif"

const estadoColors = {
  "Alegatos": { bg: "rgba(230,81,0,0.1)", text: "#E65100" },
  "En trámite": { bg: "rgba(21,101,192,0.1)", text: "#1565C0" },
  "Sentencia": { bg: "rgba(46,125,50,0.1)", text: "#2E7D32" },
  "Amparo": { bg: "rgba(123,31,162,0.1)", text: "#7B1FA2" },
  "Concluido": { bg: "rgba(84,110,122,0.1)", text: "#546E7A" },
  "Apelación": { bg: "rgba(245,127,23,0.1)", text: "#F57F17" },
  "Ejecución": { bg: "rgba(0,131,143,0.1)", text: "#00838F" },
  "Pruebas": { bg: "rgba(191,54,12,0.1)", text: "#BF360C" },
}
const cobroColors = {
  "Pendiente": { bg: "rgba(245,127,23,0.1)", text: "#F57F17" },
  "Pagado": { bg: "rgba(46,125,50,0.1)", text: "#2E7D32" },
  "Vencido": { bg: "rgba(198,40,40,0.1)", text: "#C62828" },
}

const formatDate = (d) => { if (!d) return "—"; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}` }
const formatMoney = (n) => "$" + Number(n||0).toLocaleString("es-MX")
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000)

const LogoIcon = ({ size = 28, color = GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
    <line x1="32" y1="13" x2="32" y2="50" strokeWidth="2.5"/><line x1="14" y1="18" x2="50" y2="18" strokeWidth="2.5"/>
    <circle cx="14" cy="18" r="2.5" strokeWidth="2.2" fill={color}/><line x1="14" y1="20.5" x2="14" y2="32" strokeWidth="2"/>
    <path d="M8 32 L14 32 L20 32" strokeWidth="2.5"/><circle cx="50" cy="18" r="2.5" strokeWidth="2.2" fill={color}/>
    <line x1="50" y1="20.5" x2="50" y2="32" strokeWidth="2"/><path d="M44 32 L50 32 L56 32" strokeWidth="2.5"/>
    <line x1="26" y1="50" x2="38" y2="50" strokeWidth="2.5"/>
  </svg>
)

export default function Portal({ session, userInfo }) {
  const [loading, setLoading] = useState(true)
  const [cliente, setCliente] = useState(null)
  const [expedientes, setExpedientes] = useState([])
  const [actuaciones, setActuaciones] = useState({})
  const [documentos, setDocumentos] = useState([])
  const [cobros, setCobros] = useState([])
  const [activeExp, setActiveExp] = useState(null)
  const [section, setSection] = useState("expedientes")
  const [menuOpen, setMenuOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const cid = userInfo.cliente_id
      const [cli, exps, docs, cobs] = await Promise.all([
        db.getPortalClienteInfo(cid),
        db.getPortalExpedientes(cid),
        db.getPortalDocumentos(cid),
        db.getPortalCobros(cid),
      ])
      setCliente(cli)
      setExpedientes(exps)
      setDocumentos(docs)
      setCobros(cobs)

      // Load actuaciones for each expediente
      const acts = {}
      for (const exp of exps) {
        acts[exp.id] = await db.getPortalActuaciones(exp.id)
      }
      setActuaciones(acts)
      if (exps.length > 0 && !activeExp) setActiveExp(exps[0].id)
    } catch (err) { console.error('Error loading portal data:', err) }
    setLoading(false)
  }, [userInfo])

  useEffect(() => { loadData() }, [loadData])

  const Badge = ({ children, color = GOLD, bg = "rgba(184,150,62,0.1)" }) => (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: "nowrap" }}>{children}</span>
  )

  const handleLogout = async () => { await supabase.auth.signOut() }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: BG }}>
      <div style={{ textAlign: "center", color: GOLD }}>
        <LogoIcon size={40} /><div style={{ marginTop: 16, fontSize: 13, color: MUTED }}>Cargando...</div>
      </div>
    </div>
  )

  const today = new Date().toISOString().slice(0,10)
  const totalPend = cobros.filter(c => c.estado === "Pendiente").reduce((s,c) => s + Number(c.monto), 0)
  const activeExpData = expedientes.find(e => e.id === activeExp)
  const activeActs = actuaciones[activeExp] || []

  const navItems = [
    { id: "expedientes", label: "Mis Expedientes" },
    { id: "documentos", label: "Documentos" },
    { id: "pagos", label: "Pagos" },
  ]

  return (
    <div style={{ fontFamily: FU, background: BG, color: TEXT, minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        background: SURFACE, borderBottom: `1px solid rgba(184,150,62,0.12)`,
        padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={28} />
          <div>
            <span style={{ fontFamily: FT, fontSize: 18, fontWeight: 600, color: TEXT, letterSpacing: 5 }}>TINOCO</span>
            <span style={{ fontFamily: FB, fontSize: 9, color: MUTED, letterSpacing: 2, marginLeft: 8 }}>firma legal</span>
          </div>
        </div>
        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: section === n.id ? 600 : 400,
              background: section === n.id ? "rgba(184,150,62,0.1)" : "transparent",
              color: section === n.id ? GOLD : MUTED, transition: "all 0.2s",
            }}>{n.label}</button>
          ))}
          <div style={{ width: 1, height: 24, background: "rgba(184,150,62,0.12)", margin: "0 8px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17, background: "rgba(184,150,62,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: FT, fontSize: 13, fontWeight: 700, color: GOLD }}>
                {cliente?.nombre?.split(' ').map(n => n[0]).slice(0,2).join('') || 'CL'}
              </span>
            </div>
            <button onClick={handleLogout} style={{
              background: "none", border: "none", color: MUTED, fontSize: 11,
              cursor: "pointer", fontFamily: "inherit",
            }}>Salir</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: FT, fontSize: 28, fontWeight: 600, color: TEXT, marginBottom: 4 }}>
            Bienvenido, {cliente?.nombre?.split(' ')[0] || 'Cliente'}
          </div>
          <div style={{ fontFamily: FB, fontSize: 14, color: MUTED }}>
            Consulta el avance de tus asuntos legales
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 36 }}>
          <div style={{ background: SURFACE, borderRadius: 14, padding: "20px 18px", border: "1px solid rgba(184,150,62,0.08)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: MUTED, marginBottom: 6 }}>Expedientes activos</div>
            <div style={{ fontFamily: FT, fontSize: 28, fontWeight: 700, color: TEXT }}>{expedientes.filter(e => e.estado !== "Concluido").length}</div>
          </div>
          <div style={{ background: SURFACE, borderRadius: 14, padding: "20px 18px", border: "1px solid rgba(184,150,62,0.08)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: MUTED, marginBottom: 6 }}>Documentos</div>
            <div style={{ fontFamily: FT, fontSize: 28, fontWeight: 700, color: TEXT }}>{documentos.length}</div>
          </div>
          <div style={{ background: SURFACE, borderRadius: 14, padding: "20px 18px", border: totalPend > 0 ? "1px solid rgba(245,127,23,0.2)" : "1px solid rgba(184,150,62,0.08)" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: totalPend > 0 ? "#F57F17" : MUTED, marginBottom: 6 }}>Saldo pendiente</div>
            <div style={{ fontFamily: FT, fontSize: 28, fontWeight: 700, color: totalPend > 0 ? GOLD_LIGHT : TEXT }}>{formatMoney(totalPend)}</div>
          </div>
        </div>

        {/* EXPEDIENTES */}
        {section === "expedientes" && (
          <div>
            <div style={{ fontFamily: FT, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Mis Expedientes</div>
            {expedientes.length === 0 ? (
              <div style={{ background: SURFACE, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>
                No tienes expedientes registrados
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: activeExpData ? "280px 1fr" : "1fr", gap: 20 }}>
                {/* Expediente list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {expedientes.map(e => {
                    const sc = estadoColors[e.estado] || estadoColors["En trámite"]
                    const isActive = activeExp === e.id
                    const days = e.proximo_plazo ? daysUntil(e.proximo_plazo) : null
                    return (
                      <div key={e.id} onClick={() => setActiveExp(e.id)} style={{
                        background: isActive ? "rgba(184,150,62,0.06)" : SURFACE,
                        border: isActive ? `1px solid rgba(184,150,62,0.2)` : "1px solid rgba(255,255,255,0.04)",
                        borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.2s",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontFamily: FT, fontSize: 16, fontWeight: 600, color: TEXT }}>{e.numero}</div>
                          <Badge color={sc.text} bg={sc.bg}>{e.estado}</Badge>
                        </div>
                        <div style={{ fontFamily: FB, fontSize: 11, color: MUTED, marginBottom: 4 }}>{e.tipo}</div>
                        <div style={{ fontFamily: FB, fontSize: 11, color: MUTED }}>{e.juzgado}</div>
                        {days !== null && (
                          <div style={{ marginTop: 8, fontFamily: FB, fontSize: 11, fontWeight: 600, color: days < 0 ? "#EF9A9A" : days <= 5 ? GOLD_LIGHT : "#81C784" }}>
                            Próximo plazo: {formatDate(e.proximo_plazo)} ({days < 0 ? `${Math.abs(days)}d vencido` : `${days}d`})
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Expediente detail */}
                {activeExpData && (
                  <div style={{ background: SURFACE, borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontFamily: FT, fontSize: 22, fontWeight: 600, color: TEXT }}>{activeExpData.numero}</div>
                        <div style={{ fontFamily: FB, fontSize: 13, color: MUTED, marginTop: 4 }}>{activeExpData.tipo} · {activeExpData.materia}</div>
                        <div style={{ fontFamily: FB, fontSize: 12, color: MUTED, marginTop: 2 }}>{activeExpData.juzgado}</div>
                      </div>
                      <Badge color={(estadoColors[activeExpData.estado]||{}).text} bg={(estadoColors[activeExpData.estado]||{}).bg}>
                        {activeExpData.estado}
                      </Badge>
                    </div>

                    {activeExpData.notas_cliente && (
                      <div style={{
                        background: "rgba(184,150,62,0.06)", border: "1px solid rgba(184,150,62,0.12)",
                        borderRadius: 10, padding: 16, marginBottom: 20,
                      }}>
                        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: GOLD, marginBottom: 6 }}>Mensaje de tu abogado</div>
                        <div style={{ fontFamily: FB, fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{activeExpData.notas_cliente}</div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: GOLD, marginBottom: 16 }}>
                      Actuaciones procesales ({activeActs.length})
                    </div>
                    {activeActs.length === 0 ? (
                      <div style={{ fontSize: 13, color: MUTED, padding: "12px 0" }}>Sin actuaciones visibles</div>
                    ) : (
                      <div style={{ position: "relative", paddingLeft: 24 }}>
                        {/* Timeline line */}
                        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: "rgba(184,150,62,0.15)" }} />
                        {activeActs.map((a, i) => (
                          <div key={a.id} style={{ position: "relative", paddingBottom: i === activeActs.length - 1 ? 0 : 20 }}>
                            {/* Dot */}
                            <div style={{
                              position: "absolute", left: -20, top: 6, width: 10, height: 10, borderRadius: 5,
                              background: i === 0 ? GOLD : "rgba(184,150,62,0.3)",
                              border: i === 0 ? "none" : "1px solid rgba(184,150,62,0.2)",
                            }} />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontFamily: FB, fontSize: 13, color: TEXT, fontWeight: 600 }}>{a.descripcion}</div>
                                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                  <Badge>{a.tipo}</Badge>
                                  {a.documento && <span style={{ fontSize: 11, color: MUTED }}>📄 {a.documento}</span>}
                                </div>
                              </div>
                              <div style={{ fontFamily: FB, fontSize: 11, color: MUTED, whiteSpace: "nowrap", marginLeft: 12 }}>
                                {formatDate(a.fecha)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTOS */}
        {section === "documentos" && (
          <div>
            <div style={{ fontFamily: FT, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Documentos Compartidos</div>
            {documentos.length === 0 ? (
              <div style={{ background: SURFACE, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>
                No hay documentos compartidos
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {documentos.map(d => (
                  <div key={d.id} style={{
                    background: SURFACE, borderRadius: 14, padding: 20,
                    border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 14,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: "rgba(184,150,62,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{d.tipo} · {formatDate(d.fecha)}</div>
                      {d.notas && <div style={{ fontSize: 11, color: "rgba(200,184,138,0.35)", marginTop: 3 }}>{d.notas}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGOS */}
        {section === "pagos" && (
          <div>
            <div style={{ fontFamily: FT, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Estado de Pagos</div>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ background: SURFACE, borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(184,150,62,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: MUTED, marginBottom: 6 }}>Pendiente</div>
                <div style={{ fontFamily: FT, fontSize: 22, fontWeight: 700, color: GOLD_LIGHT }}>
                  {formatMoney(cobros.filter(c => c.estado === "Pendiente").reduce((s,c) => s + Number(c.monto), 0))}
                </div>
              </div>
              <div style={{ background: SURFACE, borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(184,150,62,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: MUTED, marginBottom: 6 }}>Pagado</div>
                <div style={{ fontFamily: FT, fontSize: 22, fontWeight: 700, color: "#81C784" }}>
                  {formatMoney(cobros.filter(c => c.estado === "Pagado").reduce((s,c) => s + Number(c.monto), 0))}
                </div>
              </div>
              <div style={{ background: SURFACE, borderRadius: 14, padding: "18px 16px", border: cobros.some(c => c.estado === "Vencido") ? "1px solid rgba(198,40,40,0.2)" : "1px solid rgba(184,150,62,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: MUTED, marginBottom: 6 }}>Vencido</div>
                <div style={{ fontFamily: FT, fontSize: 22, fontWeight: 700, color: cobros.some(c => c.estado === "Vencido") ? "#EF9A9A" : TEXT }}>
                  {formatMoney(cobros.filter(c => c.estado === "Vencido").reduce((s,c) => s + Number(c.monto), 0))}
                </div>
              </div>
            </div>

            {cobros.length === 0 ? (
              <div style={{ background: SURFACE, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>
                No hay cobros registrados
              </div>
            ) : (
              <div style={{ background: SURFACE, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Concepto", "Monto", "Estado", "Vencimiento"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "12px 16px", fontSize: 10, textTransform: "uppercase",
                          letterSpacing: 1.2, color: MUTED, borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: SURFACE2,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cobros.map(c => {
                      const sc = cobroColors[c.estado] || cobroColors["Pendiente"]
                      return (
                        <tr key={c.id}>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: FB, fontSize: 13, color: TEXT }}>{c.concepto}</td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: FT, fontSize: 15, fontWeight: 700, color: TEXT }}>{formatMoney(c.monto)}</td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><Badge color={sc.text} bg={sc.bg}>{c.estado}</Badge></td>
                          <td style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: FB, fontSize: 12, color: MUTED }}>{formatDate(c.fecha_vencimiento)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(184,150,62,0.08)", padding: "20px 24px",
        textAlign: "center", marginTop: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <LogoIcon size={16} color={MUTED} />
          <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(200,184,138,0.25)" }}>
            TINOCO firma legal · Portal de Clientes
          </span>
        </div>
        <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(200,184,138,0.15)" }}>
          © 2026 Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}
