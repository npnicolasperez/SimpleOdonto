import { T, Logo, useIsMobile } from './App.jsx'

/**
 * Landing pública gated por token: muestra 2 CTAs para elegir entre la guía visual
 * (recorrido con capturas y explicaciones) o el demo interactivo (app con datos fake).
 * El profesional llega acá desde el mail que le enviamos manualmente cuando pide "Probar HolaDoc".
 */
export default function BienvenidaLanding({ tokenPath }) {
  const isMobile = useIsMobile()

  const options = [
    {
      href:  `${tokenPath}/guia`,
      titulo: 'Guía visual',
      subtitulo: 'Recorrido explicativo',
      texto: 'Un recorrido comentado por todas las pantallas del sistema, con capturas reales y descripción funcional. Lo ves a tu ritmo, en 5 minutos.',
      icono: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      cta: 'Abrir guía →',
    },
    {
      href:  `${tokenPath}/demo`,
      titulo: 'Demo interactiva',
      subtitulo: 'Probá el sistema en vivo',
      texto: 'Entrás al sistema real con datos fake precargados. Podés navegar, registrar consultas, dibujar sobre una radiografía y ver todo funcionando. Sin registrarte.',
      icono: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="14" rx="2"/>
          <path d="M8 22h8"/>
          <path d="M12 18v4"/>
        </svg>
      ),
      cta: 'Abrir demo →',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.gray2, fontFamily: T.font, color: T.black, display: 'flex', flexDirection: 'column' }}>

      {/* Header simple */}
      <header style={{ background: T.white, borderBottom: `1px solid ${T.gray1}`, padding: isMobile ? '14px 20px' : '18px 40px', flexShrink: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <Logo size={16} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray4 }}>
            <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: T.black }} />
            Probá HolaDoc
          </span>
        </div>
      </header>

      {/* Hero + CTAs */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '40px 20px' : '64px 40px' }}>
        <div style={{ maxWidth: 780, width: '100%', textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 12 }}>
            Bienvenido
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 42, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: T.black }}>
            ¿Cómo querés conocer HolaDoc?
          </h1>
          <p style={{ margin: '18px auto 0', fontSize: 15.5, color: T.gray4, lineHeight: 1.65, maxWidth: 560 }}>
            Elegí la experiencia que prefieras. Podés hacer las dos si querés, todo es sin compromiso.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, maxWidth: 780, width: '100%' }}>
          {options.map(opt => (
            <a key={opt.href} href={opt.href}
              style={{
                display: 'flex', flexDirection: 'column',
                background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 18,
                padding: isMobile ? '28px 24px' : '36px 32px',
                textDecoration: 'none', color: T.black,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.10)'
                e.currentTarget.style.borderColor = T.black
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = T.gray1
              }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: T.black, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexShrink: 0 }}>
                {opt.icono}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, marginBottom: 6 }}>
                {opt.subtitulo}
              </div>
              <div style={{ fontFamily: T.font, fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.black, marginBottom: 12 }}>
                {opt.titulo}
              </div>
              <p style={{ margin: 0, fontFamily: T.font, fontSize: 14, lineHeight: 1.6, color: T.gray4, flex: 1 }}>
                {opt.texto}
              </p>
              <div style={{ marginTop: 20, fontFamily: T.font, fontSize: 13.5, fontWeight: 700, color: T.black, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {opt.cta}
              </div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: isMobile ? 36 : 48, textAlign: 'center', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', color: T.gray5 }}>
          ¿Alguna duda? Respondé el mail que te enviamos y te contestamos al toque.
        </div>
      </main>

      <footer style={{ padding: '24px 20px', textAlign: 'center', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', color: T.gray6, borderTop: `1px solid ${T.gray1}`, background: T.white, flexShrink: 0 }}>
        holadocapp.com · para profesionales de la salud
      </footer>
    </div>
  )
}
