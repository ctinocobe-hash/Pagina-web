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
      {/* ── CSS global ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes draw    { to { stroke-dashoffset: 0; } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @media (prefers-reduced-motion:reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }

        /* ── Sistema de padding horizontal ─────────────────────────── */
        /* Aplicar siempre a: header, sections, footer.
           Los paddings verticales van en el inline style de cada elemento. */
        .px { padding-left: 64px; padding-right: 64px; }

        /* ── Tipografía responsive ──────────────────────────────────── */
        .hero-h1    { font-family:${SERIF}; font-weight:400; font-size:96px; line-height:1.1; color:${MARFIL}; width:min(980px,100%); margin:40px 0 0; overflow-wrap:break-word; }
        .hero-eyebrow { font-family:${SANS}; font-size:12px; letter-spacing:4px; color:${PLATA}; }
        .hero-p     { font-family:${SANS}; font-size:18px; line-height:1.7; font-weight:300; color:${MUTED}; width:min(620px,100%); margin:34px 0 0; }
        .hero-btns  { display:flex; gap:20px; margin-top:84px; flex-wrap:wrap; justify-content:center; }

        /* ── Titulares de sección ───────────────────────────────────── */
        .firma-main-h2    { font-family:${SERIF}; font-weight:400; font-size:52px; line-height:1.2; text-align:center; max-width:900px; margin:0 auto; color:${DARK}; }
        .contacto-info-h2 { font-family:${SERIF}; font-weight:400; font-size:56px; line-height:1.15; margin:26px 0 0; color:${DARK}; }

        /* ── Botones ────────────────────────────────────────────────── */
        .btn-border  { font-family:${SANS}; font-size:12px; letter-spacing:2.5px; color:${MARFIL}; text-decoration:none; border:1px solid rgba(164,171,179,.55); padding:14px 26px; transition:background .35s, color .35s; cursor:pointer; background:transparent; display:inline-block; }
        .btn-border:hover  { background:${MARFIL}; color:${DARK}; }
        .btn-solid   { font-family:${SANS}; font-size:13px; letter-spacing:2.5px; color:${AZUL}; background:${MARFIL}; text-decoration:none; padding:18px 36px; display:inline-block; transition:background .35s; cursor:pointer; border:none; text-align:center; }
        .btn-solid:hover   { background:#DCDAD3; }
        .btn-outline { font-family:${SANS}; font-size:13px; letter-spacing:2.5px; color:${MARFIL}; border:1px solid rgba(164,171,179,.55); text-decoration:none; padding:18px 36px; display:inline-block; transition:background .35s, color .35s; cursor:pointer; background:transparent; text-align:center; }
        .btn-outline:hover { background:${MARFIL}; color:${DARK}; }

        /* ── Nav ────────────────────────────────────────────────────── */
        .nav-a { font-family:${SANS}; font-size:12px; letter-spacing:2.5px; color:${MARFIL}; text-decoration:none; cursor:pointer; transition:color .3s; white-space:nowrap; }
        .nav-a:hover { color:${PLATA}; }

        /* ── Áreas ──────────────────────────────────────────────────── */
        .area-row { display:grid; grid-template-columns:120px 1fr 48px; gap:32px; align-items:center; padding:44px 0; border-bottom:1px solid rgba(164,171,179,.22); transition:background .35s, padding-left .3s; }
        .area-row:hover { background:rgba(36,67,90,.35); padding-left:12px; }
        .area-num   { font-family:${SERIF}; font-size:48px; color:${PIZARRA}; line-height:1; }
        .area-title { font-family:${SERIF}; font-weight:400; font-size:34px; color:${MARFIL}; margin-bottom:10px; }
        .area-desc  { font-family:${SANS}; font-size:15.5px; line-height:1.65; color:${PLATA}; }
        .area-arrow { font-family:${SERIF}; font-size:30px; color:${PIZARRA}; text-align:right; }

        /* ── Principios ─────────────────────────────────────────────── */
        .principios-grid { display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid rgba(22,24,29,.14); border-bottom:1px solid rgba(22,24,29,.14); }
        .principio-col { padding:48px 44px; display:flex; flex-direction:column; gap:16px; transition:background .35s; }
        .principio-col:not(:last-child) { border-right:1px solid rgba(22,24,29,.14); }
        .principio-num   { font-family:${SERIF}; font-size:30px; color:${PIZARRA}; }
        .principio-titulo{ font-family:${SANS}; font-size:12px; letter-spacing:3px; font-weight:600; color:${DARK}; }
        .principio-desc  { font-family:${SANS}; font-size:15.5px; line-height:1.7; color:${PIZARRA}; }

        /* ── La Firma: bloque "sobre" ───────────────────────────────── */
        .firma-sobre { display:grid; grid-template-columns:280px 1fr; gap:48px; margin-top:72px; }
        .firma-label { font-family:${SANS}; font-size:12px; letter-spacing:4px; color:${PIZARRA}; padding-top:10px; }
        .firma-h3    { font-family:${SERIF}; font-weight:400; font-size:42px; line-height:1.25; max-width:820px; color:${DARK}; }
        .firma-cols  { display:grid; grid-template-columns:1fr 1fr; gap:48px; margin-top:40px; }
        .firma-p     { font-family:${SANS}; font-size:16px; line-height:1.75; color:${PIZARRA}; }

        /* ── Publicaciones ──────────────────────────────────────────── */
        .pub-row { display:grid; grid-template-columns:160px 1fr 280px 48px; gap:32px; align-items:baseline; padding:38px 0; border-bottom:1px solid rgba(164,171,179,.22); text-decoration:none; color:${MARFIL}; transition:background .35s, padding-left .3s; }
        .pub-row:hover { background:rgba(36,67,90,.4); padding-left:12px; }
        .pub-cat   { font-family:${SANS}; font-size:11px; letter-spacing:2.5px; color:${PLATA}; }
        .pub-titulo{ font-family:${SERIF}; font-weight:400; font-size:28px; line-height:1.25; }
        .pub-extr  { font-family:${SANS}; font-size:14.5px; line-height:1.6; color:${PLATA}; }
        .pub-arrow { font-family:${SERIF}; font-size:26px; color:${PIZARRA}; text-align:right; }

        /* ── Contacto ───────────────────────────────────────────────── */
        .contacto-grid { display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:start; max-width:1200px; margin:0 auto; }
        .contact-row { display:flex; justify-content:space-between; align-items:baseline; padding:26px 4px; border-bottom:1px solid rgba(22,24,29,.16); text-decoration:none; color:${DARK}; transition:background .3s; }
        .contact-row:hover { background:rgba(22,24,29,.04); }
        .contact-row-label { font-family:${SANS}; font-size:11px; letter-spacing:3px; color:${PIZARRA}; }
        .contact-row-value { font-family:${SERIF}; font-size:24px; }
        .inp { width:100%; padding:12px 14px; background:rgba(22,24,29,.06); border:1px solid rgba(22,24,29,.16); color:${DARK}; font-family:${SANS}; font-size:14px; outline:none; transition:border-color .3s; box-sizing:border-box; }
        .inp:focus { border-color:${PIZARRA}; }
        .inp::placeholder { color:${PIZARRA}; opacity:.55; }
        .form-label { display:block; font-family:${SANS}; font-size:10px; letter-spacing:2.5px; color:${PIZARRA}; margin-bottom:6px; }
        .form-field { margin-bottom:16px; }
        .btn-submit { width:100%; padding:16px; background:${DARK}; color:${MARFIL}; border:none; font-family:${SANS}; font-size:13px; letter-spacing:2.5px; cursor:pointer; transition:background .3s; }
        .btn-submit:hover { background:${AZUL}; }
        .btn-submit:disabled { opacity:.7; cursor:wait; }

        /* ── Footer ─────────────────────────────────────────────────── */
        .footer-inner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }

        /* ═══════════════════════════════════════════════════════════════
           MOBILE  ≤ 768px
        ════════════════════════════════════════════════════════════════*/
        @media (max-width: 768px) {
          /* Padding horizontal reducido */
          .px { padding-left: 20px; padding-right: 20px; }

          /* Nav */
          .hide-mobile { display:none !important; }
          .show-mobile { display:flex !important; }

          /* Logo */
          .header-logo { height:36px !important; }

          /* Hero — push content to top; min-height asegura que la marca de agua (351px en móvil) quede visible */
          #inicio { align-items:flex-start !important; min-height:520px !important; padding-top:80px !important; padding-bottom:88px !important; }
          /* Isotipo un poco más arriba en móvil (escritorio se queda en top:42%) */
          .hero-watermark { top:34% !important; }
          .hero-h1 { font-size:38px !important; margin:22px 0 0 !important; max-width:calc(100vw - 40px) !important; overflow-wrap:break-word !important; word-break:break-word !important; line-height:1.15 !important; }
          .hero-eyebrow { font-size:10px !important; letter-spacing:2px !important; }
          .hero-p  { font-size:16px !important; margin:20px 0 0 !important; max-width:calc(100vw - 40px) !important; }
          .hero-btns { flex-direction:column !important; align-items:stretch !important; margin-top:56px !important; gap:12px !important; width:calc(100vw - 40px) !important; max-width:360px !important; }
          .hero-btns > * { padding:16px 20px !important; text-align:center !important; width:100% !important; box-sizing:border-box !important; }

          /* Titulares de sección */
          .firma-main-h2    { font-size:28px !important; }
          .contacto-info-h2 { font-size:34px !important; margin:18px 0 0 !important; }

          /* Áreas */
          .area-row { grid-template-columns:52px 1fr !important; gap:16px !important; padding:32px 0 !important; }
          .area-num   { font-size:34px !important; }
          .area-title { font-size:24px !important; margin-bottom:8px !important; }
          .area-desc  { font-size:14px !important; }
          .area-arrow { display:none !important; }

          /* Principios */
          .principios-grid { grid-template-columns:1fr !important; }
          .principio-col { padding:32px 24px !important; border-right:none !important; border-bottom:1px solid rgba(22,24,29,.14) !important; }
          .principio-col:last-child { border-bottom:none !important; }

          /* La Firma */
          .firma-sobre { grid-template-columns:1fr !important; gap:24px !important; margin-top:48px !important; }
          .firma-label { padding-top:0 !important; }
          .firma-h3    { font-size:30px !important; }
          .firma-cols  { grid-template-columns:1fr !important; gap:20px !important; margin-top:24px !important; }
          .firma-p     { font-size:15px !important; }

          /* Publicaciones */
          .pub-row   { grid-template-columns:1fr !important; gap:10px !important; padding:28px 0 !important; }
          .pub-cat   { font-size:10px !important; }
          .pub-titulo{ font-size:22px !important; }
          .pub-extr  { display:none !important; }
          .pub-arrow { display:none !important; }

          /* Contacto */
          .contacto-grid { grid-template-columns:1fr !important; gap:48px !important; }
          .contact-row-value { font-size:18px !important; }

          /* Footer */
          .footer-inner { flex-direction:column !important; align-items:flex-start !important; }
        }

        @media (min-width: 769px) {
          .show-mobile { display:none !important; }
        }
      `}</style>

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
            Firma legal dedicada al derecho administrativo, fiscal y aduanero. Estudio serio de cada asunto, atención directa del abogado titular y comunicación sin rodeos.
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
                  <div className="area-title">{a.title}</div>
                  <div className="area-desc">{a.desc}</div>
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
            <span style={{ fontFamily:SANS, fontSize:12, letterSpacing:2, color:MUTED2, cursor:"pointer" }}>AVISO DE PRIVACIDAD</span>
            <span style={{ fontFamily:SANS, fontSize:12, letterSpacing:2, color:MUTED2 }}>TINOCO.LEGAL</span>
          </div>
        </div>
      </footer>
    </>
  );
}
