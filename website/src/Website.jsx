import { useState, useEffect, useRef } from "react";

// ─── Paleta de marca ─────────────────────────────────────────────────────────
const DARK    = "#16181D";   // Carbón Nocturno
const AZUL    = "#1D3647";   // Azul Profundo
const DEEP    = "#24435A";   // Azul brillante (degradados)
const PIZARRA = "#485769";   // Pizarra
const PLATA   = "#A4ABB3";   // Gris Plata
const MARFIL  = "#F3F2EF";  // Marfil Cálido
const MUTED   = "#C7CCD2";   // texto secundario sobre oscuro
const MUTED2  = "#7C8792";   // texto terciario
const NEGRO   = "#101216";   // footer

const SERIF = "'EB Garamond', Georgia, serif";
const SANS  = "'Source Sans 3', system-ui, sans-serif";

// ─── Isotipo inline (geometría del SVG oficial) ───────────────────────────────
const IsotipoLines = ({ stroke = MARFIL, animated = false }) => (
  <g>
    <polyline points="148.47 213.39 498.46 213.39 848.47 213.39"
      stroke={stroke} fill="none" strokeWidth="43.8" strokeLinecap="square"
      style={animated ? { strokeDasharray: 900, strokeDashoffset: 900, animation: "draw 1.4s ease 0.1s forwards" } : {}} />
    <line x1="496.33" y1="288.89" x2="500.5" y2="813.4"
      stroke={stroke} fill="none" strokeWidth="36.82" strokeLinecap="square"
      style={animated ? { strokeDasharray: 600, strokeDashoffset: 600, animation: "draw 1.4s ease 0.3s forwards" } : {}} />
    <line x1="170.87" y1="307.8" x2="422.83" y2="307.8"
      stroke={stroke} fill="none" strokeWidth="37.54" strokeLinecap="square"
      style={animated ? { strokeDasharray: 350, strokeDashoffset: 350, animation: "draw 1.2s ease 0.5s forwards" } : {}} />
    <line x1="403.99" y1="320.18" x2="403.99" y2="813.97"
      stroke={stroke} fill="none" strokeWidth="37.54" strokeLinecap="square"
      style={animated ? { strokeDasharray: 600, strokeDashoffset: 600, animation: "draw 1.4s ease 0.65s forwards" } : {}} />
    <polyline points="817.66 306.92 592.91 306.92 574.09 306.92"
      stroke={stroke} fill="none" strokeWidth="37.54" strokeLinecap="square"
      style={animated ? { strokeDasharray: 350, strokeDashoffset: 350, animation: "draw 1.2s ease 0.5s forwards" } : {}} />
    <line x1="595.16" y1="813.4" x2="592.95" y2="319.61"
      stroke={stroke} fill="none" strokeWidth="37.54" strokeLinecap="square"
      style={animated ? { strokeDasharray: 600, strokeDashoffset: 600, animation: "draw 1.4s ease 0.65s forwards" } : {}} />
  </g>
);

// ─── FadeIn al entrar al viewport ────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, style = {} }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(26px)",
      transition: `opacity 0.85s cubic-bezier(.22,.61,.36,1) ${delay}s, transform 0.85s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

// ─── Etiqueta eyebrow ─────────────────────────────────────────────────────────
const Eyebrow = ({ children, light = false }) => (
  <div style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 4, color: light ? PIZARRA : PLATA, marginBottom: 0 }}>
    {children}
  </div>
);

// ─── Línea horizontal de contacto (usada en sección contacto) ────────────────
const ContactRow = ({ label, value, href }) => (
  <a href={href} style={{
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    padding: "26px 4px", borderBottom: `1px solid rgba(22,24,29,.16)`,
    textDecoration: "none", color: DARK,
  }}>
    <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: 3, color: PIZARRA }}>{label}</span>
    <span style={{ fontFamily: SERIF, fontSize: 24 }}>{value}</span>
  </a>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Website() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState("idle");
  const [contactForm, setContactForm] = useState({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (formStatus === "sending") return;
    setFormStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/mjgqydry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...contactForm,
          _subject: `Nuevo mensaje de ${contactForm.nombre || "la web"} — tinoco.legal`,
        }),
      });
      if (res.ok) {
        setFormStatus("success");
        setContactForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  }

  const areas = [
    {
      num: "I", title: "Derecho Administrativo",
      desc: "Recursos y procedimientos ante la autoridad, sanciones y responsabilidades, permisos, licencias y concesiones, juicio contencioso administrativo.",
    },
    {
      num: "II", title: "Derecho Fiscal",
      desc: "Defensa frente a créditos fiscales, auditorías y facultades de comprobación, devoluciones y compensaciones, juicio de nulidad y amparo.",
    },
    {
      num: "III", title: "Derecho Aduanero",
      desc: "Procedimientos administrativos en materia aduanera, embargo y regularización de mercancías, clasificación arancelaria, multas y sanciones.",
    },
  ];

  const principios = [
    { num: "01", titulo: "RIGOR TÉCNICO", desc: "Cada escrito se construye sobre la norma, el precedente y el expediente. Nada de plantillas ni argumentos genéricos." },
    { num: "02", titulo: "ATENCIÓN DIRECTA", desc: "Su interlocutor es el abogado que lleva el caso. Sin intermediarios, con tiempos de respuesta cortos." },
    { num: "03", titulo: "CLARIDAD", desc: "Escenarios reales explicados en lenguaje claro, para que cada decisión se tome con información completa." },
  ];

  const publicaciones = [
    { cat: "FISCAL",        titulo: "¿Qué hacer ante una visita domiciliaria del SAT?",   extracto: "Los derechos del contribuyente durante las facultades de comprobación y los errores más comunes al atenderlas." },
    { cat: "ADUANERO",     titulo: "Embargo de mercancías: el PAMA explicado paso a paso.", extracto: "Qué significa un procedimiento administrativo en materia aduanera, sus plazos y las vías para recuperar la mercancía." },
    { cat: "ADMINISTRATIVO", titulo: "Multas administrativas: cuándo y cómo impugnarlas.",   extracto: "No toda sanción está debidamente fundada y motivada. Las claves para detectar actos de autoridad impugnables." },
  ];

  const navLinks = [
    { label: "ÁREAS DE PRÁCTICA", id: "areas" },
    { label: "LA FIRMA",          id: "firma" },
    { label: "PUBLICACIONES",     id: "publicaciones" },
    { label: "CONTACTO",          id: "contacto" },
  ];

  return (
    <>
      <style>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
          [data-animate] { opacity: 1 !important; transform: none !important; }
        }

        /* Nav */
        .nav-a { font-family:${SANS}; font-size:12px; letter-spacing:2.5px; color:${MARFIL}; text-decoration:none; cursor:pointer; transition: color .3s; }
        .nav-a:hover { color:${PLATA}; }

        /* Botón borde nav */
        .btn-border { font-family:${SANS}; font-size:12px; letter-spacing:2.5px; color:${MARFIL}; text-decoration:none; border:1px solid rgba(164,171,179,.55); padding:14px 26px; transition: background .35s, color .35s, border-color .35s; cursor:pointer; background:transparent; }
        .btn-border:hover { background:${MARFIL}; color:${DARK}; border-color:${MARFIL}; }

        /* Botón sólido marfil */
        .btn-solid { font-family:${SANS}; font-size:13px; letter-spacing:2.5px; color:${AZUL}; background:${MARFIL}; text-decoration:none; padding:18px 36px; display:inline-block; transition: background .35s; cursor:pointer; border:none; }
        .btn-solid:hover { background:#DCDAD3; }

        /* Botón borde hero */
        .btn-outline { font-family:${SANS}; font-size:13px; letter-spacing:2.5px; color:${MARFIL}; border:1px solid rgba(164,171,179,.55); text-decoration:none; padding:18px 36px; display:inline-block; transition: background .35s, color .35s; cursor:pointer; background:transparent; }
        .btn-outline:hover { background:${MARFIL}; color:${DARK}; }

        /* Filas de áreas */
        .area-row { display:grid; grid-template-columns:120px 1fr 60px; gap:32px; align-items:center; padding:44px 0; border-bottom:1px solid rgba(164,171,179,.22); transition: background .35s, padding-left .35s; cursor:default; }
        .area-row:hover { background:rgba(36,67,90,.35); padding-left:16px; }

        /* Principios */
        .principio-col:hover { background: rgba(22,24,29,.04); }

        /* Publicaciones rows */
        .pub-row { display:grid; gap:32px; align-items:baseline; padding:38px 0; border-bottom:1px solid rgba(164,171,179,.22); text-decoration:none; color:${MARFIL}; transition: background .35s, padding-left .35s; }
        .pub-row:hover { background:rgba(36,67,90,.4); padding-left:12px; }

        /* Input */
        .inp { width:100%; padding:12px 14px; background:rgba(22,24,29,.06); border:1px solid rgba(22,24,29,.16); color:${DARK}; font-family:${SANS}; font-size:14px; outline:none; transition: border-color .3s; }
        .inp:focus { border-color:${PIZARRA}; }
        .inp::placeholder { color:${PIZARRA}; opacity:.6; }

        /* Mobile */
        @media (max-width: 768px) {
          .hide-mobile { display:none !important; }
          .show-mobile { display:flex !important; }
          .hero-h1 { font-size:52px !important; }
          .area-row { grid-template-columns:70px 1fr !important; }
          .area-row .area-arrow { display:none; }
          .principios-grid { grid-template-columns:1fr !important; }
          .pub-row { grid-template-columns:1fr !important; }
          .pub-row .pub-cat, .pub-row .pub-extr, .pub-row .pub-arrow { display:none; }
          .contacto-grid { grid-template-columns:1fr !important; }
          .footer-inner { flex-direction:column; gap:16px; }
          .px { padding-left:20px !important; padding-right:20px !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display:none !important; }
          .pub-row { grid-template-columns:160px 1fr 280px 48px; }
          .contacto-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "22px 64px",
        background: AZUL,
        borderBottom: `1px solid rgba(164,171,179,.18)`,
        boxShadow: "0 8px 32px rgba(0,0,0,.26)",
      }} className="px">
        <a href="#" onClick={e => { e.preventDefault(); scrollTo("inicio"); }} style={{ display: "block", textDecoration: "none" }}>
          <img src="/logo/logo-horizontal.png" alt="TINOCO · Firma Legal" style={{ height: 50, width: "auto", display: "block" }} />
        </a>

        {/* Desktop nav */}
        <nav className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 38 }}>
          {navLinks.map(n => (
            <span key={n.id} className="nav-a" onClick={() => scrollTo(n.id)}>{n.label}</span>
          ))}
          <span className="btn-border" onClick={() => scrollTo("contacto")}>AGENDAR CONSULTA</span>
        </nav>

        {/* Mobile hamburger */}
        <button className="show-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{
          background: "none", border: "none", cursor: "pointer",
          flexDirection: "column", gap: 5, padding: 8,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 22, height: 2, background: MARFIL, transition: "all .3s",
              transform: menuOpen
                ? (i === 0 ? "rotate(45deg) translate(5px,5px)"
                  : i === 2 ? "rotate(-45deg) translate(5px,-5px)"
                  : "scale(0)")
                : "none",
            }} />
          ))}
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "rgba(22,24,29,.97)", backdropFilter: "blur(16px)",
            borderBottom: `1px solid rgba(164,171,179,.12)`,
          }}>
            {navLinks.map(n => (
              <div key={n.id} onClick={() => scrollTo(n.id)} style={{
                padding: "16px 24px", fontFamily: SANS, fontSize: 13, letterSpacing: 2.5,
                color: MARFIL, cursor: "pointer", borderBottom: `1px solid rgba(164,171,179,.07)`,
              }}>{n.label}</div>
            ))}
            <div onClick={() => scrollTo("contacto")} style={{
              padding: "18px 24px", fontFamily: SANS, fontSize: 13, letterSpacing: 2.5,
              color: MARFIL, cursor: "pointer",
            }}>AGENDAR CONSULTA</div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section id="inicio" style={{
        position: "relative", overflow: "hidden",
        background: `radial-gradient(130% 100% at 50% 0%, ${DEEP} 0%, ${AZUL} 48%, ${DARK} 100%)`,
        padding: "130px 64px 110px", textAlign: "center",
        minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center",
      }} className="px">
        {/* Marca de agua — isotipo animado */}
        <svg viewBox="0 0 1001.01 1001.01" aria-hidden="true" style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(900px, 88vw)", height: "auto", opacity: .1, pointerEvents: "none",
        }}>
          <IsotipoLines stroke={PLATA} animated />
        </svg>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
          data-animate>
          <div style={{ animation: "fadeUp .9s ease both" }}>
            <Eyebrow>ADMINISTRATIVO · FISCAL · ADUANERO</Eyebrow>
          </div>
          <h1 className="hero-h1" style={{
            fontFamily: SERIF, fontWeight: 400, fontSize: 96, lineHeight: 1.1,
            color: MARFIL, maxWidth: 980, margin: "40px 0 0",
            animation: "fadeUp .9s ease .15s both",
          }}>
            Criterio frente a la autoridad.
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 18, lineHeight: 1.7, fontWeight: 300,
            color: MUTED, maxWidth: 620, margin: "34px 0 0",
            animation: "fadeUp .9s ease .3s both",
          }}>
            Firma legal dedicada al derecho administrativo, fiscal y aduanero. Estudio serio de cada asunto, atención directa del abogado titular y comunicación sin rodeos.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 52, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .9s ease .45s both" }}>
            <span className="btn-solid" onClick={() => scrollTo("contacto")}>AGENDAR CONSULTA</span>
            <span className="btn-outline" onClick={() => scrollTo("areas")}>VER ÁREAS ↓</span>
          </div>
        </div>
      </section>

      {/* ── ÁREAS DE PRÁCTICA ──────────────────────────────────────────── */}
      <section id="areas" style={{ background: DARK, padding: "100px 64px" }} className="px">
        <FadeIn>
          <Eyebrow>ÁREAS DE PRÁCTICA</Eyebrow>
        </FadeIn>
        <div style={{ marginTop: 40, borderTop: `1px solid rgba(164,171,179,.22)` }}>
          {areas.map((a, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="area-row">
                <span style={{ fontFamily: SERIF, fontSize: 48, color: PIZARRA, lineHeight: 1 }}>{a.num}</span>
                <div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 34, color: MARFIL, marginBottom: 10 }}>{a.title}</h3>
                  <p style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.65, color: PLATA }}>{a.desc}</p>
                </div>
                <span className="area-arrow" style={{ fontFamily: SERIF, fontSize: 32, color: PIZARRA, textAlign: "right" }}>→</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── LA FIRMA ───────────────────────────────────────────────────── */}
      <section id="firma" style={{ background: MARFIL, color: DARK, padding: "110px 64px" }} className="px">
        <FadeIn>
          <h2 style={{
            fontFamily: SERIF, fontWeight: 400, fontSize: 52, lineHeight: 1.2,
            textAlign: "center", maxWidth: 900, margin: "0 auto",
          }}>
            La firma se sostiene sobre tres principios.
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="principios-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 72,
            borderTop: `1px solid rgba(22,24,29,.14)`, borderBottom: `1px solid rgba(22,24,29,.14)`,
          }}>
            {principios.map((p, i) => (
              <div key={i} className="principio-col" style={{
                padding: "48px 44px",
                borderRight: i < 2 ? `1px solid rgba(22,24,29,.14)` : "none",
                display: "flex", flexDirection: "column", gap: 16,
                transition: "background .35s",
              }}>
                <span style={{ fontFamily: SERIF, fontSize: 30, color: PIZARRA }}>{p.num}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 3, fontWeight: 600 }}>{p.titulo}</span>
                <span style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.7, color: PIZARRA }}>{p.desc}</span>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 48, marginTop: 72 }} className="firma-sobre">
            <div style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 4, color: PIZARRA, paddingTop: 10 }}>LA FIRMA</div>
            <div>
              <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 42, lineHeight: 1.25, maxWidth: 820 }}>
                Una firma deliberadamente pequeña. Cada asunto lo estudia, lo decide y lo firma la misma persona.
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginTop: 40 }}>
                <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.75, color: PIZARRA }}>
                  Tinoco es una firma legal dedicada al derecho administrativo, fiscal y aduanero. Trabajamos con un principio simple: ningún asunto se delega, se estandariza ni se resuelve con fórmulas. Cada expediente recibe un estudio propio y una estrategia a su medida.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.75, color: PIZARRA }}>
                  Eso permite algo que las estructuras grandes difícilmente ofrecen: interlocución directa con el abogado que lleva el caso, tiempos de respuesta cortos y criterios consistentes de principio a fin.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── PUBLICACIONES ──────────────────────────────────────────────── */}
      <section id="publicaciones" style={{
        background: `linear-gradient(150deg, ${DARK} 0%, ${AZUL} 100%)`,
        padding: "110px 64px",
      }} className="px">
        <FadeIn>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <Eyebrow>PUBLICACIONES</Eyebrow>
            <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 2.5, color: MARFIL, cursor: "pointer", borderBottom: `1px solid rgba(164,171,179,.5)`, paddingBottom: 5 }}>
              VER TODAS →
            </span>
          </div>
        </FadeIn>
        <div style={{ marginTop: 44, borderTop: `1px solid rgba(164,171,179,.22)` }}>
          {publicaciones.map((p, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <a href="#publicaciones" className="pub-row">
                <span className="pub-cat" style={{ fontFamily: SANS, fontSize: 11, letterSpacing: 2.5, color: PLATA }}>{p.cat}</span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 30, lineHeight: 1.25 }}>{p.titulo}</h3>
                <span className="pub-extr" style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: PLATA }}>{p.extracto}</span>
                <span className="pub-arrow" style={{ fontFamily: SERIF, fontSize: 28, color: PIZARRA, textAlign: "right" }}>→</span>
              </a>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CONTACTO ───────────────────────────────────────────────────── */}
      <section id="contacto" style={{ background: MARFIL, color: DARK, padding: "110px 64px" }} className="px">
        <div className="contacto-grid" style={{ display: "grid", gap: 72, alignItems: "start", maxWidth: 1200, margin: "0 auto" }}>
          {/* Columna izquierda — info */}
          <FadeIn>
            <div>
              <Eyebrow light>CONTACTO</Eyebrow>
              <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 56, lineHeight: 1.15, margin: "26px 0 0" }}>
                Hablemos de su caso.
              </h2>
              <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.7, color: PIZARRA, margin: "24px 0 0", maxWidth: 440 }}>
                Una consulta inicial basta para saber si podemos ayudarle y cuál sería la ruta. Toda comunicación es confidencial.
              </p>
              <div style={{ borderTop: `1px solid rgba(22,24,29,.16)`, marginTop: 40 }}>
                <ContactRow label="TELÉFONO" value="462 252 8399" href="tel:+524622528399" />
                <ContactRow label="CORREO" value="contacto@tinoco.legal" href="mailto:contacto@tinoco.legal" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "26px 4px", borderBottom: `1px solid rgba(22,24,29,.16)` }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: 3, color: PIZARRA }}>HORARIO</span>
                  <span style={{ fontFamily: SERIF, fontSize: 24 }}>Lun – Vie · 9:00 – 18:00</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Columna derecha — formulario */}
          <FadeIn delay={0.15}>
            {formStatus === "success" ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontFamily: SERIF, fontSize: 48, color: PIZARRA, marginBottom: 16 }}>✓</div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 32, marginBottom: 12 }}>Mensaje recibido.</h3>
                <p style={{ fontFamily: SANS, fontSize: 16, color: PIZARRA, lineHeight: 1.7 }}>Le contactaremos a la brevedad. Toda comunicación es confidencial.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 28, marginBottom: 28 }}>Envíenos un mensaje</h3>
                {[
                  { label: "NOMBRE", key: "nombre", type: "text", ph: "Su nombre", req: true },
                  { label: "CORREO", key: "email",  type: "email", ph: "correo@ejemplo.com", req: true },
                  { label: "TELÉFONO", key: "telefono", type: "tel", ph: "+52 462 ...", req: false },
                  { label: "ASUNTO", key: "asunto", type: "text", ph: "¿En qué podemos ayudarle?", req: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontFamily: SANS, fontSize: 10, letterSpacing: 2.5, color: PIZARRA, marginBottom: 6 }}>{f.label}</label>
                    <input
                      className="inp"
                      type={f.type}
                      required={f.req}
                      placeholder={f.ph}
                      value={contactForm[f.key]}
                      onChange={e => setContactForm({ ...contactForm, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontFamily: SANS, fontSize: 10, letterSpacing: 2.5, color: PIZARRA, marginBottom: 6 }}>MENSAJE</label>
                  <textarea
                    className="inp"
                    required
                    rows={4}
                    placeholder="Describa su situación..."
                    value={contactForm.mensaje}
                    onChange={e => setContactForm({ ...contactForm, mensaje: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>
                {formStatus === "error" && (
                  <p style={{ fontFamily: SANS, fontSize: 13, color: "#B94A4A", marginBottom: 16 }}>
                    Hubo un problema. Intente de nuevo o escríbanos directamente a contacto@tinoco.legal
                  </p>
                )}
                <button
                  type="submit"
                  disabled={formStatus === "sending"}
                  style={{
                    width: "100%", padding: "16px", background: DARK, color: MARFIL,
                    border: "none", fontFamily: SANS, fontSize: 13, letterSpacing: 2.5,
                    cursor: formStatus === "sending" ? "wait" : "pointer",
                    opacity: formStatus === "sending" ? .7 : 1,
                    transition: "background .3s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = AZUL}
                  onMouseLeave={e => e.currentTarget.style.background = DARK}
                >
                  {formStatus === "sending" ? "ENVIANDO..." : "ENVIAR MENSAJE"}
                </button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{
        background: NEGRO, borderTop: `1px solid rgba(164,171,179,.12)`,
        padding: "32px 64px",
      }} className="px">
        <div className="footer-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg viewBox="0 0 1001.01 1001.01" width="24" height="24" aria-hidden="true">
              <IsotipoLines stroke={PLATA} />
            </svg>
            <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 2, color: MUTED2 }}>© MMXXVI TINOCO · FIRMA LEGAL</span>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 2, color: MUTED2, cursor: "pointer" }}>AVISO DE PRIVACIDAD</span>
            <span style={{ fontFamily: SANS, fontSize: 12, letterSpacing: 2, color: MUTED2 }}>TINOCO.LEGAL</span>
          </div>
        </div>
      </footer>
    </>
  );
}
