import { useCallback, useEffect, useState } from 'react'
import { MainLayout, T } from '../App.jsx'
import { demoApiFetch, resetDemo } from './demoApiMock.js'
import { USUARIO_DEMO } from './demoSeedData.js'
import { DemoContext } from './DemoContext.js'

/**
 * Banner permanente arriba de todo — amarillo suave, seña clara de modo demo.
 * Botones para reiniciar los datos o volver al sitio real.
 */
function DemoBanner() {
  // Si entraste al demo desde /bienvenida/{token}/demo, "Salir" vuelve al landing
  // (/bienvenida/{token}) donde están las 2 CTAs. Si venís del /demo legacy (sin
  // token), no hay landing al que volver, así que caemos al login.
  const path = typeof window !== 'undefined' ? window.location.pathname : ''
  const match = path.match(/^(\/bienvenida\/[^/]+)\/demo(?:\/|$)/)
  const salirHref = match ? match[1] : '/'
  const salirLabel = match ? '← Volver a Probá HolaDoc' : 'Salir del demo →'
  return (
    <div style={{
      background: '#fef3c7',
      borderBottom: '1px solid #fde68a',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 14, flexWrap: 'wrap',
      fontFamily: T.font, fontSize: 12.5, color: '#92400e',
      flexShrink: 0,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
        <strong style={{ fontWeight: 700 }}>Estás navegando en modo demo</strong>
        <span>· Los cambios que hagas no se guardan</span>
      </span>
      <span style={{ display: 'inline-flex', gap: 8 }}>
        <button onClick={() => { resetDemo(); window.location.reload() }}
          style={{ fontFamily: T.font, fontSize: 11.5, fontWeight: 600, color: '#78350f', background: 'transparent', border: '1px solid #d97706', borderRadius: 100, padding: '3px 10px', cursor: 'pointer' }}>
          Reiniciar datos
        </button>
        <a href={salirHref}
          style={{ fontFamily: T.font, fontSize: 11.5, fontWeight: 700, color: '#fff', background: '#111', border: '1px solid #111', borderRadius: 100, padding: '3px 10px', textDecoration: 'none' }}>
          {salirLabel}
        </a>
      </span>
    </div>
  )
}

/**
 * Modal que aparece cuando el mock rechaza una acción por límite de demo.
 * Se dispara vía window event 'demo-limit' desde demoApiMock.
 */
function DemoLimiteModal({ mensaje, onCerrar }) {
  if (!mensaje) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCerrar}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: T.white, borderRadius: 16, maxWidth: 440, width: '100%', padding: '32px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 22, color: '#d97706', fontWeight: 700, lineHeight: 1 }}>!</span>
          </div>
          <div>
            <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>Límite del modo demo</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4, marginTop: 3 }}>Esta acción está restringida</div>
          </div>
        </div>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 14, lineHeight: 1.55, color: T.gray4 }}>
          {mensaje}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCerrar}
            style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.white, background: T.black, border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Entrada del modo demo. Reutiliza el MainLayout entero pero le inyecta:
 *  - apiFetch mockeado (memoria del browser, sin backend real)
 *  - usuario "María García" fake
 *  - banner amarillo permanente
 *  - onLogout que sale del demo hacia el login normal
 *  - modal global que aparece al topar cualquier límite del demo
 */
export default function DemoApp() {
  const apiFetch = useCallback((path, opts) => demoApiFetch(path, opts), [])
  const handleLogout = useCallback(() => { window.location.href = '/' }, [])
  const [limiteMsg, setLimiteMsg] = useState(null)

  useEffect(() => {
    const handler = (e) => setLimiteMsg(e.detail?.mensaje || 'Acción bloqueada en modo demo.')
    window.addEventListener('demo-limit', handler)
    return () => window.removeEventListener('demo-limit', handler)
  }, [])

  return (
    <DemoContext.Provider value={true}>
      <MainLayout
        token="demo"
        usuario={USUARIO_DEMO}
        onLogout={handleLogout}
        apiFetch={apiFetch}
        demoMode={true}
        extraTopBanner={<DemoBanner />}
      />
      <DemoLimiteModal mensaje={limiteMsg} onCerrar={() => setLimiteMsg(null)} />
    </DemoContext.Provider>
  )
}
