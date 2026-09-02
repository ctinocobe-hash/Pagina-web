// Piezas que usan tanto la portada (Website.jsx) como las páginas nuevas
// (AreasDePractica.jsx). Vive aparte para no duplicar el header/footer en
// cada archivo de página: un cambio de marca se hace una sola vez.
import { useState, useEffect, useRef } from "react";

// ─── Paleta de marca ─────────────────────────────────────────────────────────
export const DARK    = "#16181D";
export const AZUL    = "#1D3647";
export const DEEP    = "#24435A";
export const PIZARRA = "#485769";
export const PLATA   = "#A4ABB3";
export const MARFIL  = "#F3F2EF";
export const MUTED   = "#C7CCD2";
export const MUTED2  = "#7C8792";
export const NEGRO   = "#101216";
export const SERIF   = "'EB Garamond', Georgia, serif";
export const SANS    = "'Source Sans 3', system-ui, sans-serif";

// ─── Isotipo inline ───────────────────────────────────────────────────────────
// Geometría EXACTA tomada de public/logo/isotipo.svg.
export const IsotipoLines = ({ stroke = MARFIL, animated = false }) => {
  const anim = (delay) => animated
    ? { strokeDasharray:1, strokeDashoffset:1, animation:`draw 1.3s ease ${delay}s forwards` }
    : {};
  return (
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
export const FadeIn = ({ children, delay = 0, style = {} }) => {
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

export const ContactRow = ({ label, value, href }) => (
  <a href={href} className="contact-row">
    <span className="contact-row-label">{label}</span>
    <span className="contact-row-value">{value}</span>
  </a>
);

// Una sola fuente para las 5 áreas: la usan tanto la portada (tarjetas
// cortas en la sección "Áreas de práctica") como /areas-de-practica
// (mismo texto, con más aire). Nunca se duplica el contenido entre las dos
// páginas, así no hay forma de que queden diciendo cosas distintas.
export const areas = [
  { num:"I",   slug:"civil",          title:"Derecho Civil",          desc:"Representamos a personas y empresas en controversias relacionadas con contratos, obligaciones, patrimonio y responsabilidad civil, con una defensa construida a partir de las circunstancias concretas de cada caso." },
  { num:"II",  slug:"mercantil",      title:"Derecho Mercantil",      desc:"Atendemos conflictos derivados de relaciones y operaciones comerciales, incluidos incumplimientos y disputas entre empresas o socios, considerando tanto sus implicaciones jurídicas como sus efectos sobre el negocio." },
  { num:"III", slug:"administrativo", title:"Derecho Administrativo", desc:"Defendemos a personas y empresas frente a actos, resoluciones y procedimientos de autoridades administrativas que puedan afectar sus derechos, su patrimonio o el desarrollo de sus actividades." },
  { num:"IV",  slug:"fiscal",         title:"Derecho Fiscal",         desc:"Representamos a contribuyentes frente a actos y resoluciones de las autoridades fiscales, mediante un análisis técnico de la controversia y de sus consecuencias jurídicas y económicas." },
  { num:"V",   slug:"aduanero",       title:"Derecho Aduanero",       desc:"Atendemos controversias derivadas de operaciones de comercio exterior y de actuaciones de las autoridades aduaneras, sin perder de vista la continuidad y seguridad jurídica de la operación." },
];

const navLinks = [
  { label:"ÁREAS DE PRÁCTICA", id:"areas" },
  { label:"LA FIRMA",          id:"firma" },
  { label:"PUBLICACIONES",     id:"publicaciones" },
  { label:"CONTACTO",          id:"contacto" },
];

// ─── Header ───────────────────────────────────────────────────────────────
// Los links del nav apuntan a "/#id": funcionan igual desde la portada (donde
// además se intercepta el click para hacer scroll suave sin recargar) que
// desde cualquier otra página (donde el navegador simplemente navega a la
// portada y salta a la sección, comportamiento nativo del hash en la URL).
// `isHome` se recibe como prop fija por página, nunca se detecta con
// window.location: detectarlo en el propio render produciría un HTML de
// servidor distinto al primer render del cliente (el server no tiene
// window) y eso rompe la hidratación, como ya pasó una vez en este sitio.
export const Header = ({ isHome }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // El salto nativo del navegador a #hash al cargar la página choca con
  // "scroll-behavior: smooth" del html (bug conocido en varios navegadores:
  // con smooth activado, el salto inicial a veces no ocurre o se descarta).
  // Se corrige a mano una sola vez, al montar, sin animación (llega ya
  // colocado, como se espera de un enlace directo a una sección).
  useEffect(() => {
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior:"instant" });
    }
  }, []);

  const go = (id) => (e) => {
    if (isHome) {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <header className="px" style={{
      position:"sticky", top:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      paddingTop:22, paddingBottom:22,
      background: AZUL,
      borderBottom:`1px solid rgba(164,171,179,.18)`,
      boxShadow:"0 8px 32px rgba(0,0,0,.26)",
    }}>
      <a href={isHome ? "#inicio" : "/#inicio"} onClick={go("inicio")} style={{ display:"block", textDecoration:"none" }}>
        <img src="/logo/logo-horizontal.png" alt="TINOCO · Firma Legal" className="header-logo" style={{ height:50, width:"auto", display:"block" }} />
      </a>

      <nav className="hide-mobile" style={{ display:"flex", alignItems:"center", gap:38 }}>
        {navLinks.map(n => (
          <a key={n.id} href={isHome ? `#${n.id}` : `/#${n.id}`} onClick={go(n.id)} className="nav-a">{n.label}</a>
        ))}
        <a href={isHome ? "#contacto" : "/#contacto"} onClick={go("contacto")} className="btn-border">AGENDAR CONSULTA</a>
      </nav>

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

      {menuOpen && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0,
          background:"rgba(22,24,29,.97)", backdropFilter:"blur(16px)",
          borderBottom:`1px solid rgba(164,171,179,.12)`,
        }}>
          {navLinks.map(n => (
            <a key={n.id} href={isHome ? `#${n.id}` : `/#${n.id}`} onClick={go(n.id)} style={{
              display:"block", padding:"16px 24px", fontFamily:SANS, fontSize:14, letterSpacing:2,
              color:MARFIL, textDecoration:"none", borderBottom:`1px solid rgba(164,171,179,.07)`,
            }}>{n.label}</a>
          ))}
          <a href={isHome ? "#contacto" : "/#contacto"} onClick={go("contacto")} style={{
            display:"block", padding:"18px 24px", fontFamily:SANS, fontSize:14, letterSpacing:2,
            color:MARFIL, textDecoration:"none",
          }}>AGENDAR CONSULTA</a>
        </div>
      )}
    </header>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────
export const Footer = () => (
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
);
