import { useState, useEffect, useRef } from "react";

// ─── Paleta de marca ─────────────────────────────────────────────────────────
const DARK    = "#16181D";
const AZUL    = "#1D3647";
const DEEP    = "#24435A";
const PIZARRA = "#485769";
const PLATA   = "#A4ABB3";
const MARFIL  = "#F3F2EF";
const MUTED   = "#C7CCD2";
const MUTED2  = "#7C8792";
const NEGRO   = "#101216";
const SERIF   = "'EB Garamond', Georgia, serif";
const SANS    = "'Source Sans 3', system-ui, sans-serif";

// ─── Isotipo inline ───────────────────────────────────────────────────────────
// Geometría EXACTA tomada de public/logo/isotipo.svg.
// La animación usa pathLength="1" para normalizar cada trazo: así strokeDasharray/
// strokeDashoffset valen exactamente 1 sin importar la longitud real → dibujado
// perfecto y sin huecos (evita que las líneas queden desalineadas).
const IsotipoLines = ({ stroke = MARFIL, animated = false }) => {
  const anim = (delay) => animated
    ? { strokeDasharray:1, strokeDashoffset:1, animation:`draw 1.3s ease ${delay}s forwards` }
    : {};
  return (
    // Sin strokeLinecap (butt, como el SVG oficial): con pathLength="1" el dash
    // mide justo la longitud del trazo, así que un remate "square" extendería
    // AMBOS extremos y, al variar los grosores, las líneas dejarían de encajar.
    <g strokeLinecap="butt" strokeMiterlimit="10" fill="none">
      <polyline points="148.47 213.39 498.46 213.39 848.47 213.39"
        stroke={stroke} strokeWidth="43.8" pathLength="1" style={anim(0.1)} />
      <line x1="496.33" y1="288.89" x2="500.5" y2="813.4"
        stroke={stroke} strokeWidth="36.82" pathLength="1" style={anim(0.35)} />
      <line x1="170.87" y1="307.8" x2="422.83" y2="307.8"
        stroke={stroke} strokeWidth="37.54" pathLength="1" style={anim(0.55)} />
      <line x1="403.99" y1="320.18" x2="403.99" y2="813.97"
        stroke={stroke} strokeWidth="37.54" pathLength="1" style={anim(0.65)} />
      <polyline points="817.66 306.92 592.91 306.92 574.09 306.92"
        stroke={stroke} strokeWidth="37.54" pathLength="1" style={anim(0.55)} />
      <line x1="595.16" y1="813.4" x2="592.95" y2="319.61"
        stroke={stroke} strokeWidth="37.54" pathLength="1" style={anim(0.65)} />
    </g>
  );
};

// ─── FadeIn al entrar al viewport ────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, style = {} }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.06 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(26px)",
      transition: `opacity .85s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .85s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

const ContactRow = ({ label, value, href }) => (
  <a href={href} className="contact-row">
    <span className="contact-row-label">{label}</span>
    <span className="contact-row-value">{value}</span>
  </a>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Website() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [formStatus, setFormStatus] = useState("idle");
  const [contactForm, setContactForm] = useState({ nombre:"", email:"", telefono:"", asunto:"", mensaje:"" });

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior:"smooth" }); setMenuOpen(false); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (formStatus === "sending") return;
    setFormStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/mjgqydry", {
        method:"POST",
        headers:{ "Content-Type":"application/json", Accept:"application/json" },
        body: JSON.stringify({ ...contactForm, _subject:`Nuevo mensaje de ${contactForm.nombre || "la web"} — tinoco.legal` }),
      });
      if (res.ok) { setFormStatus("success"); setContactForm({ nombre:"", email:"", telefono:"", asunto:"", mensaje:"" }); }
      else setFormStatus("error");
    } catch { setFormStatus("error"); }
  }

  const areas = [
    { num:"I",   title:"Derecho Administrativo", desc:"Recursos y procedimientos ante la autoridad, sanciones y responsabilidades, permisos, licencias y concesiones, juicio contencioso administrativo." },
    { num:"II",  title:"Derecho Fiscal",         desc:"Defensa frente a créditos fiscales, auditorías y facultades de comprobación, devoluciones y compensaciones, juicio de nulidad y amparo." },
    { num:"III", title:"Derecho Aduanero",       desc:"Procedimientos en materia aduanera, embargo y regularización de mercancías, clasificación arancelaria, multas y sanciones." },
  ];

  const principios = [
    { num:"01", titulo:"RIGOR TÉCNICO",    desc:"Cada escrito se construye sobre la norma, el precedente y el expediente. Nada de plantillas ni argumentos genéricos." },
    { num:"02", titulo:"ATENCIÓN DIRECTA", desc:"Su interlocutor es el abogado que lleva el caso. Sin intermediarios, con tiempos de respuesta cortos." },
    { num:"03", titulo:"CLARIDAD",         desc:"Escenarios reales explicados en lenguaje claro, para que cada decisión se tome con información completa." },
  ];

  const publicaciones = [
    { cat:"FISCAL",         titulo:"¿Qué hacer ante una visita domiciliaria del SAT?",    extracto:"Los derechos del contribuyente durante las facultades de comprobación y los errores más comunes al atenderlas." },
    { cat:"ADUANERO",      titulo:"Embargo de mercancías: el PAMA explicado paso a paso.", extracto:"Qué significa un procedimiento aduanero, sus plazos y las vías para recuperar la mercancía." },
    { cat:"ADMINISTRATIVO",titulo:"Multas administrativas: cuándo y cómo impugnarlas.",   extracto:"No toda sanción está debidamente fundada y motivada. Las claves para detectar actos impugnables." },
  ];

  const navLinks = [
    { label:"ÁREAS DE PRÁCTICA", id:"areas" },
    { label:"LA FIRMA",          id:"firma" },
    { label:"PUBLICACIONES",     id:"publicaciones" },
    { label:"CONTACTO",          id:"contacto" },
  ];

  return (
    <>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="px" style={{
        position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingTop:22, paddingBottom:22,
        background: AZUL,
        borderBottom:`1px solid rgba(164,171,179,.18)`,
        boxShadow:"0 8px 32px rgba(0,0,0,.26)",
      }}>
        <a href="#" onClick={e=>{ e.preventDefault(); scrollTo("inicio"); }} style={{ display:"block", textDecoration:"none" }}>
          <img src="/logo/logo-horizontal.png" alt="TINOCO · Firma Legal" className="header-logo" style={{ height:50, width:"auto", display:"block" }} />
        </a>

        {/* Desktop nav */}
        <nav className="hide-mobile" style={{ display:"flex", alignItems:"center", gap:38 }}>
          {navLinks.map(n => (
            <span key={n.id} className="nav-a" onClick={() => scrollTo(n.id)}>{n.label}</span>
          ))}
          <span className="btn-border" onClick={() => scrollTo("contacto")}>AGENDAR CONSULTA</span>
        </nav>

        {/* Hamburger */}
        <button className="show-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{
          background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", gap:5, padding:8,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:22, height:2, background:MARFIL, borderRadius:1, transition:"all .3s",
              transform: menuOpen
                ? (i===0?"rotate(45deg) translate(5px,5px)":i===2?"rotate(-45deg) translate(5px,-5px)":"scaleX(0)")
                : "none",
            }}/>
          ))}
        </button>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0,
            background:"rgba(22,24,29,.97)", backdropFilter:"blur(16px)",
            borderBottom:`1px solid rgba(164,171,179,.12)`,
          }}>
            {navLinks.map(n => (
              <div key={n.id} onClick={() => scrollTo(n.id)} style={{
                padding:"16px 24px", fontFamily:SANS, fontSize:14, letterSpacing:2,
                color:MARFIL, cursor:"pointer", borderBottom:`1px solid rgba(164,171,179,.07)`,
              }}>{n.label}</div>
            ))}
            <div onClick={() => scrollTo("contacto")} style={{
              padding:"18px 24px", fontFamily:SANS, fontSize:14, letterSpacing:2,
              color:MARFIL, cursor:"pointer",
            }}>AGENDAR CONSULTA</div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section id="inicio" className="px" style={{
        position:"relative", overflow:"hidden",
        background:`radial-gradient(130% 100% at 50% 0%, ${DEEP} 0%, ${AZUL} 48%, ${DARK} 100%)`,
        paddingTop:150, paddingBottom:130,
        minHeight:"max(94vh, 780px)", display:"flex", alignItems:"center", justifyContent:"center",
        textAlign:"center",
      }}>
        {/* Marca de agua — anclada en la zona alta (detrás del título) para que el isotipo
            se vea completo y los botones queden en espacio despejado debajo. */}
        <svg viewBox="0 0 1001.01 1001.01" aria-hidden="true" className="hero-watermark" style={{
          position:"absolute", top:"42%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:"min(560px,78vw)", height:"min(560px,78vw)", opacity:.12, pointerEvents:"none",
        }}>
          <IsotipoLines stroke={PLATA} animated />
        </svg>

        <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", width:"100%", minWidth:0, maxWidth:"100%" }}>
          <div className="hero-eyebrow" style={{ animation:"fadeUp .9s ease both" }}>
            ADMINISTRATIVO · FISCAL · ADUANERO
          </div>
          <h1 className="hero-h1" style={{ animation:"fadeUp .9s ease .15s both" }}>
            Criterio frente a la autoridad.
          </h1>
          <p className="hero-p" style={{ animation:"fadeUp .9s ease .3s both" }}>
            Firma legal en Irapuato, Guanajuato, dedicada al derecho administrativo, fiscal y aduanero. Estudio serio de cada asunto, atención directa del abogado titular y comunicación sin rodeos.
          </p>
          <div className="hero-btns" style={{ animation:"fadeUp .9s ease .45s both" }}>
            <span className="btn-solid" onClick={() => scrollTo("contacto")}>AGENDAR CONSULTA</span>
            <span className="btn-outline" onClick={() => scrollTo("areas")}>VER ÁREAS ↓</span>
          </div>
        </div>
      </section>

      {/* ── ÁREAS DE PRÁCTICA ──────────────────────────────────────────── */}
      <section id="areas" className="px" style={{ background:DARK, paddingTop:96, paddingBottom:96 }}>
        <FadeIn>
          <div style={{ fontFamily:SANS, fontSize:12, letterSpacing:4, color:PLATA }}>ÁREAS DE PRÁCTICA</div>
        </FadeIn>
        <div style={{ marginTop:40, borderTop:`1px solid rgba(164,171,179,.22)` }}>
          {areas.map((a,i) => (
            <FadeIn key={i} delay={i*.1}>
              <div className="area-row">
                <span className="area-num">{a.num}</span>
                <div>
                  <h3 className="area-title">{a.title}</h3>
                  <p className="area-desc">{a.desc}</p>
                </div>
                <span className="area-arrow">→</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── LA FIRMA ───────────────────────────────────────────────────── */}
      <section id="firma" className="px" style={{ background:MARFIL, color:DARK, paddingTop:110, paddingBottom:110 }}>
        <FadeIn>
          <h2 className="firma-main-h2">
            La firma se sostiene sobre tres principios.
          </h2>
        </FadeIn>
        <FadeIn delay={.1}>
          <div className="principios-grid" style={{ marginTop:72 }}>
            {principios.map((p,i) => (
              <div key={i} className="principio-col">
                <span className="principio-num">{p.num}</span>
                <span className="principio-titulo">{p.titulo}</span>
                <span className="principio-desc">{p.desc}</span>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={.2}>
          <div className="firma-sobre">
            <div className="firma-label">LA FIRMA</div>
            <div>
              <h3 className="firma-h3">
                Una firma deliberadamente pequeña. Cada asunto lo estudia, lo decide y lo firma la misma persona.
              </h3>
              <div className="firma-cols">
                <p className="firma-p">
                  Tinoco es una firma legal dedicada al derecho administrativo, fiscal y aduanero. Trabajamos con un principio simple: ningún asunto se delega, se estandariza ni se resuelve con fórmulas. Cada expediente recibe un estudio propio y una estrategia a su medida.
                </p>
                <p className="firma-p">
                  Eso permite algo que las estructuras grandes difícilmente ofrecen: interlocución directa con el abogado que lleva el caso, tiempos de respuesta cortos y criterios consistentes de principio a fin.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── PUBLICACIONES ──────────────────────────────────────────────── */}
      <section id="publicaciones" className="px" style={{
        background:`linear-gradient(150deg, ${DARK} 0%, ${AZUL} 100%)`,
        paddingTop:110, paddingBottom:110,
      }}>
        <FadeIn>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
            <div style={{ fontFamily:SANS, fontSize:12, letterSpacing:4, color:PLATA }}>PUBLICACIONES</div>
            <span style={{ fontFamily:SANS, fontSize:12, letterSpacing:2.5, color:MARFIL, cursor:"pointer", borderBottom:`1px solid rgba(164,171,179,.5)`, paddingBottom:5 }}>
              VER TODAS →
            </span>
          </div>
        </FadeIn>
        <div style={{ marginTop:44, borderTop:`1px solid rgba(164,171,179,.22)` }}>
          {publicaciones.map((p,i) => (
            <FadeIn key={i} delay={i*.1}>
              <a href="#publicaciones" className="pub-row">
                <span className="pub-cat">{p.cat}</span>
                <span className="pub-titulo">{p.titulo}</span>
                <span className="pub-extr">{p.extracto}</span>
                <span className="pub-arrow">→</span>
              </a>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CONTACTO ───────────────────────────────────────────────────── */}
      <section id="contacto" className="px" style={{ background:MARFIL, color:DARK, paddingTop:110, paddingBottom:110 }}>
        <div className="contacto-grid">
          {/* Info */}
          <FadeIn>
            <div>
              <div style={{ fontFamily:SANS, fontSize:12, letterSpacing:4, color:PIZARRA }}>CONTACTO</div>
              <h2 className="contacto-info-h2">
                Hablemos de su caso.
              </h2>
              <p style={{ fontFamily:SANS, fontSize:16, lineHeight:1.7, color:PIZARRA, margin:"24px 0 0" }}>
                Una consulta inicial basta para saber si podemos ayudarle y cuál sería la ruta. Toda comunicación es confidencial.
              </p>
              <div style={{ borderTop:`1px solid rgba(22,24,29,.16)`, marginTop:40 }}>
                <ContactRow label="TELÉFONO" value="462 252 8399" href="tel:+524622528399" />
                <ContactRow label="CORREO" value="contacto@tinoco.legal" href="mailto:contacto@tinoco.legal" />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"26px 4px", borderBottom:`1px solid rgba(22,24,29,.16)` }}>
                  <span className="contact-row-label">HORARIO</span>
                  <span className="contact-row-value">Lun – Vie · 9:00 – 18:00</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Formulario */}
          <FadeIn delay={.15}>
            {formStatus === "success" ? (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ fontFamily:SERIF, fontSize:48, color:PIZARRA, marginBottom:16 }}>✓</div>
                <h3 style={{ fontFamily:SERIF, fontWeight:400, fontSize:32, marginBottom:12, color:DARK }}>Mensaje recibido.</h3>
                <p style={{ fontFamily:SANS, fontSize:16, color:PIZARRA, lineHeight:1.7 }}>Le contactaremos a la brevedad. Toda comunicación es confidencial.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontFamily:SERIF, fontWeight:400, fontSize:28, marginBottom:28, color:DARK }}>Envíenos un mensaje</h3>
                {[
                  { label:"NOMBRE",   key:"nombre",   type:"text",  ph:"Su nombre",              req:true  },
                  { label:"CORREO",   key:"email",    type:"email", ph:"correo@ejemplo.com",      req:true  },
                  { label:"TELÉFONO", key:"telefono", type:"tel",   ph:"+52 462 ...",             req:false },
                  { label:"ASUNTO",   key:"asunto",   type:"text",  ph:"¿En qué podemos ayudar?", req:false },
                ].map(f => (
                  <div key={f.key} className="form-field">
                    <label className="form-label">{f.label}</label>
                    <input className="inp" type={f.type} required={f.req} placeholder={f.ph}
                      value={contactForm[f.key]}
                      onChange={e => setContactForm({ ...contactForm, [f.key]:e.target.value })} />
                  </div>
                ))}
                <div className="form-field">
                  <label className="form-label">MENSAJE</label>
                  <textarea className="inp" required rows={4} placeholder="Describa su situación..."
                    value={contactForm.mensaje} onChange={e => setContactForm({ ...contactForm, mensaje:e.target.value })}
                    style={{ resize:"vertical" }} />
                </div>
                {formStatus === "error" && (
                  <p style={{ fontFamily:SANS, fontSize:13, color:"#B94A4A", marginBottom:16 }}>
                    Hubo un problema. Escríbanos directamente a contacto@tinoco.legal
                  </p>
                )}
                <button type="submit" className="btn-submit" disabled={formStatus === "sending"}>
                  {formStatus === "sending" ? "ENVIANDO..." : "ENVIAR MENSAJE"}
                </button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="px" style={{ background:NEGRO, borderTop:`1px solid rgba(164,171,179,.12)`, paddingTop:32, paddingBottom:32 }}>
        <div className="footer-inner">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <svg viewBox="0 0 1001.01 1001.01" width="22" height="22" aria-hidden="true">
              <IsotipoLines stroke={PLATA} />
            </svg>
            <span style={{ fontFamily:SANS, fontSize:12, letterSpacing:2, color:MUTED2 }}>© MMXXVI TINOCO · FIRMA LEGAL</span>
          </div>
          <div style={{ display:"flex", gap:28 }}>
            <a href="/aviso-de-privacidad" style={{ fontFamily:SANS, fontSize:12, letterSpacing:2, color:MUTED2, textDecoration:"none" }}>AVISO DE PRIVACIDAD</a>
            <span style={{ fontFamily:SANS, fontSize:12, letterSpacing:2, color:MUTED2 }}>TINOCO.LEGAL</span>
          </div>
        </div>
      </footer>
    </>
  );
}
