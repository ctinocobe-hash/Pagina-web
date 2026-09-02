import { useState } from "react";
import { DARK, AZUL, DEEP, PIZARRA, PLATA, MARFIL, SERIF, SANS, IsotipoLines, FadeIn, ContactRow, Header, Footer, areas } from "./shared.jsx";

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Website() {
  const [formStatus, setFormStatus] = useState("idle");
  const [contactForm, setContactForm] = useState({ nombre:"", email:"", telefono:"", asunto:"", mensaje:"" });

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior:"smooth" }); };

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

  return (
    <>
      <Header isHome={true} />

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
            CIVIL · MERCANTIL · ADMINISTRATIVO · FISCAL · ADUANERO
          </div>
          <h1 className="hero-h1" style={{ animation:"fadeUp .9s ease .15s both" }}>
            Estrategia legal cuando más importa.
          </h1>
          <p className="hero-p" style={{ animation:"fadeUp .9s ease .3s both" }}>
            En Tinoco Firma Legal defendemos a personas y empresas en litigios civiles, mercantiles, administrativos, fiscales y aduaneros.
          </p>
          <div className="hero-btns" style={{ animation:"fadeUp .9s ease .45s both" }}>
            <span className="btn-solid" onClick={() => scrollTo("contacto")}>CUÉNTENOS SU CASO</span>
            <span className="btn-outline" onClick={() => scrollTo("areas")}>VER ÁREAS ↓</span>
          </div>
        </div>
      </section>

      {/* ── ÁREAS DE PRÁCTICA ──────────────────────────────────────────── */}
      <section id="areas" className="px" style={{ background:DARK, paddingTop:96, paddingBottom:96 }}>
        <FadeIn>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}>
            <div style={{ fontFamily:SANS, fontSize:12, letterSpacing:4, color:PLATA }}>ÁREAS DE PRÁCTICA</div>
            <a href="/areas-de-practica/" style={{ fontFamily:SANS, fontSize:12, letterSpacing:2.5, color:MARFIL, textDecoration:"none", borderBottom:`1px solid rgba(164,171,179,.5)`, paddingBottom:5 }}>
              VER TODAS →
            </a>
          </div>
          <p className="areas-intro">
            Cada controversia exige una estrategia distinta. Nuestro trabajo se concentra en cinco áreas desde las que analizamos los hechos, identificamos los riesgos y definimos el camino jurídico más conveniente para cada asunto.
          </p>
        </FadeIn>
        <div style={{ marginTop:40, borderTop:`1px solid rgba(164,171,179,.22)` }}>
          {areas.map((a,i) => (
            <FadeIn key={i} delay={i*.1}>
              <a className="area-row" href={`/areas-de-practica/#${a.slug}`}>
                <span className="area-num">{a.num}</span>
                <div>
                  <h3 className="area-title">{a.title}</h3>
                  <p className="area-desc">{a.desc}</p>
                  <span className="area-link">Conocer {a.title.toLowerCase()}</span>
                </div>
                <span className="area-arrow">→</span>
              </a>
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
                  Tinoco es una firma legal dedicada al derecho civil, mercantil, administrativo, fiscal y aduanero. Trabajamos con un principio simple: ningún asunto se delega, se estandariza ni se resuelve con fórmulas. Cada expediente recibe un estudio propio y una estrategia a su medida.
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

      <Footer />
    </>
  );
}
