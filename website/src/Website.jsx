import { useState, useEffect, useRef } from "react";
// Paleta de marca TINOCO (Manual de Identidad 2026)
const BG = "#16181D";        // Carbón Nocturno — fondo dominante
const SURFACE = "#1C1F26";   // Superficie elevada sobre el carbón
const GOLD = "#1D3647";      // Azul Profundo — acento/secundario (antes dorado)
const ACCENT = "#A4ABB3";    // Gris Plata — líneas, detalles sutiles
const SLATE = "#485769";     // Pizarra — soporte
const TEXT = "#F3F2EF";      // Marfil Cálido — texto claro
const MUTED = "#A4ABB3";     // Gris Plata — texto secundario
const MUTED2 = "#6B7480";    // Pizarra atenuada — metadata
const GRAD_HERO = `linear-gradient(135deg, ${BG} 0%, ${GOLD} 100%)`; // Carbón → Azul profundo
const FT = "'Cormorant Garamond', serif";
const FB = "'Cormorant Garamond', serif";
const FU = "'DM Sans', sans-serif";

const LogoIcon = ({ size = 28 }) => (
  <img src="/logo/isotipo.svg" alt="TINOCO" width={size} height={size} style={{ display: "block" }} />
);

const LogoHorizontal = ({ textColor = TEXT, mutedColor = MUTED, size = 30 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.38 }}>
    <LogoIcon size={size} />
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FT, fontSize: size * 0.74, fontWeight: 500, color: textColor, letterSpacing: size * 0.22, lineHeight: 1 }}>TINOCO</div>
      <div style={{ fontFamily: FU, fontSize: size * 0.26, fontWeight: 500, color: mutedColor, letterSpacing: size * 0.16, textTransform: "uppercase", marginTop: 2 }}>FIRMA LEGAL</div>
    </div>
  </div>
);

const SectionDivider = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 14 }}>
    <div style={{ width: 50, height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
    <LogoIcon size={16} />
    <div style={{ width: 50, height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
  </div>
);

const FadeIn = ({ children, delay = 0, style = {} }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`, ...style }}>{children}</div>
  );
};

export default function Website() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
  const [activeService, setActiveService] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [formStatus, setFormStatus] = useState("idle"); // idle | sending | success | error

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (formStatus === "sending") return;
    setFormStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/mjgqydry", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombre: contactForm.nombre,
          email: contactForm.email,
          telefono: contactForm.telefono,
          asunto: contactForm.asunto,
          mensaje: contactForm.mensaje,
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

  const services = [
    { title: "Administrativo", icon: "§", short: "Defensa frente a actos de autoridad", description: "Defendemos tus derechos frente a resoluciones arbitrarias de la administración pública. Representamos a particulares y empresas ante el Tribunal Federal de Justicia Administrativa, impugnando multas, clausuras, revocaciones de permisos, negativas de licencias y cualquier acto que vulnere tus derechos como gobernado.", items: ["Juicio contencioso administrativo", "Recursos de revisión", "Impugnación de multas y sanciones", "Negativas fictas y afirmativas fictas", "Responsabilidad patrimonial del Estado"] },
    { title: "Fiscal", icon: "⚖", short: "Estrategia y defensa tributaria", description: "Protegemos tu patrimonio ante actos de la autoridad fiscal. Diseñamos estrategias de defensa frente a créditos fiscales, determinaciones del SAT y facultades de comprobación, además de brindar asesoría preventiva en el cumplimiento de tus obligaciones tributarias.", items: ["Juicio de nulidad fiscal", "Defensa en auditorías y revisiones del SAT", "Impugnación de créditos fiscales", "Devoluciones y compensaciones", "Recurso de revocación"] },
    { title: "Aduanero", icon: "◆", short: "Comercio exterior y aduanas", description: "Asesoramos a importadores, exportadores y agentes aduanales en el cumplimiento de la normatividad de comercio exterior. Defendemos frente a procedimientos administrativos en materia aduanera (PAMA), embargos de mercancía y determinaciones de la autoridad.", items: ["Procedimiento Administrativo en Materia Aduanera (PAMA)", "Embargo precautorio de mercancías", "Clasificación arancelaria y valoración", "Regularización de mercancía", "Defensa ante el SAT y aduanas"] },
  ];

  const blogPosts = [
    { title: "¿Qué hacer cuando la autoridad niega tu licencia?", category: "Administrativo", date: "Próximamente", excerpt: "Conoce los recursos legales disponibles cuando la autoridad administrativa niega, revoca o condiciona permisos de manera arbitraria." },
    { title: "¿Qué hacer cuando el SAT determina un crédito fiscal?", category: "Fiscal", date: "Próximamente", excerpt: "Conoce los medios de defensa para impugnar créditos fiscales, determinaciones y multas de la autoridad tributaria antes de que queden firmes." },
    { title: "Embargo de mercancía en la aduana: tus opciones legales", category: "Aduanero", date: "Próximamente", excerpt: "Te explicamos el Procedimiento Administrativo en Materia Aduanera (PAMA) y cómo defender tu mercancía ante un embargo precautorio." },
  ];

  const navItems = ["Inicio", "Servicios", "Nosotros", "Blog", "Contacto"];

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { background: ${BG}; color: ${TEXT}; font-family: ${FU}; overflow-x: hidden; width: 100%; }
        ::selection { background: ${TEXT}; color: ${BG}; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        .nav-link { position: relative; cursor: pointer; transition: color 0.3s; }
        .nav-link:hover { color: ${TEXT} !important; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: ${ACCENT}; transition: width 0.3s; }
        .nav-link:hover::after { width: 100%; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-3px); border-color: rgba(164,171,179,0.35) !important; }
        .btn-p { transition: all 0.3s; cursor: pointer; }
        .btn-p:hover { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .btn-o { transition: all 0.3s; cursor: pointer; }
        .btn-o:hover { background: rgba(164,171,179,0.1) !important; }
        .inp:focus { border-color: ${ACCENT} !important; outline: none; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .logo-nav { transform: scale(0.7); }
          .hero-t { font-size: 40px !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .svc-detail { grid-template-columns: 1fr !important; }
          .footer-g { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .px-main { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
      <div style={{ background: BG, minHeight: "100vh", overflowX: "hidden", width: "100%" }}>

        {/* NAVBAR */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          background: scrolled ? "rgba(22,24,29,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(164,171,179,0.1)" : "none",
          transition: "all 0.4s", padding: "0 24px", height: 84,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div className="logo-nav" style={{ cursor: "pointer", transformOrigin: "left center" }} onClick={() => scrollTo("inicio")}>
            <LogoHorizontal size={42} />
          </div>
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {navItems.map(item => (
              <span key={item} className="nav-link" onClick={() => scrollTo(item.toLowerCase())} style={{ fontFamily: FU, fontSize: 15, color: MUTED, letterSpacing: 0.5 }}>{item}</span>
            ))}
          </div>
          <button className="show-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{
            display: "none", background: "none", border: "none", cursor: "pointer",
            flexDirection: "column", gap: 5, padding: 8,
          }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 20, height: 2, background: ACCENT, borderRadius: 1, transition: "all 0.3s", transform: menuOpen ? (i===0?"rotate(45deg) translate(5px,5px)":i===2?"rotate(-45deg) translate(5px,-5px)":"scale(0)") : "none" }} />)}
          </button>
          {menuOpen && <div style={{ position: "absolute", top: 84, left: 0, right: 0, background: "rgba(22,24,29,0.98)", backdropFilter: "blur(20px)", padding: "16px 24px", borderBottom: "1px solid rgba(164,171,179,0.1)" }}>
            {navItems.map(item => (
              <div key={item} onClick={() => scrollTo(item.toLowerCase())} style={{ padding: "14px 0", fontFamily: FU, fontSize: 16, color: MUTED, cursor: "pointer", borderBottom: "1px solid rgba(164,171,179,0.06)" }}>{item}</div>
            ))}
          </div>}
        </nav>

        {/* HERO */}
        <section id="inicio" style={{
          minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "100px 20px 60px", position: "relative", overflow: "hidden",
          backgroundImage: "url('/img/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center",
        }}>
          {/* Capa de color (overlay azul profundo que tiñe la imagen) */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(22,24,29,0.74) 0%, rgba(29,54,71,0.68) 100%)`, mixBlendMode: "multiply" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(22,24,29,0.45) 0%, rgba(22,24,29,0.2) 50%, rgba(22,24,29,0.6) 100%)` }} />
          {/* Textura de líneas sutiles encima del overlay */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(243,242,239,0.3) 80px, rgba(243,242,239,0.3) 81px)" }} />
          <FadeIn style={{ position: "relative", zIndex: 1 }}>
            <div style={{ animation: "float 6s ease-in-out infinite" }}><LogoIcon size={104} /></div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="hero-t" style={{ fontFamily: FT, fontSize: 64, fontWeight: 400, color: TEXT, letterSpacing: 1, lineHeight: 1.15, marginTop: 36, maxWidth: 720, position: "relative" }}>
              Defensa legal con experiencia y compromiso
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p style={{ fontFamily: FU, fontSize: 15, color: MUTED, lineHeight: 1.8, maxWidth: 460, marginTop: 22, position: "relative" }}>
              Más de una década protegiendo los derechos de nuestros clientes en materia administrativa, fiscal y aduanera.
            </p>
          </FadeIn>
          <FadeIn delay={0.6}>
            <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
              <button className="btn-p" onClick={() => scrollTo("contacto")} style={{ padding: "13px 28px", background: TEXT, color: BG, border: "none", borderRadius: 8, fontFamily: FU, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>Solicitar asesoría</button>
              <button className="btn-o" onClick={() => scrollTo("servicios")} style={{ padding: "13px 28px", background: "transparent", color: TEXT, border: "1px solid rgba(243,242,239,0.25)", borderRadius: 8, fontFamily: FU, fontSize: 13 }}>Conocer servicios</button>
            </div>
          </FadeIn>
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.25 }}>
            <div style={{ fontFamily: FU, fontSize: 9, letterSpacing: 2, color: MUTED }}>SCROLL</div>
            <div style={{ width: 1, height: 24, background: `linear-gradient(to bottom, ${MUTED}, transparent)` }} />
          </div>
        </section>

        <SectionDivider />

        {/* SERVICIOS */}
        <section id="servicios" className="px-main" style={{ padding: "0 24px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: 4, color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>Nuestros servicios</div>
                <h2 style={{ fontFamily: FT, fontSize: 34, fontWeight: 600, color: TEXT }}>Áreas de práctica</h2>
                <p style={{ fontFamily: FB, fontSize: 14, color: MUTED, marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>Cada caso recibe atención personalizada y una estrategia diseñada para los mejores resultados.</p>
              </div>
            </FadeIn>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
              {services.map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="card-hover" onClick={() => setActiveService(i)} style={{
                    background: activeService === i ? "rgba(164,171,179,0.06)" : SURFACE,
                    border: `1px solid ${activeService === i ? "rgba(164,171,179,0.25)" : "rgba(255,255,255,0.04)"}`,
                    borderRadius: 14, padding: "24px 16px", textAlign: "center", cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 10, opacity: activeService === i ? 1 : 0.5 }}>{s.icon}</div>
                    <div style={{ fontFamily: FT, fontSize: 14, fontWeight: 600, color: activeService === i ? TEXT : MUTED, lineHeight: 1.3 }}>{s.title}</div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>{s.short}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
            <FadeIn>
              <div className="svc-detail" style={{ background: SURFACE, borderRadius: 18, padding: "32px 28px", border: "1px solid rgba(164,171,179,0.08)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{services[activeService].icon}</div>
                  <h3 style={{ fontFamily: FT, fontSize: 24, fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>{services[activeService].title}</h3>
                  <p style={{ fontFamily: FB, fontSize: 13, color: MUTED, lineHeight: 1.8, marginTop: 14 }}>{services[activeService].description}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: 2, color: ACCENT, textTransform: "uppercase", marginBottom: 14 }}>Servicios incluidos</div>
                  {services[activeService].items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(164,171,179,0.06)" }}>
                      <div style={{ width: 5, height: 5, borderRadius: 3, background: ACCENT, flexShrink: 0 }} />
                      <span style={{ fontFamily: FB, fontSize: 12, color: TEXT }}>{item}</span>
                    </div>
                  ))}
                  <button className="btn-p" onClick={() => scrollTo("contacto")} style={{ marginTop: 20, padding: "11px 22px", background: TEXT, color: BG, border: "none", borderRadius: 8, fontFamily: FB, fontSize: 12, fontWeight: 600, alignSelf: "flex-start" }}>Solicitar consulta</button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <SectionDivider />

        {/* NOSOTROS */}
        <section id="nosotros" className="px-main" style={{ padding: "0 24px 60px" }}>
          <div style={{ maxWidth: 750, margin: "0 auto", textAlign: "center" }}>
            <FadeIn>
              <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: 4, color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>Sobre nosotros</div>
              <h2 style={{ fontFamily: FT, fontSize: 34, fontWeight: 600, color: TEXT }}>Compromiso con la justicia</h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p style={{ fontFamily: FB, fontSize: 15, color: MUTED, lineHeight: 1.9, marginTop: 24 }}>
                En TINOCO firma legal creemos que el acceso a una defensa jurídica competente y comprometida es un derecho fundamental. Nos dedicamos a proteger los intereses de nuestros clientes con rigor técnico, ética profesional y comunicación transparente.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p style={{ fontFamily: FB, fontSize: 15, color: MUTED, lineHeight: 1.9, marginTop: 16 }}>
                Operamos en Guanajuato, ante el Tribunal Federal de Justicia Administrativa, autoridades fiscales y aduaneras y tribunales federales. Cada caso recibe un análisis profundo y una estrategia personalizada.
              </p>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 40 }}>
                {[
                  { title: "Rigor técnico", desc: "Análisis exhaustivo con fundamentos jurídicos sólidos y actualizados." },
                  { title: "Transparencia", desc: "Comunicación clara y constante sobre el avance de tu asunto." },
                  { title: "Compromiso", desc: "Cada caso recibe la dedicación y urgencia que merece." },
                ].map((v, i) => (
                  <div key={i} style={{ padding: "28px 18px", background: SURFACE, borderRadius: 14, border: "1px solid rgba(164,171,179,0.06)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: ACCENT, margin: "0 auto 14px" }} />
                    <div style={{ fontFamily: FT, fontSize: 17, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{v.title}</div>
                    <div style={{ fontFamily: FB, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{v.desc}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        <SectionDivider />

        {/* BLOG */}
        <section id="blog" className="px-main" style={{ padding: "0 24px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: 4, color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>Blog jurídico</div>
                <h2 style={{ fontFamily: FT, fontSize: 34, fontWeight: 600, color: TEXT }}>Artículos y análisis</h2>
              </div>
            </FadeIn>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {blogPosts.map((post, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="card-hover" style={{ background: SURFACE, borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontFamily: FU, fontSize: 10, color: ACCENT, letterSpacing: 1, textTransform: "uppercase" }}>{post.category}</span>
                      <span style={{ fontFamily: FB, fontSize: 10, color: MUTED2 }}>{post.date}</span>
                    </div>
                    <h3 style={{ fontFamily: FT, fontSize: 18, fontWeight: 600, color: TEXT, lineHeight: 1.3, marginBottom: 12 }}>{post.title}</h3>
                    <p style={{ fontFamily: FB, fontSize: 12, color: MUTED, lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>
                    <div style={{ marginTop: 16, fontFamily: FB, fontSize: 11, color: ACCENT }}>Leer más →</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* CONTACTO */}
        <section id="contacto" className="px-main" style={{ padding: "0 24px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: 4, color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>Contacto</div>
                <h2 style={{ fontFamily: FT, fontSize: 34, fontWeight: 600, color: TEXT }}>Hablemos de tu caso</h2>
                <p style={{ fontFamily: FB, fontSize: 14, color: MUTED, marginTop: 10 }}>Primera consulta sin compromiso</p>
              </div>
            </FadeIn>
            <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <FadeIn>
                <div style={{ background: SURFACE, borderRadius: 18, padding: 28, border: "1px solid rgba(164,171,179,0.08)" }}>
                  <div style={{ fontFamily: FT, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 20 }}>Envíanos un mensaje</div>
                  {formStatus === "success" ? (
                    <div style={{ textAlign: "center", padding: "32px 8px" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                      <div style={{ fontFamily: FT, fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 8 }}>¡Gracias por escribirnos!</div>
                      <div style={{ fontFamily: FB, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>Hemos recibido tu mensaje. Te contactaremos a la brevedad.</div>
                    </div>
                  ) : (
                  <form onSubmit={handleSubmit}>
                  {[
                    { label: "Nombre", key: "nombre", type: "text", ph: "Tu nombre", required: true },
                    { label: "Correo", key: "email", type: "email", ph: "correo@ejemplo.com", required: true },
                    { label: "Teléfono", key: "telefono", type: "tel", ph: "+52 462...", required: false },
                    { label: "Asunto", key: "asunto", type: "text", ph: "¿En qué podemos ayudarte?", required: false },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: FU, fontSize: 9, letterSpacing: 1, color: MUTED, textTransform: "uppercase", marginBottom: 5 }}>{f.label}</label>
                      <input className="inp" type={f.type} required={f.required} placeholder={f.ph} value={contactForm[f.key]} onChange={e => setContactForm({...contactForm, [f.key]: e.target.value})} style={{ width: "100%", padding: "11px 12px", background: "rgba(164,171,179,0.04)", border: "1px solid rgba(164,171,179,0.12)", borderRadius: 8, color: TEXT, fontSize: 13, fontFamily: FB, boxSizing: "border-box", outline: "none" }} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontFamily: FU, fontSize: 9, letterSpacing: 1, color: MUTED, textTransform: "uppercase", marginBottom: 5 }}>Mensaje</label>
                    <textarea className="inp" required placeholder="Describe tu situación..." value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje: e.target.value})} rows={3} style={{ width: "100%", padding: "11px 12px", background: "rgba(164,171,179,0.04)", border: "1px solid rgba(164,171,179,0.12)", borderRadius: 8, color: TEXT, fontSize: 13, fontFamily: FB, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  {formStatus === "error" && (
                    <div style={{ fontFamily: FB, fontSize: 12, color: "#E08A8A", marginBottom: 12, textAlign: "center" }}>Hubo un problema al enviar. Intenta de nuevo o escríbenos a contacto@tinoco.legal.</div>
                  )}
                  <button type="submit" disabled={formStatus === "sending"} className="btn-p" style={{ width: "100%", padding: "13px", background: TEXT, color: BG, border: "none", borderRadius: 8, fontFamily: FB, fontSize: 14, fontWeight: 600, cursor: formStatus === "sending" ? "wait" : "pointer", opacity: formStatus === "sending" ? 0.7 : 1 }}>{formStatus === "sending" ? "Enviando..." : "Enviar mensaje"}</button>
                  </form>
                  )}
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { icon: "💬", title: "WhatsApp", line1: "+52 462 252 8399", line2: "Respuesta en menos de 24h", color2: "#25D366" },
                    { icon: "✉️", title: "Correo electrónico", line1: "contacto@tinoco.legal", color1: ACCENT },
                    { icon: "📞", title: "Teléfono", line1: "+52 462 252 8399", line2: "Lun - Vie, 9:00 - 18:00" },
                  ].map((c, i) => (
                    <div key={i} style={{ background: SURFACE, borderRadius: 14, padding: 22, border: "1px solid rgba(164,171,179,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(164,171,179,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
                        <div>
                          <div style={{ fontFamily: FT, fontSize: 15, fontWeight: 600, color: TEXT }}>{c.title}</div>
                          <div style={{ fontFamily: FB, fontSize: 12, color: c.color1 || MUTED, marginTop: 2 }}>{c.line1}</div>
                          {c.line2 && <div style={{ fontFamily: FB, fontSize: 10, color: c.color2 || MUTED2, marginTop: 3 }}>{c.line2}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: SURFACE, borderRadius: 14, padding: 22, border: "1px solid rgba(164,171,179,0.06)" }}>
                    <div style={{ fontFamily: FT, fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 12 }}>Redes sociales</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {["Facebook", "Instagram", "LinkedIn"].map(s => (
                        <div key={s} style={{ padding: "7px 16px", borderRadius: 8, background: "rgba(164,171,179,0.05)", border: "1px solid rgba(164,171,179,0.1)", fontFamily: FB, fontSize: 11, color: MUTED, cursor: "pointer" }}>{s}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: SURFACE, borderTop: "1px solid rgba(164,171,179,0.08)", padding: "48px 24px 28px" }}>
          <div className="footer-g" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }}>
            <div>
              <LogoHorizontal size={24} />
              <p style={{ fontFamily: FB, fontSize: 12, color: MUTED, lineHeight: 1.7, maxWidth: 260, marginTop: 14 }}>Defensa legal con experiencia y compromiso en Guanajuato.</p>
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, letterSpacing: 2, color: ACCENT, textTransform: "uppercase", marginBottom: 14 }}>Servicios</div>
              {["Administrativo", "Fiscal", "Aduanero"].map(s => (
                <div key={s} style={{ fontFamily: FB, fontSize: 12, color: MUTED, padding: "5px 0" }}>{s}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, letterSpacing: 2, color: ACCENT, textTransform: "uppercase", marginBottom: 14 }}>Navegación</div>
              {["Inicio", "Servicios", "Nosotros", "Blog", "Contacto"].map(l => (
                <div key={l} onClick={() => scrollTo(l.toLowerCase())} style={{ fontFamily: FB, fontSize: 12, color: MUTED, padding: "5px 0", cursor: "pointer" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, letterSpacing: 2, color: ACCENT, textTransform: "uppercase", marginBottom: 14 }}>Contacto</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: MUTED, lineHeight: 2 }}>+52 462 252 8399<br/>contacto@tinoco.legal<br/>Irapuato, Guanajuato</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(164,171,179,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: FB, fontSize: 10, color: MUTED2 }}>© 2026 TINOCO firma legal. Todos los derechos reservados.</div>
            <div style={{ display: "flex", gap: 16 }}>
              {["Aviso de privacidad", "Términos"].map(l => (
                <span key={l} style={{ fontFamily: FB, fontSize: 10, color: MUTED2, cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
