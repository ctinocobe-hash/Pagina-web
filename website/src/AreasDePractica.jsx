import { DEEP, AZUL, DARK, PLATA, SANS } from "./shared.jsx";
import { FadeIn, Header, Footer, areas } from "./shared.jsx";

export default function AreasDePractica() {
  return (
    <>
      <Header isHome={false} />

      {/* ── INTRO ──────────────────────────────────────────────────────── */}
      <section className="px" style={{
        background:`radial-gradient(130% 100% at 50% 0%, ${DEEP} 0%, ${AZUL} 48%, ${DARK} 100%)`,
        paddingTop:120, paddingBottom:64,
      }}>
        <FadeIn>
          <div className="hero-eyebrow">ÁREAS DE PRÁCTICA</div>
          <h1 className="firma-main-h2" style={{ textAlign:"left", margin:"18px 0 0", color:"#F3F2EF", maxWidth:720 }}>
            Cinco áreas, una misma forma de trabajar.
          </h1>
          <p className="areas-intro" style={{ marginTop:20 }}>
            Cada controversia exige una estrategia distinta. Nuestro trabajo se concentra en cinco áreas desde las que analizamos los hechos, identificamos los riesgos y definimos el camino jurídico más conveniente para cada asunto.
          </p>
        </FadeIn>
      </section>

      {/* ── BLOQUES POR ÁREA ───────────────────────────────────────────── */}
      <section className="px" style={{ background:DARK, paddingBottom:40 }}>
        {areas.map((a, i) => (
          <FadeIn key={a.slug} delay={i * .05}>
            <div id={a.slug} className="ap-block">
              <span className="area-num" style={{ display:"block", marginBottom:8 }}>{a.num}</span>
              <h2 className="ap-title">{a.title}</h2>
              <p className="ap-desc">{a.desc}</p>
            </div>
          </FadeIn>
        ))}
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="px" style={{ background:DARK, paddingTop:24, paddingBottom:96, textAlign:"center" }}>
        <FadeIn>
          <p style={{ fontFamily:SANS, fontSize:16, color:PLATA, marginBottom:24 }}>
            ¿Su situación entra en alguna de estas áreas, o no está seguro de cuál aplica?
          </p>
          <a href="/#contacto" className="btn-solid">CUÉNTENOS SU CASO</a>
        </FadeIn>
      </section>

      <Footer />
    </>
  );
}
