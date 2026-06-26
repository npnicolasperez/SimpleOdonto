import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Upload, LayoutList, LayoutGrid, Users, ScanLine, ClipboardList, Building2, Menu, X } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

/* ─── constants ─────────────────────────────────────────────── */

function IcoPunto() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="2" fill="currentColor" stroke="none" /><line x1="7.5" y1="1" x2="7.5" y2="5" /><line x1="7.5" y1="10" x2="7.5" y2="14" /><line x1="1" y1="7.5" x2="5" y2="7.5" /><line x1="10" y1="7.5" x2="14" y2="7.5" /></svg>
}
function IcoLinea() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="2.5" cy="12.5" r="2" fill="currentColor" stroke="none" /><circle cx="12.5" cy="2.5" r="2" fill="currentColor" stroke="none" /><line x1="4" y1="11" x2="11" y2="4" /></svg>
}
function IcoAngulo() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none" /><line x1="7.5" y1="12" x2="2" y2="3" /><line x1="7.5" y1="12" x2="13" y2="3" /><path d="M5.5 9 Q7.5 10.2 9.5 9" strokeWidth="1.2" fill="none" /></svg>
}
function IcoMedirAngulo() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="1.5" y1="13" x2="13.5" y2="13" /><line x1="1.5" y1="13" x2="9" y2="1.5" /><path d="M5.2 13 A4 4 0 0 1 8.5 6" strokeWidth="1.2" fill="none" /></svg>
}
function IcoLongitud() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="7.5" x2="13" y2="7.5" /><line x1="2" y1="4.5" x2="2" y2="10.5" /><line x1="13" y1="4.5" x2="13" y2="10.5" /></svg>
}
function IcoCirculo() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="5.5" /></svg>
}
function IcoCuadrado() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="11" height="11" /></svg>
}
function IcoBorrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14 L6 14 L14 6 L10 2 L2 10 Z" />
      <path d="M2 10 L6 14" />
      <path d="M6 6 L10 10" strokeOpacity="0.4" />
    </svg>
  )
}
function IcoCalibracion() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="6" width="16" height="6" rx="0.5" />
      <line x1="4"  y1="6"  x2="4"  y2="3.5" />
      <line x1="9"  y1="6"  x2="9"  y2="3.5" />
      <line x1="14" y1="6"  x2="14" y2="3.5" />
      <line x1="6.5" y1="6" x2="6.5" y2="4.5" />
      <line x1="11.5" y1="6" x2="11.5" y2="4.5" />
    </svg>
  )
}

const HERRAMIENTAS_DIBUJAR = [
  { key: 'punto',    label: 'Punto',    Ico: IcoPunto    },
  { key: 'linea',    label: 'Línea',    Ico: IcoLinea    },
  { key: 'circulo',  label: 'Círculo',  Ico: IcoCirculo  },
  { key: 'cuadrado', label: 'Cuadrado', Ico: IcoCuadrado },
  { key: 'borrar',   label: 'Borrar',   Ico: IcoBorrar   },
]
const HERRAMIENTAS_MEDIR = [
  { key: 'angulo-lineas', label: 'Medir ángulo',   Ico: IcoMedirAngulo  },
  { key: 'longitud',      label: 'Medir longitud', Ico: IcoLongitud     },
  { key: 'calibrar',      label: 'Calibrar',       Ico: IcoCalibracion  },
]

const RADIOS_PUNTO    = { 1: 2, 2: 4, 3: 7 }
const GROSORES_LINEA  = { 1: 1.5, 2: 3, 3: 5 }
const COLOR_PUNTO    = '#ff3333'
const COLOR_LINEA    = '#2563eb'
const COLOR_ANGULO   = '#ffffff'
const COLORES_PRESET = ['#ff3333', '#2563eb', '#22c55e', '#f59e0b', '#ffffff', '#a855f7', '#f97316']

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

// Cloudflare Turnstile — sitekey pública (va en el HTML, no es secreta).
const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY ?? '0x4AAAAAADaI7NQj1V3qw4BK'

/* ─── global request loading state (top progress bar) ──────────── */
// Contador de requests activas. Notifica solo si la operación tarda más de 250ms,
// para evitar parpadeos en requests rápidas.
const _loading = { count: 0, visible: false, showTimer: null, listeners: new Set() }
function _notify() { _loading.listeners.forEach(fn => fn(_loading.visible)) }
function fetchTracked(input, init) {
  _loading.count++
  if (_loading.count === 1 && !_loading.showTimer) {
    _loading.showTimer = setTimeout(() => {
      _loading.showTimer = null
      _loading.visible = true
      _notify()
    }, 250)
  }
  return fetch(input, init).finally(() => {
    _loading.count = Math.max(0, _loading.count - 1)
    if (_loading.count === 0) {
      if (_loading.showTimer) { clearTimeout(_loading.showTimer); _loading.showTimer = null }
      if (_loading.visible) { _loading.visible = false; _notify() }
    }
  })
}
function useGlobalLoading() {
  const [v, setV] = useState(_loading.visible)
  useEffect(() => { _loading.listeners.add(setV); return () => { _loading.listeners.delete(setV) } }, [])
  return v
}
function TopLoader() {
  const visible = useGlobalLoading()
  if (!visible) return null
  return (
    <>
      <style>{`@keyframes so-loader { 0% { left: -40%; width: 40%; } 50% { left: 30%; width: 40%; } 100% { left: 100%; width: 40%; } }`}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'transparent', zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', background: '#111', animation: 'so-loader 1.1s ease-in-out infinite' }} />
      </div>
    </>
  )
}

/* ─── responsive helpers ─────────────────────────────────────── */
const MOBILE_BREAKPOINT = 1024
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

/**
 * Devuelve true si el device es mobile (pantalla chica) o tiene touch capability.
 * Sirve para decidir si mostrar el canvas de firma directo en este device o disparar
 * el flujo "esperando firma desde otro device".
 */
function useIsMobileOrTouch() {
  const isMobile = useIsMobile()
  const [hasTouch] = useState(() =>
    typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0)
    )
  )
  return isMobile || hasTouch
}

/**
 * FAB (Floating Action Button) con speed dial. Pensado para mobile.
 * Recibe un array de acciones; si hay 1, click directo dispara el onClick.
 * Si hay >1, click expande un menú vertical sobre el FAB con cada acción.
 *
 *   acciones: [{ label: string, onClick: () => void, variant?: 'primary'|'outline' }]
 */
function FabAcciones({ acciones = [] }) {
  const [open, setOpen] = useState(false)
  if (!acciones.length) return null
  const fabSize = 56
  const handleClick = () => {
    if (acciones.length === 1) acciones[0].onClick()
    else setOpen(o => !o)
  }
  return (
    <>
      {/* backdrop invisible para cerrar al tocar fuera */}
      {open && (
        <div onClick={() => setOpen(false)}
             style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
      )}
      <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {/* Sub-acciones, aparecen sobre el FAB principal cuando open */}
        {open && acciones.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `so-fab-in 160ms ease-out ${i * 30}ms backwards` }}>
            <span style={{ background: T.black, color: T.white, fontFamily: T.font, fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {a.label}
            </span>
            <button
              onClick={() => { a.onClick(); setOpen(false) }}
              aria-label={a.label}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: a.variant === 'outline' ? T.white : T.black,
                color:      a.variant === 'outline' ? T.black : T.white,
                border:     a.variant === 'outline' ? `1px solid ${T.gray1}` : 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.18)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 300,
              }}
            >+</button>
          </div>
        ))}
        {/* FAB principal */}
        <button
          onClick={handleClick}
          aria-label={acciones.length === 1 ? acciones[0].label : (open ? 'Cerrar' : 'Agregar')}
          style={{
            width: fabSize, height: fabSize, borderRadius: '50%',
            background: T.black, color: T.white, border: 'none',
            boxShadow: '0 6px 16px rgba(0,0,0,0.22)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 200ms ease', transform: open ? 'rotate(45deg)' : 'rotate(0)',
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 200, lineHeight: 1 }}>+</span>
        </button>
      </div>
      <style>{`@keyframes so-fab-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </>
  )
}

/* ─── design tokens ──────────────────────────────────────────── */
const T = {
  font:    "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
  serif:   "'Playfair Display', serif",
  black:   '#111111',
  white:   '#ffffff',
  gray1:   '#e0e0dc',   // --border
  gray2:   '#f6f6f4',   // --surface
  gray3:   '#888888',   // --muted
  gray4:   '#555555',
  gray5:   '#aaaaaa',
  gray6:   '#cccccc',
  gray7:   '#eeeeec',   // --surface-2
  red:     '#cc0000',
}

/* ─── math helpers ───────────────────────────────────────────── */

function calcularAngulo(vx, vy, ax1, ay1, ax2, ay2) {
  const dx1 = ax1 - vx, dy1 = ay1 - vy
  const dx2 = ax2 - vx, dy2 = ay2 - vy
  const dot  = dx1 * dx2 + dy1 * dy2
  const mag  = Math.sqrt((dx1 ** 2 + dy1 ** 2) * (dx2 ** 2 + dy2 ** 2))
  if (mag === 0) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI
}

function dibujarArco(ctx, vx, vy, ax1, ay1, ax2, ay2, r = 28) {
  const a1   = Math.atan2(ay1 - vy, ax1 - vx)
  const a2   = Math.atan2(ay2 - vy, ax2 - vx)
  let   diff = a2 - a1
  if (diff >  Math.PI) diff -= 2 * Math.PI
  if (diff < -Math.PI) diff += 2 * Math.PI
  ctx.beginPath()
  ctx.arc(vx, vy, r, a1, a2, diff < 0)
  ctx.stroke()
  return { midA: a1 + diff / 2, r }
}

function distPuntoSegmento(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function interseccionLineas(t1, t2) {
  const { x1, y1, x2, y2 } = t1
  const x3 = t2.x1, y3 = t2.y1, x4 = t2.x2, y4 = t2.y2
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 0.001) return null
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  return { ix: x1 + t * (x2 - x1), iy: y1 + t * (y2 - y1) }
}

function trazoCercanoParaBorrar(x, y, trazos) {
  const TOL = 10
  for (let i = trazos.length - 1; i >= 0; i--) {
    const t = trazos[i]
    if (t.tipo === 'punto') {
      if (Math.hypot(x - t.x, y - t.y) <= Math.max(TOL, (RADIOS_PUNTO[t.grosor ?? 1] ?? 2) + 5)) return i
    } else if (t.tipo === 'linea' || t.tipo === 'longitud') {
      if (distPuntoSegmento(x, y, t.x1, t.y1, t.x2, t.y2) <= TOL) return i
    } else if (t.tipo === 'angulo') {
      if (Math.hypot(x - t.vx, y - t.vy) <= TOL + 4) return i
      if (distPuntoSegmento(x, y, t.vx, t.vy, t.ax1, t.ay1) <= TOL) return i
      if (distPuntoSegmento(x, y, t.vx, t.vy, t.ax2, t.ay2) <= TOL) return i
    } else if (t.tipo === 'angulo-lineas') {
      if (Math.hypot(x - t.ix, y - t.iy) <= TOL + 4) return i
    } else if (t.tipo === 'circulo') {
      if (Math.abs(Math.hypot(x - t.cx, y - t.cy) - t.r) <= TOL) return i
    } else if (t.tipo === 'cuadrado') {
      const minX = Math.min(t.x1, t.x2), maxX = Math.max(t.x1, t.x2)
      const minY = Math.min(t.y1, t.y2), maxY = Math.max(t.y1, t.y2)
      if ((Math.abs(x - minX) <= TOL && y >= minY - TOL && y <= maxY + TOL) ||
          (Math.abs(x - maxX) <= TOL && y >= minY - TOL && y <= maxY + TOL) ||
          (Math.abs(y - minY) <= TOL && x >= minX - TOL && x <= maxX + TOL) ||
          (Math.abs(y - maxY) <= TOL && x >= minX - TOL && x <= maxX + TOL)) return i
    }
  }
  return -1
}

function dibujarEtiqueta(ctx, texto, x, y) {
  ctx.font = 'bold 15px Inter, sans-serif'
  ctx.lineWidth = 4
  ctx.strokeStyle = '#000000'
  ctx.strokeText(texto, x, y)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(texto, x, y)
}

function anguloHaciaLinea(ix, iy, a, midx, midy) {
  const d1 = Math.hypot(midx - (ix + 50 * Math.cos(a)),           midy - (iy + 50 * Math.sin(a)))
  const d2 = Math.hypot(midx - (ix + 50 * Math.cos(a + Math.PI)), midy - (iy + 50 * Math.sin(a + Math.PI)))
  return d1 <= d2 ? a : a + Math.PI
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' +
         d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

/* ─── App ─────────────────────────────────────────────────────── */

export default function App() {
  const [token,   setToken]   = useState(() => localStorage.getItem('so_token'))
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('so_usuario')) } catch { return null }
  })

  function handleLogin(data) {
    const u = { nombre: data.nombre, apellido: data.apellido, email: data.email, perfilCompleto: data.perfilCompleto !== false, foto: data.foto || null, especialidadNombre: data.especialidadNombre || null, esAdmin: data.esAdmin === true }
    localStorage.setItem('so_token', data.token)
    localStorage.setItem('so_usuario', JSON.stringify(u))
    setToken(data.token); setUsuario(u)
  }

  function handleLogout() {
    localStorage.removeItem('so_token'); localStorage.removeItem('so_usuario')
    setToken(null); setUsuario(null)
  }

  // Página de bienvenida post-pago: MercadoPago redirige acá tras pagar la suscripción.
  // Se detecta por path porque no usamos React Router; sale del flujo normal de auth.
  if (window.location.pathname === '/post-pago') {
    return <><TopLoader /><VistaPostPago /></>
  }

  let content
  if (!token) content = <VistaLogin onLogin={handleLogin} />
  else if (!usuario?.perfilCompleto) content = <VistaCompletarPerfil token={token} onLogin={handleLogin} onLogout={handleLogout} />
  else content = <MainLayout token={token} usuario={usuario} onLogout={handleLogout} />
  return <><TopLoader />{content}</>
}

/* ─── MainLayout ─────────────────────────────────────────────── */

const NAV_ITEMS = [
  { key: 'dashboard',      label: 'Resumen'           },
  { key: 'pacientes',      label: 'Pacientes'          },
  { key: 'turnos',         label: 'Turnos'            },
  { key: 'estudios',       label: 'Estudios'          },
  { key: 'consultas',      label: 'Consultas'         },
  { key: 'finanzas',       label: 'Finanzas'          },
  { key: 'obras-sociales', label: 'Obras sociales'    },
  { key: 'consultorios',   label: 'Consultorios'      },
  { key: 'medios-pago',    label: 'Medios de pago'    },
  { key: 'especialidades', label: 'Especialidades',   adminOnly: true },
]

function MainLayout({ token, usuario, onLogout }) {
  const [vista, setVista] = useState('dashboard')
  const [consultasFiltroInicial, setConsultasFiltroInicial] = useState(false)
  const [consultaEditarInicial,  setConsultaEditarInicial]  = useState(null) // { consultaId, pacienteId } | null
  const [volverAFinanzasActivo,  setVolverAFinanzasActivo]  = useState(false) // flag persistente que habilita el back-a-finanzas hasta que se use
  const [finanzasMesInicial,     setFinanzasMesInicial]     = useState(null) // { año, mes } | null
  const [finanzasSubVistaInicial, setFinanzasSubVistaInicial] = useState(null) // 'dash' | 'movimientos' | null
  const [turnosFechaInicial,     setTurnosFechaInicial]     = useState(null) // Date | null
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-cerrar el drawer al pasar a desktop o al navegar
  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])
  useEffect(() => { setSidebarOpen(false) }, [vista])

  function navegar(key) {
    if (key === 'turnos') setTurnosFechaInicial(null)
    setVista(key)
  }

  const apiFetch = useCallback(async (path, opts = {}) => {
    const res = await fetchTracked(`${API_URL}${path}`, {
      ...opts,
      headers: { ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...opts.headers },
    })
    if (res.status === 401) { onLogout(); return null }
    return res
  }, [token, onLogout])

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.white, overflow: 'hidden' }}>

      {/* ── global header ── */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 24px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, background: T.white, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(o => !o)}
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.black }}
            >
              {sidebarOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          )}
          <Logo size={16} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usuario?.foto && <img src={usuario.foto} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
          {!isMobile && (
            <span style={{ fontFamily: T.font, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4 }}>
              {usuario?.nombre} {usuario?.apellido}
            </span>
          )}
        </div>
      </header>

      {/* ── body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', position: 'relative' }}>

        {/* backdrop (solo mobile + sidebar abierta) */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 20, animation: 'so-fade 150ms ease-out' }}
          />
        )}
        <style>{`@keyframes so-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>

        {/* sidebar — fija en desktop, drawer en mobile */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${T.gray1}`,
            background: T.white,
            ...(isMobile ? {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 30,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 200ms ease-out',
              boxShadow: sidebarOpen ? '2px 0 12px rgba(0,0,0,0.08)' : 'none',
            } : {}),
          }}
        >
          <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
            {NAV_ITEMS
              .filter(({ adminOnly }) => !(adminOnly && !usuario?.esAdmin))
              .map(({ key, label }) => (
                <NavItem key={key} label={label} active={vista === key} onClick={() => navegar(key)} />
              ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.gray7}` }}>
            <Btn variant="outline" size="sm" fullWidth onClick={onLogout}>Cerrar sesión</Btn>
          </div>
        </aside>

        {/* main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
          {vista === 'dashboard'      && <VistaDashboard apiFetch={apiFetch} usuario={usuario} setVista={setVista} setTurnosFechaInicial={setTurnosFechaInicial} />}
          {vista === 'pacientes'      && <VistaPacientes apiFetch={apiFetch} onIrAConsultorios={() => setVista('consultorios')} usuario={usuario} />}
          {vista === 'turnos'         && <VistaTurnos apiFetch={apiFetch} fechaInicial={turnosFechaInicial} />}
          {vista === 'estudios'       && <VistaEstudios apiFetch={apiFetch} />}
          {vista === 'consultas'      && <VistaConsultas apiFetch={apiFetch} onIrAConsultorios={() => setVista('consultorios')} usuario={usuario} filtroPendienteInicial={consultasFiltroInicial} consultaEditarInicial={consultaEditarInicial} onConsultaEditarInicialUsada={() => setConsultaEditarInicial(null)} onVolverAFinanzas={(consultasFiltroInicial || volverAFinanzasActivo) ? () => { setConsultasFiltroInicial(false); setConsultaEditarInicial(null); setVolverAFinanzasActivo(false); setVista('finanzas') } : undefined} />}
          {vista === 'finanzas'       && <VistaFinanzas apiFetch={apiFetch} mesInicial={finanzasMesInicial} subVistaInicial={finanzasSubVistaInicial} onSubVistaConsumida={() => setFinanzasSubVistaInicial(null)} onIrAConsultas={(año, mes) => { setFinanzasMesInicial({ año, mes }); setConsultasFiltroInicial(true); setVolverAFinanzasActivo(true); setVista('consultas') }} onIrAConsulta={(consultaId, pacienteId) => { setConsultaEditarInicial({ consultaId, pacienteId }); setFinanzasSubVistaInicial('movimientos'); setVolverAFinanzasActivo(true); setVista('consultas') }} />}
          {vista === 'obras-sociales' && <VistaObrasSociales apiFetch={apiFetch} />}
          {vista === 'consultorios'   && <VistaConsultorios apiFetch={apiFetch} />}
          {vista === 'medios-pago'    && <VistaMediosPago apiFetch={apiFetch} />}
          {vista === 'especialidades' && usuario?.esAdmin && <VistaEspecialidades apiFetch={apiFetch} />}
        </main>
      </div>
      <FirmaPendienteOverlay apiFetch={apiFetch} />
    </div>
  )
}

function NavItem({ label, active, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'block',
        width: active ? 'calc(100% - 6px)' : 'calc(100% - 12px)',
        textAlign: 'left',
        marginLeft: active ? 0 : 6, marginRight: 6, marginBottom: 2,
        padding: '8px 14px',
        fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
        fontFamily: T.font, fontWeight: active ? 600 : 400,
        border: 'none',
        borderRadius: active ? '0 6px 6px 0' : 6,
        background: active ? T.black : hov ? T.gray7 : 'none',
        color: active ? T.white : hov ? T.black : T.gray3,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

/* ─── shared button component ────────────────────────────────── */

function Btn({ variant = 'default', size = 'default', fullWidth = false, disabled = false, onClick, type = 'button', children }) {
  const [hov, setHov] = useState(false)

  const h  = size === 'sm' ? 32 : size === 'lg' ? 44 : 36
  const px = size === 'sm' ? 16 : size === 'lg' ? 32 : 20
  const fs = size === 'sm' ? 10 : 11

  const styles = {
    default:     { bg: hov ? T.white : T.black,  color: hov ? T.black : T.white,  border: T.black  },
    destructive: { bg: hov ? T.white : T.red,    color: hov ? T.red   : T.white,  border: T.red    },
    outline:     { bg: hov ? T.black : T.white,  color: hov ? T.white : T.black,  border: T.black  },
    ghost:       { bg: 'none',                   color: hov ? T.black : T.gray4,  border: 'transparent' },
  }

  const s = styles[variant] || styles.default

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: h, padding: `0 ${px}px`,
        fontSize: fs, fontFamily: T.font, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        background: disabled ? T.gray7 : s.bg,
        color: disabled ? T.gray3 : s.color,
        border: `1px solid ${disabled ? T.gray1 : s.border}`,
        borderRadius: 100,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

/* ─── shared badge ───────────────────────────────────────────── */

function Badge({ variant = 'default', children }) {
  const styles = {
    default:  { bg: T.black,  color: T.white, border: T.black  },
    outline:  { bg: 'transparent', color: T.black, border: T.gray1 },
    muted:    { bg: T.gray2,  color: T.gray4, border: T.gray1  },
  }
  const s = styles[variant] || styles.default
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 10, fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 100 }}>
      {children}
    </span>
  )
}

/* ─── shared input ───────────────────────────────────────────── */

function Input({ style: extraStyle, ...props }) {
  const [foc, setFoc] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFoc(true); props.onFocus?.(e) }}
      onBlur={e  => { setFoc(false); props.onBlur?.(e) }}
      style={{
        height: 36, width: '100%', padding: '0 12px',
        border: `1px solid ${foc ? T.black : T.gray1}`,
        outline: 'none', background: T.white,
        fontSize: 13, fontFamily: T.font, color: T.black,
        borderRadius: 6,
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
    />
  )
}

function Textarea({ style: extraStyle, ...props }) {
  const [foc, setFoc] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={e => { setFoc(true); props.onFocus?.(e) }}
      onBlur={e  => { setFoc(false); props.onBlur?.(e) }}
      style={{
        width: '100%', padding: '8px 12px',
        border: `1px solid ${foc ? T.black : T.gray1}`,
        outline: 'none', background: T.white,
        fontSize: 13, fontFamily: T.font, color: T.black,
        borderRadius: 6,
        boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
    />
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{ margin: '0 0 16px', fontSize: 10, fontFamily: T.mono, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray3, borderBottom: `1px solid ${T.gray1}`, paddingBottom: 8 }}>
      {children}
    </p>
  )
}

function ErrorMsg({ children }) {
  if (!children) return null
  return (
    <p style={{ margin: 0, fontSize: 12, fontFamily: T.font, color: T.red, letterSpacing: '0.02em' }}>
      {children}
    </p>
  )
}

/* ─── page header (top bar inside a view) ────────────────────── */

function PageBar({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: 52, borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, gap: 12 }}>
      {children}
    </div>
  )
}

function PageTitle({ children }) {
  return (
    <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: T.black, flex: 1 }}>
      {children}
    </span>
  )
}

/* ─── FilterBar (secondary bar below PageBar) ────────────────── */

function FilterBar({ children }) {
  return (
    <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {children}
    </div>
  )
}

/* ─── ViewToggle ─────────────────────────────────────────────── */

function ViewToggle({ vista, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, flexShrink: 0, borderRadius: 6, overflow: 'hidden' }}>
      {[
        { key: 'list', Icon: LayoutList, title: 'Vista lista' },
        { key: 'grid', Icon: LayoutGrid, title: 'Vista tarjetas' },
      ].map(({ key, Icon, title }, i) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          title={title}
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: vista === key ? T.black : T.white,
            color: vista === key ? T.white : T.gray3,
            border: 'none',
            borderLeft: i > 0 ? `1px solid ${T.gray1}` : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

/* ─── SidePanel (drawer from right) ─────────────────────────── */

function SidePanel({ open, onClose, title, width = 520, footer, children }) {
  const isMobile = useIsMobile()
  const effectiveWidth = isMobile ? '100vw' : width
  const slideOff = isMobile ? '100vw' : `${width}px`
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: effectiveWidth, zIndex: 50,
        background: T.white,
        borderLeft: `1px solid ${T.gray1}`,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : `translateX(${slideOff})`,
        transition: 'transform 0.3s ease',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        borderRadius: '12px 0 0 12px',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.black }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gray3, display: 'flex', alignItems: 'center', padding: 4, fontSize: 22, lineHeight: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = T.black}
            onMouseLeave={e => e.currentTarget.style.color = T.gray3}
          >×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.gray1}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── ConfirmDialog + useConfirm ─────────────────────────────── */

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Eliminar', confirmVariant = 'destructive' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}>
      <div style={{ background: T.white, border: `1px solid ${T.gray1}`, padding: '28px 32px', maxWidth: 380, width: '90%', display: 'flex', flexDirection: 'column', gap: 20, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <span style={{ fontFamily: T.font, fontSize: 14, color: T.black, lineHeight: 1.5 }}>{message}</span>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={onCancel}>Cancelar</Btn>
          <Btn variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [cfg, setCfg] = useState(null)
  const resolveRef = useRef(null)

  // openConfirm acepta opcionalmente { confirmLabel, confirmVariant } para customizar el botón
  // de confirmación. Por default es destructivo ("Eliminar") porque la mayoría son acciones de borrado.
  function openConfirm(message, opts = {}) {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setCfg({ message, ...opts })
    })
  }

  function handleConfirm() { resolveRef.current?.(true);  setCfg(null) }
  function handleCancel()  { resolveRef.current?.(false); setCfg(null) }

  const dialog = cfg
    ? <ConfirmDialog message={cfg.message} onConfirm={handleConfirm} onCancel={handleCancel}
        confirmLabel={cfg.confirmLabel} confirmVariant={cfg.confirmVariant} />
    : null

  return { openConfirm, dialog }
}

/* ─── AlertDialog + useAlert ─────────────────────────────────── */

function AlertDialog({ message, title, buttonLabel = 'Entendido', onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: T.white, border: `1px solid ${T.gray1}`, padding: '28px 32px', maxWidth: 380, width: '90%', display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        {title && <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.black, letterSpacing: '-0.01em' }}>{title}</span>}
        <span style={{ fontFamily: T.font, fontSize: 14, color: T.black, lineHeight: 1.5 }}>{message}</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn onClick={onClose}>{buttonLabel}</Btn>
        </div>
      </div>
    </div>
  )
}

function useAlert() {
  const [cfg, setCfg] = useState(null)
  const resolveRef = useRef(null)

  function openAlert(message, opts = {}) {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setCfg({ message, ...opts })
    })
  }

  function handleClose() { resolveRef.current?.(); setCfg(null) }

  const dialog = cfg
    ? <AlertDialog message={cfg.message} title={cfg.title} buttonLabel={cfg.buttonLabel} onClose={handleClose} />
    : null

  return { openAlert, dialog }
}

/* ─── Firma del paciente ─────────────────────────────────────── */

const fmtMontoFirma = m => m != null && !isNaN(Number(m))
  ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : null

/** Canvas para que el paciente firme con dedo o mouse. Devuelve PNG base64 al guardar. */
function CanvasFirma({ pendiente, onGuardar, onCancelar, guardando, error }) {
  const wrapRef    = useRef(null)
  const canvasRef  = useRef(null)
  const [vacio, setVacio] = useState(true)
  const dibujando  = useRef(false)
  const ultimaPos  = useRef({ x: 0, y: 0 })

  // Setup canvas con DPR para que no se vea borroso en retina/mobile.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return
    const dpr  = Math.max(window.devicePixelRatio || 1, 1)
    const rect = wrap.getBoundingClientRect()
    canvas.width  = Math.round(rect.width  * dpr)
    canvas.height = Math.round(rect.height * dpr)
    canvas.style.width  = rect.width  + 'px'
    canvas.style.height = rect.height + 'px'
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2.3
    ctx.lineCap  = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches && e.touches[0]
    const cx = touch ? touch.clientX : e.clientX
    const cy = touch ? touch.clientY : e.clientY
    return { x: cx - rect.left, y: cy - rect.top }
  }

  function start(e) {
    e.preventDefault()
    const pos = getPos(e)
    ultimaPos.current = pos
    dibujando.current = true
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineTo(pos.x + 0.01, pos.y + 0.01) // micro-trazo para un punto si solo tocan
    ctx.stroke()
    if (vacio) setVacio(false)
  }

  function move(e) {
    if (!dibujando.current) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(ultimaPos.current.x, ultimaPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ultimaPos.current = pos
  }

  function end(e) {
    if (!dibujando.current) return
    if (e) e.preventDefault()
    dibujando.current = false
  }

  function limpiar() {
    const canvas = canvasRef.current
    const dpr = Math.max(window.devicePixelRatio || 1, 1)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2.3
    ctx.lineCap  = 'round'
    ctx.lineJoin = 'round'
    setVacio(true)
  }

  function guardar() {
    if (vacio || guardando) return
    const png = canvasRef.current.toDataURL('image/png')
    onGuardar(png)
  }

  const montoFmt = fmtMontoFirma(pendiente?.monto)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: T.gray2 }}>

      {/* Contenido scrolleable: snapshot + canvas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, marginBottom: 8 }}>Confirmás la atención de</div>
          <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>
            {(pendiente?.pacienteNombre || '') + ' ' + (pendiente?.pacienteApellido || '')}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {pendiente?.fecha && (
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4 }}>Fecha</div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.black }}>{pendiente.fecha}</div>
              </div>
            )}
            {montoFmt && (
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4 }}>Monto</div>
                <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black }}>{montoFmt}</div>
              </div>
            )}
          </div>
          {pendiente?.descripcion && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4, marginBottom: 4 }}>Descripción</div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, lineHeight: 1.5 }}>{pendiente.descripcion}</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, marginBottom: 8 }}>Firmá acá abajo</div>
          <div ref={wrapRef} style={{ width: '100%', height: 240, background: T.white, border: `1.5px solid ${T.gray1}`, borderRadius: 10, overflow: 'hidden', touchAction: 'none', position: 'relative' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}
              style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
            />
            {vacio && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5 }}>
                Trazá tu firma con el dedo
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={limpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', color: T.gray4, padding: 4 }}>
              Borrar y volver a firmar
            </button>
          </div>
        </div>

        {error && <ErrorMsg>{error}</ErrorMsg>}
      </div>

      {/* Footer fijo abajo — siempre visible aunque el contenido haga scroll */}
      <div style={{ flexShrink: 0, padding: '14px 16px', borderTop: `1px solid ${T.gray1}`, background: T.white, display: 'flex', gap: 10 }}>
        <Btn variant="outline" onClick={onCancelar} disabled={guardando} fullWidth>Cancelar</Btn>
        <Btn onClick={guardar} disabled={vacio || guardando} fullWidth>{guardando ? 'Guardando…' : 'Confirmar firma'}</Btn>
      </div>
    </div>
  )
}

/**
 * Overlay full-screen que aparece cuando hay una firma pendiente para el profesional logueado.
 * Polea /firmas/pendiente al ganar foco la app (no en intervalo) — basta con un check al levantar el celu.
 */
function FirmaPendienteOverlay({ apiFetch }) {
  const [pendiente, setPendiente] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)

  const chequear = useCallback(async () => {
    if (document.visibilityState !== 'visible') return
    try {
      const res = await apiFetch('/firmas/pendiente')
      if (!res) return
      if (res.status === 204) { setPendiente(null); return }
      if (res.ok) {
        const data = await res.json()
        setPendiente(prev => prev?.consultaId === data.consultaId ? prev : data)
      }
    } catch {}
  }, [apiFetch])

  useEffect(() => {
    chequear()
    const onVis = () => { if (document.visibilityState === 'visible') chequear() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', chequear)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', chequear)
    }
  }, [chequear])

  async function handleGuardar(png) {
    if (!pendiente) return
    setError(null); setGuardando(true)
    const res = await apiFetch('/firmas/firmar', { method: 'PUT', body: JSON.stringify({ consultaId: pendiente.consultaId, pngBase64: png }) })
    if (!res) { setGuardando(false); return }
    if (res.ok || res.status === 204) {
      setPendiente(null)
    } else {
      const err = await res.json().catch(() => null)
      setError(err?.error || 'Error al guardar la firma')
    }
    setGuardando(false)
  }

  function handleCancelar() {
    setPendiente(null) // el slot sigue en el backend hasta que el desktop lo cancele o el paciente vuelva
  }

  if (!pendiente) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.gray2, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', background: T.black, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Firma del paciente</div>
          <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, marginTop: 2 }}>holaDoc</div>
        </div>
      </div>
      <CanvasFirma pendiente={pendiente} onGuardar={handleGuardar} onCancelar={handleCancelar} guardando={guardando} error={error} />
    </div>
  )
}

/** Muestra el PNG de una firma. Fetch con Authorization → blob URL (el <img> nativo no manda headers). */
function FirmaImg({ apiFetch, consultaId, refreshKey, style }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let cancelado = false
    let url = null
    apiFetch(`/firmas/consulta/${consultaId}/png`).then(async res => {
      if (!res || !res.ok || cancelado) return
      const blob = await res.blob()
      if (cancelado) return
      url = URL.createObjectURL(blob)
      setSrc(url)
    })
    return () => { cancelado = true; if (url) URL.revokeObjectURL(url) }
  }, [apiFetch, consultaId, refreshKey])
  if (!src) return <div style={{ ...style, background: T.gray2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 9, color: T.gray5 }}>…</div>
  return <img src={src} alt="firma" style={style} />
}

/** Modal de desktop que muestra "Esperando firma…" y polea cada 3 seg para detectar cuando se firmó. */
function EsperandoFirmaModal({ apiFetch, consultaId, onCerrar, onFirmada }) {
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (!consultaId) return
    let cancelado = false
    let timer = null
    const tick = async () => {
      if (cancelado) return
      const res = await apiFetch(`/firmas/consulta/${consultaId}/estado`)
      if (cancelado) return
      if (res?.ok) {
        const data = await res.json()
        setEstado(data)
        if (data.firmada) { onFirmada?.(data); return }
      }
      timer = setTimeout(tick, 3000)
    }
    tick()
    return () => { cancelado = true; if (timer) clearTimeout(timer) }
  }, [apiFetch, consultaId, onFirmada])

  async function cancelar() {
    await apiFetch(`/firmas/consulta/${consultaId}/solicitud`, { method: 'DELETE' })
    onCerrar?.()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(17,17,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: T.white, borderRadius: 14, padding: '28px 32px', maxWidth: 380, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.gray2, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${T.gray1}`, borderTopColor: T.black, borderRadius: '50%', animation: 'soSpin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes soSpin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>Esperando firma del paciente</div>
        <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.gray3, marginTop: 6, lineHeight: 1.5 }}>
          Pasale el celular al paciente. Cuando abra holaDoc en su pantalla va a aparecer el espacio para firmar.
        </div>
        {estado?.solicitada === false && !estado?.firmada && (
          <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', color: T.red }}>
            La solicitud ya no está activa
          </div>
        )}
        <div style={{ marginTop: 22 }}>
          <Btn variant="outline" onClick={cancelar} fullWidth>Cancelar</Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── table components ───────────────────────────────────────── */

function TableHead({ cols, extraCol = true, gap = 0 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${cols.map(c => c.w || '1fr').join(' ')}${extraCol ? ' 40px' : ''}`, columnGap: gap, padding: '0 24px', height: 40, alignItems: 'center', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
      {cols.map(c => (
        <span key={c.label} style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray3, textAlign: c.align ?? 'left' }}>{c.label}</span>
      ))}
      {extraCol && <span />}
    </div>
  )
}

/* ─── Logo wordmark ──────────────────────────────────────────── */

function Logo({ size = 16 }) {
  const iS = Math.round(size * 1.55)
  const rS = Math.round(iS * 0.3)
  const fS = Math.round(iS * 0.56)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.45), userSelect: 'none' }}>
      <div style={{ width: iS, height: iS, background: T.black, borderRadius: rS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: fS, color: T.white, letterSpacing: '-0.02em', lineHeight: 1 }}>D</span>
      </div>
      <span style={{ fontFamily: T.font, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1 }}>
        <span style={{ fontWeight: 300, color: T.gray3 }}>hola</span><span style={{ fontWeight: 700, color: T.black }}>Doc</span>
      </span>
    </div>
  )
}

/* ─── VistaLogin ─────────────────────────────────────────────── */

const FEATURES = [
  { icon: Users,         label: 'Pacientes y odontogramas'              },
  { icon: ScanLine,      label: 'Estudios de imágenes radiográficas'    },
  { icon: ClipboardList, label: 'Historia clínica y consultas'          },
  { icon: Building2,     label: 'Obras sociales y consultorios'         },
]

function LoginLogo({ dark, size = 18 }) {
  const iS = Math.round(size * 1.9)
  const rS = Math.round(iS * 0.28)
  const fS = Math.round(iS * 0.5)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <div style={{ width: iS, height: iS, background: dark ? T.white : T.black, borderRadius: rS, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: fS, color: dark ? T.black : T.white, letterSpacing: '-0.02em', lineHeight: 1 }}>hD</span>
      </div>
      <span style={{ fontFamily: T.font, fontSize: size, letterSpacing: '-0.02em', lineHeight: 1 }}>
        <span style={{ fontWeight: 300, color: dark ? '#444' : T.gray3 }}>hola</span><span style={{ fontWeight: 700, color: dark ? T.white : T.black }}>Doc</span>
      </span>
    </div>
  )
}

/**
 * Pantalla a la que redirige MercadoPago después de pagar la suscripción (back_url del plan).
 * Muestra mensaje cálido + barra de progreso animada de 10s. Al completar, redirige al login
 * (donde el usuario inicia sesión con Google y entra como ACTIVO porque el webhook ya activó
 * su cuenta del lado del back).
 */
function VistaPostPago() {
  const isMobile = useIsMobile()
  const [progreso,    setProgreso]    = useState(0)
  // Estados: 'pidiendo-email' (default — pedimos siempre el email para vincular el pago al
  // profesional), 'activando' (submit en curso), 'ok' (activada), 'error' (algo falló).
  const [estado,      setEstado]      = useState('pidiendo-email')
  // Pre-fill best-effort desde localStorage si el user pre-registró en el mismo browser.
  // No es bloqueante si está vacío.
  const [email,       setEmail]       = useState(() => {
    try { return localStorage.getItem('postPagoEmail') || '' } catch { return '' }
  })
  const [enviando,    setEnviando]    = useState(false)
  const [errorMsg,    setErrorMsg]    = useState(null)
  const DURACION_MS = 10_000

  // preapproval_id viene en la URL que MP usa para redirigir al back_url tras el pago.
  const preapprovalId = useMemo(() => new URLSearchParams(window.location.search).get('preapproval_id'), [])

  // La barra de progreso solo arranca después de la activación (ok / error). Mientras esperamos
  // el input del user no contamos — no tendría sentido el redirect automático.
  useEffect(() => {
    if (estado !== 'ok' && estado !== 'error') return
    const inicio = Date.now()
    const tick = setInterval(() => {
      const transcurrido = Date.now() - inicio
      const pct = Math.min(100, (transcurrido / DURACION_MS) * 100)
      setProgreso(pct)
      if (pct >= 100) {
        clearInterval(tick)
        window.location.href = '/'
      }
    }, 80)
    return () => clearInterval(tick)
  }, [estado])

  function handleSubmitEmail(e) {
    e.preventDefault()
    if (!email.trim() || !preapprovalId) return
    setErrorMsg(null)
    setEnviando(true)
    fetch(`${API_URL}/auth/confirmar-pago`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim(), preapprovalId }),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data?.ok) {
          setEstado('ok')
          try { localStorage.removeItem('postPagoEmail') } catch {}
        } else {
          // El back devuelve {ok:false} si el email no existe o la preapproval no es válida.
          // Mantenemos el formulario para que el user corrija sin tener que reiniciar el flow.
          setErrorMsg('No pudimos encontrar tu cuenta con ese email. Revisá que sea el mismo con el que te registraste.')
        }
      })
      .catch(() => setErrorMsg('Hubo un error al conectar con el servidor. Probá de nuevo en unos segundos.'))
      .finally(() => setEnviando(false))
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.gray2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 16px' : '40px', fontFamily: T.font,
    }}>
      <div style={{
        background: T.white, borderRadius: 16, padding: isMobile ? '32px 24px' : '48px 56px',
        boxShadow: '0 2px 24px rgba(0,0,0,0.06)', maxWidth: 460, width: '100%', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <LoginLogo size={22} />
        </div>

        {estado === 'pidiendo-email' && (
          <>
            <Badge>Pago recibido</Badge>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', marginTop: 6 }}>
              Una cosa más
            </div>
            <div style={{ fontSize: 13, color: T.gray3, marginTop: 8, lineHeight: 1.6 }}>
              Ingresá el email con el que te registraste en holaDoc para vincular tu pago y activar tu cuenta.
            </div>
            <form onSubmit={handleSubmitEmail} style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" autoFocus required value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(null) }}
                placeholder="tu@email.com"
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${errorMsg ? '#dc2626' : T.gray1}`, borderRadius: 8, fontFamily: T.font, fontSize: 14, color: T.black, background: T.white, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
              />
              {errorMsg && (
                <div style={{ fontSize: 12, color: '#dc2626', lineHeight: 1.5, textAlign: 'left' }}>{errorMsg}</div>
              )}
              <button type="submit" disabled={enviando || !email.trim() || !preapprovalId}
                style={{ padding: '12px', background: T.black, color: T.white, border: 'none', borderRadius: 10, fontFamily: T.font, fontWeight: 700, fontSize: 13.5, cursor: (enviando || !email.trim() || !preapprovalId) ? 'not-allowed' : 'pointer', opacity: (enviando || !email.trim() || !preapprovalId) ? 0.5 : 1 }}>
                {enviando ? 'Activando…' : 'Activar mi cuenta'}
              </button>
            </form>
            {!preapprovalId && (
              <div style={{ marginTop: 14, fontSize: 11, color: T.gray4, lineHeight: 1.5 }}>
                No detectamos un pago en esta página. Si llegaste acá por error, volvé al <a href="/" style={{ color: T.black }}>login</a>.
              </div>
            )}
          </>
        )}

        {(estado === 'ok' || estado === 'error') && (
          <>
            <Badge>{estado === 'ok' ? 'Cuenta activada' : 'No pudimos activar'}</Badge>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', marginTop: 6 }}>
              {estado === 'ok' ? 'Bienvenido a la comunidad de HolaDocApp' : 'Hubo un problema activando tu cuenta'}
            </div>
            <div style={{ fontSize: 13, color: T.gray3, marginTop: 8, lineHeight: 1.6 }}>
              {estado === 'ok'
                ? 'Tu cuenta ya está activa. En unos segundos te vamos a redirigir al login para que entres con Google.'
                : 'Vamos a redirigirte al login. Si no podés entrar, contactanos para activarte manualmente.'}
            </div>

            <div style={{ marginTop: 28, height: 6, width: '100%', background: T.gray1, borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progreso}%`, background: estado === 'error' ? '#dc2626' : T.black,
                borderRadius: 100, transition: 'width 0.08s linear',
              }} />
            </div>
            <div style={{ marginTop: 10, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>
              Redirigiendo · {Math.round(progreso)}%
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VistaLogin({ onLogin }) {
  const isMobile = useIsMobile()
  const [cargando,        setCargando]        = useState(false)
  const [error,           setError]           = useState(null)
  const [modo,            setModo]            = useState('login') // 'login' | 'registro' | 'exito'
  const [form,            setForm]            = useState({ nombre: '', apellido: '', email: '', confirmarEmail: '' })
  const [turnstileToken,  setTurnstileToken]  = useState(null)
  const turnstileRef      = useRef(null)
  const turnstileWidgetId = useRef(null)

  useEffect(() => {
    if (modo !== 'registro') return
    let cancelled = false
    const tryRender = () => {
      if (cancelled) return
      if (window.turnstile && turnstileRef.current && turnstileWidgetId.current === null) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey:            TURNSTILE_SITEKEY,
          callback:           (token) => setTurnstileToken(token),
          'error-callback':   () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
          theme:              'light',
        })
      } else if (!window.turnstile) {
        setTimeout(tryRender, 150)
      }
    }
    tryRender()
    return () => {
      cancelled = true
      if (window.turnstile && turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current) } catch {}
        turnstileWidgetId.current = null
      }
      setTurnstileToken(null)
    }
  }, [modo])

  async function handleGoogleSuccess(credentialResponse) {
    setError(null); setCargando(true)
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      const res = await fetchTracked(`${API_URL}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: credentialResponse.credential }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión con Google'); return }
      onLogin({ ...data, foto: payload.picture })
    } catch { setError('No se pudo conectar con el servidor') }
    finally { setCargando(false) }
  }

  async function handleRegistro(e) {
    e.preventDefault()
    if (form.email.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) {
      setError('Los emails no coinciden'); return
    }
    if (!turnstileToken) { setError('Completá la verificación anti-bot'); return }
    setError(null); setCargando(true)
    try {
      const { confirmarEmail: _ignored, ...payload } = form
      const res = await fetchTracked(`${API_URL}/auth/registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...payload, turnstileToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta')
        if (window.turnstile && turnstileWidgetId.current !== null) {
          window.turnstile.reset(turnstileWidgetId.current)
        }
        setTurnstileToken(null)
        return
      }
      // Guardamos el email para que /post-pago lo use al confirmar el pago con el back (MP no
      // propaga external_reference desde el query string del init_point del plan, así que la
      // forma de mapear pago → profesional es vía este localStorage).
      try { localStorage.setItem('postPagoEmail', form.email.trim()) } catch {}
      setModo('exito')
    } catch { setError('No se pudo conectar con el servidor') }
    finally { setCargando(false) }
  }

  // Estilos compartidos
  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${T.gray1}`, borderRadius: 8,
    fontFamily: T.font, fontSize: 13, color: T.black,
    background: T.white, outline: 'none',
    transition: 'border-color 0.18s',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontFamily: T.mono, fontSize: 9.5,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: T.gray3, marginBottom: 7,
  }

  // ── Contenido del panel oscuro izquierdo ────────────────────────
  const leftClaim = modo === 'registro'
    ? { light: 'Co-creado', main: ['con quienes', 'lo usan', 'cada día.'], sub: 'No queremos construir una app para profesionales de la salud — queremos construirla con ellos. Cada sugerencia la leemos.' }
    : { light: 'Vos atendé.', main: ['Del resto nos', 'ocupamos', 'nosotros.'],   sub: 'Gestión clínica para profesionales independientes. Turnos, pacientes, historia clínica y finanzas — todo en un solo lugar.' }

  const leftStats = modo === 'registro'
    ? [{ v: '3',  l: 'Co-constructores' }, { v: '∞',  l: 'Sugerencias' }, { v: '0',  l: 'Burocracia' }]
    : [{ v: '1',  l: 'Solo lugar' },       { v: '0',  l: 'Planillas' },   { v: '∞',  l: 'Claridad'   }]

  const leftFeatures = modo === 'registro'
    ? ['Acceso anticipado a todas las funciones', 'Influencia directa sobre el producto', 'Tu nombre en los créditos de la app', 'Acceso gratuito de por vida para los primeros']
    : ['Turnos sincronizados con Google Calendar', 'Historia clínica completa de cada paciente', 'Finanzas en tiempo real · Por mes · Por consultorio', 'Estudios radiográficos · Archivos · Co-creado con vos']

  const leftPanel = !isMobile && (
    <div style={{
      background: T.black,
      padding: '3rem',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
      minHeight: '100vh',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}><LoginLogo dark size={17} /></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', letterSpacing: '-0.03em', lineHeight: 0.95, color: T.white, marginBottom: '1.25rem' }}>
          <span style={{ display: 'block', fontWeight: 300, color: '#444' }}>{leftClaim.light}</span>
          {leftClaim.main.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 300, color: '#666', lineHeight: 1.65, maxWidth: 380 }}>{leftClaim.sub}</div>

        <div style={{ display: 'flex', marginTop: '2.5rem', border: '1px solid #1e1e1e' }}>
          {leftStats.map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '1rem 1.25rem', borderRight: i < leftStats.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
              <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: T.white, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: T.mono, fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#444', marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: '2rem' }}>
          {leftFeatures.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#777' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#444', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {modo === 'registro' && (
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #1a1a1a', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: 12.5, fontStyle: 'italic', color: '#555', lineHeight: 1.65 }}>
            "Estamos buscando a los profesionales que quieran ayudarnos a construir el mejor sistema de gestión clínica de Argentina."
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#333', marginTop: 10 }}>
            holaDoc · Beta · 2026
          </div>
        </div>
      )}
    </div>
  )

  // ── Card derecho ────────────────────────────────────────────────
  const cardStyle = {
    width: '100%',
    background: T.white,
    border: `1px solid ${T.gray1}`,
    borderRadius: 18,
    padding: isMobile ? '2rem 1.5rem' : '2.5rem',
    boxShadow: '0 4px 40px rgba(17,17,17,0.07)',
  }

  const Badge = ({ children }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '4px 11px', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 14 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.black, display: 'inline-block', animation: 'soPulse 2s ease infinite' }} />
      {children}
    </div>
  )

  const Divider = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.gray1 }} />
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray6 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: T.gray1 }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative', background: T.gray2, fontFamily: T.font }}>
      {/* Animación del pulse del badge */}
      <style>{`@keyframes soPulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }`}</style>

      {/* Patrón de puntos de fondo */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle, #c8c8c2 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {leftPanel}

        {/* RIGHT — card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: isMobile ? '2rem 1.25rem' : '3rem', minHeight: '100vh' }}>
          <div style={cardStyle}>

            {/* Header del card */}
            <div style={{ textAlign: 'center', marginBottom: modo === 'registro' ? 18 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <LoginLogo size={20} />
              </div>
              {modo === 'registro' && <Badge>Acceso</Badge>}
              {modo === 'exito' && <Badge>Registro recibido</Badge>}
              <div style={{ fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>
                {modo === 'login'    && 'Bienvenido/a'}
                {modo === 'registro' && 'Solicitá acceso'}
                {modo === 'exito'    && 'Revisá tu casilla'}
              </div>
              <div style={{ fontSize: 12.5, color: T.gray3, marginTop: 5, lineHeight: 1.55 }}>
                {modo === 'login'    && 'Ingresá con tu cuenta de Google para acceder a tu consultorio.'}
                {modo === 'registro' && 'Completá el formulario y te contactamos para darte acceso anticipado.'}
                {modo === 'exito'    && 'Te enviamos un mail con el link para activar tu suscripción mensual. Cuando termines el pago, te redirigimos al login para que entres con Google.'}
              </div>
            </div>

            {/* Contenido por modo */}
            {modo === 'login' && (
              <>
                <Divider>Acceso seguro</Divider>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
                  {cargando
                    ? <span style={{ fontSize: 12, color: T.gray5, fontFamily: T.mono, letterSpacing: '0.1em', alignSelf: 'center' }}>Conectando…</span>
                    : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Error al iniciar sesión con Google')} locale="es" text="signin_with" size="large" width="320" />
                  }
                </div>
                {error && <div style={{ marginTop: 12, textAlign: 'center' }}><ErrorMsg>{error}</ErrorMsg></div>}

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {['Turnos sincronizados con Google Calendar', 'Historia clínica completa de cada paciente', 'Finanzas en tiempo real · Por consultorio'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: T.gray3 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.gray1, flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', color: T.gray6 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1L1.5 3v3c0 2.76 1.96 5.34 4.5 6 2.54-.66 4.5-3.24 4.5-6V3L6 1z" stroke="#bbb" strokeWidth="1" fill="none"/></svg>
                  Acceso seguro · Sin contraseñas
                </div>

                <button type="button" onClick={() => { setModo('registro'); setError(null) }} style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 18, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12.5, color: T.gray3 }}>
                  ¿No tenés acceso todavía? <u style={{ textUnderlineOffset: 3 }}>Solicitá uno acá</u>
                </button>
              </>
            )}

            {modo === 'registro' && (
              <form onSubmit={handleRegistro}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input style={inputStyle} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="María" required onFocus={e => e.target.style.borderColor = T.black} onBlur={e => e.target.style.borderColor = T.gray1} />
                  </div>
                  <div>
                    <label style={labelStyle}>Apellido</label>
                    <input style={inputStyle} value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="López" required onFocus={e => e.target.style.borderColor = T.black} onBlur={e => e.target.style.borderColor = T.gray1} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@consultorio.com" required onFocus={e => e.target.style.borderColor = T.black} onBlur={e => e.target.style.borderColor = T.gray1} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Confirmar email</label>
                  <input
                    style={{ ...inputStyle, borderColor: (form.confirmarEmail && form.email.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) ? T.red : T.gray1 }}
                    type="email"
                    value={form.confirmarEmail}
                    onChange={e => setForm(f => ({ ...f, confirmarEmail: e.target.value }))}
                    onPaste={e => e.preventDefault()}
                    placeholder="maria@consultorio.com"
                    required
                  />
                </div>

                <div ref={turnstileRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, minHeight: 65 }} />

                {error && <div style={{ marginBottom: 10 }}><ErrorMsg>{error}</ErrorMsg></div>}

                <button type="submit" disabled={cargando || !turnstileToken} style={{ width: '100%', padding: '13px', background: T.black, color: T.white, border: 'none', borderRadius: 10, fontFamily: T.font, fontWeight: 700, fontSize: 13.5, cursor: (cargando || !turnstileToken) ? 'not-allowed' : 'pointer', opacity: (cargando || !turnstileToken) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  {cargando ? 'Enviando…' : 'Solicitar acceso'}
                </button>

                <button type="button" onClick={() => { setModo('login'); setError(null) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', margin: '14px 0 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </form>
            )}

            {modo === 'exito' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <button type="button" onClick={() => { setModo('login'); setForm({ nombre: '', apellido: '', email: '', confirmarEmail: '' }); setError(null) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </div>
            )}

          </div>

          <div style={{ marginTop: 18, fontFamily: T.mono, fontSize: 9, color: T.gray6, letterSpacing: '0.08em', textAlign: 'center' }}>
            holadocapp.com · para profesionales de la salud
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── VistaCompletarPerfil ───────────────────────────────────── */

function VistaCompletarPerfil({ token, onLogin, onLogout }) {
  const [form,           setForm]           = useState({ especialidadId: '', matricula: '' })
  const [especialidades, setEspecialidades] = useState([])
  const [cargando,       setCargando]       = useState(false)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    fetchTracked(`${API_URL}/especialidades`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setEspecialidades(data) : [])
      .catch(() => {})
  }, [])

  function handleChange(e) { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setCargando(true)
    try {
      const res = await fetchTracked(`${API_URL}/auth/completar-perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ especialidadId: Number(form.especialidadId), matricula: form.matricula || null })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar el perfil'); return }
      onLogin(data)
    } catch { setError('No se pudo conectar con el servidor') }
    finally { setCargando(false) }
  }

  const selectStyle = { height: 36, width: '100%', padding: '0 12px', border: `1px solid ${T.gray1}`, borderRadius: 6, outline: 'none', background: T.white, fontSize: 13, fontFamily: T.font, color: T.black, boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ marginBottom: 8 }}><Logo size={22} /></div>
      <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 48, fontFamily: T.mono }}>
        Completar perfil profesional
      </span>
      <div style={{ width: 400 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel>Especialidad *</FieldLabel>
            <select required name="especialidadId" value={form.especialidadId} onChange={handleChange} style={selectStyle}>
              <option value="">Seleccionar…</option>
              {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Matrícula</FieldLabel>
            <Input name="matricula" value={form.matricula} onChange={handleChange} />
          </div>
          <ErrorMsg>{error}</ErrorMsg>
          <div style={{ marginTop: 4 }}>
            <Btn type="submit" disabled={cargando} fullWidth>
              {cargando ? 'Guardando…' : 'Guardar y continuar'}
            </Btn>
          </div>
          <button type="button" onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 11, color: '#999', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── VistaDashboard ─────────────────────────────────────────── */

function DashRow({ label, value, alert, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.gray1}` }}>
      <span style={{ fontFamily: T.font, fontSize: 12, color: muted ? T.gray4 : T.gray5 }}>{label}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: alert ? '#b45309' : T.black }}>{value ?? '—'}</span>
    </div>
  )
}

function DashBlock({ title, children }) {
  return (
    <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.gray1}`, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray3, display: 'block', marginBottom: 8 }}>{title}</span>
      {children}
    </div>
  )
}

function DashStatCard({ label, value, sub, dark }) {
  return (
    <div style={{ flex: 1, background: dark ? T.black : T.white, borderRadius: 10, border: `1px solid ${dark ? T.black : T.gray1}`, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: 0 }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.55)' : T.gray4, display: 'block', marginBottom: 6 }}>{label}</span>
      <span style={{ fontFamily: T.font, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: dark ? T.white : T.black, lineHeight: 1, display: 'block' }}>{value ?? '—'}</span>
      {sub && <span style={{ fontFamily: T.mono, fontSize: 9, color: dark ? 'rgba(255,255,255,0.45)' : T.gray5, letterSpacing: '0.08em', marginTop: 4, display: 'block' }}>{sub}</span>}
    </div>
  )
}

function DashBarChart({ datos, isMobile, titulo = 'Ingresos últimos 12 meses', valorField = 'total', resumenTipo = 'suma' }) {
  if (!datos || datos.length === 0) {
    return (
      <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.gray1}`, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, display: 'block', marginBottom: 12 }}>{titulo}</span>
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Sin datos</div>
      </div>
    )
  }
  const MESES_LETRA = ['E','F','M','A','M','J','J','A','S','O','N','D']
  const max = Math.max(...datos.map(d => Number(d[valorField]) || 0), 1)
  const fmtCorto = n => {
    const v = Number(n) || 0
    if (v === 0) return '$0'
    if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `$${Math.round(v/1_000)}K`
    return `$${Math.round(v)}`
  }
  const fmtFull = n => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  let resumenLabel = 'Total'
  let resumenValor = 0
  if (resumenTipo === 'promedio') {
    const conValor = datos.filter(d => Number(d[valorField]) > 0)
    resumenLabel = 'Promedio'
    resumenValor = conValor.length > 0
      ? conValor.reduce((s, d) => s + Number(d[valorField]), 0) / conValor.length
      : 0
  } else {
    resumenValor = datos.reduce((s, d) => s + (Number(d[valorField]) || 0), 0)
  }

  return (
    <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.gray1}`, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4 }}>{titulo}</span>
        <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5 }}>{resumenLabel}: <span style={{ color: T.black, fontWeight: 600 }}>{fmtFull(resumenValor)}</span></span>
      </div>
      <div style={{ display: 'flex', height: 140, gap: isMobile ? 4 : 8 }}>
        {datos.map((d, i) => {
          const v = Number(d[valorField]) || 0
          const h = max > 0 ? (v / max) * 100 : 0
          return (
            <div key={`${d.año}-${d.mes}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
                <div title={`${MESES_LETRA[d.mes-1]} ${String(d.año).slice(2)} — ${fmtFull(v)}`}
                     style={{ width: '100%', height: `${Math.max(h, v > 0 ? 2 : 0)}%`, background: T.black, borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, marginTop: 6 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, lineHeight: 1 }}>{MESES_LETRA[d.mes-1]}</span>
                {!isMobile && <span style={{ fontFamily: T.mono, fontSize: 8, color: T.gray3, lineHeight: 1 }}>{fmtCorto(v)}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VistaDashboard({ apiFetch, usuario, setVista, setTurnosFechaInicial }) {
  const isMobile    = useIsMobile()
  const [dash,      setDash]      = useState(null)
  const [turnosHoy, setTurnosHoy] = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [mesSel, setMesSel] = useState(() => {
    const d = new Date()
    return { año: d.getFullYear(), mes: d.getMonth() + 1 }
  })

  const pad = n => String(n).padStart(2, '0')

  useEffect(() => {
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T00:00:00`
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)

    apiFetch(`/turnos?desde=${encodeURIComponent(fmt(hoy))}&hasta=${encodeURIComponent(fmt(manana))}`).then(async (resHoy) => {
      if (resHoy?.ok) {
        const data = await resHoy.json()
        setTurnosHoy(data.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)))
      }
    })
  }, [apiFetch])

  // Fetch que sí depende de mesSel (consultas del mes + promedio + resto del dashboard)
  useEffect(() => {
    setCargando(true)
    const mesParam = `${mesSel.año}-${pad(mesSel.mes)}`
    apiFetch(`/dashboard?mes=${mesParam}`).then(async (res) => {
      if (res?.ok) setDash(await res.json())
      setCargando(false)
    })
  }, [apiFetch, mesSel])

  const mesNombre = new Date(mesSel.año, mesSel.mes - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const mesShort = new Date(mesSel.año, mesSel.mes - 1, 1)
    .toLocaleDateString('es-AR', { month: 'short' })

  function prevMes() {
    setMesSel(m => {
      const d = new Date(m.año, m.mes - 2, 1)
      return { año: d.getFullYear(), mes: d.getMonth() + 1 }
    })
  }
  function nextMes() {
    setMesSel(m => {
      const d = new Date(m.año, m.mes, 1)
      return { año: d.getFullYear(), mes: d.getMonth() + 1 }
    })
  }
  const esHoy = (() => { const n = new Date(); return mesSel.año === n.getFullYear() && mesSel.mes === n.getMonth() + 1 })()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>

      <div style={{ padding: isMobile ? '16px 16px 10px' : '20px 24px 14px', flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontSize: isMobile ? 17 : 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>
          Bienvenido/a, {usuario?.nombre}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 16px 24px' : '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Total pacientes (independiente del mes) ── */}
        <DashStatCard
          label="Total pacientes"
          value={cargando && dash == null ? '…' : dash?.pacientesTotal}
          dark
        />

        {/* ── Sección scopeada al mes seleccionado ── */}
        <div style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.gray1}`, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button onClick={prevMes} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${T.gray1}`, background: T.white, color: T.gray4, fontFamily: T.mono, fontSize: 13, flexShrink: 0 }}>‹</button>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4, flex: 1, textAlign: 'center' }}>{mesNombre}</span>
            <button onClick={nextMes} disabled={esHoy} style={{ all: 'unset', cursor: esHoy ? 'default' : 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${T.gray1}`, background: T.white, color: esHoy ? T.gray1 : T.gray4, fontFamily: T.mono, fontSize: 13, flexShrink: 0 }}>›</button>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12 }}>
            <DashStatCard
              label="Cantidad consultas"
              value={cargando ? '…' : dash?.consultasMes}
            />
            <DashStatCard
              label="Promedio consultas por día"
              value={cargando ? '…' : (dash?.promedioConsultasPorDia != null ? dash.promedioConsultasPorDia.toFixed(1) : '—')}
            />
          </div>
        </div>

        {/* ── Pendientes mañana ── */}
        {!cargando && dash != null && (
          <button onClick={() => {
            const manana = new Date(); manana.setDate(manana.getDate() + 1); manana.setHours(0,0,0,0)
            setTurnosFechaInicial?.(manana)
            setVista?.('turnos')
          }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: dash.turnosPendientesManana > 0 ? T.black : T.white, border: `1px solid ${dash.turnosPendientesManana > 0 ? T.black : T.gray1}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: dash.turnosPendientesManana > 0 ? 'rgba(255,255,255,0.12)' : T.gray2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 700, color: dash.turnosPendientesManana > 0 ? T.white : T.gray4, lineHeight: 1 }}>{dash.turnosPendientesManana}</span>
            </div>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: dash.turnosPendientesManana > 0 ? T.white : T.black, letterSpacing: '-0.01em' }}>
                {dash.turnosPendientesManana === 1 ? 'turno sin confirmar' : 'turnos sin confirmar'} para mañana
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: dash.turnosPendientesManana > 0 ? 'rgba(255,255,255,0.45)' : T.gray5, marginTop: 3 }}>
                Ir a turnos →
              </div>
            </div>
          </button>
        )}

        {/* ── Turnos de hoy ── */}
        <div style={{ flex: 1, minHeight: isMobile ? 320 : 0 }}>
          <TurnosHoyPanel turnos={turnosHoy} onClickTurno={() => setVista?.('turnos')} />
        </div>

      </div>
    </div>
  )
}

/* ─── VistaPlaceholder ───────────────────────────────────────── */

function VistaPlaceholder({ titulo }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: T.black }}>{titulo}</span>
      <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.mono }}>Próximamente</span>
    </div>
  )
}

function VistaDesktopOnly({ titulo, onVolver }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '24px 28px', textAlign: 'center', background: T.gray2 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
        <rect x="6" y="11" width="44" height="28" rx="2" stroke={T.gray3} strokeWidth="2" />
        <path d="M22 45 L34 45" stroke={T.gray3} strokeWidth="2" strokeLinecap="round" />
        <path d="M28 39 L28 45" stroke={T.gray3} strokeWidth="2" />
      </svg>
      <div>
        <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.black, letterSpacing: '-0.01em' }}>{titulo}</div>
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>
          Esta sección está optimizada para escritorio. Accedé desde una pantalla más grande para ver y gestionar.
        </div>
      </div>
      {onVolver && <Btn variant="outline" size="sm" onClick={onVolver}>Volver al inicio</Btn>}
    </div>
  )
}

/* ─── VistaABMSimple (consultorios, obras sociales, medios de pago) ── */

function NombreCard({ item, onEliminar }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', boxSizing: 'border-box', borderTop: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderRight: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderBottom: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: hov ? `3px solid ${T.black}` : `3px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s', minHeight: 56, borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: T.black, lineHeight: 1.3, fontFamily: T.font, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.nombre}
      </div>
      <button onClick={onEliminar}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: T.gray5, padding: 4, display: 'flex', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = T.red}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  )
}

function VistaABMSimple({ apiFetch, endpoint, titulo, panelTitulo, addLabel, msgVacio, msgConfirmar, storageKey, placeholder }) {
  const isMobile = useIsMobile()
  const [items,     setItems]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [nombre,    setNombre]    = useState('')
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [buscar,    setBuscar]    = useState('')
  const { openConfirm, dialog }   = useConfirm()

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch(endpoint)
    if (!res) return
    if (res.ok) setItems(await res.json())
    else setError('Error al cargar')
    setCargando(false)
  }, [apiFetch, endpoint])

  useEffect(() => { cargar() }, [cargar])

  function cerrarPanel() { setPanelOpen(false); setNombre(''); setFormErr(null) }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setFormErr('El nombre es requerido'); return }
    setFormErr(null); setGuardando(true)
    const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ nombre: nombre.trim() }) })
    if (!res) return
    if (res.ok) { cerrarPanel(); cargar() }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  async function handleEliminar(id) {
    if (!await openConfirm(msgConfirmar)) return
    const res = await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' })
    if (!res) return
    if (res.ok || res.status === 204) { cargar(); return }
    if (res.status === 409) {
      const body = await res.json().catch(() => null)
      setError(body?.error || 'No se puede eliminar porque está en uso.')
    }
  }

  const filtrados = buscar.trim()
    ? items.filter(i => i.nombre.toLowerCase().includes(buscar.toLowerCase()))
    : items

  const msgEmpty = buscar.trim() ? 'Sin resultados' : msgVacio

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>{titulo}</PageTitle>
        {!isMobile && <Btn onClick={() => setPanelOpen(true)}>{addLabel}</Btn>}
      </PageBar>

      <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 96px' : '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 36, paddingLeft: 12, flex: 1, maxWidth: isMobile ? 'none' : 360, borderRadius: 8, background: T.white }}>
            <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msgEmpty}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map(item => <NombreCard key={item.id} item={item} onEliminar={() => handleEliminar(item.id)} />)}
            </div>
          )}
        </div>

      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={panelTitulo} width={380}
        footer={<>
          <Btn variant="outline" onClick={cerrarPanel} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
        </>}
      >
        <form onSubmit={handleGuardar} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel>Nombre *</FieldLabel>
            <Input required value={nombre} onChange={e => setNombre(e.target.value)} placeholder={placeholder} />
          </div>
          <ErrorMsg>{formErr}</ErrorMsg>
        </form>
      </SidePanel>
      {dialog}

      {isMobile && !panelOpen && (
        <FabAcciones acciones={[
          { label: addLabel.replace(/^[+ ]+/, ''), onClick: () => setPanelOpen(true), variant: 'primary' },
        ]} />
      )}
    </div>
  )
}

function VistaConsultorios({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/consultorios" titulo="Consultorios" panelTitulo="Nuevo consultorio" addLabel="+ Agregar" msgVacio="No hay consultorios registrados" msgConfirmar="¿Eliminar este consultorio?" storageKey="consultorios-vista" placeholder="Ej: Casa Central, Sucursal Norte…" />
}

function VistaObrasSociales({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/obras-sociales" titulo="Obras sociales" panelTitulo="Nueva obra social" addLabel="+ Nueva obra social" msgVacio="No hay obras sociales registradas" msgConfirmar="¿Eliminar esta obra social?" storageKey="obras-sociales-vista" placeholder="Ej: OSDE, Swiss Medical, IOMA…" />
}

function VistaEspecialidades({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/especialidades" titulo="Especialidades" panelTitulo="Nueva especialidad" addLabel="+ Agregar" msgVacio="No hay especialidades registradas" msgConfirmar="¿Eliminar esta especialidad?" storageKey="especialidades-vista" placeholder="Ej: Ortodoncia, Endodoncia, Periodoncia…" />
}

function FilaSimple({ cols, gridCols, onEliminar, compact = false }) {
  const [hov, setHov] = useState(false)
  const [hovT, setHovT] = useState(false)

  if (compact) {
    return (
      <div style={{ padding: '14px 16px', minHeight: 52, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: T.white }}>
        <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.black, letterSpacing: '0.01em' }}>{cols[0]}</span>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: `${gridCols} 40px`, padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, transition: 'background 0.1s' }}
    >
      {cols.map((val, i) => (
        <span key={i} style={{ fontFamily: T.font, fontSize: 13, fontWeight: i === 0 ? 500 : 400, color: i === 0 ? T.black : T.gray4, letterSpacing: '0.02em' }}>{val}</span>
      ))}
      <button onClick={onEliminar} onMouseEnter={() => setHovT(true)} onMouseLeave={() => setHovT(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovT ? T.red : T.gray5, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  )
}

/* ─── EmptyOrError ───────────────────────────────────────────── */

function PacientePicker({ pacientes, value, onChange, placeholder = 'Buscar por nombre o DNI…' }) {
  const [query, setQuery] = useState('')
  const selec = pacientes.find(p => String(p.id) === String(value))
  const filtrados = query.length > 0
    ? pacientes.filter(p =>
        `${p.apellido} ${p.nombre} ${p.dni ?? ''}`.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []
  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange('') }}
        onBlur={() => setTimeout(() => setQuery(''), 150)}
        placeholder={selec ? `${selec.apellido}, ${selec.nombre}` : placeholder}
        style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, outline: 'none', boxSizing: 'border-box', background: T.white }}
      />
      {filtrados.length > 0 && (
        <div style={{ position: 'absolute', top: 38, left: 0, right: 0, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 6, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {filtrados.map(p => (
            <div key={p.id}
              onMouseDown={() => { onChange(p.id); setQuery('') }}
              style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontFamily: T.font, color: T.black, borderBottom: `1px solid ${T.gray1}` }}
              onMouseEnter={e => e.currentTarget.style.background = T.gray2}
              onMouseLeave={e => e.currentTarget.style.background = T.white}
            >
              <span style={{ fontWeight: 500 }}>{p.apellido}, {p.nombre}</span>
              {p.dni && <span style={{ fontSize: 11, color: T.gray4, marginLeft: 8 }}>DNI {p.dni}</span>}
            </div>
          ))}
        </div>
      )}
      {query.length > 0 && filtrados.length === 0 && (
        <div style={{ position: 'absolute', top: 38, left: 0, right: 0, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: T.gray4, fontFamily: T.font, zIndex: 50 }}>
          Sin resultados
        </div>
      )}
    </div>
  )
}

function EmptyOrError({ cargando, error, empty, msg }) {
  if (cargando) return <div style={{ padding: '3rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
  if (error)    return <div style={{ padding: '2rem 24px', fontSize: 13, color: T.red, fontFamily: T.font }}>{error}</div>
  if (empty)    return <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msg}</div>
  return null
}

const TIPO_PAGO = {
  PARTICULAR: 'Particular',
  OBRA_SOCIAL: 'Obra social',
  OTRO: 'Otro',
}

/* ─── VistaPacientes ─────────────────────────────────────────── */

const VACÍO_FORM = { apellido: '', nombre: '', dni: '', fechaNac: '', telefono: '', email: '', direccion: '', obrasSociales: [], ocupacion: '', grupoSanguineo: '', alergias: '', medicaciones: '', antecedentes: '', antecedentesFamiliares: '', peso: '', altura: '' }

function buildObrasSocialesBody(lista) {
  return (lista || [])
    .filter(o => o.obraSocialId)
    .map(o => ({
      obraSocialId: Number(o.obraSocialId),
      nroAfiliado:  o.nroAfiliado || null,
      plan:         o.plan || null,
      titular:      o.titular || null,
    }))
}
const COLS_PAC = [{ label: 'Paciente', w: '2fr' }, { label: 'DNI', w: '1fr' }, { label: 'Teléfono', w: '1fr' }, { label: 'Obra social', w: '1.5fr' }, { label: 'Registrado', w: '1fr' }]

function VistaNuevoPaciente({ apiFetch, onVolver, onCreado }) {
  const [form,      setForm]      = useState(VACÍO_FORM)
  const [guardando, setGuardando] = useState(false)
  const [err,       setErr]       = useState(null)

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.apellido.trim() || !form.nombre.trim()) { setErr('Apellido y nombre son requeridos'); return }
    setErr(null); setGuardando(true)
    const body = { nombre: form.nombre, apellido: form.apellido, dni: form.dni || null, fechaNac: form.fechaNac || null, telefono: form.telefono || null, email: form.email || null, direccion: form.direccion || null, obrasSociales: buildObrasSocialesBody(form.obrasSociales), ocupacion: form.ocupacion || null, grupoSanguineo: form.grupoSanguineo || null, alergias: form.alergias || null, medicaciones: form.medicaciones || null, antecedentes: form.antecedentes || null, antecedentesFamiliares: form.antecedentesFamiliares || null, peso: form.peso ? Number(form.peso) : null, altura: form.altura ? Number(form.altura) : null }
    const res = await apiFetch('/pacientes', { method: 'POST', body: JSON.stringify(body) })
    if (!res) { setGuardando(false); return }
    if (res.ok) {
      const d = await res.json()
      onCreado?.(d.id)
    } else {
      const e = await res.json().catch(() => null)
      setErr(e?.error || 'Error al registrar')
      setGuardando(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', flexShrink: 0 }}>
        <BackBtn onClick={onVolver} />
        <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Nuevo paciente</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        <form onSubmit={handleCrear} style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, padding: 24, maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <PacienteFormFields form={form} handleChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))} setField={(name, val) => setForm(p => ({ ...p, [name]: val }))} apiFetch={apiFetch} />
          <ErrorMsg>{err}</ErrorMsg>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="outline" type="button" onClick={onVolver} disabled={guardando}>Cancelar</Btn>
            <Btn type="submit" disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar paciente'}</Btn>
          </div>
        </form>
      </div>
    </div>
  )
}

function VistaPacientes({ apiFetch, onIrAConsultorios, usuario }) {
  const [sub,              setSub]              = useState('lista')
  const [pacienteId,       setPacienteId]       = useState(null)
  const [estudioIdAbierto, setEstudioIdAbierto] = useState(null)
  const [consultaActual,   setConsultaActual]   = useState(null)

  function abrirDetalle(id)             { setPacienteId(id); setSub('detalle') }
  function volver()                     { setSub('lista'); setPacienteId(null) }
  function volverADetalle()             { setSub('detalle') }
  function abrirNuevoEstudio()         { setEstudioIdAbierto(null); setSub('estudios') }
  function abrirEstudioExistente(id)   { setEstudioIdAbierto(id);   setSub('estudios') }
  function abrirNuevaConsulta()        { setConsultaActual(null);   setSub('nueva-consulta') }
  function abrirEditarConsulta(c)      { setConsultaActual(c);      setSub('nueva-consulta') }

  if (sub === 'lista')           return <ListaPacientes apiFetch={apiFetch} onDetalle={abrirDetalle} onNuevo={() => setSub('nuevo')} />
  if (sub === 'nuevo')           return <VistaNuevoPaciente apiFetch={apiFetch} onVolver={() => setSub('lista')} onCreado={abrirDetalle} />
  if (sub === 'detalle')         return <DetallePaciente apiFetch={apiFetch} id={pacienteId} onVolver={volver} onNuevoEstudio={abrirNuevoEstudio} onAbrirEstudio={abrirEstudioExistente} onIrAConsultorios={onIrAConsultorios} onIniciarConsulta={abrirNuevaConsulta} onEditarConsulta={abrirEditarConsulta} usuario={usuario} />
  if (sub === 'estudios')        return <VistaEstudios apiFetch={apiFetch} pacienteIdInicial={pacienteId} estudioIdInicial={estudioIdAbierto} onVolver={volverADetalle} />
  if (sub === 'nueva-consulta')  return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteId} onVolver={volverADetalle} usuario={usuario} consulta={consultaActual} />
  return null
}

function StatCard({ label, value, sub, inverted = false, pct = null, trend = null, bottomRight = null, bottomRightLabel = null, pendienteInfo = null, desglose = null, action = null, style: styleProp }) {
  return (
    <div style={{
      background: inverted ? T.black : T.white,
      border: `1px solid ${inverted ? T.black : T.gray1}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      ...styleProp,
    }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: inverted ? 'rgba(255,255,255,0.45)' : T.gray3 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: T.font, fontSize: 38, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: inverted ? T.white : T.black }}>
          {value ?? '—'}
        </span>
        {pct && (
          <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: inverted ? 'rgba(255,255,255,0.5)' : T.gray4 }}>
            {pct}
          </span>
        )}
        {trend && (
          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: trend.up ? (inverted ? '#4ade80' : '#16a34a') : (inverted ? '#f87171' : '#dc2626') }}>
            {trend.up ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {sub
          ? <span style={{ fontFamily: T.mono, fontSize: 9, color: inverted ? 'rgba(255,255,255,0.35)' : T.gray3, letterSpacing: '0.08em' }}>{sub}</span>
          : <span />
        }
        {bottomRight && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: inverted ? 'rgba(255,255,255,0.4)' : T.gray3 }}>{bottomRightLabel ?? 'balance'}</span>
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: inverted ? T.white : T.black }}>{bottomRight}</span>
          </div>
        )}
        {pendienteInfo && pendienteInfo.count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.6)', borderLeft: '2px solid #f59e0b', paddingLeft: 6, fontWeight: 600 }}>
              {pendienteInfo.count} pendiente{pendienteInfo.count !== 1 ? 's' : ''}
            </span>
            <button onClick={pendienteInfo.onVer} style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.15)', color: T.white, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 8px', cursor: 'pointer' }}>
              Ver
            </button>
          </div>
        )}
      </div>
      {desglose && desglose.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${inverted ? 'rgba(255,255,255,0.12)' : T.gray1}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {desglose.map((d, i) => {
            const acc = d.highlight ? '#fbbf24' : null
            const clickable = typeof d.onClick === 'function'
            const Wrap = clickable ? 'button' : 'div'
            return (
              <Wrap
                key={i}
                onClick={clickable ? d.onClick : undefined}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
                  background: 'none', border: 'none', padding: 0, textAlign: 'left',
                  cursor: clickable ? 'pointer' : 'default',
                  fontFamily: 'inherit', color: 'inherit',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.font, fontSize: 12, color: acc ?? (inverted ? 'rgba(255,255,255,0.6)' : T.gray4) }}>
                  {d.highlight && (
                    <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: acc, color: T.black, fontFamily: T.font, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>!</span>
                  )}
                  {d.label}
                  {clickable && <span aria-hidden style={{ fontFamily: T.font, fontSize: 12, marginLeft: 2, color: acc ?? (inverted ? 'rgba(255,255,255,0.5)' : T.gray4) }}>›</span>}
                </span>
                <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: acc ?? (inverted ? T.white : T.black) }}>{d.value}</span>
              </Wrap>
            )
          })}
        </div>
      )}
      {action && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${inverted ? 'rgba(255,255,255,0.12)' : T.gray2}` }}>
          <button onClick={action.onClick}
            style={{
              width: '100%',
              fontFamily: T.font, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: inverted ? T.white : T.black,
              color:      inverted ? T.black : T.white,
              border: 'none', borderRadius: 100,
              padding: '12px 16px', cursor: 'pointer',
              transition: 'transform 0.15s',
              boxShadow: inverted ? 'none' : '0 2px 8px rgba(0,0,0,0.12)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

const PIE_COLORS = ['#18181b', '#3b82f6', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#c2410c']

/**
 * Empty state para cards que normalmente muestran un PieChart (o gráfico chico).
 * Mini-ícono de pie chart en grises + mensaje breve.
 */
function EmptyChart({ mensaje = 'Sin movimientos en este mes', minHeight = 110 }) {
  return (
    <div style={{ flex: 1, minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px 16px' }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <circle cx="20" cy="20" r="14" fill="#f3f3f1" />
        <path d="M20 6 A14 14 0 0 1 33.13 14.18 L20 20 Z" fill="#e2e2df" />
        <path d="M33.13 14.18 A14 14 0 0 1 28.49 30.81 L20 20 Z" fill="#cfcfcb" />
        <circle cx="20" cy="20" r="5.5" fill={T.white} />
      </svg>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, textAlign: 'center', lineHeight: 1.4, letterSpacing: '0.01em' }}>
        {mensaje}
      </span>
    </div>
  )
}

function PieChart({ items }) {
  const total = items.reduce((s, [, d]) => s + d.total, 0)
  if (!total) return null

  const R = 56, r = 28, cx = 70, cy = 70
  let ang = -Math.PI / 2

  const slices = items.map(([label, data], idx) => {
    const fraction = data.total / total
    const sweep = fraction * 2 * Math.PI
    const start = ang
    ang += sweep
    const end = ang
    const mid = start + sweep / 2
    const large = sweep > Math.PI ? 1 : 0
    const cos1 = Math.cos(start), sin1 = Math.sin(start)
    const cos2 = Math.cos(end),   sin2 = Math.sin(end)
    const path = [
      `M ${cx + R * cos1} ${cy + R * sin1}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * cos2} ${cy + R * sin2}`,
      `L ${cx + r * cos2} ${cy + r * sin2}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * cos1} ${cy + r * sin1}`,
      'Z'
    ].join(' ')
    const labelR = (R + r) / 2
    return {
      label, data, path,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      pct: Math.round(fraction * 100),
      lx: cx + labelR * Math.cos(mid),
      ly: cy + labelR * Math.sin(mid),
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <svg width={120} height={120} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {slices.length === 1
          ? <>
              <circle cx={cx} cy={cy} r={R} fill={slices[0].color} />
              <circle cx={cx} cy={cy} r={r} fill="white" />
              {slices[0].pct >= 8 && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight={700}>{slices[0].pct}%</text>
              )}
            </>
          : <>
              {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />)}
              {slices.map((s, i) => s.pct >= 8 && (
                <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={700}>{s.pct}%</text>
              ))}
            </>
        }
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: T.font, fontSize: 13, color: T.black, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{s.label}</span>
            <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.black, flexShrink: 0 }}>{fmtPesos(s.data.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListaPacientes({ apiFetch, onDetalle, onNuevo }) {
  const isMobile = useIsMobile()
  const [buscar,      setBuscar]      = useState('')
  const [pacientes,   setPacientes]   = useState([])
  const [meta,        setMeta]        = useState(null)   // { last, number, totalElements }
  const [cargando,    setCargando]    = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error,       setError]       = useState(null)
  const [vista,       setVista]       = useState(() => localStorage.getItem('pacientes-vista') ?? 'list')

  function toggleVista(v) { setVista(v); localStorage.setItem('pacientes-vista', v) }

  const cargar = useCallback(async (q, page = 0) => {
    if (page === 0) { setCargando(true); setError(null) }
    else setCargandoMas(true)
    const params = new URLSearchParams({ size: 50, page, sort: 'apellido,asc' })
    if (q) params.set('buscar', q)
    const res = await apiFetch(`/pacientes?${params}`)
    if (res?.ok) {
      const data = await res.json()
      setPacientes(prev => page === 0 ? data.content : [...prev, ...data.content])
      setMeta({ last: data.last, number: data.number, totalElements: data.totalElements })
    } else {
      setError('Error al cargar pacientes')
    }
    if (page === 0) setCargando(false)
    else setCargandoMas(false)
  }, [apiFetch])

  useEffect(() => {
    const t = setTimeout(() => cargar(buscar, 0), buscar ? 350 : 0)
    return () => clearTimeout(t)
  }, [buscar, cargar])

  const msgVacio = buscar ? 'Sin resultados' : 'No hay pacientes registrados'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>Pacientes</PageTitle>
        {!isMobile && <Btn onClick={onNuevo}>+ Nuevo paciente</Btn>}
      </PageBar>

      <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 96px' : '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 36, paddingLeft: 12, flex: 1, maxWidth: isMobile ? 'none' : 360, borderRadius: 8, background: T.white }}>
            <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o DNI…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: T.font, color: T.black, letterSpacing: '0.02em', width: '100%' }} />
          </div>
          {!isMobile && meta && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{meta.totalElements} pacientes</span>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : error ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, color: T.red, fontFamily: T.font }}>{error}</div>
          ) : pacientes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msgVacio}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pacientes.map(p => <PacienteCard key={p.id} paciente={p} onClick={() => onDetalle(p.id)} onEliminar={() => cargar(buscar, 0)} apiFetch={apiFetch} />)}
            </div>
          )}
          {!cargando && !error && !meta?.last && pacientes.length > 0 && (
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <Btn variant="outline" onClick={() => cargar(buscar, (meta?.number ?? 0) + 1)} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando…' : `Cargar más`}
              </Btn>
            </div>
          )}
        </div>

      </div>

      {isMobile && (
        <FabAcciones acciones={[
          { label: 'Nuevo paciente', onClick: onNuevo, variant: 'primary' },
        ]} />
      )}
    </div>
  )
}

function PacienteCard({ paciente: p, onClick, onEliminar, apiFetch }) {
  const [hov, setHov] = useState(false)
  const { openConfirm, dialog } = useConfirm()

  async function handleEliminar(e) {
    e.stopPropagation()
    if (!await openConfirm(`¿Eliminar a ${p.apellido}, ${p.nombre}?`)) return
    const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
    if (res && res.ok) onEliminar()
  }

  return (
    <>
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: '100%', boxSizing: 'border-box', borderTop: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderRight: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderBottom: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: hov ? `3px solid ${T.black}` : `3px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'pointer', borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <button
        onClick={handleEliminar}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: T.gray5, padding: 4, display: 'flex', transition: 'color 0.15s', zIndex: 1 }}
        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = T.red }}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.black, paddingRight: 28, lineHeight: 1.3, fontFamily: T.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {p.apellido}, {p.nombre}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: T.gray4, fontFamily: T.font }}>
        {p.dni && <span>DNI {p.dni}</span>}
        {p.telefono && <span>{p.telefono}</span>}
      </div>
      {p.obrasSociales?.length > 0 && <div style={{ fontSize: 10, color: T.gray3, fontFamily: T.mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{p.obrasSociales[0].obraSocialNombre}{p.obrasSociales.length > 1 ? ` +${p.obrasSociales.length - 1}` : ''}</div>}
    </div>
    {dialog}
    </>
  )
}

function FilaPaciente({ paciente: p, onClick, onEliminar, apiFetch, compact = false }) {
  const [hov,  setHov]  = useState(false)
  const [hovT, setHovT] = useState(false)
  const { openConfirm, dialog } = useConfirm()

  async function handleEliminar(e) {
    e.stopPropagation()
    if (!await openConfirm(`¿Eliminar a ${p.apellido}, ${p.nombre}?`)) return
    const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
    if (res && res.ok) onEliminar()
  }

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{ padding: '14px 16px', minHeight: 52, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, cursor: 'pointer', background: T.white }}
      >
        <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.black, letterSpacing: '0.01em' }}>
          {p.apellido}, {p.nombre}
        </span>
      </div>
    )
  }

  return (
    <>
    <div
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr 40px', padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, cursor: 'pointer', transition: 'background 0.1s' }}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{p.apellido}, {p.nombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.dni || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.telefono || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.obrasSociales?.length > 0 ? `${p.obrasSociales[0].obraSocialNombre}${p.obrasSociales.length > 1 ? ` +${p.obrasSociales.length - 1}` : ''}` : '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{fmtFecha(p.dateCreated)}</span>
      <button onClick={handleEliminar} onMouseEnter={e => { e.stopPropagation(); setHovT(true) }} onMouseLeave={() => setHovT(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovT ? T.red : T.gray6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>
        ✕
      </button>
    </div>
    {dialog}
    </>
  )
}

/* ─── DetallePaciente ────────────────────────────────────────── */

const hoyISO = () => new Date().toISOString().slice(0, 10)
const VACÍO_CO_DET = { consultorioId: '', fecha: hoyISO(), descripcion: '', monto: '', tipoPago: 'PARTICULAR' }

function DetallePaciente({ apiFetch, id, onVolver, onNuevoEstudio, onAbrirEstudio, onIrAConsultorios, onIniciarConsulta, onEditarConsulta, usuario }) {
  const isMobile = useIsMobile()
  const [paciente,        setPaciente]        = useState(null)
  const [cargando,        setCargando]        = useState(true)
  const [error,           setError]           = useState(null)
  const [panelEdit,       setPanelEdit]       = useState(false)
  const [formEdit,        setFormEdit]        = useState(VACÍO_FORM)
  const [guardando,       setGuardando]       = useState(false)
  const [editErr,         setEditErr]         = useState(null)
  const [consultas,       setConsultas]       = useState([])
  const [cargandoCO,      setCargandoCO]      = useState(true)
  const { openConfirm, dialog }               = useConfirm()
  const [estudiosList,    setEstudiosList]    = useState([])
  const [cargandoAnal,    setCargandoAnal]    = useState(true)
  const [tab,             setTab]             = useState('historia')
  const [datosOpen,       setDatosOpen]       = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch(`/pacientes/${id}`)
    if (!res) return
    if (res.ok) setPaciente(await res.json())
    else setError('No se pudo cargar el paciente')
    setCargando(false)
  }, [apiFetch, id])

  const cargarConsultas = useCallback(async () => {
    setCargandoCO(true)
    const res = await apiFetch(`/consultas/paciente/${id}`)
    if (res?.ok) setConsultas(await res.json())
    setCargandoCO(false)
  }, [apiFetch, id])

  const cargarEstudiosPaciente = useCallback(async () => {
    setCargandoAnal(true)
    const res = await apiFetch(`/estudios/paciente/${id}`)
    if (res?.ok) setEstudiosList(await res.json())
    setCargandoAnal(false)
  }, [apiFetch, id])

  async function handleEliminarEstudio(estudioId) {
    if (!await openConfirm('¿Eliminar este estudio?')) return
    await apiFetch(`/estudios/${estudioId}`, { method: 'DELETE' })
    cargarEstudiosPaciente()
  }

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { cargarConsultas() }, [cargarConsultas])
  useEffect(() => { cargarEstudiosPaciente() }, [cargarEstudiosPaciente])

  function abrirEdit() {
    if (!paciente) return
    setFormEdit({
      apellido: paciente.apellido ?? '', nombre: paciente.nombre ?? '', dni: paciente.dni ?? '',
      fechaNac: paciente.fechaNac ?? '', telefono: paciente.telefono ?? '', email: paciente.email ?? '',
      direccion: paciente.direccion ?? '',
      obrasSociales: (paciente.obrasSociales ?? []).map(o => ({
        obraSocialId:     o.obraSocialId ?? '',
        obraSocialNombre: o.obraSocialNombre ?? '',
        nroAfiliado:      o.nroAfiliado ?? '',
        plan:             o.plan ?? '',
        titular:          o.titular ?? '',
      })),
      ocupacion: paciente.ocupacion ?? '',
      grupoSanguineo: paciente.grupoSanguineo ?? '', alergias: paciente.alergias ?? '',
      medicaciones: paciente.medicaciones ?? '', antecedentes: paciente.antecedentes ?? '',
      antecedentesFamiliares: paciente.antecedentesFamiliares ?? '',
      peso: paciente.peso ?? '', altura: paciente.altura ?? '',
    })
    setEditErr(null)
    setPanelEdit(true)
  }

  async function handleGuardarEdit(e) {
    e.preventDefault(); setEditErr(null); setGuardando(true)
    const body = { nombre: formEdit.nombre, apellido: formEdit.apellido, dni: formEdit.dni || null, fechaNac: formEdit.fechaNac || null, telefono: formEdit.telefono || null, email: formEdit.email || null, direccion: formEdit.direccion || null, obrasSociales: buildObrasSocialesBody(formEdit.obrasSociales), ocupacion: formEdit.ocupacion || null, grupoSanguineo: formEdit.grupoSanguineo || null, alergias: formEdit.alergias || null, medicaciones: formEdit.medicaciones || null, antecedentes: formEdit.antecedentes || null, antecedentesFamiliares: formEdit.antecedentesFamiliares || null, peso: formEdit.peso ? Number(formEdit.peso) : null, altura: formEdit.altura ? Number(formEdit.altura) : null }
    const res = await apiFetch(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { setPanelEdit(false); cargar() }
    else { const err = await res.json().catch(() => null); setEditErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  if (cargando) return <Cargando />
  if (error)    return <ErrorScreen msg={error} onVolver={onVolver} />

  const p = paciente

  const edad = p.fechaNac ? (() => {
    const today = new Date(), nac = new Date(p.fechaNac)
    let e = today.getFullYear() - nac.getFullYear()
    if (today.getMonth() < nac.getMonth() || (today.getMonth() === nac.getMonth() && today.getDate() < nac.getDate())) e--
    return e
  })() : null

  const esOdontologo = usuario?.especialidadNombre?.toLowerCase().includes('odontolog')

  // ── Mobile: hero + tabs scrolleables + contenido del tab ───────────
  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        {/* top bar minimal */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${T.gray1}`, background: T.white }}>
          <BackBtn onClick={onVolver} />
        </div>

        {/* hero compacto */}
        <div style={{ flexShrink: 0, padding: '14px 16px', borderBottom: `1px solid ${T.gray1}`, background: T.white, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.white, textTransform: 'uppercase' }}>{p.nombre?.[0]}{p.apellido?.[0]}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.apellido}, {p.nombre}
            </div>
            <div style={{ fontFamily: T.font, fontSize: 12, color: T.gray5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {edad != null && `${edad} años`}
              {edad != null && p.obrasSociales?.length > 0 && ' · '}
              {p.obrasSociales?.length > 0 && (p.obrasSociales[0].obraSocialNombre + (p.obrasSociales.length > 1 ? ` +${p.obrasSociales.length - 1}` : ''))}
            </div>
          </div>
          <Btn size="sm" variant="outline" onClick={() => setDatosOpen(true)}>Ver datos</Btn>
        </div>

        {/* tabs scrolleables */}
        <div style={{ flexShrink: 0, display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.gray1}`, background: T.white, scrollbarWidth: 'none' }}>
          <style>{`div[data-tabs-mobile]::-webkit-scrollbar { display: none; }`}</style>
          <div data-tabs-mobile style={{ display: 'flex' }}>
            {[
              { key: 'historia',    label: 'Historia', count: !cargandoCO ? consultas.length : null },
              esOdontologo && { key: 'odontograma', label: 'Odontograma' },
              { key: 'estudios',    label: 'Estudios', count: !cargandoAnal ? estudiosList.length : null },
            ].filter(Boolean).map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding: '12px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderBottom: tab === key ? `2px solid ${T.black}` : '2px solid transparent', background: 'none', color: tab === key ? T.black : T.gray5, cursor: 'pointer', fontFamily: T.font, fontWeight: tab === key ? 500 : 400, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                {label}
                {count != null && <span style={{ fontSize: 10, color: tab === key ? T.gray4 : T.gray5 }}>({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* contenido del tab */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'historia' && (
            <div style={{ padding: '16px', paddingBottom: 96 }}>
              <HistoriaClinica consultas={consultas} cargando={cargandoCO} apiFetch={apiFetch} onRefresh={cargarConsultas} onEditarConsulta={onEditarConsulta} />
            </div>
          )}
          {tab === 'odontograma' && (
            <div style={{ padding: '16px', paddingBottom: 96 }}>
              <Odontograma apiFetch={apiFetch} pacienteId={id} />
            </div>
          )}
          {tab === 'estudios' && (
            <div style={{ padding: '16px', paddingBottom: 96 }}>
              {cargandoAnal ? (
                <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font, display: 'block', padding: 16 }}>Cargando…</span>
              ) : estudiosList.length === 0 ? (
                <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font, letterSpacing: '0.04em', display: 'block', padding: 16 }}>Sin estudios registrados</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {estudiosList.map(a => (
                    <EstudioCard key={a.id} a={a} onAbrir={() => onAbrirEstudio(a.id)} onEliminar={() => handleEliminarEstudio(a.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <SidePanel open={datosOpen} onClose={() => setDatosOpen(false)} title="Datos del paciente" width={480}
          footer={<Btn variant="outline" onClick={() => { setDatosOpen(false); abrirEdit(); }}>Editar paciente</Btn>}
        >
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, padding: 16 }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 12 }}>Datos personales</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DatoClinico label="DNI"          value={p.dni} />
                <DatoClinico label="Nacimiento"   value={p.fechaNac ? fmtFecha(p.fechaNac) : null} />
                <DatoClinico label="Teléfono"     value={p.telefono} />
                <DatoClinico label="Email"        value={p.email} truncate />
                <DatoClinico label="Dirección"    value={p.direccion} truncate />
                <ObrasSocialesList obrasSociales={p.obrasSociales} />
              </div>
            </div>
            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, padding: 16 }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 12 }}>Datos clínicos</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DatoClinico label="Grupo sanguíneo" value={p.grupoSanguineo} />
                <div style={{ display: 'flex', gap: 24 }}>
                  <DatoClinico label="Peso"   value={p.peso   != null ? `${p.peso} kg`   : null} />
                  <DatoClinico label="Altura" value={p.altura != null ? `${p.altura} cm` : null} />
                </div>
                <DatoClinico label="Alergias"                value={p.alergias}               truncate warning />
                <DatoClinico label="Medicaciones"            value={p.medicaciones}           truncate />
                <DatoClinico label="Antecedentes personales" value={p.antecedentes}           truncate />
                <DatoClinico label="Antecedentes familiares" value={p.antecedentesFamiliares} truncate />
              </div>
            </div>
            <span style={{ fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5, textAlign: 'center' }}>
              Reg. {fmtFecha(p.dateCreated)}
            </span>
          </div>
        </SidePanel>

        <SidePanel open={panelEdit} onClose={() => setPanelEdit(false)} title="Editar paciente" width={560}
          footer={<>
            <Btn variant="outline" onClick={() => setPanelEdit(false)} disabled={guardando}>Cancelar</Btn>
            <Btn onClick={handleGuardarEdit} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Btn>
          </>}
        >
          <form onSubmit={handleGuardarEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <PacienteFormFields form={formEdit} handleChange={e => setFormEdit(p => ({ ...p, [e.target.name]: e.target.value }))} setField={(name, val) => setFormEdit(p => ({ ...p, [name]: val }))} apiFetch={apiFetch} />
            <ErrorMsg>{editErr}</ErrorMsg>
          </form>
        </SidePanel>
        {dialog}

        {!datosOpen && !panelEdit && (
          <FabAcciones acciones={[
            { label: 'Iniciar consulta', onClick: onIniciarConsulta, variant: 'primary' },
          ]} />
        )}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: `1px solid ${T.gray1}`, background: T.white }}>
        <BackBtn onClick={onVolver} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={onNuevoEstudio}>+ Nuevo estudio</Btn>
          <Btn onClick={onIniciarConsulta}>Iniciar consulta</Btn>
        </div>
      </div>

      {/* ── two-column body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── left: patient sidebar ── */}
        <div style={{ width: 420, flexShrink: 0, overflow: 'hidden', background: T.gray2, padding: '20px 16px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', height: '100%' }}>

          {/* avatar + nombre (horizontal) */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.white, textTransform: 'uppercase' }}>
                {p.nombre?.[0]}{p.apellido?.[0]}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.apellido}, {p.nombre}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                {edad != null && <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5 }}>{edad} años</span>}
                {edad != null && p.ocupacion && <span style={{ color: T.gray3, fontSize: 10 }}>·</span>}
                {p.ocupacion && <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ocupacion}</span>}
              </div>
            </div>
          </div>

          {/* datos personales — 2 columnas */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 10 }}>Datos personales</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              <DatoClinico label="DNI"          value={p.dni} />
              <DatoClinico label="Nacimiento"   value={p.fechaNac ? fmtFecha(p.fechaNac) : null} />
              <DatoClinico label="Teléfono"     value={p.telefono} />
              <DatoClinico label="Email"        value={p.email} truncate />
              <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Dirección" value={p.direccion} truncate /></div>
              <div style={{ gridColumn: '1 / -1' }}><ObrasSocialesList obrasSociales={p.obrasSociales} /></div>
            </div>
          </div>

          {/* datos clínicos — 2 columnas */}
          <div style={{ padding: '14px 20px', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 10 }}>Datos clínicos</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              <DatoClinico label="Grupo sanguíneo" value={p.grupoSanguineo} />
              <div style={{ display: 'flex', gap: 20 }}>
                <DatoClinico label="Peso"   value={p.peso   != null ? `${p.peso} kg`   : null} />
                <DatoClinico label="Altura" value={p.altura != null ? `${p.altura} cm` : null} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Alergias"               value={p.alergias}               truncate warning /></div>
              <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Medicaciones"            value={p.medicaciones}            truncate /></div>
              <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Antecedentes personales" value={p.antecedentes}            truncate /></div>
              <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Antecedentes familiares" value={p.antecedentesFamiliares}  truncate /></div>
            </div>
          </div>

          {/* footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5 }}>
              Reg. {fmtFecha(p.dateCreated)}
            </span>
            <Btn variant="outline" size="sm" onClick={abrirEdit}>Editar paciente</Btn>
          </div>

        </div>
        </div>

        {/* ── right: tabs + content (card) ── */}
        <div style={{ flex: 1, overflow: 'hidden', background: T.gray2, padding: '20px 20px 20px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, padding: '0 24px' }}>
              {[
                { key: 'historia',    label: 'Historia clínica', count: !cargandoCO ? consultas.length : null },
                usuario?.especialidadNombre?.toLowerCase().includes('odontolog') && { key: 'odontograma', label: 'Odontograma', count: null },
                { key: 'estudios',    label: 'Estudios',         count: !cargandoAnal ? estudiosList.length : null },
              ].filter(Boolean).map(({ key, label, count }) => (
                <button key={key} onClick={() => setTab(key)} style={{ padding: '12px 0', marginRight: 28, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderBottom: tab === key ? `2px solid ${T.black}` : '2px solid transparent', background: 'none', color: tab === key ? T.black : T.gray5, cursor: 'pointer', fontFamily: T.font, fontWeight: tab === key ? 500 : 400, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {label}
                  {count != null && <span style={{ fontSize: 10, color: tab === key ? T.gray4 : T.gray5 }}>({count})</span>}
                </button>
              ))}
            </div>

            {/* tab content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {tab === 'historia' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
                  <HistoriaClinica consultas={consultas} cargando={cargandoCO} apiFetch={apiFetch} onRefresh={cargarConsultas} onEditarConsulta={onEditarConsulta} />
                </div>
              )}
              {tab === 'odontograma' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <Odontograma apiFetch={apiFetch} pacienteId={id} />
                </div>
              )}
              {tab === 'estudios' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                  {cargandoAnal ? (
                    <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font }}>Cargando…</span>
                  ) : estudiosList.length === 0 ? (
                    <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font, letterSpacing: '0.04em' }}>Sin estudios registrados</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {estudiosList.map(a => (
                        <EstudioCard key={a.id} a={a} onAbrir={() => onAbrirEstudio(a.id)} onEliminar={() => handleEliminarEstudio(a.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <SidePanel open={panelEdit} onClose={() => setPanelEdit(false)} title="Editar paciente" width={560}
        footer={<>
          <Btn variant="outline" onClick={() => setPanelEdit(false)} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleGuardarEdit} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Btn>
        </>}
      >
        <form onSubmit={handleGuardarEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PacienteFormFields form={formEdit} handleChange={e => setFormEdit(p => ({ ...p, [e.target.name]: e.target.value }))} setField={(name, val) => setFormEdit(p => ({ ...p, [name]: val }))} apiFetch={apiFetch} />
          <ErrorMsg>{editErr}</ErrorMsg>
        </form>
      </SidePanel>
      {dialog}
    </div>
  )
}

function FormSection({ titulo, children }) {
  return (
    <div>
      <SectionTitle>{titulo}</SectionTitle>
      {children}
    </div>
  )
}

function Campo({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray3 }}>{label}</span>
      <span style={{ fontSize: 13, color: T.black, fontFamily: T.font }}>{value || '—'}</span>
    </div>
  )
}

/* ─── VistaNuevaConsulta ─────────────────────────────────────── */

function VistaNuevaConsulta({ apiFetch, pacienteId, onVolver, usuario, consulta = null }) {
  const isMobile = useIsMobile()
  const modoEdicion = !!consulta
  const [paciente,       setPaciente]       = useState(null)
  const [consultorios,   setConsultorios]   = useState([])
  const [mediosPago,     setMediosPago]     = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [form,           setForm]           = useState(modoEdicion ? {
    consultorioId:         consulta.consultorioId ? String(consulta.consultorioId) : '',
    fecha:                 consulta.fecha || hoyISO(),
    descripcion:           consulta.descripcion   || '',
    monto:                 consulta.monto != null ? String(consulta.monto) : '',
    tipoPago:              consulta.tipoPago || 'PARTICULAR',
    medioPagoId:           consulta.medioPagoId ? String(consulta.medioPagoId) : '',
    obraSocialId:          consulta.obraSocialId ? String(consulta.obraSocialId) : '',
  } : { consultorioId: '', fecha: hoyISO(), descripcion: '', monto: '', tipoPago: 'PARTICULAR', medioPagoId: '', obraSocialId: '' })
  const [archivosExist,  setArchivosExist]  = useState(modoEdicion ? (consulta.archivos || []) : [])
  const [archivos,       setArchivos]       = useState([])
  const { openConfirm, dialog }             = useConfirm()
  const { openAlert,   dialog: alertDialog } = useAlert()
  const [guardando,      setGuardando]      = useState(false)
  // Estado del cobro para PARTICULAR. 3 opciones explícitas:
  //   'cobrar'              → cobrado YA, monto > 0 y medio de pago obligatorios
  //   'pendiente_con_monto' → pendiente pero el monto se sabe (monto > 0, medio NO se carga ahora)
  //   'pendiente_sin_monto' → pendiente y todavía no se sabe el monto
  // Para OBRA_SOCIAL: NO se muestra selector — siempre queda como pendiente sin monto.
  const [estadoCobro, setEstadoCobro] = useState(modoEdicion
    ? (consulta.estadoIngreso === 'PENDIENTE'
        ? (consulta.monto != null ? 'pendiente_con_monto' : 'pendiente_sin_monto')
        : 'cobrar')
    : 'cobrar'
  )
  // Para consultas de OS ya cobradas en un batch, el usuario puede tildar este flag para desvincularlas.
  const [desvincularBatch, setDesvincularBatch] = useState(false)
  // Computados según tipoPago. OS fuerza pendiente_sin_monto (sin selector); PARTICULAR usa estadoCobro.
  const esObraSocial = form.tipoPago === 'OBRA_SOCIAL'
  const estabaEnBatch = modoEdicion && !!consulta?.cobroObraSocialId
  const mantenerEnBatch = esObraSocial && estabaEnBatch && !desvincularBatch
  // Mientras la consulta esté cerrada por un pago de OS, todo el card de Pago va a estar bloqueado.
  // El único cambio permitido es desvincular (que despeja este flag y desbloquea el form).
  const bloqueadoPorCobro = mantenerEnBatch
  const cobrarDespues = mantenerEnBatch ? false : (esObraSocial ? true : estadoCobro !== 'cobrar')
  // Para OS, monto y medio = coseguro (opcional). Si el paciente no pagó nada al toque, quedan vacíos.
  // El coseguro es independiente del cobro batch de la OS: se puede editar incluso cuando la
  // consulta ya está cerrada por un cobro batch (el back preserva el cobro batch al guardar).
  const coseguroOpcional = esObraSocial
  const coseguroConMonto = coseguroOpcional && form.monto && Number(form.monto) > 0
  const mostrarMonto     = esObraSocial
                            ? true
                            : (!bloqueadoPorCobro && estadoCobro !== 'pendiente_sin_monto')
  const mostrarMedioPago = esObraSocial
                            ? coseguroConMonto
                            : (!bloqueadoPorCobro && estadoCobro === 'cobrar')

  // ── Firma del paciente ─────────────────────────────────────────
  const isMobileOrTouch = useIsMobileOrTouch()
  const [firmaInfo,       setFirmaInfo]      = useState({
    firmada:    modoEdicion ? !!consulta.firmada     : false,
    firmaFecha: modoEdicion ? consulta.firmaFecha    : null,
  })
  const [firmaSolicitando, setFirmaSolicitando] = useState(false)
  const [firmaCanvasLocal, setFirmaCanvasLocal] = useState(null) // datos para el canvas local
  const [firmaModalEsperar, setFirmaModalEsperar] = useState(false)
  const [firmaError,        setFirmaError]      = useState(null)
  const [firmaGuardando,    setFirmaGuardando]  = useState(false)

  async function handleSolicitarFirma() {
    if (firmaInfo.firmada || firmaSolicitando) return
    setFirmaSolicitando(true); setFirmaError(null)

    // Siempre guardar primero (creando si es nueva, actualizando si es edición)
    // para que la firma se asocie al estado actual de la consulta.
    const id = await guardarYRetornarId()
    if (!id) { setFirmaSolicitando(false); return }

    if (isMobileOrTouch) {
      setFirmaCanvasLocal({
        consultaId:       id,
        pacienteNombre:   paciente?.nombre,
        pacienteApellido: paciente?.apellido,
        fecha:            form.fecha,
        descripcion:      form.descripcion,
        monto:            form.monto ? Number(form.monto) : null,
      })
      setFirmaSolicitando(false)
      return
    }

    // Flow desktop: crear slot en backend, esperar que otro device firme.
    const res = await apiFetch('/firmas/solicitar', { method: 'POST', body: JSON.stringify({ consultaId: id }) })
    setFirmaSolicitando(false)
    if (!res) return
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => null)
      openAlert(err?.error || 'No se pudo solicitar la firma', { title: 'Error' })
      return
    }
    setFirmaModalEsperar(true)
  }

  async function handleFirmarLocal(png) {
    if (!firmaCanvasLocal) return
    setFirmaGuardando(true); setFirmaError(null)
    const res = await apiFetch('/firmas/firmar', { method: 'PUT', body: JSON.stringify({ consultaId: firmaCanvasLocal.consultaId, pngBase64: png }) })
    setFirmaGuardando(false)
    if (!res) return
    if (res.ok || res.status === 204) {
      setFirmaInfo({ firmada: true, firmaFecha: new Date().toISOString() })
      setFirmaCanvasLocal(null)
    } else {
      const err = await res.json().catch(() => null)
      setFirmaError(err?.error || 'Error al guardar la firma')
    }
  }

  function handleCancelarFirmaLocal() {
    setFirmaCanvasLocal(null); setFirmaError(null)
  }

  function handleFirmadaDesdeOtroDevice(estado) {
    setFirmaInfo({ firmada: true, firmaFecha: estado.fechaFirma })
    setFirmaModalEsperar(false)
  }

  useEffect(() => {
    async function cargar() {
      const [resPac, resCons, resMp] = await Promise.all([
        apiFetch(`/pacientes/${pacienteId}`),
        apiFetch('/consultorios'),
        apiFetch('/medios-pago'),
      ])
      if (resPac?.ok)  setPaciente(await resPac.json())
      if (resCons?.ok) setConsultorios(await resCons.json())
      if (resMp?.ok)   setMediosPago(await resMp.json())
      setCargando(false)
    }
    cargar()
  }, [apiFetch, pacienteId])

  // Pre-selección de la 1ra OS del paciente cuando el tipo de pago es OBRA_SOCIAL
  // y aún no hay una elegida. Cubre el caso en que el paciente carga después del
  // primer render o cuando se edita una consulta legacy sin obraSocialId.
  useEffect(() => {
    if (form.tipoPago !== 'OBRA_SOCIAL') return
    if (form.obraSocialId) return
    if (!paciente?.obrasSociales?.length) return
    setForm(f => ({ ...f, obraSocialId: String(paciente.obrasSociales[0].obraSocialId) }))
  }, [form.tipoPago, form.obraSocialId, paciente])

  // Al cambiar tipoPago se resetea el flag de desvinculación batch.
  useEffect(() => { setDesvincularBatch(false) }, [form.tipoPago])

  // Para PARTICULAR el monto siempre se sabe → 'pendiente_sin_monto' no aplica. Normalizamos a 'pendiente_con_monto'.
  useEffect(() => {
    if (form.tipoPago === 'PARTICULAR' && estadoCobro === 'pendiente_sin_monto') {
      setEstadoCobro('pendiente_con_monto')
    }
  }, [form.tipoPago, estadoCobro])

  // Defaults para el caso de uso más común: consulta nueva de un paciente con OS
  // → arranca con tipoPago=OBRA_SOCIAL, la OS principal pre-seleccionada y "cobrar
  // después" activo (porque casi siempre la OS paga semanas/meses más tarde y el
  // profesional ni sabe el monto cuando registra la consulta).
  // Sólo corre 1 vez, cuando el paciente carga, y sólo en modo creación.
  const defaultsAplicadosRef = useRef(false)
  useEffect(() => {
    if (modoEdicion) return
    if (defaultsAplicadosRef.current) return
    if (!paciente) return
    defaultsAplicadosRef.current = true
    if (paciente.obrasSociales?.length > 0) {
      setForm(f => ({
        ...f,
        tipoPago:     'OBRA_SOCIAL',
        obraSocialId: String(paciente.obrasSociales[0].obraSocialId),
      }))
      // Con OBRA_SOCIAL no hace falta tocar estadoCobro — los derivados lo fuerzan a pendiente_sin_monto.
    }
  }, [paciente, modoEdicion])

  async function handleEliminarArchivoExist(archivoId) {
    await apiFetch(`/consultas/${consulta.id}/archivos/${archivoId}`, { method: 'DELETE' })
    setArchivosExist(prev => prev.filter(a => a.id !== archivoId))
  }

  async function handleEliminar() {
    if (!await openConfirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return
    setGuardando(true)
    await apiFetch(`/consultas/${consulta.id}`, { method: 'DELETE' })
    onVolver()
  }

  // ID de la consulta "actual": en edición arranca con el de la prop, en nueva
  // se setea al guardar (útil cuando se guarda implícitamente desde "Solicitar firma").
  const [idActual, setIdActual] = useState(modoEdicion ? consulta.id : null)

  /**
   * Guarda la consulta (POST si es nueva, PUT si ya existe). Devuelve el ID
   * resultante o null si hubo error. NO navega — eso lo decide el caller.
   */
  async function guardarYRetornarId() {
    if (!form.consultorioId) {
      openAlert('Seleccioná un consultorio antes de guardar la consulta.', { title: 'Campo requerido' })
      return null
    }

    // OBRA_SOCIAL: la obra social es obligatoria SIEMPRE. Si después la OS paga en batch desde el flow
    // "Cobrar OS", el ingreso pendiente tiene que tener la OS marcada.
    if (form.tipoPago === 'OBRA_SOCIAL' && !form.obraSocialId) {
      openAlert('Seleccioná una obra social para esta consulta.', { title: 'Campo requerido' })
      return null
    }

    // PARTICULAR: monto obligatorio cuando se muestra (cobrar ahora / pendiente con monto). Medio
    // obligatorio en "cobrar ahora". Para OS el monto del coseguro es opcional — pero si se carga,
    // exigimos el medio.
    if (mostrarMonto && !coseguroOpcional) {
      if (!form.monto || Number(form.monto) <= 0) {
        openAlert('Ingresá un monto válido (mayor a 0). Si todavía no sabés el monto, elegí "Pendiente sin monto".', { title: 'Campo requerido' })
        return null
      }
    }
    if (mostrarMedioPago && !coseguroOpcional && !form.medioPagoId) {
      openAlert('Seleccioná un medio de pago.', { title: 'Campo requerido' })
      return null
    }
    if (coseguroConMonto && !form.medioPagoId) {
      openAlert('Seleccioná el medio de pago del coseguro.', { title: 'Campo requerido' })
      return null
    }

    const body = {
      ...(modoEdicion || idActual ? {} : { pacienteId: Number(pacienteId) }),
      consultorioId:         form.consultorioId ? Number(form.consultorioId) : null,
      fecha:                 form.fecha || null,
      descripcion:           form.descripcion   || null,
      // PARTICULAR: monto solo si "cobrar" o "pendiente con monto". OS: monto = coseguro (opcional).
      monto:                 mostrarMonto && form.monto ? Number(form.monto) : null,
      // tipoPago y obraSocialId se mandan siempre — son metadata del cobro futuro.
      tipoPago:              form.tipoPago || null,
      // Medio de pago: PARTICULAR cuando se cobra ahora; OS solo si hay coseguro con monto.
      medioPagoId:           mostrarMedioPago && form.medioPagoId ? Number(form.medioPagoId) : null,
      obraSocialId:          form.tipoPago === 'OBRA_SOCIAL' && form.obraSocialId ? Number(form.obraSocialId) : null,
      pendienteCobro:        cobrarDespues,
    }

    const url    = idActual ? `/consultas/${idActual}` : '/consultas'
    const method = idActual ? 'PUT' : 'POST'

    const res = await apiFetch(url, { method, body: JSON.stringify(body) })
    if (!res) return null
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      openAlert(err?.error || 'Error al guardar', { title: 'No se pudo guardar' })
      return null
    }

    let id = idActual
    if (!id) {
      const data = await res.json()
      id = data.id
      setIdActual(id)
    }

    // Subir archivos nuevos
    for (const f of archivos) {
      const fd = new FormData(); fd.append('archivo', f)
      await apiFetch(`/consultas/${id}/archivos`, { method: 'POST', body: fd })
    }
    setArchivos([])
    return id
  }

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    const id = await guardarYRetornarId()
    setGuardando(false)
    if (id) onVolver()
  }

  if (cargando) return <Cargando />

  const p = paciente
  const esOdontologo = usuario?.especialidadNombre?.toLowerCase().includes('odontolog')

  const cardStyle = { background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px 24px', flexShrink: 0 }
  const secLabel  = { fontSize: 9, fontFamily: T.mono, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5, fontWeight: 600, marginBottom: 16 }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 14px' : '10px 24px', borderBottom: `1px solid ${T.gray1}`, background: T.white, gap: 8 }}>
        <BackBtn onClick={onVolver} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0, flex: isMobile ? 1 : '0 0 auto' }}>
          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black, letterSpacing: '-0.01em' }}>{modoEdicion ? 'Editar consulta' : 'Nueva consulta'}</span>
          {p && <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{p.apellido}, {p.nombre}</span>}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {modoEdicion && (
              <button type="button" onClick={handleEliminar} disabled={guardando} style={{ height: 34, padding: '0 14px', border: `1px solid #f5c6cb`, borderRadius: 6, background: T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 11, color: '#c00', letterSpacing: '0.04em' }}>Eliminar</button>
            )}
            <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
          </div>
        )}
      </div>

      {/* ── body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── formulario en cards (centrado, sin sidebar de paciente) ── */}
        <form onSubmit={handleGuardar} style={{ flex: 1, overflow: 'hidden', background: T.gray2, padding: isMobile ? '16px' : '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: isMobile ? 'none' : 760, margin: isMobile ? 0 : '0 auto', paddingBottom: isMobile ? 80 : 0 }}>

            {/* Card: Clínica — consultorio arriba, campos en el medio, archivo abajo */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={secLabel}>Clínica</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: '0 0 160px' }}>
                  <FieldLabel>Fecha de la consulta</FieldLabel>
                  <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Consultorio *</FieldLabel>
                  <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                    <option value="">Seleccioná un consultorio…</option>
                    {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
              </div>
              <div style={{ borderTop: `1px solid ${T.gray1}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FieldLabel>Archivos adjuntos</FieldLabel>

                {/* archivos ya guardados (solo en modo edición) */}
                {/* todos los archivos juntos */}
                {(archivosExist.length > 0 || archivos.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {archivosExist.map(arch => (
                      <span key={arch.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid ${T.gray1}`, borderRadius: 4, fontSize: 10, fontFamily: T.font, color: T.gray4, background: T.white }}>
                        📎 {arch.nombre}
                        <button type="button" onClick={() => handleEliminarArchivoExist(arch.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: '#c00', lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                      </span>
                    ))}
                    {archivos.map((f, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid #d4edda`, borderRadius: 4, fontSize: 10, fontFamily: T.font, color: T.gray4, background: '#f8fff8' }}>
                        📎 {f.name}
                        <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: T.gray4, lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* botón adjuntar siempre al final */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 12px', border: `1px solid ${T.gray1}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, color: T.gray4, background: T.white, userSelect: 'none' }}>
                    + Adjuntar archivo
                  </span>
                  <span style={{ fontSize: 10, fontFamily: T.font, color: T.gray5 }}>imagen o PDF</span>
                  <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])} />
                </label>
              </div>
            </div>

            {/* Card: Pago */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={secLabel}>Pago</div>

              {/* Tipo de pago: particular u obra social */}
              <div>
                <FieldLabel>Tipo de pago *</FieldLabel>
                {bloqueadoPorCobro ? (
                  <div style={{ height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 12px', display: 'flex', alignItems: 'center', fontFamily: T.font, fontSize: 13, color: T.gray4, background: T.gray2 }}>
                    Obra social
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, overflow: 'hidden', maxWidth: 300 }}>
                    {Object.entries(TIPO_PAGO).filter(([op]) => op !== 'OTRO').map(([op, label], idx, arr) => (
                      <button key={op} type="button" onClick={() => setForm(f => {
                        const next = { ...f, tipoPago: op }
                        // Al elegir OBRA_SOCIAL, pre-seleccionar la primera OS del paciente si no hay una elegida.
                        if (op === 'OBRA_SOCIAL' && !f.obraSocialId && paciente?.obrasSociales?.length > 0) {
                          next.obraSocialId = String(paciente.obrasSociales[0].obraSocialId)
                        }
                        return next
                      })}
                        style={{ flex: 1, border: 'none', borderRight: idx < arr.length - 1 ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: form.tipoPago === op ? T.black : T.white, color: form.tipoPago === op ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {form.tipoPago === 'OBRA_SOCIAL' && (
                <div>
                  <FieldLabel>Obra social *</FieldLabel>
                  {bloqueadoPorCobro ? (
                    <div style={{ height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 12px', display: 'flex', alignItems: 'center', fontFamily: T.font, fontSize: 13, color: T.gray4, background: T.gray2, maxWidth: 320 }}>
                      {consulta?.obraSocialNombre || '—'}
                    </div>
                  ) : paciente?.obrasSociales?.length > 0 ? (
                    <select value={form.obraSocialId}
                      onChange={e => setForm(f => ({ ...f, obraSocialId: e.target.value }))}
                      style={{ width: '100%', maxWidth: 320, height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: form.obraSocialId ? T.black : T.gray5, background: T.white, outline: 'none' }}>
                      <option value="">Seleccionar…</option>
                      {paciente.obrasSociales.map(os => (
                        <option key={os.obraSocialId} value={os.obraSocialId}>{os.obraSocialNombre}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: 11, fontFamily: T.font, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', lineHeight: 1.55 }}>
                      Este paciente no tiene obras sociales registradas. Agregale una desde su ficha para asociar el cobro.
                    </div>
                  )}
                </div>
              )}

              {/* OBRA_SOCIAL pendiente (no cobrada todavía): nota informativa. */}
              {esObraSocial && !estabaEnBatch && (
                <div style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '8px 12px', lineHeight: 1.55 }}>
                  Esta consulta queda <strong>pendiente de cobro</strong>. Cuando la obra social te pague, vas a Finanzas → "Registrar cobro".
                </div>
              )}

              {/* OBRA_SOCIAL ya cobrada: panel destacado con la única acción posible (desvincular). */}
              {bloqueadoPorCobro && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: T.font, color: T.black, lineHeight: 1.55, fontWeight: 500 }}>
                    Esta consulta ya está <strong>cobrada</strong> dentro de un pago de obra social.
                  </span>
                  <span style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, lineHeight: 1.55 }}>
                    Para modificar el pago, primero marcala de nuevo como pendiente. Eso la desvincula del pago registrado de la obra social.
                  </span>
                  <button type="button" onClick={() => setDesvincularBatch(true)}
                    style={{ alignSelf: 'flex-start', marginTop: 2, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '6px 14px', fontFamily: T.font, fontSize: 11, fontWeight: 600, color: '#b45309', cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Marcar de nuevo como pendiente
                  </button>
                </div>
              )}
              {esObraSocial && estabaEnBatch && desvincularBatch && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: T.font, color: '#b45309', lineHeight: 1.55 }}>
                    Al guardar, esta consulta vuelve a quedar <strong>pendiente de cobro</strong>. El pago de obra social que registraste no se borra — podés ajustarlo desde Finanzas.
                  </span>
                  <button type="button" onClick={() => setDesvincularBatch(false)}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontFamily: T.font, fontSize: 11, color: T.gray4, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                    Cancelar — dejarla cobrada
                  </button>
                </div>
              )}

              {/* PARTICULAR: 2 estados (el monto siempre se sabe). */}
              {!esObraSocial && !bloqueadoPorCobro && (
                <div>
                  <FieldLabel>Estado *</FieldLabel>
                  <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, overflow: 'hidden', maxWidth: 360 }}>
                    {[
                      { val: 'cobrar',              label: 'Cobrar ahora' },
                      { val: 'pendiente_con_monto', label: 'Pendiente' },
                    ].map((op, idx, arr) => {
                      const sel = estadoCobro === op.val
                      return (
                        <button key={op.val} type="button" onClick={() => setEstadoCobro(op.val)}
                          style={{ flex: 1, border: 'none', borderRight: idx < arr.length - 1 ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: sel ? T.black : T.white, color: sel ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                          {op.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Monto + Medio. Labels distintos según OS (coseguro opcional) vs PARTICULAR (monto obligatorio). */}
              {mostrarMonto && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (mostrarMedioPago ? 'minmax(140px, 220px) minmax(180px, 320px)' : 'minmax(140px, 220px)'), gap: 14, alignItems: 'end' }}>
                  <div>
                    <FieldLabel>{coseguroOpcional ? 'Coseguro (opcional)' : 'Monto *'}</FieldLabel>
                    <Input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0" />
                  </div>
                  {mostrarMedioPago && (
                    <div>
                      <FieldLabel>{coseguroOpcional ? 'Medio de pago del coseguro *' : 'Medio de pago *'}</FieldLabel>
                      <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))}
                        style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: form.medioPagoId ? T.black : T.gray5, background: T.white, outline: 'none' }}>
                        <option value="">Seleccionar…</option>
                        {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Nota informativa cuando un PARTICULAR queda pendiente */}
              {!esObraSocial && cobrarDespues && (
                <div style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '8px 12px', lineHeight: 1.55 }}>
                  La consulta queda como <strong>cobro pendiente</strong>. La vas a poder cobrar más adelante desde Finanzas.
                </div>
              )}
            </div>

            {/* Card: Odontograma — solo para odontólogos, oculto en mobile */}
            {esOdontologo && !isMobile && (
              <div style={cardStyle}>
                <div style={secLabel}>Odontograma</div>
                <Odontograma apiFetch={apiFetch} pacienteId={pacienteId} />
              </div>
            )}

            {/* Card: Firma del paciente — opcional, disponible tanto en nueva como en edición */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={secLabel}>Firma del paciente (opcional)</div>
              {firmaInfo.firmada && idActual ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black }}>Firmada por el paciente</div>
                    {firmaInfo.firmaFecha && (
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', color: T.gray4, marginTop: 2 }}>
                        {new Date(firmaInfo.firmaFecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <FirmaImg apiFetch={apiFetch} consultaId={idActual} refreshKey={firmaInfo.firmaFecha} style={{ height: 48, maxWidth: 140, border: `1px solid ${T.gray1}`, borderRadius: 4, background: T.white, objectFit: 'contain' }} />
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, lineHeight: 1.5 }}>
                    {isMobileOrTouch
                      ? 'Tocá el botón y pasale el dispositivo al paciente para que firme.'
                      : 'Al solicitar la firma, pasale el celular al paciente. Cuando abra holaDoc en su celular, aparecerá el espacio para firmar.'}
                    {!idActual && ' La consulta se guarda automáticamente al solicitar la firma.'}
                  </div>
                  <div>
                    <Btn onClick={handleSolicitarFirma} disabled={firmaSolicitando}>
                      {firmaSolicitando
                        ? 'Guardando…'
                        : (idActual ? 'Solicitar firma del paciente' : 'Guardar y solicitar firma')}
                    </Btn>
                  </div>
                </>
              )}
            </div>

          </div>
        </form>
      </div>
      {isMobile && (
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: `1px solid ${T.gray1}`, background: T.white, display: 'flex', gap: 10 }}>
          {modoEdicion && (
            <Btn variant="outline" onClick={handleEliminar} disabled={guardando} fullWidth>Eliminar</Btn>
          )}
          <Btn onClick={handleGuardar} disabled={guardando} fullWidth>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
        </div>
      )}

      {/* Canvas local (mobile/touch) — abre directo cuando se solicita firma desde el mismo device */}
      {firmaCanvasLocal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: T.gray2, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', background: T.black, color: T.white, flexShrink: 0 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Firma del paciente</div>
            <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, marginTop: 2 }}>holaDoc</div>
          </div>
          <CanvasFirma pendiente={firmaCanvasLocal} onGuardar={handleFirmarLocal} onCancelar={handleCancelarFirmaLocal} guardando={firmaGuardando} error={firmaError} />
        </div>
      )}

      {/* Modal "Esperando firma…" (desktop) — polea cada 3 seg al backend */}
      {firmaModalEsperar && idActual && (
        <EsperandoFirmaModal
          apiFetch={apiFetch}
          consultaId={idActual}
          onCerrar={() => setFirmaModalEsperar(false)}
          onFirmada={handleFirmadaDesdeOtroDevice}
        />
      )}

      {dialog}
      {alertDialog}
    </div>
  )
}

/* ─── HistoriaClinica ────────────────────────────────────────── */

function HistoriaClinica({ consultas, cargando, apiFetch, onRefresh, onEditarConsulta }) {
  if (cargando) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
  )
  if (consultas.length === 0) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin consultas registradas</div>
  )

  // Cards estilo "cobros pendientes" — fullWidth, sin nombre del paciente (redundante en detalle de paciente).
  const fmtMonto = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const fmtTipo  = t => TIPO_PAGO[t] ?? t
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
      {consultas.map(a => (
        <ConsultaCard key={a.id} a={a} fmtMonto={fmtMonto} fmtTipo={fmtTipo} onEditar={() => onEditarConsulta?.(a)} fullWidth hidePaciente />
      ))}
    </div>
  )
}

function ConsultaHCItem({ a, last, apiFetch, onEditar }) {
  const [hov, setHov] = useState(false)
  const fmtM = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
  const montoMostrado = a.monto
  const pendiente = a.estadoIngreso === 'PENDIENTE'

  async function handleDescargar(archivo) {
    const res = await apiFetch(`/consultas/${a.id}/archivos/${archivo.id}`)
    if (!res?.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = archivo.nombre; link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      onClick={onEditar}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${T.gray2}`, display: 'flex', gap: 20, background: hov ? T.gray2 : 'transparent', transition: 'background 0.1s', cursor: 'pointer' }}
    >
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ fontSize: 11, fontFamily: T.font, color: T.black, letterSpacing: '0.04em' }}>{a.fecha || fmtFecha(a.dateCreated)}</div>
        {a.consultorioNombre && (
          <div style={{ marginTop: 4, fontSize: 10, fontFamily: T.font, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray5, fontWeight: 500 }}>
            {a.consultorioNombre}
          </div>
        )}
        {pendiente && (
          <div style={{ marginTop: 4, fontSize: 9, fontFamily: T.mono, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b45309' }}>Pendiente de cobro</div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {a.descripcion && (
          <div style={{ fontSize: 13, fontFamily: T.font, color: T.black, lineHeight: 1.4 }}>{a.descripcion}</div>
        )}
        {a.archivos?.length > 0 && (
          <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {a.archivos.map(arch => (
              <button key={arch.id} onClick={e => { e.stopPropagation(); handleDescargar(arch) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', border: `1px solid ${T.gray1}`, borderRadius: 4, background: T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 10, color: T.gray4, letterSpacing: '0.04em' }}>
                📎 {arch.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {montoMostrado != null && (
          <div style={{ fontSize: 15, fontFamily: T.font, fontWeight: 500, color: T.black }}>{fmtM(montoMostrado)}</div>
        )}
        <div style={{ marginTop: 3, fontSize: 10, fontFamily: T.font, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray4, fontWeight: 500 }}>
          {TIPO_PAGO[a.tipoPago] ?? ''}
        </div>
      </div>
    </div>
  )
}

/* ─── ObraSocialSelector ─────────────────────────────────────── */

function ObraSocialSelector({ apiFetch, value, onChange }) {
  const [obras,       setObras]       = useState([])
  const [showNew,     setShowNew]     = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [err,         setErr]         = useState(null)

  useEffect(() => {
    apiFetch('/obras-sociales')
      .then(r => r?.ok ? r.json() : [])
      .then(data => Array.isArray(data) ? setObras(data) : [])
      .catch(() => {})
  }, [apiFetch])

  async function handleAgregarNueva(e) {
    e.preventDefault()
    if (!nuevoNombre.trim()) { setErr('El nombre es requerido'); return }
    setErr(null); setGuardando(true)
    const res = await apiFetch('/obras-sociales', { method: 'POST', body: JSON.stringify({ nombre: nuevoNombre.trim() }) })
    if (res?.ok) {
      const nueva = await res.json()
      setObras(prev => [...prev, nueva])
      onChange({ target: { name: 'obraSocialId', value: nueva.id } })
      setNuevoNombre('')
      setShowNew(false)
    } else {
      setErr('Error al crear la obra social')
    }
    setGuardando(false)
  }

  const selectStyle = {
    flex: 1, height: 36, padding: '0 10px',
    border: `1px solid ${T.gray1}`, outline: 'none',
    background: T.white, fontSize: 13, fontFamily: T.font, color: value ? T.black : T.gray5,
    borderRadius: 6, boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <select name="obraSocialId" value={value} onChange={onChange} style={selectStyle}>
          <option value="">Sin obra social</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
        <button
          type="button"
          onClick={() => { setShowNew(v => !v); setErr(null); setNuevoNombre('') }}
          title="Nueva obra social"
          style={{
            width: 36, height: 36, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: showNew ? T.black : T.white,
            color: showNew ? T.white : T.gray4,
            border: `1px solid ${showNew ? T.black : T.gray1}`,
            cursor: 'pointer', fontSize: 20, lineHeight: 1,
            transition: 'all 0.15s',
          }}
        >+</button>
      </div>
      {showNew && (
        <div style={{ border: `1px solid ${T.gray1}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: T.gray2, borderRadius: 8 }}>
          <FieldLabel>Nueva obra social</FieldLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            <Input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              placeholder="Nombre de la obra social"
              onKeyDown={e => e.key === 'Enter' && handleAgregarNueva(e)}
              style={{ flex: 1 }}
            />
            <Btn size="sm" onClick={handleAgregarNueva} disabled={guardando}>{guardando ? '…' : 'Agregar'}</Btn>
            <Btn size="sm" variant="ghost" type="button" onClick={() => { setShowNew(false); setNuevoNombre(''); setErr(null) }}>×</Btn>
          </div>
          {err && <ErrorMsg>{err}</ErrorMsg>}
        </div>
      )}
    </div>
  )
}

/* ─── DatoClinico (read-only field for clinical tab) ─────────── */

function DatoClinico({ label, value, truncate, warning }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5 }}>{label}</span>
        {warning && value && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: '#d92d20', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: T.font, lineHeight: 1, flexShrink: 0 }}>!</span>
        )}
      </div>
      {value
        ? <span style={{ fontFamily: T.font, fontSize: 12, color: T.black, lineHeight: 1.4, ...(truncate ? { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } : {}) }}>{value}</span>
        : <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray3, fontStyle: 'italic' }}>—</span>
      }
    </div>
  )
}

/* ─── ObrasSocialesList (read-only display de las OS del paciente) ── */

function ObrasSocialesList({ obrasSociales }) {
  if (!obrasSociales || obrasSociales.length === 0) {
    return <DatoClinico label="Obra social" value={null} />
  }
  const principal = obrasSociales[0]
  const extras    = obrasSociales.length - 1
  const label = extras > 0
    ? `Obra social (principal · +${extras} más)`
    : 'Obra social'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <DatoClinico label={label} value={principal.obraSocialNombre} truncate />
      {(principal.nroAfiliado || principal.plan || principal.titular) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {principal.nroAfiliado && <DatoClinico label="Nro afiliado" value={principal.nroAfiliado} />}
          {principal.plan        && <DatoClinico label="Plan"         value={principal.plan} truncate />}
          {principal.titular     && <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Titular" value={principal.titular} truncate /></div>}
        </div>
      )}
    </div>
  )
}

/* ─── ObrasSocialesEditor (lista editable de OS del paciente) ── */

function ObrasSocialesEditor({ apiFetch, lista, onChange }) {
  function update(idx, patch) {
    onChange(lista.map((o, i) => i === idx ? { ...o, ...patch } : o))
  }
  function agregar() {
    onChange([...lista, { obraSocialId: '', nroAfiliado: '', plan: '', titular: '' }])
  }
  function quitar(idx) {
    onChange(lista.filter((_, i) => i !== idx))
  }

  if (lista.length === 0) {
    return (
      <div style={{ background: T.gray2, border: `1px dashed ${T.gray1}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4 }}>Sin obras sociales registradas</span>
        <Btn size="sm" variant="outline" type="button" onClick={agregar}>+ Agregar obra social</Btn>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {lista.map((os, idx) => (
        <div key={idx} style={{ background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray4 }}>
              {idx === 0 ? 'Principal' : `Obra social ${idx + 1}`}
            </span>
            <button type="button" onClick={() => quitar(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gray5, fontSize: 16, lineHeight: 1, padding: 4 }}
              title="Quitar"
            >✕</button>
          </div>
          <div>
            <FieldLabel>Obra social / Prepaga *</FieldLabel>
            <ObraSocialSelector apiFetch={apiFetch} value={os.obraSocialId}
              onChange={e => update(idx, { obraSocialId: e.target.value })} />
          </div>
          <div><FieldLabel>Nro. de afiliado</FieldLabel>
            <Input value={os.nroAfiliado} onChange={e => update(idx, { nroAfiliado: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><FieldLabel>Plan</FieldLabel>
              <Input value={os.plan} onChange={e => update(idx, { plan: e.target.value })} />
            </div>
            <div><FieldLabel>Titular</FieldLabel>
              <Input value={os.titular} onChange={e => update(idx, { titular: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
      <Btn size="sm" variant="outline" type="button" onClick={agregar}>+ Agregar otra obra social</Btn>
    </div>
  )
}

/* ─── PacienteFormFields (shared form sections) ──────────────── */

function PacienteFormFields({ form, handleChange, setField, apiFetch }) {
  return (
    <>
      <div>
        <SectionTitle>Datos personales</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><FieldLabel>Apellido *</FieldLabel><Input required name="apellido" value={form.apellido} onChange={handleChange} /></div>
          <div><FieldLabel>Nombre *</FieldLabel><Input required name="nombre" value={form.nombre} onChange={handleChange} /></div>
          <div><FieldLabel>DNI</FieldLabel><Input name="dni" value={form.dni} onChange={handleChange} /></div>
          <div><FieldLabel>Fecha de nacimiento</FieldLabel><Input type="date" name="fechaNac" value={form.fechaNac} onChange={handleChange} /></div>
        </div>
      </div>
      <div>
        <SectionTitle>Contacto</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><FieldLabel>Teléfono</FieldLabel><Input name="telefono" value={form.telefono} onChange={handleChange} /></div>
          <div><FieldLabel>Email</FieldLabel><Input type="email" name="email" value={form.email} onChange={handleChange} /></div>
          <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Dirección</FieldLabel><Input name="direccion" value={form.direccion} onChange={handleChange} /></div>
        </div>
      </div>
      <div>
        <SectionTitle>Cobertura</SectionTitle>
        <ObrasSocialesEditor
          apiFetch={apiFetch}
          lista={form.obrasSociales || []}
          onChange={(nueva) => setField('obrasSociales', nueva)}
        />
      </div>
      <div>
        <SectionTitle>Datos clínicos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><FieldLabel>Ocupación</FieldLabel><Input name="ocupacion" value={form.ocupacion} onChange={handleChange} /></div>
          <div><FieldLabel>Grupo sanguíneo</FieldLabel><Input name="grupoSanguineo" value={form.grupoSanguineo} onChange={handleChange} placeholder="Ej: A+" /></div>
          <div><FieldLabel>Peso (kg)</FieldLabel><Input type="number" step="0.1" min="0" name="peso" value={form.peso} onChange={handleChange} /></div>
          <div><FieldLabel>Altura (cm)</FieldLabel><Input type="number" min="0" name="altura" value={form.altura} onChange={handleChange} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Alergias</FieldLabel>
            <Textarea name="alergias" rows={2} value={form.alergias} onChange={handleChange} placeholder="Medicamentos, alimentos u otras alergias conocidas…" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Medicaciones</FieldLabel>
            <Textarea name="medicaciones" rows={2} value={form.medicaciones} onChange={handleChange} placeholder="Medicamentos actuales y dosis…" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Antecedentes personales</FieldLabel>
            <Textarea name="antecedentes" rows={3} value={form.antecedentes} onChange={handleChange} placeholder="Enfermedades, cirugías, tratamientos previos…" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Antecedentes familiares</FieldLabel>
            <Textarea name="antecedentesFamiliares" rows={2} value={form.antecedentesFamiliares} onChange={handleChange} placeholder="Enfermedades hereditarias relevantes…" />
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── VistaConsultas ─────────────────────────────────────────── */

const VACÍO_CO = { pacienteId: '', consultorioId: '', fecha: hoyISO(), descripcion: '', monto: '', tipoPago: 'PARTICULAR' }
const COLS_CO = [
  { label: 'Paciente',    w: '2fr' },
  { label: 'Práctica',    w: '2fr' },
  { label: 'Monto',       w: '1fr' },
  { label: 'Tipo',        w: '1fr' },
  { label: 'Consultorio', w: '1fr' },
  { label: 'Fecha',       w: '1fr' },
]

function VistaConsultas({ apiFetch, onIrAConsultorios, usuario, filtroPendienteInicial = false, onVolverAFinanzas, consultaEditarInicial = null, onConsultaEditarInicialUsada }) {
  const isMobile = useIsMobile()
  const [items,          setItems]          = useState([])
  const [meta,           setMeta]           = useState(null)
  const [cargando,       setCargando]       = useState(true)
  const [cargandoMas,    setCargandoMas]    = useState(false)
  const [error,          setError]          = useState(null)
  const [buscar,         setBuscar]         = useState('')
  const [soloPendientes, setSoloPendientes] = useState(filtroPendienteInicial)
  const [vistaMode,      setVistaMode]      = useState(() => localStorage.getItem('consultas-vista') ?? 'list')
  const [sub,            setSub]            = useState('lista')
  const [pacienteSelecId, setPacienteSelecId] = useState(null)
  const [consultaEditar, setConsultaEditar] = useState(null)
  const [modalPac,       setModalPac]       = useState(false)
  const [pacientes,      setPacientes]      = useState([])
  const [pacSelecTemp,   setPacSelecTemp]   = useState('')
  const [sinConsultorios, setSinConsultorios] = useState(false)
  function toggleVista(v) { setVistaMode(v); localStorage.setItem('consultas-vista', v) }

  const cargar = useCallback(async (q, page = 0) => {
    if (page === 0) { setCargando(true); setError(null) }
    else setCargandoMas(true)
    const params = new URLSearchParams({ size: 30, page })
    if (q) params.set('buscar', q)
    const res = await apiFetch(`/consultas?${params}`)
    if (res?.ok) {
      const data = await res.json()
      setItems(prev => page === 0 ? data.content : [...prev, ...data.content])
      setMeta({ last: data.last, number: data.number, totalElements: data.totalElements })
    } else {
      setError('Error al cargar consultas')
    }
    if (page === 0) setCargando(false)
    else setCargandoMas(false)
  }, [apiFetch])

  useEffect(() => {
    const t = setTimeout(() => cargar(buscar, 0), buscar ? 350 : 0)
    return () => clearTimeout(t)
  }, [buscar, cargar])

  useEffect(() => {
    if (!modalPac) return
    apiFetch('/pacientes?size=200').then(r => r?.ok && r.json().then(d => setPacientes(Array.isArray(d) ? d : (d.content ?? []))))
  }, [modalPac, apiFetch])

  async function abrirNuevaConsulta() {
    const res = await apiFetch('/consultorios')
    if (!res) return
    const lista = await res.json()
    if (!lista.length) { setSinConsultorios(true); return }
    setPacSelecTemp('')
    setModalPac(true)
  }

  function confirmarPaciente() {
    if (!pacSelecTemp) return
    setPacienteSelecId(pacSelecTemp)
    setModalPac(false)
    setSub('nueva-consulta')
  }

  // Marca si la sesión actual de edición vino directamente desde Finanzas (movimientos pendientes)
  // → el back del form va directo a Finanzas en vez de a la lista de consultas.
  const desdeFinanzasRef = useRef(false)

  function volverALista() {
    if (desdeFinanzasRef.current && onVolverAFinanzas) {
      desdeFinanzasRef.current = false
      onVolverAFinanzas()
      return
    }
    setSub('lista')
    setPacienteSelecId(null)
    setConsultaEditar(null)
    cargar(buscar, 0)
  }

  function abrirEditar(a) {
    // Edición disparada desde la lista normal — limpiamos cualquier rastro de origen "finanzas".
    desdeFinanzasRef.current = false
    setConsultaEditar(a)
    setPacienteSelecId(a.pacienteId)
    setSub('nueva-consulta')
  }

  // Si llegamos desde Finanzas con una consulta puntual para abrir, fetcheamos los datos y la abrimos
  // saltándonos la lista. El back nos va a llevar de regreso a Finanzas (no a la lista de consultas).
  // El clear del parent state se hace DESPUÉS de abrir la consulta para evitar race conditions con
  // el gate mobile/desktop en MainLayout.
  useEffect(() => {
    if (!consultaEditarInicial?.consultaId) return
    const id = consultaEditarInicial.consultaId
    let cancelled = false
    apiFetch(`/consultas/${id}`).then(async res => {
      if (cancelled) return
      if (res?.ok) {
        const consulta = await res.json()
        setConsultaEditar(consulta)
        setPacienteSelecId(consulta.pacienteId)
        setSub('nueva-consulta')
        desdeFinanzasRef.current = true // sólo este flujo marca el origen
      }
      onConsultaEditarInicialUsada?.()
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaEditarInicial?.consultaId])

  if (sub === 'nueva-consulta') {
    return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteSelecId} onVolver={volverALista} usuario={usuario} consulta={consultaEditar} />
  }

  if (sub === 'nuevo-paciente') {
    return (
      <VistaNuevoPaciente
        apiFetch={apiFetch}
        onVolver={() => { setSub('lista'); setModalPac(true) }}
        onCreado={async (id) => {
          setPacSelecTemp(id)
          const rp = await apiFetch('/pacientes?size=200')
          if (rp?.ok) { const dp = await rp.json(); setPacientes(Array.isArray(dp) ? dp : (dp.content ?? [])) }
          setSub('lista')
          setModalPac(true)
        }}
      />
    )
  }

  const pendientesCount = items.filter(i => i.estadoIngreso === 'PENDIENTE' || i.monto == null).length
  const filtradas = items.filter(i => !soloPendientes || i.estadoIngreso === 'PENDIENTE' || i.monto == null)

  const fmtMonto = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const fmtTipo  = t => TIPO_PAGO[t] ?? t

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          {onVolverAFinanzas && <BackBtn onClick={onVolverAFinanzas} />}
          <PageTitle>Consultas</PageTitle>
        </div>
        {!onVolverAFinanzas && !isMobile && <Btn onClick={abrirNuevaConsulta}>Iniciar consulta</Btn>}
      </PageBar>

      <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 16px' : '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '4px 0 12px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 36, paddingLeft: 12, flex: 1, maxWidth: isMobile ? 'none' : 360, borderRadius: 8, background: T.white }}>
            <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
            <input
              value={buscar} onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por paciente o práctica…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
            />
          </div>
          {!isMobile && meta && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{meta.totalElements} consultas</span>}
          {pendientesCount > 0 && (
            <button onClick={() => setSoloPendientes(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 8, border: soloPendientes ? '1px solid #b45309' : `1px solid ${T.gray1}`, background: soloPendientes ? '#fffbeb' : T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 12, fontWeight: soloPendientes ? 600 : 400, color: soloPendientes ? '#b45309' : T.gray4, transition: 'all 0.15s' }}>
              {isMobile ? 'Pendientes' : 'Cobros pendientes'}
              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, background: '#fef9c3', color: '#b45309', border: '1px solid #fde68a', borderRadius: 20, padding: '1px 6px' }}>{pendientesCount}</span>
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : error ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, color: T.red, fontFamily: T.font }}>{error}</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscar ? 'Sin resultados' : 'No hay consultas registradas'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtradas.map(a => (
                <ConsultaCard key={a.id} a={a} fmtMonto={fmtMonto} fmtTipo={fmtTipo} onEditar={() => abrirEditar(a)} fullWidth />
              ))}
            </div>
          )}
          {!cargando && !error && !meta?.last && items.length > 0 && (
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <Btn variant="outline" onClick={() => cargar(buscar, (meta?.number ?? 0) + 1)} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando…' : 'Cargar más'}
              </Btn>
            </div>
          )}
        </div>

      </div>

      {sinConsultorios && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.white, border: `1px solid ${T.gray1}`, padding: '32px 36px', maxWidth: 400, width: '90%', display: 'flex', flexDirection: 'column', gap: 16, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: T.black }}>Sin consultorios registrados</span>
            <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, lineHeight: 1.5 }}>Para registrar una consulta necesitás tener al menos un consultorio. Podés crearlo desde "Consultorios".</span>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="outline" onClick={() => setSinConsultorios(false)}>Cancelar</Btn>
              <Btn onClick={() => { setSinConsultorios(false); onIrAConsultorios?.() }}>Ir a Consultorios</Btn>
            </div>
          </div>
        </div>
      )}

      {modalPac && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.white, borderRadius: 12, padding: '28px 32px', width: 420, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Seleccionar paciente</span>
            <div>
              <FieldLabel>Paciente</FieldLabel>
              <PacientePicker pacientes={pacientes} value={pacSelecTemp} onChange={setPacSelecTemp} placeholder="Buscar por nombre o DNI…" />
            </div>
            <button
              onClick={() => { setModalPac(false); setSub('nuevo-paciente') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray4, textAlign: 'left', padding: 0, textDecoration: 'underline' }}
            >
              + Agregar nuevo paciente
            </button>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => setModalPac(false)}>Cancelar</Btn>
              <Btn onClick={confirmarPaciente} disabled={!pacSelecTemp}>Continuar</Btn>
            </div>
          </div>
        </div>
      )}

      {isMobile && !onVolverAFinanzas && (
        <FabAcciones acciones={[
          { label: 'Iniciar consulta', onClick: abrirNuevaConsulta, variant: 'primary' },
        ]} />
      )}
    </div>
  )
}

function ConsultaFila({ a, fmtMonto, fmtTipo, onEditar }) {
  const [hov, setHov] = useState(false)
  const pendiente = a.estadoIngreso === 'PENDIENTE' || a.monto == null
  return (
    <div
      onClick={onEditar}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', columnGap: 16, padding: '10px 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, borderLeft: pendiente ? '3px solid #b45309' : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{a.pacienteApellido}, {a.pacienteNombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{a.descripcion || '—'}</span>
      {a.monto == null
        ? <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cobro pendiente</span>
        : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{fmtMonto(a.monto)}</span>
            {pendiente && a.monto != null && (
              <span style={{ fontFamily: T.mono, fontSize: 8, color: '#b45309', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Cobro pendiente</span>
            )}
          </div>
        )
      }
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{fmtTipo(a.tipoPago)}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em' }}>{a.consultorioNombre || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{a.fecha || fmtFecha(a.dateCreated)}</span>
    </div>
  )
}

function ConsultaCard({ a, fmtMonto, fmtTipo, onEditar, fullWidth = false, hidePaciente = false, selectable = false, selected = false, onToggleSelect }) {
  const [hov, setHov] = useState(false)
  // Source of truth: el estado del ingreso. Antes también chequeábamos a.monto == null como fallback,
  // pero eso causaba que consultas confirmadas vía cobro batch (con consulta.monto null en BD) siguieran
  // pareciendo pendientes en historia clínica.
  const pendiente = a.estadoIngreso === 'PENDIENTE'
  // Si la consulta es por obra social, mostramos el nombre de la OS en vez del label genérico
  // "OBRA SOCIAL" — más útil para el profesional cuando escanea la historia clínica.
  const tipoLabel = a.tipoPago === 'OBRA_SOCIAL' && a.obraSocialNombre
    ? a.obraSocialNombre
    : fmtTipo ? fmtTipo(a.tipoPago) : null
  // En modo seleccionable: click en el card togglea la selección, el borde izquierdo refleja "seleccionado" en negro.
  const handleClick = selectable ? onToggleSelect : onEditar
  const borderLeftColor = selectable
    ? (selected ? T.black : (hov ? T.black : T.gray1))
    : (pendiente ? '#b45309' : hov ? T.black : T.gray1)
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: fullWidth ? '100%' : 240, boxSizing: 'border-box', borderTop: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderRight: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderBottom: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: `3px solid ${borderLeftColor}`, background: T.white, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s, box-shadow 0.15s', borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' }}
    >
      {!hidePaciente && (
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: T.black, fontFamily: T.font, lineHeight: 1.3 }}>
          {a.pacienteApellido}, {a.pacienteNombre}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'stretch' }}>
        {/* Columna izquierda: descripción, consultorio, fecha */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {a.descripcion && (
            <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, lineHeight: 1.4, letterSpacing: '0.02em' }}>
              {a.descripcion}
            </div>
          )}
          <div style={{ flex: 1 }} />
          {a.consultorioNombre && (
            <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{a.consultorioNombre}</div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.black, fontFamily: T.font, letterSpacing: '0.02em' }}>{a.fecha || fmtFecha(a.dateCreated)}</div>
        </div>

        {/* Columna derecha: monto + indicador (checkbox en modo seleccionable, "Cobro pendiente" en modo normal) */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'right', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {selectable
              ? <input type="checkbox" checked={selected} readOnly
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: 'pointer', width: 18, height: 18 }} />
              : pendiente
                ? <span style={{ fontFamily: T.mono, fontSize: 9, color: '#b45309', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cobro pendiente</span>
                : a.monto != null
                  ? <span style={{ fontSize: 13, fontWeight: 500, color: T.black, fontFamily: T.font }}>{fmtMonto(a.monto)}</span>
                  : null
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {tipoLabel && (
              <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4, fontFamily: T.font }}>{tipoLabel}</span>
            )}
            {/* En modo seleccionable (pendientes-por-os), mostrar el coseguro ya cobrado como info auxiliar.
                NO afecta al monto del cobro batch — es solo para que el profesional recuerde qué entró del paciente. */}
            {selectable && a.tipoPago === 'OBRA_SOCIAL' && a.monto != null && Number(a.monto) > 0 && (
              <span title="El paciente ya pagó este coseguro. No se suma al cobro de la obra social."
                style={{ fontFamily: T.mono, fontSize: 9, color: '#15803d', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 4, padding: '2px 6px' }}>
                Coseguro {fmtMonto ? fmtMonto(a.monto) : a.monto}
              </span>
            )}
            {a.cobroObraSocialId && (
              <span title="Esta consulta fue cobrada dentro de un pago de obra social"
                style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 4, padding: '2px 6px' }}>
                Cobrada por OS
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── VistaEstudios ──────────────────────────────────────────── */

const COLS_ANALISIS = [
  { label: 'Nombre',   w: '2fr' },
  { label: 'Paciente', w: '2fr' },
  { label: 'Trazos',   w: '1fr' },
  { label: 'Fecha',    w: '1fr' },
]

function normalizarTrazos(trazos, w, h) {
  return trazos.map(t => {
    if (t.tipo === 'punto')         return { ...t, x: t.x/w, y: t.y/h }
    if (t.tipo === 'linea')         return { ...t, x1: t.x1/w, y1: t.y1/h, x2: t.x2/w, y2: t.y2/h }
    if (t.tipo === 'angulo')        return { ...t, vx: t.vx/w, vy: t.vy/h, ax1: t.ax1/w, ay1: t.ay1/h, ax2: t.ax2/w, ay2: t.ay2/h }
    if (t.tipo === 'angulo-lineas') return { ...t, ix: t.ix/w, iy: t.iy/h, mid1x: t.mid1x/w, mid1y: t.mid1y/h, mid2x: t.mid2x/w, mid2y: t.mid2y/h }
    if (t.tipo === 'longitud')      return { ...t, x1: t.x1/w, y1: t.y1/h, x2: t.x2/w, y2: t.y2/h }
    if (t.tipo === 'circulo')       return { ...t, cx: t.cx/w, cy: t.cy/h, rx: t.rx/w, ry: t.ry/h }
    if (t.tipo === 'cuadrado')      return { ...t, x1: t.x1/w, y1: t.y1/h, x2: t.x2/w, y2: t.y2/h }
    return t
  })
}

function desnormalizarTrazos(trazos, w, h, escala) {
  return trazos.map(t => {
    if (t.tipo === 'punto')         return { ...t, x: t.x*w, y: t.y*h }
    if (t.tipo === 'linea')         return { ...t, x1: t.x1*w, y1: t.y1*h, x2: t.x2*w, y2: t.y2*h }
    if (t.tipo === 'angulo')        return { ...t, vx: t.vx*w, vy: t.vy*h, ax1: t.ax1*w, ay1: t.ay1*h, ax2: t.ax2*w, ay2: t.ay2*h }
    if (t.tipo === 'angulo-lineas') return { ...t, ix: t.ix*w, iy: t.iy*h, mid1x: t.mid1x*w, mid1y: t.mid1y*h, mid2x: t.mid2x*w, mid2y: t.mid2y*h }
    if (t.tipo === 'longitud') {
      const x1 = t.x1*w, y1 = t.y1*h, x2 = t.x2*w, y2 = t.y2*h
      const px = Math.hypot(x2-x1, y2-y1)
      return { ...t, x1, y1, x2, y2, px, mm: escala > 0 ? px/escala : (t.mm ?? 0) }
    }
    if (t.tipo === 'circulo') {
      const cx = t.cx*w, cy = t.cy*h, rx = t.rx*w, ry = t.ry*h
      return { ...t, cx, cy, rx, ry, r: Math.hypot(rx-cx, ry-cy) }
    }
    if (t.tipo === 'cuadrado')      return { ...t, x1: t.x1*w, y1: t.y1*h, x2: t.x2*w, y2: t.y2*h }
    return t
  })
}

function VistaEstudios({ apiFetch, pacienteIdInicial = null, estudioIdInicial = null, onVolver = null }) {
  const isMobile = useIsMobile()
  // En mobile la vista es solo lectura — sin upload, sin edición de trazos, sin eliminar/asignar.
  const readOnly = isMobile
  const [sub,          setSub]          = useState(onVolver
    ? (estudioIdInicial ? 'cargando' : (readOnly ? 'lista' : 'upload'))
    : 'lista')
  const [lista,        setLista]        = useState([])
  const [metaEst,      setMetaEst]      = useState(null)
  const [buscarEst,    setBuscarEst]    = useState('')
  const [cargandoLista,setCargandoLista]= useState(true)
  const [cargandoMasEst,setCargandoMasEst]= useState(false)
  const [estudioId,   setEstudioId]   = useState(null)
  const [imagen,       setImagen]       = useState(null)
  const [nombre,       setNombre]       = useState('')
  const [herramienta,  setHerramienta]  = useState('punto')
  const [trazos,       setTrazos]       = useState([])
  const [primerPunto,   setPrimerPunto]   = useState(null)

  const [lineasSel,     setLineasSel]     = useState([])
  const [lineaHover,    setLineaHover]    = useState(-1)
  const [borrarHover,   setBorrarHover]   = useState(-1)
  const [escala,        setEscala]        = useState(1)
  const [grosor,        setGrosor]        = useState(1)
  const [color,         setColor]         = useState('#ff3333')
  const [calibrado,     setCalibrado]     = useState(false)
  const [mouse,         setMouse]         = useState(null)
  const [subiendo,      setSubiendo]      = useState(false)
  const [errSubida,     setErrSubida]     = useState(null)
  const [asignandoId,   setAsignandoId]   = useState(null)
  const [pacientesOpts, setPacientesOpts] = useState([])
  const [pacSelId,      setPacSelId]      = useState('')
  // Flujo "+ Nuevo estudio": el usuario primero elige paciente (o crea uno) y luego sube la imagen.
  const [modalPacUpload, setModalPacUpload] = useState(false)
  const [pacIdUpload,    setPacIdUpload]    = useState(null)
  const [pacSelTempUpload, setPacSelTempUpload] = useState('')
  // Marca a dónde volver después de crear un paciente nuevo: 'asignar' (modal de asignación a estudio existente) o 'upload' (continuar al upload).
  const [intencionPostNuevo, setIntencionPostNuevo] = useState('asignar')
  const [estadoGuardado, setEstadoGuardado] = useState(null)
  const [pendingFile,    setPendingFile]    = useState(null)
  const [nombrePendiente,setNombrePendiente]= useState('')
  const [descripcion,    setDescripcion]    = useState('')
  const inputRef        = useRef(null), canvasRef = useRef(null), containerRef = useRef(null)
  const pendingNormRef  = useRef(null)
  const skipSaveRef     = useRef(false)
  const debounceRef     = useRef(null)
  const descDebounceRef = useRef(null)
  const latestRef       = useRef({})

  // Zoom de la imagen del estudio (1 = fit, escala visual sólo — los trazos siguen anclados a la imagen).
  const [zoom,          setZoom]          = useState(1)
  const zoomRef         = useRef(1)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  const { openConfirm, dialog: confirmDialog } = useConfirm()

  const cargarLista = useCallback(async (q, page = 0) => {
    if (page === 0) setCargandoLista(true)
    else setCargandoMasEst(true)
    const params = new URLSearchParams({ size: 30, page })
    if (q) params.set('buscar', q)
    const res = await apiFetch(`/estudios?${params}`)
    if (res?.ok) {
      const data = await res.json()
      setLista(prev => page === 0 ? data.content : [...prev, ...data.content])
      setMetaEst({ last: data.last, number: data.number, totalElements: data.totalElements })
    }
    if (page === 0) setCargandoLista(false)
    else setCargandoMasEst(false)
  }, [apiFetch])

  async function abrirAsignacion(id) {
    setAsignandoId(id); setPacSelId('')
    const res = await apiFetch('/pacientes?size=200')
    if (res?.ok) { const d = await res.json(); setPacientesOpts(Array.isArray(d) ? d : (d.content ?? [])) }
  }

  async function confirmarAsignacion() {
    if (!pacSelId) return
    const det = await apiFetch(`/estudios/${asignandoId}`)
    if (!det?.ok) return
    const data = await det.json()
    await apiFetch(`/estudios/${asignandoId}`, {
      method: 'PUT',
      body: JSON.stringify({ pacienteId: Number(pacSelId), trazos: data.trazos ?? [], escala: data.escala ?? 1 })
    })
    setAsignandoId(null)
    cargarLista(buscarEst, 0)
  }

  useEffect(() => {
    if (sub !== 'lista') return
    const t = setTimeout(() => cargarLista(buscarEst, 0), buscarEst ? 350 : 0)
    return () => clearTimeout(t)
  }, [sub, buscarEst, cargarLista])

  useEffect(() => {
    if (!estudioIdInicial) return
    apiFetch(`/estudios/${estudioIdInicial}`).then(async res => {
      if (!res?.ok) return
      const data = await res.json()
      setEstudioId(data.id); setNombre(data.nombre); setEscala(data.escala ?? 1); setCalibrado((data.escala ?? 1) !== 1)
      setDescripcion(data.descripcion ?? '')
      setImagen(`data:${data.imagenTipo};base64,${data.imagenBase64}`)
      pendingNormRef.current = data.trazos ?? []
      setTrazos([]); setSub('editor')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function seleccionarArchivo(file) {
    if (!file || !file.type.startsWith('image/')) return
    const nombreLimpio = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ').trim()
    setNombrePendiente(nombreLimpio)
    setPendingFile(file)
  }

  async function procesarArchivo(file, nombreFinal) {
    if (!file || !file.type.startsWith('image/')) return
    const pacId = pacienteIdInicial ?? pacIdUpload
    if (!pacId) { setErrSubida('Tenés que seleccionar un paciente antes de subir el estudio.'); return }
    setSubiendo(true); setErrSubida(null); setPendingFile(null)
    const fd = new FormData()
    fd.append('imagen', file)
    fd.append('nombre', nombreFinal || file.name)
    fd.append('escala', '1')
    fd.append('pacienteId', pacId)
    let res
    try { res = await apiFetch('/estudios', { method: 'POST', body: fd }) }
    catch (e) { setSubiendo(false); setErrSubida('No se pudo conectar con el servidor'); return }
    if (!res) { setSubiendo(false); setErrSubida('Tu sesión expiró. Iniciá sesión nuevamente.'); return }
    if (!res.ok) { setSubiendo(false); setErrSubida(`Error al subir la imagen (${res.status})`); return }
    const data = await res.json()
    setEstudioId(data.id); setNombre(file.name)
    setImagen(URL.createObjectURL(file))
    setTrazos([]); resetInProgress(); setEscala(1); setCalibrado(false)
    setSubiendo(false); setSub('editor')
  }

  // Disparado por "+ Nuevo estudio" en la lista: abre un modal para elegir/crear paciente antes del upload.
  async function abrirNuevoEstudio() {
    if (pacientesOpts.length === 0) {
      const res = await apiFetch('/pacientes?size=200')
      if (res?.ok) { const d = await res.json(); setPacientesOpts(Array.isArray(d) ? d : (d.content ?? [])) }
    }
    setPacSelTempUpload('')
    setModalPacUpload(true)
  }

  function confirmarPacienteUpload() {
    if (!pacSelTempUpload) return
    setPacIdUpload(pacSelTempUpload)
    setModalPacUpload(false)
    setSub('upload')
  }

  async function cargarEstudio(id) {
    const res = await apiFetch(`/estudios/${id}`)
    if (!res?.ok) return
    const data = await res.json()
    setEstudioId(data.id); setNombre(data.nombre); setEscala(data.escala ?? 1); setCalibrado((data.escala ?? 1) !== 1)
    setDescripcion(data.descripcion ?? '')
    setImagen(`data:${data.imagenTipo};base64,${data.imagenBase64}`)
    pendingNormRef.current = data.trazos ?? []
    setTrazos([]); resetInProgress(); setSub('editor')
  }

  async function handleGuardar() {
    if (!estudioId) return
    const canvas = canvasRef.current; if (!canvas) return
    setGuardando(true)
    await apiFetch(`/estudios/${estudioId}`, {
      method: 'PUT',
      body: JSON.stringify({ trazos: normalizarTrazos(trazos, canvas.width, canvas.height), escala, pacienteId: pacienteIdInicial ?? null })
    })
    setGuardando(false)
  }

  async function handleEliminar(id) {
    if (!await openConfirm('¿Eliminar este estudio?')) return
    await apiFetch(`/estudios/${id}`, { method: 'DELETE' })
    cargarLista(buscarEst, 0)
  }

  async function handleEliminarDesdeEditor() {
    if (!estudioId) return
    if (!await openConfirm('¿Eliminar este estudio? Esta acción no se puede deshacer.')) return
    await apiFetch(`/estudios/${estudioId}`, { method: 'DELETE' })
    if (onVolver) { onVolver() } else { setSub('lista'); setImagen(null); setTrazos([]); resetInProgress() }
  }

  async function handleDescargar() {
    const canvas = canvasRef.current
    if (!canvas || !imagen) return
    const temp = document.createElement('canvas')
    temp.width = canvas.width
    temp.height = canvas.height
    const ctx = temp.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, temp.width, temp.height)
    const img = new Image()
    img.src = imagen
    await new Promise(res => { img.onload = res; img.onerror = res })
    const scale = Math.min(temp.width / img.naturalWidth, temp.height / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (temp.width - w) / 2, (temp.height - h) / 2, w, h)
    ctx.drawImage(canvas, 0, 0)
    const a = document.createElement('a')
    a.href = temp.toDataURL('image/png')
    a.download = `${nombre || 'estudios'}.png`
    a.click()
  }

  const redibujar = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height)
    let nLong = 0
    for (const [i, t] of trazos.entries()) {
      if (t.tipo === 'punto') {
        ctx.fillStyle = t.color ?? COLOR_PUNTO; ctx.beginPath(); ctx.arc(t.x, t.y, RADIOS_PUNTO[t.grosor ?? 1], 0, Math.PI * 2); ctx.fill()
      } else if (t.tipo === 'linea') {
        const mL = herramienta === 'angulo-lineas' || herramienta === 'longitud'
        const eS = herramienta === 'angulo-lineas' && lineasSel.some(s => s.idx === i)
        const eH = mL && lineaHover === i && !eS
        const cL = t.color ?? COLOR_LINEA
        ctx.strokeStyle = (eS || eH) ? COLOR_ANGULO : cL; ctx.fillStyle = (eS || eH) ? COLOR_ANGULO : cL
        const gL = GROSORES_LINEA[t.grosor ?? 1]
        ctx.lineWidth = eS ? gL * 1.8 : eH ? gL * 1.4 : gL; ctx.globalAlpha = eH ? 0.65 : 1
        ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.x1, t.y1, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(t.x2, t.y2, 3, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1; ctx.lineWidth = gL
      } else if (t.tipo === 'angulo') {
        ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(t.vx, t.vy); ctx.lineTo(t.ax1, t.ay1); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(t.vx, t.vy); ctx.lineTo(t.ax2, t.ay2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.vx, t.vy, 4, 0, Math.PI * 2); ctx.fill()
        const { midA, r } = dibujarArco(ctx, t.vx, t.vy, t.ax1, t.ay1, t.ax2, t.ay2)
        dibujarEtiqueta(ctx, `${t.grados.toFixed(1)}°`, t.vx + (r + 20) * Math.cos(midA) - 14, t.vy + (r + 20) * Math.sin(midA) + 5)
      } else if (t.tipo === 'angulo-lineas') {
        ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = 2
        const fa1 = anguloHaciaLinea(t.ix, t.iy, t.a1, t.mid1x, t.mid1y)
        const fa2 = anguloHaciaLinea(t.ix, t.iy, t.a2, t.mid2x, t.mid2y)
        const arm1x = t.ix + 50 * Math.cos(fa1), arm1y = t.iy + 50 * Math.sin(fa1)
        const arm2x = t.ix + 50 * Math.cos(fa2), arm2y = t.iy + 50 * Math.sin(fa2)
        ctx.beginPath(); ctx.arc(t.ix, t.iy, 4, 0, Math.PI * 2); ctx.fill()
        const { midA, r } = dibujarArco(ctx, t.ix, t.iy, arm1x, arm1y, arm2x, arm2y)
        dibujarEtiqueta(ctx, `${t.grados.toFixed(1)}°`, t.ix + (r + 20) * Math.cos(midA) - 14, t.iy + (r + 20) * Math.sin(midA) + 5)
      } else if (t.tipo === 'longitud') {
        nLong++
        const dx = t.x2 - t.x1, dy = t.y2 - t.y1, len = Math.hypot(dx, dy)
        if (len === 0) continue
        const nx = -dy / len, ny = dx / len
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        const drawTick = (x, y) => { ctx.beginPath(); ctx.moveTo(x + nx * 7, y + ny * 7); ctx.lineTo(x - nx * 7, y - ny * 7); ctx.stroke() }
        drawTick(t.x1, t.y1); drawTick(t.x2, t.y2); ctx.lineWidth = 2
        const label = `L${nLong}: ${t.mm.toFixed(1)} mm`
        const mx = (t.x1 + t.x2) / 2 + nx * 22, my = (t.y1 + t.y2) / 2 + ny * 22
        dibujarEtiqueta(ctx, label, mx - label.length * 4, my + 5)
      } else if (t.tipo === 'circulo') {
        ctx.strokeStyle = t.color ?? COLOR_LINEA; ctx.fillStyle = t.color ?? COLOR_LINEA; ctx.lineWidth = GROSORES_LINEA[t.grosor ?? 1]; ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.cx, t.cy, 3, 0, Math.PI * 2); ctx.fill()
      } else if (t.tipo === 'cuadrado') {
        ctx.strokeStyle = t.color ?? COLOR_LINEA; ctx.lineWidth = GROSORES_LINEA[t.grosor ?? 1]; ctx.globalAlpha = 1
        ctx.strokeRect(t.x1, t.y1, t.x2 - t.x1, t.y2 - t.y1)
      }
    }
    if (herramienta === 'linea' && primerPunto) {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = GROSORES_LINEA[grosor]
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, RADIOS_PUNTO[1], 0, Math.PI * 2); ctx.fill()
      if (mouse) { ctx.beginPath(); ctx.moveTo(primerPunto.x, primerPunto.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill() }
    }
    if (herramienta === 'calibrar' && primerPunto) {
      const CAL = '#f59e0b'
      ctx.strokeStyle = CAL; ctx.fillStyle = CAL; ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, RADIOS_PUNTO[1], 0, Math.PI * 2); ctx.fill()
      if (mouse) { ctx.beginPath(); ctx.moveTo(primerPunto.x, primerPunto.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill() }
      ctx.setLineDash([])
    }
    if (herramienta === 'circulo' && primerPunto && mouse) {
      const r = Math.hypot(mouse.x - primerPunto.x, mouse.y - primerPunto.y)
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = GROSORES_LINEA[grosor]
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, r, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, 3, 0, Math.PI * 2); ctx.fill()
    }
    if (herramienta === 'cuadrado' && primerPunto && mouse) {
      ctx.strokeStyle = color; ctx.lineWidth = GROSORES_LINEA[grosor]
      ctx.strokeRect(primerPunto.x, primerPunto.y, mouse.x - primerPunto.x, mouse.y - primerPunto.y)
    }
    if (herramienta === 'borrar' && borrarHover !== -1 && trazos[borrarHover]) {
      const t = trazos[borrarHover]
      ctx.save(); ctx.strokeStyle = 'rgba(239,68,68,0.85)'; ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.lineCap = 'round'
      if (t.tipo === 'punto') { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, (RADIOS_PUNTO[t.grosor ?? 1] ?? 2) + 5, 0, Math.PI * 2); ctx.stroke() }
      else if (t.tipo === 'linea' || t.tipo === 'longitud') { ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke() }
      else if (t.tipo === 'angulo') { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.vx, t.vy, 12, 0, Math.PI * 2); ctx.stroke() }
      else if (t.tipo === 'angulo-lineas') { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.ix, t.iy, 12, 0, Math.PI * 2); ctx.stroke() }
      else if (t.tipo === 'circulo') { ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2); ctx.stroke() }
      else if (t.tipo === 'cuadrado') { ctx.lineWidth = 6; ctx.strokeRect(Math.min(t.x1, t.x2), Math.min(t.y1, t.y2), Math.abs(t.x2 - t.x1), Math.abs(t.y2 - t.y1)) }
      ctx.restore()
    }
  }, [trazos, primerPunto, mouse, herramienta, lineasSel, lineaHover, borrarHover, color])

  useEffect(() => { redibujar() }, [redibujar])
  useEffect(() => {
    if (!imagen) return
    const container = containerRef.current; if (!container) return
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current; if (!canvas) return
      // Sólo redimensionar el buffer interno del canvas cuando estamos en zoom 1 (fit-to-container).
      // Si estamos zoomeados, el container cambia de tamaño por el scrollbar y no queremos perder los trazos.
      if (zoomRef.current === 1) {
        canvas.width = container.clientWidth; canvas.height = container.clientHeight
      }
      if (pendingNormRef.current) {
        skipSaveRef.current = true
        setTrazos(desnormalizarTrazos(pendingNormRef.current, canvas.width, canvas.height, escala))
        pendingNormRef.current = null
      }
      redibujar()
    })
    observer.observe(container); return () => observer.disconnect()
  }, [imagen, redibujar, escala])

  useEffect(() => {
    if (!estudioId || !canvasRef.current) return
    if (skipSaveRef.current) { skipSaveRef.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setEstadoGuardado('guardando')
    const canvas = canvasRef.current
    debounceRef.current = setTimeout(async () => {
      await apiFetch(`/estudios/${estudioId}`, {
        method: 'PUT',
        body: JSON.stringify({ trazos: normalizarTrazos(trazos, canvas.width, canvas.height), escala, pacienteId: pacienteIdInicial ?? null, descripcion: latestRef.current.descripcion ?? '' })
      })
      setEstadoGuardado('guardado')
    }, 600)
  }, [trazos]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    latestRef.current = { trazos, escala, descripcion, estudioId }
  })

  useEffect(() => {
    if (!estudioId || !canvasRef.current) return
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current)
    setEstadoGuardado('guardando')
    const canvas = canvasRef.current
    descDebounceRef.current = setTimeout(async () => {
      const { trazos: t, escala: esc } = latestRef.current
      await apiFetch(`/estudios/${estudioId}`, {
        method: 'PUT',
        body: JSON.stringify({ trazos: normalizarTrazos(t, canvas.width, canvas.height), escala: esc, pacienteId: pacienteIdInicial ?? null, descripcion })
      })
      setEstadoGuardado('guardado')
    }, 800)
  }, [descripcion]) // eslint-disable-line react-hooks/exhaustive-deps

  function getCoordsFromEvent(e) {
    const canvas = canvasRef.current
    const r = canvas.getBoundingClientRect()
    // Mapear coords del mouse del espacio visual (que incluye el zoom CSS) al espacio interno del canvas.
    const scaleX = canvas.width  / r.width
    const scaleY = canvas.height / r.height
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY }
  }
  function lineaCercana(x, y, excluir = []) {
    let best = -1, bestDist = 10
    trazos.forEach((t, i) => { if (t.tipo !== 'linea' || excluir.some(s => (typeof s === 'object' ? s.idx : s) === i)) return; const d = distPuntoSegmento(x, y, t.x1, t.y1, t.x2, t.y2); if (d < bestDist) { bestDist = d; best = i } })
    return best
  }
  function handleCanvasClick(e) {
    const { x, y } = getCoordsFromEvent(e)
    if (herramienta === 'punto') { setTrazos(prev => [...prev, { tipo: 'punto', x, y, grosor, color }]) }
    else if (herramienta === 'linea') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'linea', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y, color, grosor }]); setPrimerPunto(null) }
    } else if (herramienta === 'longitud') {
      const idx = lineaCercana(x, y); if (idx === -1) return
      const t = trazos[idx]; const px = Math.hypot(t.x2 - t.x1, t.y2 - t.y1)
      setTrazos(prev => [...prev, { tipo: 'longitud', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, px, mm: px / escala }])
    } else if (herramienta === 'angulo-lineas') {
      const idx = lineaCercana(x, y, lineasSel); if (idx === -1) return
      const nuevasSel = [...lineasSel, { idx, cx: x, cy: y }]
      if (nuevasSel.length === 2) {
        const t1 = trazos[nuevasSel[0].idx], t2 = trazos[nuevasSel[1].idx]
        const inter = interseccionLineas(t1, t2); if (!inter) { setLineasSel([]); return }
        const a1 = Math.atan2(t1.y2 - t1.y1, t1.x2 - t1.x1), a2 = Math.atan2(t2.y2 - t2.y1, t2.x2 - t2.x1)
        const fa1 = anguloHaciaLinea(inter.ix, inter.iy, a1, nuevasSel[0].cx, nuevasSel[0].cy)
        const fa2 = anguloHaciaLinea(inter.ix, inter.iy, a2, nuevasSel[1].cx, nuevasSel[1].cy)
        let diff = fa2 - fa1
        if (diff > Math.PI) diff -= 2 * Math.PI
        if (diff < -Math.PI) diff += 2 * Math.PI
        diff = Math.abs(diff) * 180 / Math.PI
        setTrazos(prev => [...prev, { tipo: 'angulo-lineas', ix: inter.ix, iy: inter.iy, a1, a2, mid1x: nuevasSel[0].cx, mid1y: nuevasSel[0].cy, mid2x: nuevasSel[1].cx, mid2y: nuevasSel[1].cy, grados: diff }])
        setLineasSel([])
      } else setLineasSel(nuevasSel)
    } else if (herramienta === 'circulo') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { const r = Math.hypot(x-primerPunto.x, y-primerPunto.y); setTrazos(prev => [...prev, { tipo: 'circulo', cx: primerPunto.x, cy: primerPunto.y, rx: x, ry: y, r, color, grosor }]); setPrimerPunto(null) }
    } else if (herramienta === 'cuadrado') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'cuadrado', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y, color, grosor }]); setPrimerPunto(null) }
    } else if (herramienta === 'borrar') {
      const idx = trazoCercanoParaBorrar(x, y, trazos); if (idx === -1) return
      setTrazos(prev => prev.filter((_, i) => i !== idx)); setBorrarHover(-1)
    } else if (herramienta === 'calibrar') {
      if (!primerPunto) { setPrimerPunto({ x, y }) }
      else {
        const px = Math.hypot(x - primerPunto.x, y - primerPunto.y)
        setEscala(parseFloat((px / 10).toFixed(4)))
        setCalibrado(true)
        setPrimerPunto(null)
        setHerramienta('longitud')
      }
    }
  }
  function handleMouseMove(e) {
    const pos = getCoordsFromEvent(e); setMouse(pos)
    if (herramienta === 'angulo-lineas') setLineaHover(lineaCercana(pos.x, pos.y, lineasSel))
    else if (herramienta === 'longitud') setLineaHover(lineaCercana(pos.x, pos.y))
    else setLineaHover(-1)
    if (herramienta === 'borrar') setBorrarHover(trazoCercanoParaBorrar(pos.x, pos.y, trazos))
    else setBorrarHover(-1)
  }
  function resetInProgress() { setPrimerPunto(null); setLineasSel([]); setLineaHover(-1); setBorrarHover(-1) }
  function handleDeshacer() {
    if (herramienta === 'angulo-lineas' && lineasSel.length > 0) { setLineasSel([]); return }
    if (primerPunto) { setPrimerPunto(null); return }
    setTrazos(prev => prev.slice(0, -1))
  }

  const sinAcciones = trazos.length === 0 && !primerPunto && lineasSel.length === 0
  const statusMsg = herramienta === 'linea' && primerPunto ? 'Click para fijar el segundo punto' : herramienta === 'angulo-lineas' && lineasSel.length === 0 ? 'Click en la primera línea' : herramienta === 'angulo-lineas' && lineasSel.length === 1 ? 'Click en la segunda línea' : herramienta === 'longitud' ? 'Click sobre una línea para medirla' : herramienta === 'circulo' && !primerPunto ? 'Click para fijar el centro' : herramienta === 'circulo' && primerPunto ? 'Click para fijar el radio' : herramienta === 'cuadrado' && !primerPunto ? 'Click para fijar la primera esquina' : herramienta === 'cuadrado' && primerPunto ? 'Click para fijar la esquina opuesta' : herramienta === 'calibrar' && !primerPunto ? 'Click en una marca larga del reglero' : herramienta === 'calibrar' && primerPunto ? 'Click en la siguiente marca larga (10 mm)' : herramienta === 'borrar' ? 'Click sobre un trazo para eliminarlo' : null
  const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M3 19 L8 19 L19 8 L14 3 L3 14 Z" fill="white" stroke="#444" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 14 L8 9 L13 14 L8 19 L3 19 Z" fill="#fca5a5" stroke="#444" stroke-width="1.5" stroke-linejoin="round"/></svg>')}") 3 19, crosshair`
  // Lapicito SVG con la punta en (1, 21). Hotspot en la punta para que el trazo arranque exactamente
  // donde el usuario apunta. Fallback a crosshair si el navegador no acepta el url().
  const PENCIL_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M1 21 L4.5 17.5 L4.5 19.5 L2.5 21.5 Z" fill="#1f2937"/><path d="M4.5 17.5 L7 15 L9 17 L6.5 19.5 Z" fill="#fbbf24" stroke="#1f2937" stroke-width="0.6"/><path d="M7 15 L16 6 L18.5 8.5 L9 18 Z" fill="#fcd34d" stroke="#1f2937" stroke-width="0.8" stroke-linejoin="round"/><path d="M16 6 L18 4 L20.5 6.5 L18.5 8.5 Z" fill="#f87171" stroke="#1f2937" stroke-width="0.6" stroke-linejoin="round"/></svg>')}") 1 21, crosshair`
  const canvasCursor = herramienta === 'borrar' ? ERASER_CURSOR : (herramienta === 'angulo-lineas' || herramienta === 'longitud') ? (lineaHover !== -1 ? 'pointer' : 'default') : PENCIL_CURSOR

  // ── CARGANDO estudio existente ──
  if (sub === 'cargando') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <BackBtn onClick={onVolver} />
        <PageTitle>Cargando estudio…</PageTitle>
      </PageBar>
      <Cargando />
    </div>
  )

  // ── UPLOAD ──
  if (sub === 'upload') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <BackBtn onClick={onVolver ?? (() => setSub('lista'))} />
        <PageTitle>Nuevo estudio</PageTitle>
      </PageBar>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Upload size={40} strokeWidth={1} color={T.gray5} />
        <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4, fontFamily: T.font }}>
          Seleccioná una imagen radiográfica para comenzar
        </span>
        {errSubida && (
          <span style={{ fontSize: 12, color: T.red, fontFamily: T.font, maxWidth: 320, textAlign: 'center' }}>{errSubida}</span>
        )}
        <Btn onClick={() => { setErrSubida(null); inputRef.current?.click() }} disabled={subiendo}>
          {subiendo ? 'Subiendo…' : 'Seleccionar imagen'}
        </Btn>
        <input ref={inputRef} type="file" accept="image/*" onChange={e => seleccionarArchivo(e.target.files[0])} style={{ display: 'none' }} />
      </div>

      {pendingFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setPendingFile(null) }}>
          <div style={{ background: T.white, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontSize: 13, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.06em', color: T.black }}>Nombre del estudio</span>
            <div>
              <FieldLabel>Nombre *</FieldLabel>
              <Input
                autoFocus
                value={nombrePendiente}
                onChange={e => setNombrePendiente(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && nombrePendiente.trim()) procesarArchivo(pendingFile, nombrePendiente.trim()) }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="outline" onClick={() => { setPendingFile(null); if (inputRef.current) inputRef.current.value = '' }}>Cancelar</Btn>
              <Btn disabled={!nombrePendiente.trim() || subiendo} onClick={() => procesarArchivo(pendingFile, nombrePendiente.trim())}>
                {subiendo ? 'Subiendo…' : 'Continuar'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── NUEVO PACIENTE (desde modal asignar o desde "Nuevo estudio") ──
  if (sub === 'nuevo-paciente') {
    return (
      <VistaNuevoPaciente
        apiFetch={apiFetch}
        onVolver={() => {
          // Si veníamos del flow "Nuevo estudio", al cancelar volvemos al modal de selección de paciente.
          if (intencionPostNuevo === 'upload') { setSub('lista'); setModalPacUpload(true) }
          else setSub('lista')
        }}
        onCreado={async (id) => {
          const rp = await apiFetch('/pacientes?size=200')
          if (rp?.ok) { const dp = await rp.json(); setPacientesOpts(Array.isArray(dp) ? dp : (dp.content ?? [])) }
          if (intencionPostNuevo === 'upload') {
            setPacIdUpload(id)
            setSub('upload')
          } else {
            setPacSelId(id)
            setSub('lista')
          }
        }}
      />
    )
  }

  // ── LISTA ──
  if (sub === 'lista') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>Estudios</PageTitle>
        {!readOnly && <Btn onClick={abrirNuevoEstudio}>+ Nuevo estudio</Btn>}
      </PageBar>
      <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 36, paddingLeft: 12, flex: 1, maxWidth: 360, borderRadius: 8, background: T.white }}>
            <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
            <input
              value={buscarEst} onChange={e => setBuscarEst(e.target.value)}
              placeholder="Buscar por nombre o paciente…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
            />
          </div>
          {metaEst && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.06em', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{metaEst.totalElements} estudios</span>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargandoLista ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscarEst ? 'Sin resultados' : 'No hay estudios guardados'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lista.map(a => (
                <EstudioCard key={a.id} a={a}
                  onAbrir={() => cargarEstudio(a.id)}
                  onEliminar={readOnly ? null : () => handleEliminar(a.id)}
                  onAsignar={readOnly || a.pacienteApellido ? null : () => abrirAsignacion(a.id)} />
              ))}
            </div>
          )}
          {!cargandoLista && !metaEst?.last && lista.length > 0 && (
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <Btn variant="outline" onClick={() => cargarLista(buscarEst, (metaEst?.number ?? 0) + 1)} disabled={cargandoMasEst}>
                {cargandoMasEst ? 'Cargando…' : 'Cargar más'}
              </Btn>
            </div>
          )}
        </div>

      </div>

      {/* Modal nombre estudio */}
      {pendingFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setPendingFile(null) }}>
          <div style={{ background: T.white, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontSize: 13, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.06em', color: T.black }}>Nombre del estudio</span>
            <div>
              <FieldLabel>Nombre *</FieldLabel>
              <Input
                autoFocus
                value={nombrePendiente}
                onChange={e => setNombrePendiente(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && nombrePendiente.trim()) procesarArchivo(pendingFile, nombrePendiente.trim()) }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="outline" onClick={() => { setPendingFile(null); if (inputRef.current) inputRef.current.value = '' }}>Cancelar</Btn>
              <Btn disabled={!nombrePendiente.trim() || subiendo} onClick={() => procesarArchivo(pendingFile, nombrePendiente.trim())}>
                {subiendo ? 'Subiendo…' : 'Continuar'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar paciente (estudios legacy sin paciente) */}
      {asignandoId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setAsignandoId(null) }}>
          <div style={{ background: T.white, borderRadius: 12, padding: '28px 32px', width: 420, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Asignar paciente</span>
            <div>
              <FieldLabel>Paciente</FieldLabel>
              <PacientePicker pacientes={pacientesOpts} value={pacSelId} onChange={setPacSelId} placeholder="Buscar por nombre o DNI…" />
            </div>
            <button
              onClick={() => { setIntencionPostNuevo('asignar'); setSub('nuevo-paciente') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray4, textAlign: 'left', padding: 0, textDecoration: 'underline' }}
            >
              + Agregar nuevo paciente
            </button>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => setAsignandoId(null)}>Cancelar</Btn>
              <Btn onClick={confirmarAsignacion} disabled={!pacSelId}>Asignar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal seleccionar paciente para "Nuevo estudio" */}
      {modalPacUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModalPacUpload(false) }}>
          <div style={{ background: T.white, borderRadius: 12, padding: '28px 32px', width: 420, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Seleccionar paciente</span>
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, lineHeight: 1.5 }}>Cada estudio queda asociado a un paciente. Elegí uno existente o cargá uno nuevo.</span>
            <div>
              <FieldLabel>Paciente</FieldLabel>
              <PacientePicker pacientes={pacientesOpts} value={pacSelTempUpload} onChange={setPacSelTempUpload} placeholder="Buscar por nombre o DNI…" />
            </div>
            <button
              onClick={() => { setIntencionPostNuevo('upload'); setModalPacUpload(false); setSub('nuevo-paciente') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray4, textAlign: 'left', padding: 0, textDecoration: 'underline' }}
            >
              + Agregar nuevo paciente
            </button>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => setModalPacUpload(false)}>Cancelar</Btn>
              <Btn onClick={confirmarPacienteUpload} disabled={!pacSelTempUpload}>Continuar</Btn>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  )

  // ── EDITOR ──
  // ── Mobile: read-only, solo imagen + trazos guardados ───────────
  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.black }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 44, gap: 8, flexShrink: 0, background: T.white, borderBottom: `1px solid ${T.gray1}` }}>
          <BackBtn onClick={() => { if (onVolver) { onVolver() } else { setSub('lista'); setImagen(null); setTrazos([]); resetInProgress() } }} />
          <span style={{ flex: 1, fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{nombre}</span>
        </div>
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: T.black }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={imagen} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 44, borderBottom: `1px solid ${T.gray1}`, gap: 8, flexShrink: 0 }}>
        <BackBtn onClick={() => { if (onVolver) { onVolver() } else { setSub('lista'); setImagen(null); setTrazos([]); resetInProgress() } }} />
        <span style={{ flex: 1, fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{nombre}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {estadoGuardado === 'guardando' && <span style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, letterSpacing: '0.04em' }}>Guardando…</span>}
          {estadoGuardado === 'guardado'  && <span style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, letterSpacing: '0.04em' }}>✓ Guardado</span>}
          <Btn variant="outline" size="sm" onClick={handleDescargar}>Descargar PNG</Btn>
        </div>
      </div>

      {/* Área principal: tres card panels */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: T.gray2, padding: '16px 20px', gap: 12 }}>

        {/* Card herramientas */}
        <div style={{ width: 168, flexShrink: 0, background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 6px', fontSize: 9, fontFamily: T.font, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5, fontWeight: 600 }}>Herramientas</div>

          {/* ── Grupo Dibujar ── */}
          <SideSection label="Dibujar" />
          {HERRAMIENTAS_DIBUJAR.map(({ key, label, Ico }) => (
            <SideToolGroup key={key}>
              <SideToolBtn active={herramienta === key} onClick={() => { resetInProgress(); setHerramienta(key) }}>
                <Ico />{label}
              </SideToolBtn>
            </SideToolGroup>
          ))}

          {/* Grosor + Color — herramientas de dibujo */}
          {['punto', 'linea', 'circulo', 'cuadrado'].includes(herramienta) && (
            <div style={{ padding: '4px 14px 10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ fontSize: 8, fontFamily: T.font, color: T.gray4, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Grosor</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map(g => (
                    <button key={g} onClick={() => setGrosor(g)}
                      style={{ width: 28, height: 22, fontSize: 9, fontFamily: T.font, fontWeight: 600, border: `1px solid ${grosor === g ? T.black : T.gray2}`, background: grosor === g ? T.black : T.white, color: grosor === g ? T.white : T.gray4, cursor: 'pointer', borderRadius: 2 }}>
                      {g}×
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 8, fontFamily: T.font, color: T.gray4, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Color</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {COLORES_PRESET.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      style={{ width: 22, height: 22, background: c, border: color === c ? `2px solid ${T.black}` : `1px solid ${T.gray2}`, borderRadius: 3, cursor: 'pointer', outline: color === c ? '1px solid #888' : 'none', outlineOffset: 1 }} />
                  ))}
                  <label style={{ width: 22, height: 22, cursor: 'pointer', position: 'relative', border: `1px solid ${T.gray2}`, borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── Grupo Medir ── */}
          <SideSection label="Medir" top />
          {HERRAMIENTAS_MEDIR.map(({ key, label, Ico }) => {
            const efectivo = key === 'longitud' && !calibrado ? 'calibrar' : key
            return (
              <SideToolGroup key={key}>
                <SideToolBtn
                  active={herramienta === key}
                  onClick={() => { resetInProgress(); setHerramienta(efectivo) }}
                  title={key === 'longitud' && !calibrado ? 'Calibrá primero la imagen' : undefined}
                >
                  <Ico />{label}
                  {key === 'longitud' && !calibrado && <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 12, lineHeight: 1 }}>⚠</span>}
                </SideToolBtn>
                {key === 'longitud' && herramienta === 'longitud' && calibrado && (
                  <div style={{ padding: '2px 14px 6px 36px', fontSize: 9, fontFamily: T.font, color: T.gray4, letterSpacing: '0.04em' }}>
                    {escala.toFixed(2)} px/mm
                  </div>
                )}
              </SideToolGroup>
            )
          })}

          {/* ── Grupo Acciones ── */}
          <SideSection label="Acciones" top />
          <SideToolBtn active={false} onClick={handleDeshacer} disabled={sinAcciones}>
            ↩ Deshacer
          </SideToolBtn>
          <SideToolBtn active={false} onClick={() => { setTrazos([]); resetInProgress() }} disabled={sinAcciones}>
            ✕ Limpiar
          </SideToolBtn>

          {/* Hint de estado */}
          {statusMsg && (
            <div style={{ marginTop: 'auto', padding: '10px 14px', fontSize: 9, fontFamily: T.font, color: T.gray4, borderTop: `1px solid ${T.gray1}`, lineHeight: 1.6, letterSpacing: '0.04em' }}>
              {statusMsg}
            </div>
          )}
        </div>

        {/* Card imagen / canvas — wrapper externo para overlays no-scrolleables */}
        <div style={{ flex: 1, position: 'relative', background: T.black, borderRadius: 12, overflow: 'hidden' }}>
          {/* Scroll container — se hace scrolleable cuando zoom > 1 */}
          <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', overflow: zoom === 1 ? 'hidden' : 'auto', scrollbarGutter: 'stable' }}
          >
            {/* Wrapper escalable: a zoom 1 ocupa 100% (fit); a zoom > 1 crece y dispara scroll */}
            <div style={{ width: `${100 * zoom}%`, height: `${100 * zoom}%`, position: 'relative', minWidth: '100%', minHeight: '100%' }}>
              <img src={imagen} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />
              <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: canvasCursor }} onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseLeave={() => { setMouse(null); setLineaHover(-1); setBorrarHover(-1) }} />
            </div>
          </div>

          {/* Overlays absolutos al wrapper externo — no se mueven con el scroll del contenido */}
          <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'inline-flex', alignItems: 'center', gap: 0, background: 'rgba(17,17,17,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: 2, zIndex: 5 }}>
            <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} disabled={zoom <= 0.5}
              style={{ width: 28, height: 26, background: 'none', border: 'none', color: zoom <= 0.5 ? 'rgba(255,255,255,0.3)' : T.white, cursor: zoom <= 0.5 ? 'default' : 'pointer', fontSize: 16, fontFamily: T.font, lineHeight: 1 }}>−</button>
            <button onClick={() => setZoom(1)}
              style={{ minWidth: 44, height: 26, padding: '0 8px', background: 'none', border: 'none', color: T.white, cursor: 'pointer', fontSize: 10, fontFamily: T.mono, letterSpacing: '0.05em' }}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))} disabled={zoom >= 5}
              style={{ width: 28, height: 26, background: 'none', border: 'none', color: zoom >= 5 ? 'rgba(255,255,255,0.3)' : T.white, cursor: zoom >= 5 ? 'default' : 'pointer', fontSize: 16, fontFamily: T.font, lineHeight: 1 }}>+</button>
          </div>

          <RatioPanel trazos={trazos} />
          <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: T.font, pointerEvents: 'none' }}>{nombre}</span>
        </div>

        {confirmDialog}

        {/* Card descripción / análisis */}
        <div style={{ width: 260, flexShrink: 0, background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px 8px', fontSize: 9, fontFamily: T.font, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5, fontWeight: 600, borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
            Descripción / Análisis
          </div>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Escribí tus notas, hallazgos o diagnóstico sobre este estudio…"
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              padding: '12px 14px', fontFamily: T.font, fontSize: 12,
              color: T.black, lineHeight: 1.6, letterSpacing: '0.02em',
              background: T.white,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function SideSection({ label, top }) {
  return (
    <div style={{ padding: top ? '12px 14px 4px' : '4px 14px', fontSize: 8, fontFamily: 'var(--font, system-ui)', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, borderTop: top ? '1px solid #f3f4f6' : 'none', marginTop: top ? 6 : 0 }}>
      {label}
    </div>
  )
}
function SideToolGroup({ children }) {
  return <div>{children}</div>
}
function SideToolBtn({ active, onClick, title, disabled, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={disabled ? undefined : onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 34, padding: '0 14px', border: 'none', background: active ? '#111' : hov && !disabled ? '#f3f4f6' : 'transparent', color: active ? '#fff' : disabled ? '#d1d5db' : hov ? '#111' : '#6b7280', cursor: disabled ? 'default' : 'pointer', fontFamily: 'system-ui, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.02em', textAlign: 'left', transition: 'background 0.1s, color 0.1s' }}
    >
      {children}
    </button>
  )
}

function EstudioFila({ a, onClick, onEliminar, onAsignar }) {
  const [hov, setHov] = useState(false)
  const [hovT, setHovT] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 40px', padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, transition: 'background 0.1s', cursor: 'pointer' }}
      onClick={onClick}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{a.nombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4 }}>
        {a.pacienteApellido
          ? `${a.pacienteApellido}, ${a.pacienteNombre}`
          : onAsignar
            ? <button onClick={e => { e.stopPropagation(); onAsignar() }}
                style={{ background: 'none', border: `1px solid ${T.gray2}`, borderRadius: 2, padding: '2px 8px', fontFamily: T.font, fontSize: 10, color: T.gray4, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                + Asignar
              </button>
            : '—'}
      </span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4 }}>{a.cantidadTrazos} trazos</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{fmtFecha(a.dateCreated)}</span>
      <button onClick={e => { e.stopPropagation(); onEliminar() }}
        onMouseEnter={() => setHovT(true)} onMouseLeave={() => setHovT(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovT ? T.red : T.gray6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>✕</button>
    </div>
  )
}

function MovimientoCard({ m, onEliminar, onIrAConsulta }) {
  const [hov, setHov] = useState(false)
  const esIngreso = m.tipo === 'ingreso'
  const pendiente = m.tipo === 'pendiente'
  const esCobroOs = m.origen === 'cobro_os'
  const [y, mo, d] = (m.fecha || '').split('-')
  const fechaFmt = m.fecha ? `${d}/${mo}/${y}` : '—'
  // Los cobros de OS no se eliminan desde acá — el flow vivo está en la pestaña "Cobros"
  // (que confirma con el usuario que los ingresos vuelven a pendiente).
  const eliminable = m.id != null && m.origen !== 'consulta' && !esCobroOs
  const irAConsulta = pendiente && m.origen === 'consulta' && m.consultaId != null && onIrAConsulta
  const signo = esIngreso || pendiente ? '+' : '−'
  const borderLeftColor = pendiente ? '#b45309' : esIngreso ? (hov ? T.black : T.gray1) : '#9b1c1c'
  return (
    <div
      onClick={irAConsulta ? () => onIrAConsulta(m.consultaId, m.pacienteId) : undefined}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', boxSizing: 'border-box', borderTop: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderRight: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderBottom: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: `3px solid ${borderLeftColor}`, background: T.white, padding: 14, display: 'grid', gridTemplateColumns: '1fr auto 32px', columnGap: 12, alignItems: 'center', transition: 'border-color 0.15s, box-shadow 0.15s', borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)', cursor: irAConsulta ? 'pointer' : 'default' }}
    >
      {/* Col 1: Descripción + fecha. Para filas pendientes de OS, sufijamos el nombre de la OS
          (la descripción base "Consulta · X" no lo trae). Si ya está en la descripción, no lo duplicamos. */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: T.font, fontSize: 14, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {m.descripcion}
          {pendiente && m.obraSocialNombre && !m.descripcion?.includes(m.obraSocialNombre) ? ` · ${m.obraSocialNombre}` : ''}
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.04em' }}>{fechaFmt}</span>
      </div>
      {/* Col 2: Monto con signo */}
      {pendiente && m.monto == null
        ? <span style={{ fontFamily: T.mono, fontSize: 9, color: '#b45309', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Cobro pendiente</span>
        : (
          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', display: 'block' }}>{signo}{fmtPesos(m.monto)}</span>
            {pendiente && (
              <span style={{ fontFamily: T.mono, fontSize: 9, color: '#b45309', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2, display: 'block', whiteSpace: 'nowrap' }}>Cobro pendiente</span>
            )}
            {m.cobroObraSocialId && !esCobroOs && (
              <span title={m.cobroObraSocialFecha ? `Cobrada el ${m.cobroObraSocialFecha} dentro de un pago de obra social` : 'Esta consulta fue cobrada dentro de un pago de obra social'}
                style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2, display: 'inline-block', whiteSpace: 'nowrap', background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 4, padding: '2px 6px' }}>
                Cobrada por OS
              </span>
            )}
          </div>
        )
      }
      {/* Col 3: Eliminar o chevron de "ir a consulta" */}
      {eliminable ? (
        <button onClick={e => { e.stopPropagation(); onEliminar() }}
          title={`Eliminar ${m.origen === 'egreso' ? 'egreso' : 'ingreso'}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.gray5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.color = T.red}
          onMouseLeave={e => e.currentTarget.style.color = T.gray5}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      ) : irAConsulta ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gray4, fontSize: 18, fontFamily: T.mono, lineHeight: 1 }}>›</span>
      ) : <span />}
    </div>
  )
}

function EstudioCard({ a, onAbrir, onEliminar, onAsignar }) {
  const [hov, setHov] = useState(false)
  const tienePaciente = !!a.pacienteApellido
  return (
    <div
      onClick={onAbrir}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', boxSizing: 'border-box', borderTop: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderRight: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderBottom: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: hov ? `3px solid ${T.black}` : `3px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s, box-shadow 0.15s', borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.black, fontFamily: T.font, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{a.nombre}</span>
        {onEliminar && (
          <button onClick={e => { e.stopPropagation(); onEliminar() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.gray5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.gray5}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        )}
      </div>
      {tienePaciente && (
        <div style={{ fontSize: 12, fontFamily: T.font, color: T.gray4 }}>{a.pacienteApellido}, {a.pacienteNombre}</div>
      )}
      {!tienePaciente && onAsignar && (
        <button onClick={e => { e.stopPropagation(); onAsignar() }}
          style={{ alignSelf: 'flex-start', background: 'none', border: `1px solid ${T.gray1}`, borderRadius: 4, padding: '3px 10px', fontFamily: T.mono, fontSize: 9, color: T.gray4, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          + Asignar paciente
        </button>
      )}
      <div style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, letterSpacing: '0.04em' }}>
        {a.cantidadTrazos} {a.cantidadTrazos === 1 ? 'trazo' : 'trazos'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.black, fontFamily: T.font, letterSpacing: '0.02em', marginTop: 2 }}>
        {fmtFecha(a.lastUpdated || a.dateCreated)}
      </div>
    </div>
  )
}

function EstudioFilaPaciente({ a, onAbrir, onEliminar }) {
  const [hov, setHov] = useState(false)
  const [hovX, setHovX] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.gray7}`, background: hov ? T.gray2 : 'none', transition: 'background 0.1s', marginLeft: -8, marginRight: -8, paddingLeft: 8, paddingRight: 8, borderRadius: 2 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.black, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</span>
        <span style={{ fontFamily: T.font, fontSize: 10, color: T.gray4, letterSpacing: '0.04em' }}>
          {a.cantidadTrazos} trazos · {fmtFecha(a.lastUpdated)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Btn size="sm" variant="outline" onClick={onAbrir}>Abrir</Btn>
        <button
          onClick={onEliminar}
          onMouseEnter={() => setHovX(true)} onMouseLeave={() => setHovX(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovX ? T.red : T.gray6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>✕</button>
      </div>
    </div>
  )
}

/* ─── odontograma (standalone, sin nav) ─────────────────────── */

const TS = 38, TG = 3, ML = 22
const Q1 = [18, 17, 16, 15, 14, 13, 12, 11]
const Q2 = [21, 22, 23, 24, 25, 26, 27, 28]
const Q3 = [31, 32, 33, 34, 35, 36, 37, 38]
const Q4 = [48, 47, 46, 45, 44, 43, 42, 41]

const CONDICIONES = [
  { key: 'sano',       label: 'Sano',                 color: T.white },
  { key: 'caries',     label: 'Caries',               color: '#ef4444' },
  { key: 'arreglo',    label: 'Arreglo / Obturación', color: '#3b82f6' },
  { key: 'corona',     label: 'Corona',               color: '#f59e0b' },
  { key: 'extraccion', label: 'Extracción indicada',  color: T.gray4  },
  { key: 'ausente',    label: 'Ausente',              color: T.gray1  },
]
const COLOR_COND = Object.fromEntries(CONDICIONES.map(c => [c.key, c.color]))

function Diente({ numero, superficies, onClickSuperficie }) {
  const [hov, setHov] = useState(null)
  const s = TS, o = Math.round(s * 0.26)
  const fill = sup => { const c = superficies[sup] || 'sano'; return c !== 'sano' ? COLOR_COND[c] : hov === sup ? T.gray2 : T.white }
  const poly = (key, pts) => <polygon key={key} points={pts} fill={fill(key)} stroke="#444" strokeWidth={0.8} style={{ cursor: 'pointer' }} onClick={e => onClickSuperficie(numero, key, e)} onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)} />
  return (
    <svg width={s} height={s} style={{ display: 'block', flexShrink: 0 }}>
      {poly('v', `0,0 ${s},0 ${s-o},${o} ${o},${o}`)}
      {poly('d', `${s},0 ${s},${s} ${s-o},${s-o} ${s-o},${o}`)}
      {poly('l', `${s},${s} 0,${s} ${o},${s-o} ${s-o},${s-o}`)}
      {poly('m', `0,0 ${o},${o} ${o},${s-o} 0,${s}`)}
      <rect x={o} y={o} width={s-2*o} height={s-2*o} fill={fill('o')} stroke="#444" strokeWidth={0.8} style={{ cursor: 'pointer' }} onClick={e => onClickSuperficie(numero, 'o', e)} onMouseEnter={() => setHov('o')} onMouseLeave={() => setHov(null)} />
    </svg>
  )
}

function MenuCondicion({ x, y, onSelect }) {
  return (
    <div style={{ position: 'fixed', left: x + 10, top: y + 10, background: T.white, border: `1px solid ${T.black}`, zIndex: 100, minWidth: 180, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: T.font }} onClick={e => e.stopPropagation()}>
      {CONDICIONES.map((c, i) => (
        <button key={c.key} onClick={() => onSelect(c.key)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: i < CONDICIONES.length - 1 ? `1px solid ${T.gray2}` : 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11, color: T.gray4, fontFamily: T.font }}
          onMouseEnter={e => e.currentTarget.style.background = T.gray2} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <div style={{ width: 12, height: 12, background: c.color, border: `1px solid ${T.gray1}`, flexShrink: 0 }} />
          {c.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Odontograma ────────────────────────────────────────────── */

function Odontograma({ apiFetch, pacienteId }) {
  const [historiales,  setHistoriales]  = useState([])
  const [superficies,  setSuperficies]  = useState({})
  const [selId,        setSelId]        = useState(null)
  const [cargando,     setCargando]     = useState(true)
  const [guardando,    setGuardando]    = useState(false)
  const [menu,         setMenu]         = useState(null)
  const { openConfirm, dialog }         = useConfirm()

  const cargarTodos = useCallback(async () => {
    const r = await apiFetch(`/pacientes/${pacienteId}/odontogramas`)
    if (r?.ok) {
      const lista = await r.json()
      setHistoriales(lista)
      if (lista.length > 0) setSuperficies(lista[0].superficies || {})
    }
    setCargando(false)
  }, [apiFetch, pacienteId])

  useEffect(() => { cargarTodos() }, [cargarTodos])

  const modoHistorial = selId !== null
  const sups = modoHistorial
    ? (historiales.find(h => h.id === selId)?.superficies || {})
    : superficies

  function handleClickSuperficie(numero, sup, e) {
    if (modoHistorial) return
    e.stopPropagation()
    setMenu({ numero, superficie: sup, x: e.clientX, y: e.clientY })
  }

  async function handleSelect(condicion) {
    if (!menu) return
    const key  = `${menu.numero}_${menu.superficie}`
    const next = { ...superficies, [key]: condicion }
    setSuperficies(next); setMenu(null); setGuardando(true)
    await apiFetch(`/pacientes/${pacienteId}/odontograma`, { method: 'POST', body: JSON.stringify({ superficies: next }) })
    setGuardando(false)
  }

  async function handleNuevo(e) {
    e.stopPropagation()
    if (!await openConfirm('Se creará un odontograma nuevo en blanco. El actual quedará guardado en el historial. ¿Continuar?', { confirmLabel: 'Continuar', confirmVariant: 'default' })) return
    setGuardando(true)
    const r = await apiFetch(`/pacientes/${pacienteId}/odontogramas`, { method: 'POST' })
    if (r?.ok) { await cargarTodos(); setSelId(null) }
    setGuardando(false)
  }

  function dienteSups(n) {
    const r = {}
    ;['v', 'd', 'l', 'm', 'o'].forEach(s => { r[s] = sups[`${n}_${s}`] || 'sano' })
    return r
  }

  if (cargando) return <div style={{ padding: '2rem', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando odontograma…</div>

  const filaDientes = (nums, labelAbajo = false) => (
    <div style={{ display: 'flex', gap: TG }}>
      {nums.map(n => (
        <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {!labelAbajo && <span style={{ fontSize: 9, color: T.gray3, fontFamily: T.font }}>{n}</span>}
          <Diente numero={n} superficies={dienteSups(n)} onClickSuperficie={handleClickSuperficie} />
          {labelAbajo  && <span style={{ fontSize: 9, color: T.gray3, fontFamily: T.font }}>{n}</span>}
        </div>
      ))}
    </div>
  )

  const btnVer = (label, id) => {
    const activo = id === null ? selId === null : selId === id
    return (
      <button key={id ?? 'actual'} type="button" onClick={() => setSelId(id)}
        style={{ height: 26, padding: '0 10px', border: `1px solid ${activo ? T.black : T.gray1}`, borderRadius: 4, background: activo ? T.black : T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 10, color: activo ? T.white : T.gray4, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </button>
    )
  }

  return (
    <div onClick={() => setMenu(null)} style={{ position: 'relative', userSelect: 'none' }}>

      {/* ── selector de versiones ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {btnVer('Actual', null)}
          {historiales.slice(1).map(h => btnVer(fmtFecha(h.dateCreated), h.id))}
        </div>
        {!modoHistorial && (
          <button type="button" onClick={handleNuevo} disabled={guardando}
            style={{ height: 26, padding: '0 10px', border: `1px solid ${T.gray1}`, borderRadius: 4, background: T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 10, color: T.gray4, letterSpacing: '0.04em' }}>
            + Nuevo odontograma
          </button>
        )}
      </div>

      {modoHistorial && (
        <div style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#fff7e6', border: '1px solid #fde68a', borderRadius: 4 }}>
          <span style={{ fontSize: 10, fontFamily: T.font, color: '#92400e', letterSpacing: '0.06em' }}>
            Solo lectura — {fmtFecha(historiales.find(h => h.id === selId)?.dateCreated)}
          </span>
        </div>
      )}

      {guardando && <span style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, color: T.gray5, fontFamily: T.font, letterSpacing: '0.08em' }}>Guardando…</span>}

      {/* Scroll horizontal cuando el odontograma no entra en la pantalla — keeps el contenido completo accesible */}
      <div style={{ overflowX: 'auto', overflowY: 'visible', margin: '0 -16px', padding: '0 16px' }}>
        <div style={{ minWidth: 'max-content', margin: '0 auto', width: 'fit-content' }}>
          <div style={{ display: 'flex', gap: TG * 4, marginBottom: ML }}>
            {filaDientes(Q1, false)}
            <div style={{ width: 1, background: T.gray1, alignSelf: 'stretch', margin: `0 ${TG * 2}px` }} />
            {filaDientes(Q2, false)}
          </div>

          <div style={{ display: 'flex', gap: TG * 4 }}>
            {filaDientes(Q4, true)}
            <div style={{ width: 1, background: T.gray1, alignSelf: 'stretch', margin: `0 ${TG * 2}px` }} />
            {filaDientes(Q3, true)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        {CONDICIONES.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, background: c.color, border: `1px solid ${T.gray1}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontFamily: T.font, color: T.gray4, letterSpacing: '0.06em' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {menu && <MenuCondicion x={menu.x} y={menu.y} onSelect={handleSelect} />}
      {dialog}
    </div>
  )
}

/* ─── RatioPanel ─────────────────────────────────────────────── */

function RatioPanel({ trazos }) {
  const ls = trazos.filter(t => t.tipo === 'longitud')
  if (ls.length < 2) return null
  const l1 = ls[0], l2 = ls[1], ratio = l1.mm / l2.mm
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.96)', border: `1px solid ${T.black}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 5, fontFamily: T.font, pointerEvents: 'none', minWidth: 140 }}>
      <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray3 }}>Índice</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: `1px solid ${T.gray1}`, paddingBottom: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: T.gray4 }}>L1 = {l1.mm.toFixed(2)} mm</span>
        <span style={{ fontSize: 11, color: T.gray4 }}>L2 = {l2.mm.toFixed(2)} mm</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray3 }}>L1 / L2</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', letterSpacing: '-0.02em' }}>{ratio.toFixed(3)}</span>
      </div>
    </div>
  )
}

/* ─── VistaTurnos ────────────────────────────────────────────── */

function GoogleCalendarIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="2.5" width="15" height="14" rx="2" fill="white" stroke="#dadce0" strokeWidth="0.8"/>
      <rect x="1.5" y="2.5" width="15" height="4.5" rx="2" fill="#4285F4"/>
      <rect x="1.5" y="5" width="15" height="2" fill="#4285F4"/>
      <rect x="5.25" y="0.5" width="1.5" height="4" rx="0.75" fill="#4285F4"/>
      <rect x="11.25" y="0.5" width="1.5" height="4" rx="0.75" fill="#4285F4"/>
      <circle cx="6" cy="13" r="1.1" fill="#EA4335"/>
      <circle cx="9" cy="13" r="1.1" fill="#FBBC04"/>
      <circle cx="12" cy="13" r="1.1" fill="#34A853"/>
    </svg>
  )
}

const ESTADO_TURNO_COLORS = {
  PENDIENTE:  { bg: '#fef9c3', border: '#ca8a04', text: '#713f12' },
  CONFIRMADO: { bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
}

const VACÍO_TURNO = {
  pacienteId: '',
  nombrePacienteLibre: '',
  consultorioId: '',
  fechaHora: '',
  duracionMinutos: 30,
  motivo: '',
  estado: 'PENDIENTE',
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toLocalISOString(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function formatFechaHoraInput(fechaHora) {
  if (!fechaHora) return ''
  const d = new Date(fechaHora)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const DIAS_SEMANA_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function nombrePaciente(t) {
  if (t.pacienteNombre) return `${t.pacienteApellido ?? ''} ${t.pacienteNombre}`.trim()
  return t.nombrePacienteLibre || 'Sin nombre'
}

function formatHora(fechaHora) {
  const d = new Date(fechaHora)
  if (isNaN(d)) return ''
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Para una lista de turnos del mismo día, devuelve un Map { id -> { col, totalCols } }
 * que indica la columna horizontal y cuántas columnas totales usar. Turnos que se solapan
 * en el tiempo se dividen el ancho de la grilla. Usa union-find para agrupar clusters de
 * solapamiento transitivo y asigna columnas greedy dentro de cada cluster.
 */
function calcularColumnasTurnos(turnos) {
  const n = turnos.length
  if (n === 0) return new Map()
  const data = turnos.map(t => {
    const start = new Date(t.fechaHora).getTime()
    return { id: t.id, start, end: start + (t.duracionMinutos || 30) * 60_000 }
  })
  data.sort((a, b) => a.start - b.start)

  const parent = data.map((_, i) => i)
  const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]))
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (data[j].start >= data[i].end) break
      if (data[i].end > data[j].start && data[j].end > data[i].start) union(i, j)
    }
  }

  const clusters = new Map()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    if (!clusters.has(r)) clusters.set(r, [])
    clusters.get(r).push(i)
  }

  const out = new Map()
  for (const cluster of clusters.values()) {
    cluster.sort((a, b) => data[a].start - data[b].start)
    const colEnds = []
    const cols = new Map()
    for (const i of cluster) {
      let col = 0
      while (col < colEnds.length && colEnds[col] > data[i].start) col++
      cols.set(i, col)
      colEnds[col] = data[i].end
    }
    const total = colEnds.length
    for (const i of cluster) {
      out.set(data[i].id, { col: cols.get(i), totalCols: total })
    }
  }
  return out
}

function TurnosHoyPanel({ turnos, onClickTurno }) {
  const hoy = new Date()
  return (
    <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.02em', display: 'block' }}>
          Turnos de hoy
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4 }}>
          {DIAS_SEMANA_LABELS[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1]} {hoy.getDate()} {MESES_CORTO[hoy.getMonth()]}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {turnos.length === 0 ? (
          <div style={{ padding: '28px 18px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>
            Sin turnos hoy
          </div>
        ) : (
          turnos.map(t => {
            const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
            return (
              <div key={t.id} onClick={() => onClickTurno?.(t)}
                style={{ padding: '12px 18px', borderBottom: `1px solid ${T.gray1}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3 }}
                onMouseEnter={e => e.currentTarget.style.background = T.gray2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black }}>{formatHora(t.fechaHora)}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: col.bg, color: col.text, border: `1px solid ${col.border}`, padding: '1px 6px', borderRadius: 3 }}>{t.estado}</span>
                </div>
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.black, fontWeight: 500 }}>{nombrePaciente(t)}</span>
                {t.consultorioNombre && <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4 }}>{t.consultorioNombre}</span>}
                {t.motivo && <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, fontStyle: 'italic' }}>{t.motivo}</span>}
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray5, letterSpacing: '0.06em' }}>{t.duracionMinutos} min</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function VistaTurnos({ apiFetch, fechaInicial }) {
  const isMobile = useIsMobile()
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Grilla 24h scrolleable. Mobile y desktop tienen distinto alto por hora pero mismo rango.
  const HORA_INICIO_GRILLA = 0
  const HORA_FIN_GRILLA    = 24
  const ALTO_HORA_MOBILE   = 64
  const ALTO_HORA_DESKTOP  = 80

  // Ref al contenedor scrolleable de la grilla — usado para centrar la línea "ahora" al abrir.
  const scrollGridRef = useRef(null)

  // Centra la grilla en la hora actual al terminar de cargar, cambiar de día o cambiar de modo.
  // Deps explícitas para NO re-scrollear cada vez que se actualiza `ahora`.

  const [modoVista,       setModoVista]       = useState(() => {
    const m = localStorage.getItem('turnos-modo')
    return ['dia', 'semana', 'mes'].includes(m) ? m : 'semana'
  })
  const cantDiasRango     = { dia: 1, semana: 7, mes: 7 }[modoVista]
  const [rangoInicio,     setRangoInicio]     = useState(() => {
    if (fechaInicial) { const d = new Date(fechaInicial); d.setHours(0,0,0,0); return d }
    const d = new Date(); d.setHours(0,0,0,0)
    if (window.innerWidth < MOBILE_BREAKPOINT) return d
    const m = localStorage.getItem('turnos-modo') ?? 'semana'
    if (m === 'semana' || m === 'mes') return startOfWeek(new Date())
    return d
  })
  const [ahora,           setAhora]           = useState(() => new Date())
  const [turnos,          setTurnos]          = useState([])
  const [cargando,        setCargando]        = useState(true)
  const [calConectado,    setCalConectado]    = useState(null)
  const [modalOpen,       setModalOpen]       = useState(false)
  const [form,            setForm]            = useState(VACÍO_TURNO)
  const [editId,          setEditId]          = useState(null)
  const [guardando,       setGuardando]       = useState(false)
  const [formErr,         setFormErr]         = useState(null)
  const [pacientes,       setPacientes]       = useState([])
  const [consultorios,    setConsultorios]    = useState([])
  const [usarPacienteLib, setUsarPacienteLib] = useState(false)
  const { openConfirm, dialog: confirmDialog } = useConfirm()

  // Centra la grilla en la hora actual al terminar de cargar, al cambiar de día o cambiar de modo.
  useEffect(() => {
    if (cargando) return
    const el = scrollGridRef.current
    if (!el) return
    const now = new Date()
    const horaActual = now.getHours() + now.getMinutes() / 60
    const alto = isMobile ? ALTO_HORA_MOBILE : ALTO_HORA_DESKTOP
    const top  = (horaActual - HORA_INICIO_GRILLA) * alto
    el.scrollTop = Math.max(0, top - el.clientHeight / 2)
  }, [cargando, isMobile, modoVista, rangoInicio.getTime()])

  const rangoFin = addDays(rangoInicio, cantDiasRango - 1)

  // Cambio de modoVista: ajustar rangoInicio para mantener "hoy" visible cuando sea posible.
  function cambiarModoVista(nuevo) {
    setModoVista(nuevo)
    localStorage.setItem('turnos-modo', nuevo)
    if (nuevo === 'semana' || nuevo === 'mes') {
      setRangoInicio(startOfWeek(new Date()))
    } else {
      const d = new Date(); d.setHours(0,0,0,0)
      setRangoInicio(d)
    }
  }

  // Para vista mes: calcular el rango (lunes anterior al primer día → domingo posterior al último día).
  function rangoMes(refDate) {
    const primero = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
    const inicio  = startOfWeek(primero)
    const ultimo  = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0)
    const fin     = startOfWeek(ultimo); fin.setDate(fin.getDate() + 6)
    const dias    = []
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) dias.push(new Date(d))
    return { inicio, fin, dias, mesRef: refDate }
  }
  // mesAncla: Date de referencia para vista mes (cualquier día dentro del mes).
  const [mesAncla, setMesAncla] = useState(() => new Date())
  const datosMes = modoVista === 'mes' ? rangoMes(mesAncla) : null

  // Tick cada 60s para actualizar la línea de hora actual.
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const cargarTurnos = useCallback(async () => {
    setCargando(true)
    let desdeDate, hastaDate
    if (modoVista === 'mes') {
      const r = rangoMes(mesAncla)
      desdeDate = r.inicio
      hastaDate = addDays(r.fin, 1)
    } else {
      desdeDate = rangoInicio
      hastaDate = addDays(rangoInicio, cantDiasRango)
    }
    const desde = toLocalISOString(desdeDate)
    const hasta = toLocalISOString(hastaDate)
    const res = await apiFetch(`/turnos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`)
    if (res?.ok) setTurnos(await res.json())
    setCargando(false)
  }, [apiFetch, rangoInicio, cantDiasRango, modoVista, mesAncla])

  const cargarEstadoCal = useCallback(async () => {
    const res = await apiFetch('/calendar/status')
    if (res?.ok) {
      const data = await res.json()
      setCalConectado(data.conectado)
    }
  }, [apiFetch])

  useEffect(() => { cargarTurnos() }, [cargarTurnos])
  useEffect(() => { cargarEstadoCal() }, [cargarEstadoCal])

  async function cargarFormDeps() {
    apiFetch('/pacientes?size=200').then(r => r?.ok && r.json().then(d => setPacientes(Array.isArray(d) ? d : (d.content ?? []))))
    apiFetch('/consultorios').then(r => r?.ok && r.json().then(d => setConsultorios(d)))
  }

  /**
   * Variante de abrirNuevo que primero revalida el estado de Google Calendar contra el back.
   * Si HABÍA conexión activa y se detecta que se cayó (token revocado entre la carga de la vista
   * y este click), ofrece reconectar (mismo flow que el botón "Conectar" del header). Si el
   * usuario opta por no reconectar, abre el modal igual (el turno se guarda sin sincronizar).
   * Si nunca conectó, abre el modal directamente.
   */
  async function abrirNuevoConChequeoCal(diaDate, hora = 9) {
    const estabaConectado = calConectado === true
    if (estabaConectado) {
      const res = await apiFetch('/calendar/status')
      if (res?.ok) {
        const data = await res.json()
        setCalConectado(data.conectado)
        if (!data.conectado) {
          const reconectar = await openConfirm('Google Calendar se desconectó. ¿Querés reconectarlo ahora? Se abrirá Google en una nueva pestaña para que autorices el acceso.', { confirmLabel: 'Reconectar', confirmVariant: 'primary' })
          if (reconectar) {
            conectarCalendar()
            return
          }
        }
      }
    }
    abrirNuevo(diaDate, hora)
  }

  function abrirNuevo(diaDate, hora = 9) {
    const d = new Date(diaDate)
    d.setHours(hora, 0, 0, 0)
    const pad = n => String(n).padStart(2, '0')
    const fh = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hora)}:00`
    setForm({ ...VACÍO_TURNO, fechaHora: fh })
    setEditId(null)
    setUsarPacienteLib(false)
    setFormErr(null)
    setModalOpen(true)
    cargarFormDeps()
  }

  function abrirEditar(turno) {
    setForm({
      pacienteId:          turno.pacienteId ?? '',
      nombrePacienteLibre: turno.nombrePacienteLibre ?? '',
      consultorioId:       turno.consultorioId ?? '',
      fechaHora:           formatFechaHoraInput(turno.fechaHora),
      duracionMinutos:     turno.duracionMinutos ?? 30,
      motivo:              turno.motivo ?? '',
      estado:              turno.estado ?? 'PENDIENTE',
    })
    setUsarPacienteLib(!turno.pacienteId && !!turno.nombrePacienteLibre)
    setEditId(turno.id)
    setFormErr(null)
    setModalOpen(true)
    cargarFormDeps()
  }

  function cerrarModal() { setModalOpen(false); setForm(VACÍO_TURNO); setEditId(null); setFormErr(null) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'duracionMinutos' ? Number(value) : value }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!usarPacienteLib && !form.pacienteId && !form.nombrePacienteLibre.trim()) {
      setFormErr('Ingresá un paciente o el nombre del nuevo paciente'); return
    }
    if (!form.fechaHora) { setFormErr('Ingresá fecha y hora'); return }
    if (!form.consultorioId) { setFormErr('Seleccioná un consultorio'); return }
    setFormErr(null); setGuardando(true)

    const body = {
      pacienteId:          usarPacienteLib ? null : (form.pacienteId ? Number(form.pacienteId) : null),
      nombrePacienteLibre: usarPacienteLib ? (form.nombrePacienteLibre || null) : null,
      consultorioId:       form.consultorioId ? Number(form.consultorioId) : null,
      fechaHora:           form.fechaHora + ':00',
      duracionMinutos:     Number(form.duracionMinutos),
      motivo:              form.motivo || null,
      estado:              form.estado,
    }

    const res = editId
      ? await apiFetch(`/turnos/${editId}`, { method: 'PUT',  body: JSON.stringify(body) })
      : await apiFetch('/turnos',            { method: 'POST', body: JSON.stringify(body) })

    if (!res) { setGuardando(false); return }
    if (res.ok) { cerrarModal(); cargarTurnos() }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  async function handleEliminar() {
    if (!editId) return
    setGuardando(true)
    const res = await apiFetch(`/turnos/${editId}`, { method: 'DELETE' })
    if (res?.ok || res?.status === 204) { cerrarModal(); cargarTurnos() }
    else setFormErr('Error al eliminar')
    setGuardando(false)
  }

  async function conectarCalendar() {
    const res = await apiFetch('/calendar/auth-url')
    if (!res?.ok) return
    const { url } = await res.json()
    window.open(url, '_blank')
  }

  async function desconectarCalendar() {
    const res = await apiFetch('/calendar/desconectar', { method: 'DELETE' })
    if (res?.ok || res?.status === 204) setCalConectado(false)
  }

  const diasRango = Array.from({ length: cantDiasRango }, (_, i) => addDays(rangoInicio, i))

  const esHoyEnVista = (() => {
    if (modoVista === 'mes') return mesAncla.getFullYear() === hoy.getFullYear() && mesAncla.getMonth() === hoy.getMonth()
    return rangoInicio.getTime() <= hoy.getTime() && hoy.getTime() <= addDays(rangoInicio, cantDiasRango - 1).getTime()
  })()
  function turnosDelDia(dia) {
    return turnos.filter(t => {
      const td = new Date(t.fechaHora)
      return td.getFullYear() === dia.getFullYear() &&
             td.getMonth()    === dia.getMonth()    &&
             td.getDate()     === dia.getDate()
    }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
  }

  const fmtRango = () => {
    const d1 = diasRango[0], dN = diasRango[diasRango.length - 1]
    if (diasRango.length === 1) {
      return `${d1.getDate()} ${MESES_CORTO[d1.getMonth()]} ${d1.getFullYear()}`
    }
    if (d1.getMonth() === dN.getMonth() && d1.getFullYear() === dN.getFullYear()) {
      return `${d1.getDate()} – ${dN.getDate()} ${MESES_CORTO[d1.getMonth()]} ${d1.getFullYear()}`
    }
    return `${d1.getDate()} ${MESES_CORTO[d1.getMonth()]} – ${dN.getDate()} ${MESES_CORTO[dN.getMonth()]} ${dN.getFullYear()}`
  }

  const selectStyle = {
    height: 36, width: '100%', padding: '0 10px',
    border: `1px solid ${T.gray1}`, borderRadius: 0,
    fontFamily: T.font, fontSize: 13, color: T.black,
    background: T.white, outline: 'none', appearance: 'none',
  }

  // ── Mobile: vista día (default) o semana (con scroll horizontal). En mobile no exponemos Mes ───
  if (isMobile) {
    const HORA_INICIO_M = HORA_INICIO_GRILLA, HORA_FIN_M = HORA_FIN_GRILLA, ALTO_HORA_M = ALTO_HORA_MOBILE
    const horasM = Array.from({ length: HORA_FIN_M - HORA_INICIO_M }, (_, i) => HORA_INICIO_M + i)
    const diaActual = diasRango[0]
    const esHoyDiaActual = diaActual.getFullYear() === hoy.getFullYear() && diaActual.getMonth() === hoy.getMonth() && diaActual.getDate() === hoy.getDate()
    const fmtFechaDia = diaActual.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    const nowTopM = esHoyDiaActual ? (ahora.getHours() - HORA_INICIO_M + ahora.getMinutes() / 60) * ALTO_HORA_M : null
    const mostrarLineaAhoraM = modoVista === 'dia' && esHoyDiaActual && nowTopM != null && nowTopM >= 0 && nowTopM <= (HORA_FIN_M - HORA_INICIO_M) * ALTO_HORA_M
    const turnosDelDiaActual = modoVista === 'dia' ? turnosDelDia(diaActual) : []
    const subtituloHeader = modoVista === 'semana'
      ? `${MESES_LABEL[(diasRango[Math.floor(diasRango.length / 2)] || rangoInicio).getMonth()]} de ${(diasRango[Math.floor(diasRango.length / 2)] || rangoInicio).getFullYear()}`
      : fmtFechaDia

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.white }}>
        {/* header con fecha */}
        <div style={{ padding: '14px 16px 12px', flexShrink: 0, borderBottom: `1px solid ${T.gray1}` }}>
          <div style={{ fontFamily: T.font, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Turnos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtituloHeader}</span>
            {modoVista === 'dia' && esHoyDiaActual && <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: T.black, color: T.white, padding: '2px 6px', borderRadius: 3 }}>Hoy</span>}
          </div>
        </div>

        {/* franja Google Calendar */}
        <div style={{ padding: '8px 16px', flexShrink: 0, borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src="/google_calendar_icon.png" alt="" style={{ width: 18, height: 18, display: 'block' }} />
            {calConectado != null && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: calConectado ? '#16a34a' : '#dc2626', border: `1.5px solid ${T.white}` }} />
            )}
          </div>
          <span style={{ flex: 1, fontFamily: T.font, fontSize: 11, color: calConectado ? T.gray4 : '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {calConectado == null ? '…' : calConectado ? 'Google Calendar conectado' : 'Google Calendar no conectado'}
          </span>
          {calConectado != null && (
            calConectado
              ? <Btn size="sm" variant="ghost" onClick={desconectarCalendar}>Desconectar</Btn>
              : <Btn size="sm" variant="ghost" onClick={conectarCalendar}>Conectar</Btn>
          )}
        </div>

        {/* navegación: ‹ Hoy › + selector Día/Semana */}
        <div style={{ padding: '8px 16px', flexShrink: 0, borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => {
              if (modoVista === 'semana') setRangoInicio(s => addDays(s, -7))
              else setRangoInicio(s => addDays(s, -1))
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: T.gray4 }}>‹</button>
          <button onClick={() => {
              if (modoVista === 'semana') setRangoInicio(startOfWeek(new Date()))
              else { const d = new Date(); d.setHours(0,0,0,0); setRangoInicio(d) }
            }}
            disabled={esHoyEnVista}
            style={{ background: T.white, border: `1px solid ${esHoyEnVista ? T.gray2 : T.gray1}`, cursor: esHoyEnVista ? 'default' : 'pointer', height: 32, padding: '0 14px', fontFamily: T.font, fontSize: 12, fontWeight: 500, color: esHoyEnVista ? T.gray3 : T.black, borderRadius: 100 }}>
            Hoy
          </button>
          <button onClick={() => {
              if (modoVista === 'semana') setRangoInicio(s => addDays(s, 7))
              else setRangoInicio(s => addDays(s, 1))
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: T.gray4 }}>›</button>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <select value={modoVista} onChange={e => cambiarModoVista(e.target.value)}
              style={{ height: 32, border: `1px solid ${T.gray1}`, borderRadius: 100, background: T.white, padding: '0 28px 0 14px', fontFamily: T.font, fontSize: 12, color: T.black, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.gray5, fontSize: 9 }}>▼</span>
          </div>
        </div>

        {/* grilla SEMANA mobile: 7 columnas estrechas con scroll horizontal */}
        {modoVista === 'semana' && (cargando ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
        ) : (
          <div ref={scrollGridRef} style={{ flex: 1, overflow: 'auto' }}>
            {(() => {
              const COL_WIDTH = 96  // ancho por columna día
              const totalWidth = 48 + COL_WIDTH * diasRango.length
              return (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: totalWidth }}>
                  {/* headers de días sticky */}
                  <div style={{ display: 'flex', flexShrink: 0, background: T.white, position: 'sticky', top: 0, zIndex: 3 }}>
                    <div style={{ width: 48, flexShrink: 0 }} />
                    {diasRango.map((dia, i) => {
                      const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                      const labelIdx = (dia.getDay() + 6) % 7
                      return (
                        <div key={i} style={{ width: COL_WIDTH, flexShrink: 0, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 9, fontFamily: T.font, letterSpacing: '0.08em', textTransform: 'uppercase', color: esHoy ? T.black : T.gray4, fontWeight: 500 }}>{DIAS_SEMANA_LABELS[labelIdx].toUpperCase()}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: esHoy ? T.black : 'transparent', color: esHoy ? T.white : T.black, fontSize: 16, fontFamily: T.font, fontWeight: 400, lineHeight: 1 }}>
                            {dia.getDate()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* grilla horas */}
                  <div style={{ display: 'flex', position: 'relative', height: (HORA_FIN_M - HORA_INICIO_M) * ALTO_HORA_M, paddingBottom: 80 }}>
                    {/* eje horas sticky a la izquierda */}
                    <div style={{ width: 48, flexShrink: 0, position: 'sticky', left: 0, background: T.white, zIndex: 2 }}>
                      {horasM.map((h, i) => (
                        <div key={h} style={{ height: ALTO_HORA_M, display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingRight: 6, justifyContent: 'flex-end' }}>
                          {i > 0 && <span style={{ fontSize: 9, color: T.gray4, fontFamily: T.mono, letterSpacing: '0.04em' }}>{h}:00</span>}
                        </div>
                      ))}
                    </div>
                    {/* columnas día */}
                    {diasRango.map((dia, di) => {
                      const esHoyCol = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                      const nowTop = esHoyCol ? (ahora.getHours() - HORA_INICIO_M + ahora.getMinutes() / 60) * ALTO_HORA_M : null
                      const mostrarLineaAhora = esHoyCol && nowTop != null && nowTop >= 0 && nowTop <= (HORA_FIN_M - HORA_INICIO_M) * ALTO_HORA_M
                      const turnosCol = turnosDelDia(dia)
                      const layoutCol = calcularColumnasTurnos(turnosCol)
                      return (
                        <div key={di} style={{ width: COL_WIDTH, flexShrink: 0, position: 'relative', borderLeft: `1px solid ${T.gray1}` }}>
                          {horasM.map((h, i) => (
                            <div key={h}
                              onClick={() => abrirNuevo(dia, h)}
                              style={{ position: 'absolute', top: i * ALTO_HORA_M, left: 0, right: 0, height: ALTO_HORA_M, borderTop: `1px solid ${T.gray1}`, cursor: 'pointer', boxSizing: 'border-box' }}
                            />
                          ))}
                          {mostrarLineaAhora && (
                            <div style={{ position: 'absolute', top: nowTop - 1, left: 0, right: 0, height: 2, background: T.red, zIndex: 2, pointerEvents: 'none' }}>
                              <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: T.red }} />
                            </div>
                          )}
                          {turnosCol.map(t => {
                            const d = new Date(t.fechaHora)
                            const top = (d.getHours() - HORA_INICIO_M + d.getMinutes() / 60) * ALTO_HORA_M
                            const height = Math.max((t.duracionMinutos / 60) * ALTO_HORA_M, 16)
                            const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                            const info = layoutCol.get(t.id) ?? { col: 0, totalCols: 1 }
                            const positioning = info.totalCols === 1
                              ? { left: 3, right: 3 }
                              : { left: `calc(${info.col * (100 / info.totalCols)}% + 2px)`, width: `calc(${100 / info.totalCols}% - 3px)` }
                            return (
                              <div key={t.id}
                                onClick={e => { e.stopPropagation(); abrirEditar(t) }}
                                style={{ position: 'absolute', top, height, ...positioning, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 4, padding: '2px 4px', cursor: 'pointer', overflow: 'hidden', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 0, boxSizing: 'border-box' }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: col.text, fontFamily: T.font, lineHeight: 1.1 }}>{formatHora(t.fechaHora)}</span>
                                <span style={{ fontSize: 10, color: col.text, fontFamily: T.font, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePaciente(t)}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        ))}

        {/* grilla 1 día */}
        {modoVista === 'dia' && (cargando ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
        ) : (
          <div ref={scrollGridRef} style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', height: (HORA_FIN_M - HORA_INICIO_M) * ALTO_HORA_M, paddingBottom: 80 }}>
              {/* eje horas */}
              <div style={{ width: 48, flexShrink: 0 }}>
                {horasM.map((h, i) => (
                  <div key={h} style={{ height: ALTO_HORA_M, display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingRight: 8, justifyContent: 'flex-end' }}>
                    {i > 0 && <span style={{ fontSize: 9, color: T.gray4, fontFamily: T.mono, letterSpacing: '0.04em' }}>{h}:00</span>}
                  </div>
                ))}
              </div>
              {/* columna día */}
              <div style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${T.gray1}` }}>
                {horasM.map((h, i) => (
                  <div key={h}
                    onClick={() => abrirNuevo(diaActual, h)}
                    style={{ position: 'absolute', top: i * ALTO_HORA_M, left: 0, right: 0, height: ALTO_HORA_M, borderTop: `1px solid ${T.gray1}`, cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                ))}
                {/* línea hora actual */}
                {mostrarLineaAhoraM && (
                  <div style={{ position: 'absolute', top: nowTopM - 1, left: 0, right: 0, height: 2, background: T.red, zIndex: 2, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: T.red }} />
                  </div>
                )}
                {/* turnos */}
                {(() => {
                  const layoutM = calcularColumnasTurnos(turnosDelDiaActual)
                  return turnosDelDiaActual.map(t => {
                    const d = new Date(t.fechaHora)
                    const top = (d.getHours() - HORA_INICIO_M + d.getMinutes() / 60) * ALTO_HORA_M
                    const realHeight = (t.duracionMinutos / 60) * ALTO_HORA_M
                    const height = Math.max(realHeight, 16)
                    const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                    const info = layoutM.get(t.id) ?? { col: 0, totalCols: 1 }
                    const positioning = info.totalCols === 1
                      ? { left: 6, right: 6 }
                      : { left: `calc(${info.col * (100 / info.totalCols)}% + 4px)`, width: `calc(${100 / info.totalCols}% - 6px)` }
                    return (
                      <div key={t.id}
                        onClick={e => { e.stopPropagation(); abrirEditar(t) }}
                        style={{ position: 'absolute', top, height, ...positioning, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 6, padding: '2px 8px', cursor: 'pointer', overflow: 'hidden', zIndex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: col.text, fontFamily: T.font, lineHeight: 1.1, flexShrink: 0 }}>{formatHora(t.fechaHora)}</span>
                        <span style={{ fontSize: 11, color: col.text, fontFamily: T.font, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{nombrePaciente(t)}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        ))}

        {!modalOpen && (
          <FabAcciones acciones={[
            { label: 'Nuevo turno', onClick: () => abrirNuevoConChequeoCal(diaActual), variant: 'primary' },
          ]} />
        )}

        {turnoModal()}
        {confirmDialog}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* top bar */}
      <PageBar>
        <PageTitle>Turnos</PageTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src="/google_calendar_icon.png" alt="Google Calendar" style={{ width: 18, height: 18, display: 'block' }} />
            {calConectado != null && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: calConectado ? '#16a34a' : '#dc2626', border: `1.5px solid ${T.white}` }} />
            )}
          </div>
          <span style={{ fontFamily: T.font, fontSize: 13, color: calConectado ? T.gray4 : '#dc2626' }}>
            {calConectado ? 'Google Calendar conectado — turnos sincronizados automáticamente.' : 'Google Calendar no conectado'}
          </span>
          {calConectado
            ? <Btn size="sm" variant="ghost" onClick={desconectarCalendar}>Desconectar</Btn>
            : <Btn size="sm" variant="ghost" onClick={conectarCalendar}>Conectar</Btn>
          }
          <Btn onClick={() => abrirNuevoConChequeoCal(new Date())}>+ Nuevo turno</Btn>
        </div>
      </PageBar>

      {/* body: calendar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* navegación + selector de vista — estilo Google Calendar (botón Hoy redondeado,
            flechas circulares, mes grande con título "Mes Año", selector dropdown a la derecha). */}
        <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <button onClick={() => {
              if (modoVista === 'mes') setMesAncla(new Date())
              else if (modoVista === 'semana') setRangoInicio(startOfWeek(new Date()))
              else { const d = new Date(); d.setHours(0,0,0,0); setRangoInicio(d) }
            }}
            disabled={esHoyEnVista}
            onMouseEnter={e => { if (!esHoyEnVista) e.currentTarget.style.background = T.gray2 }}
            onMouseLeave={e => { e.currentTarget.style.background = T.white }}
            style={{ background: T.white, border: `1px solid ${T.gray1}`, cursor: esHoyEnVista ? 'default' : 'pointer', height: 36, padding: '0 18px', fontFamily: T.font, fontSize: 14, fontWeight: 500, color: esHoyEnVista ? T.gray3 : T.black, borderRadius: 100, transition: 'background 0.15s' }}>
            Hoy
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => {
                if (modoVista === 'mes') setMesAncla(a => new Date(a.getFullYear(), a.getMonth() - 1, 1))
                else setRangoInicio(s => addDays(s, -cantDiasRango))
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.gray2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              aria-label="Anterior"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: T.gray5, lineHeight: 1, transition: 'background 0.15s' }}>
              ‹
            </button>
            <button onClick={() => {
                if (modoVista === 'mes') setMesAncla(a => new Date(a.getFullYear(), a.getMonth() + 1, 1))
                else setRangoInicio(s => addDays(s, cantDiasRango))
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.gray2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              aria-label="Siguiente"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: T.gray5, lineHeight: 1, transition: 'background 0.15s' }}>
              ›
            </button>
          </div>
          <span style={{ fontFamily: T.font, fontSize: 22, color: T.black, letterSpacing: '-0.01em', fontWeight: 400, flex: 1, textTransform: 'capitalize' }}>
            {(() => {
              const refDate = modoVista === 'mes' ? mesAncla : (diasRango[Math.floor(diasRango.length / 2)] || rangoInicio)
              return `${MESES_LABEL[refDate.getMonth()]} de ${refDate.getFullYear()}`
            })()}
          </span>
          {/* selector de vista — dropdown estilo GCal */}
          <div style={{ position: 'relative' }}>
            <select value={modoVista} onChange={e => cambiarModoVista(e.target.value)}
              style={{ height: 36, border: `1px solid ${T.gray1}`, borderRadius: 100, background: T.white, padding: '0 36px 0 18px', fontFamily: T.font, fontSize: 14, color: T.black, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
              <option value="semana">Semana</option>
              <option value="dia">Día</option>
              <option value="mes">Mes</option>
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.gray5, fontSize: 10 }}>▼</span>
          </div>
        </div>

      {/* vista mes (grilla mensual) */}
      {modoVista === 'mes' && datosMes && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* headers de días de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flexShrink: 0, borderBottom: `1px solid ${T.gray1}`, background: T.white }}>
            {DIAS_SEMANA_LABELS.map((label, i) => (
              <div key={i} style={{ padding: '8px 12px', borderLeft: i === 0 ? 'none' : `1px solid ${T.gray1}`, fontSize: 9, fontFamily: T.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>
                {label}
              </div>
            ))}
          </div>
          {cargando ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, 1fr)', height: '100%' }}>
                {datosMes.dias.map((dia, idx) => {
                  const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                  const fueraDelMes = dia.getMonth() !== mesAncla.getMonth()
                  const turnosDia = turnosDelDia(dia)
                  return (
                    <div key={idx}
                      onClick={() => abrirNuevo(dia, 9)}
                      style={{ borderRight: `1px solid ${T.gray1}`, borderBottom: `1px solid ${T.gray1}`, padding: 6, display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer', background: fueraDelMes ? T.gray2 : T.white, opacity: fueraDelMes ? 0.6 : 1, overflow: 'hidden' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: esHoy ? 22 : 'auto', height: esHoy ? 22 : 'auto', borderRadius: '50%', background: esHoy ? T.black : 'transparent', color: esHoy ? T.white : T.black, fontSize: 12, fontFamily: T.font, fontWeight: 600, lineHeight: 1, alignSelf: 'flex-start' }}>
                        {dia.getDate()}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                        {turnosDia.slice(0, 3).map(t => {
                          const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                          return (
                            <div key={t.id}
                              onClick={e => { e.stopPropagation(); abrirEditar(t) }}
                              style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 3, padding: '2px 5px', fontSize: 10, color: col.text, fontFamily: T.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: 4 }}>
                              <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatHora(t.fechaHora)}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePaciente(t)}</span>
                            </div>
                          )
                        })}
                        {turnosDia.length > 3 && (
                          <span style={{ fontSize: 9, fontFamily: T.mono, color: T.gray4, letterSpacing: '0.04em', paddingLeft: 4 }}>
                            +{turnosDia.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* calendar grid (día / semana) */}
      {modoVista !== 'mes' && (() => {
        const HORA_INICIO = HORA_INICIO_GRILLA, HORA_FIN = HORA_FIN_GRILLA, ALTO_HORA = ALTO_HORA_DESKTOP
        const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
        return (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* sticky day headers — estilo Google Calendar: día arriba (uppercase, gris si no es hoy),
                número grande debajo. Hoy con círculo negro y número en blanco. Sin divisiones entre días
                ni fondo blanco — comparte el fondo del panel para que el header se vea como una sola pieza. */}
            <div style={{ display: 'flex', flexShrink: 0, background: 'transparent' }}>
              <div style={{ width: 52, flexShrink: 0 }} />
              {diasRango.map((dia, i) => {
                const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                const labelIdx = (dia.getDay() + 6) % 7 // lunes = 0
                return (
                  <div key={i} style={{ flex: 1, padding: '8px 12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontFamily: T.font, letterSpacing: '0.08em', textTransform: 'uppercase', color: esHoy ? T.black : T.gray4, fontWeight: 500 }}>{DIAS_SEMANA_LABELS[labelIdx].toUpperCase()}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: esHoy ? T.black : 'transparent', color: esHoy ? T.white : T.black, fontSize: 22, fontFamily: T.font, fontWeight: 400, lineHeight: 1 }}>
                      {dia.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* scrollable time grid */}
            {cargando ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
            ) : (
              <div ref={scrollGridRef} style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', height: (HORA_FIN - HORA_INICIO) * ALTO_HORA }}>

                  {/* time axis */}
                  <div style={{ width: 52, flexShrink: 0 }}>
                    {horas.map((h, i) => (
                      <div key={h} style={{ height: ALTO_HORA, display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingRight: 10, justifyContent: 'flex-end' }}>
                        {i > 0 && <span style={{ fontSize: 9, color: T.gray4, fontFamily: T.mono, letterSpacing: '0.04em' }}>{h}:00</span>}
                      </div>
                    ))}
                  </div>

                  {/* day columns */}
                  {diasRango.map((dia, di) => {
                    const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                    const nowTop = esHoy ? (ahora.getHours() - HORA_INICIO + ahora.getMinutes() / 60) * ALTO_HORA : null
                    const mostrarLineaAhora = esHoy && nowTop != null && nowTop >= 0 && nowTop <= (HORA_FIN - HORA_INICIO) * ALTO_HORA
                    return (
                    <div key={di} style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${T.gray1}` }}>
                      {/* hour slot backgrounds */}
                      {horas.map((h, i) => (
                        <div key={h}
                          onClick={() => abrirNuevo(dia, h)}
                          onMouseEnter={e => e.currentTarget.style.background = T.gray2}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{ position: 'absolute', top: i * ALTO_HORA, left: 0, right: 0, height: ALTO_HORA, borderTop: `1px solid ${T.gray1}`, cursor: 'pointer', boxSizing: 'border-box' }}
                        />
                      ))}
                      {/* línea de hora actual */}
                      {mostrarLineaAhora && (
                        <div style={{ position: 'absolute', top: nowTop - 1, left: 0, right: 0, height: 2, background: T.red, zIndex: 2, pointerEvents: 'none' }}>
                          <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: T.red }} />
                        </div>
                      )}
                      {/* appointments */}
                      {(() => {
                        const turnosDia = turnosDelDia(dia)
                        const layout = calcularColumnasTurnos(turnosDia)
                        return turnosDia.map(t => {
                          const d = new Date(t.fechaHora)
                          const top = (d.getHours() - HORA_INICIO + d.getMinutes() / 60) * ALTO_HORA
                          const height = Math.max((t.duracionMinutos / 60) * ALTO_HORA, 16)
                          const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                          const info = layout.get(t.id) ?? { col: 0, totalCols: 1 }
                          const positioning = info.totalCols === 1
                            ? { left: 4, right: 4 }
                            : { left: `calc(${info.col * (100 / info.totalCols)}% + 2px)`, width: `calc(${100 / info.totalCols}% - 4px)` }
                          return (
                            <div key={t.id}
                              onClick={e => { e.stopPropagation(); abrirEditar(t) }}
                              style={{ position: 'absolute', top, height, ...positioning, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', overflow: 'hidden', zIndex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, boxSizing: 'border-box' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: col.text, fontFamily: T.font, lineHeight: 1.1, flexShrink: 0 }}>{formatHora(t.fechaHora)}</span>
                              <span style={{ fontSize: 11, color: col.text, fontFamily: T.font, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{nombrePaciente(t)}</span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                    )
                  })}

                </div>
              </div>
            )}
          </div>
        )
      })()}
        </div> {/* fin wrapper calendario */}
      </div>   {/* fin body (panel + calendario) */}

      {turnoModal()}
    </div>
  )

  function turnoModal() {
    if (!modalOpen) return null
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 8 : 0 }}
        onClick={cerrarModal}>
        <div style={{ background: T.white, border: `1px solid ${T.gray1}`, width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
          onClick={e => e.stopPropagation()}>

          {/* modal header */}
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.black }}>{editId ? 'Editar turno' : 'Nuevo turno'}</span>
            <button onClick={cerrarModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: T.gray3, lineHeight: 1, padding: 4 }}>×</button>
          </div>

          {/* modal body */}
          <form onSubmit={handleGuardar} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* paciente toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <button type="button" onClick={() => setUsarPacienteLib(false)}
                style={{ flex: 1, height: 32, border: `1px solid ${!usarPacienteLib ? T.black : T.gray1}`, background: !usarPacienteLib ? T.black : T.white, color: !usarPacienteLib ? T.white : T.gray4, fontFamily: T.font, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Paciente registrado
              </button>
              <button type="button" onClick={() => setUsarPacienteLib(true)}
                style={{ flex: 1, height: 32, border: `1px solid ${usarPacienteLib ? T.black : T.gray1}`, background: usarPacienteLib ? T.black : T.white, color: usarPacienteLib ? T.white : T.gray4, fontFamily: T.font, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Nuevo paciente
              </button>
            </div>

            {usarPacienteLib ? (
              <div>
                <FieldLabel>Nombre del paciente</FieldLabel>
                <Input name="nombrePacienteLibre" value={form.nombrePacienteLibre} onChange={handleChange} placeholder="Nombre y apellido…" />
              </div>
            ) : (
              <div>
                <FieldLabel>Paciente</FieldLabel>
                <PacientePicker
                  pacientes={pacientes}
                  value={form.pacienteId}
                  onChange={id => setForm(f => ({ ...f, pacienteId: id }))}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Fecha *</FieldLabel>
                  <Input type="date" value={(form.fechaHora || '').split('T')[0]} onChange={e => setForm(f => ({ ...f, fechaHora: e.target.value + 'T' + ((f.fechaHora || '').split('T')[1] || '09:00') }))} />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                  <FieldLabel>Hora *</FieldLabel>
                  <Input type="time" value={(form.fechaHora || '').split('T')[1] || ''} onChange={e => setForm(f => ({ ...f, fechaHora: ((f.fechaHora || '').split('T')[0] || '') + 'T' + e.target.value }))} />
                </div>
              </div>
              <div>
                <FieldLabel>Duración (minutos)</FieldLabel>
                <select name="duracionMinutos" value={form.duracionMinutos} onChange={handleChange} style={selectStyle}>
                  {[15, 20, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel>Consultorio *</FieldLabel>
                <select name="consultorioId" value={form.consultorioId} onChange={handleChange} style={selectStyle}>
                  <option value="">Seleccioná un consultorio…</option>
                  {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Estado</FieldLabel>
                <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, overflow: 'hidden' }}>
                  {[['PENDIENTE', 'Pendiente'], ['CONFIRMADO', 'Confirmado']].map(([val, label], idx) => (
                    <button key={val} type="button"
                      onClick={() => setForm(f => ({ ...f, estado: val }))}
                      style={{ flex: 1, border: 'none', borderRight: idx === 0 ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, fontWeight: 500, background: form.estado === val ? T.black : T.white, color: form.estado === val ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Motivo</FieldLabel>
              <Textarea name="motivo" value={form.motivo} onChange={handleChange} rows={3} placeholder="Descripción del turno…" />
            </div>

            {formErr && <ErrorMsg>{formErr}</ErrorMsg>}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
              <div>
                {editId && (
                  <Btn variant="destructive" type="button" onClick={handleEliminar} disabled={guardando}>Eliminar</Btn>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="outline" type="button" onClick={cerrarModal} disabled={guardando}>Cancelar</Btn>
                <Btn type="submit" disabled={guardando}>{guardando ? 'Guardando…' : editId ? 'Guardar' : 'Crear'}</Btn>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

/* ─── helpers ────────────────────────────────────────────────── */

function BackBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: hov ? T.gray3 : T.black, padding: 0, lineHeight: 1, transition: 'color 0.15s', marginRight: 4 }}>
      ←
    </button>
  )
}

function Cargando() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</span>
    </div>
  )
}

function ErrorScreen({ msg, onVolver }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <span style={{ fontSize: 13, color: T.red, fontFamily: T.font }}>{msg}</span>
      <Btn variant="outline" onClick={onVolver}>← Volver</Btn>
    </div>
  )
}

/* ─── VistaMediosPago ────────────────────────────────────────── */

function VistaMediosPago({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/medios-pago" titulo="Medios de pago" panelTitulo="Nuevo medio de pago" addLabel="+ Agregar" msgVacio="No hay medios de pago registrados" msgConfirmar="¿Eliminar este medio de pago?" storageKey="medios-pago-vista" placeholder="Ej: Efectivo, Transferencia, Mercado Pago…" />
}

/* ─── VistaFinanzas ──────────────────────────────────────────── */

const fmtPesos = n => n == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const MESES_LABEL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function mesStr(year, month) {
  return `${String(year)}-${String(month).padStart(2, '0')}`
}

const INGRESO_LIBRE_EMPTY = { descripcion: '', monto: '', tipoPago: '', medioPagoId: '', consultorioId: '' }
const EGRESO_EMPTY = { fecha: new Date().toISOString().slice(0, 10), monto: '', descripcion: '', consultorioId: '' }

function VistaFinanzas({ apiFetch, onIrAConsultas, onIrAConsulta, mesInicial, subVistaInicial, onSubVistaConsumida }) {
  const isMobile = useIsMobile()
  const hoy = new Date()
  const [año,      setAño]      = useState(mesInicial?.año ?? hoy.getFullYear())
  const [mes,      setMes]      = useState(mesInicial?.mes ?? hoy.getMonth() + 1)
  const [resumen,  setResumen]  = useState(null)
  const [ingresos, setIngresos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(INGRESO_LIBRE_EMPTY)
  const [guardando,setGuardando]= useState(false)
  const [egresos,      setEgresos]      = useState([])
  const [modalEgreso,  setModalEgreso]  = useState(false)
  const [formEgreso,   setFormEgreso]   = useState(EGRESO_EMPTY)
  const [guardandoEgr, setGuardandoEgr] = useState(false)
  const [mediosPago,   setMediosPago]   = useState([])
  const [consultorios, setConsultorios] = useState([])
  const [filtroCons,   setFiltroCons]   = useState('')
  const [filtroConsId, setFiltroConsId] = useState(null)
  const [filtroTipo,   setFiltroTipo]   = useState(() => subVistaInicial === 'movimientos' ? 'pendiente' : null)
  const [buscarMov,    setBuscarMov]    = useState('')
  const [movs,         setMovs]         = useState([])
  const [metaMov,      setMetaMov]      = useState(null)
  const [cargandoMovs, setCargandoMovs] = useState(false)
  const [cargandoMasMov,setCargandoMasMov]= useState(false)
  const [subVista,     setSubVista]     = useState(() => subVistaInicial || 'dash')
  const [estAnuales,   setEstAnuales]   = useState(null)
  const [cargandoAnual,setCargandoAnual]= useState(false)
  const [obrasSociales,setObrasSociales]= useState([])
  const [cobros,       setCobros]       = useState([])
  const [cargandoCobros,setCargandoCobros] = useState(false)
  const [cobroDetalleId,setCobroDetalleId] = useState(null)
  // Avisar al parent que ya consumimos el subVistaInicial (para que lo limpie y no se reaplique en próximas visitas).
  useEffect(() => {
    if (subVistaInicial) onSubVistaConsumida?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const { openConfirm, dialog: confirmDialog } = useConfirm()

  async function eliminarMovimiento(m) {
    const tipo = m.origen === 'egreso' ? 'egreso' : 'ingreso'
    const ok = await openConfirm(`¿Eliminar este ${tipo}? Esta acción no se puede deshacer.`)
    if (!ok) return
    const path = m.origen === 'egreso' ? `/finanzas/egresos/${m.id}` : `/finanzas/ingresos/${m.id}`
    const res = await apiFetch(path, { method: 'DELETE' })
    if (res && (res.ok || res.status === 204)) {
      cargarMovs(buscarMov, 0)
      cargar()
    }
  }

  const cargar = useCallback(async () => {
    setCargando(true)
    const q = `mes=${mesStr(año, mes)}`
    const [resRes, ingRes, egrRes, cobRes] = await Promise.all([
      apiFetch(`/finanzas/resumen?${q}`),
      apiFetch(`/finanzas/ingresos?${q}`),
      apiFetch(`/finanzas/egresos?${q}`),
      apiFetch(`/cobros-os?${q}`),
    ])
    if (resRes?.ok) setResumen(await resRes.json())
    const ingData = ingRes?.ok ? await ingRes.json() : []
    const cobData = cobRes?.ok ? await cobRes.json() : []
    // Los cobros de OS son ingresos en finanzas (la parte que paga la OS). Los mergeamos a la lista
    // de ingresos como "ingresos virtuales" para que el dashboard los cuente sin tocar el back.
    // consultaId queda null para que NO entren al ticket promedio (eso es solo de consultas).
    const cobrosVirtuales = cobData.map(c => ({
      id:                c.id,
      consultaId:        null,
      descripcion:       `Cobro · ${c.obraSocialNombre || 'Obra social'}`,
      monto:             c.montoRecibido,
      estado:            'CONFIRMADO',
      tipoPago:          'OBRA_SOCIAL',
      medioPagoId:       c.medioPagoId,
      medioPagoNombre:   c.medioPagoNombre,
      obraSocialId:      c.obraSocialId,
      obraSocialNombre:  c.obraSocialNombre,
      consultorioId:     c.consultorioId,
      consultorioNombre: c.consultorioNombre,
      cantidadIngresos:  c.cantidadIngresos,
      fecha:             c.fecha,
      origen:            'cobro_os',
    }))
    setIngresos([...ingData, ...cobrosVirtuales])
    if (egrRes?.ok) setEgresos(await egrRes.json())
    setCargando(false)
  }, [apiFetch, año, mes])

  useEffect(() => { cargar() }, [cargar])

  const cargarMovs = useCallback(async (q, page = 0) => {
    if (page === 0) setCargandoMovs(true)
    else setCargandoMasMov(true)
    const params = new URLSearchParams({ mes: mesStr(año, mes), size: 30, page })
    if (q) params.set('buscar', q)
    if (filtroConsId) params.set('consultorioId', filtroConsId)
    if (filtroTipo) params.set('tipo', filtroTipo)
    const res = await apiFetch(`/finanzas/movimientos?${params}`)
    if (res?.ok) {
      const data = await res.json()
      setMovs(prev => page === 0 ? data.content : [...prev, ...data.content])
      setMetaMov({ last: data.last, number: data.number, totalElements: data.totalElements })
    }
    if (page === 0) setCargandoMovs(false)
    else setCargandoMasMov(false)
  }, [apiFetch, año, mes, filtroConsId, filtroTipo])

  useEffect(() => {
    if (subVista !== 'movimientos') return
    const t = setTimeout(() => cargarMovs(buscarMov, 0), buscarMov ? 350 : 0)
    return () => clearTimeout(t)
  }, [subVista, buscarMov, cargarMovs])

  useEffect(() => {
    if (subVista !== 'anual') return
    setCargandoAnual(true)
    const qs = filtroConsId ? `?consultorioId=${filtroConsId}` : ''
    apiFetch(`/finanzas/estadisticas-anuales${qs}`).then(async (res) => {
      if (res?.ok) setEstAnuales(await res.json())
      setCargandoAnual(false)
    })
  }, [subVista, apiFetch, filtroConsId])

  useEffect(() => {
    apiFetch('/medios-pago').then(r => r?.ok && r.json().then(setMediosPago))
    apiFetch('/consultorios').then(r => r?.ok && r.json().then(setConsultorios))
    apiFetch('/obras-sociales').then(r => r?.ok && r.json().then(setObrasSociales))
  }, [apiFetch])

  const cargarCobros = useCallback(async () => {
    setCargandoCobros(true)
    const res = await apiFetch(`/cobros-os?mes=${mesStr(año, mes)}`)
    if (res?.ok) setCobros(await res.json())
    setCargandoCobros(false)
  }, [apiFetch, año, mes])

  useEffect(() => {
    if (subVista !== 'cobros') return
    cargarCobros()
  }, [subVista, cargarCobros])

  async function eliminarCobro(id) {
    const ok = await openConfirm(
      '¿Eliminar este cobro? Los ingresos que cerraba van a volver a quedar pendientes.',
      { confirmLabel: 'Eliminar', confirmVariant: 'destructive' }
    )
    if (!ok) return
    const res = await apiFetch(`/cobros-os/${id}`, { method: 'DELETE' })
    if (res && (res.ok || res.status === 204)) {
      cargarCobros()
      cargar()
    }
  }

  function navMes(dir) {
    setMes(m => {
      const nuevo = m + dir
      if (nuevo < 1) { setAño(a => a - 1); return 12 }
      if (nuevo > 12) { setAño(a => a + 1); return 1 }
      return nuevo
    })
  }

  async function guardarIngresoLibre() {
    if (!form.descripcion.trim() || !form.monto) return
    setGuardando(true)
    const res = await apiFetch('/finanzas/ingresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion:   form.descripcion.trim(),
        monto:         Number(form.monto),
        tipoPago:      form.tipoPago   || null,
        medioPagoId:   form.medioPagoId   ? Number(form.medioPagoId)   : null,
        consultorioId: form.consultorioId ? Number(form.consultorioId) : null,
      }),
    })
    setGuardando(false)
    if (res?.ok) {
      setModal(false)
      setForm(INGRESO_LIBRE_EMPTY)
      cargar()
    }
  }

  async function guardarEgreso() {
    if (!formEgreso.monto || !formEgreso.consultorioId) return
    setGuardandoEgr(true)
    const res = await apiFetch('/finanzas/egresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha:         formEgreso.fecha || new Date().toISOString().slice(0, 10),
        monto:         Number(formEgreso.monto),
        descripcion:   formEgreso.descripcion.trim() || null,
        consultorioId: Number(formEgreso.consultorioId),
      }),
    })
    setGuardandoEgr(false)
    if (res?.ok) { setModalEgreso(false); setFormEgreso(EGRESO_EMPTY); cargar() }
  }

  const ingresosFiltrados = ingresos.filter(i =>
    (!filtroCons || i.consultorioNombre === filtroCons)
  )

  // Reglas espejo del back:
  //  - confirmado: OS con monto > 0 (coseguro cobrado al paciente) o cualquier ingreso con estado=CONFIRMADO.
  //  - pendiente: cualquier ingreso con estado=PENDIENTE (incluye OS con coseguro — la parte OS sigue pendiente).
  // Una consulta OS con coseguro entra a AMBOS buckets: el coseguro aporta al monto confirmado, y la consulta
  // aporta a la cuenta de cobros pendientes (porque la OS todavía no pagó).
  const esConfirmadoEnFinanzas = i => i.tipoPago === 'OBRA_SOCIAL'
    ? Number(i.monto ?? 0) > 0
    : i.estado === 'CONFIRMADO'
  const confirmados        = ingresosFiltrados.filter(esConfirmadoEnFinanzas)
  const pendientes         = ingresosFiltrados.filter(i => i.estado === 'PENDIENTE' && i.origen !== 'cobro_os')
  const totalConfirmadosNum = confirmados.reduce((s, i) => s + Number(i.monto ?? 0), 0)
  const totalGlobalNum     = ingresos.filter(esConfirmadoEnFinanzas).reduce((s, i) => s + Number(i.monto ?? 0), 0)
  const totalCobros        = cargando ? null : fmtPesos(totalConfirmadosNum)
  const pendienteCount     = cargando ? null : pendientes.length
  const pctConsultorio     = (filtroCons && totalGlobalNum > 0)
    ? Math.round(totalConfirmadosNum / totalGlobalNum * 100) + '%'
    : null

  function agrupar(lista, keyFn) {
    const map = {}
    lista.forEach(i => {
      const key = keyFn(i) ?? 'Sin especificar'
      if (!map[key]) map[key] = { total: 0, cantidad: 0 }
      map[key].total    += Number(i.monto ?? 0)
      map[key].cantidad += 1
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }

  const breakdownMp = agrupar(confirmados, i => i.medioPagoNombre)

  // Ingresos confirmados agrupados por origen: Particular + cada OS como categoría distinta.
  // Es lo que el profesional realmente quiere ver: "cuánto me entró de OSDE, cuánto de Swiss Medical, cuánto particular".
  const claveOrigen = i => {
    if (i.tipoPago === 'OBRA_SOCIAL' && i.obraSocialNombre) return i.obraSocialNombre
    if (i.tipoPago === 'PARTICULAR') return 'Particular'
    if (i.tipoPago === 'OTRO')       return 'Otro'
    return 'Sin especificar'
  }
  const breakdownOrigen = agrupar(confirmados, claveOrigen)

  // Pendientes agrupados igual (Particular + cada OS) — para el card "Cobros pendientes".
  const breakdownPendientes = agrupar(pendientes, claveOrigen)

  const egresosFiltrados  = egresos.filter(e => !filtroCons || e.consultorioNombre === filtroCons)
  const totalEgresosNum   = egresosFiltrados.reduce((s, e) => s + Number(e.monto ?? 0), 0)
  const saldoNum          = totalConfirmadosNum - totalEgresosNum
  const totalPendienteNum = pendientes.reduce((s, i) => s + Number(i.monto ?? 0), 0)

  // Promedio "por consulta": reflejar el valor REAL cobrado por consulta. Reglas:
  //  - Particular CONFIRMADO con monto > 0 → entra con su monto.
  //  - OS con cobro batch asignado → entra con (coseguro + parte del cobro batch que le toca).
  //    La parte del cobro batch se reparte uniforme: cobro.monto / cobro.cantidadIngresos.
  //  - OS pendiente del cobro batch → NO entra (la consulta está incompleta; el coseguro solo
  //    distorsionaría el promedio).
  //  - Cobros virtuales (consultaId=null) → NO entran por sí solos, se imputan vía la regla de arriba.
  //  - Libres → NO entran (no son consultas).
  const cobrosPorId = {}
  for (const i of ingresosFiltrados) {
    if (i.origen === 'cobro_os') cobrosPorId[i.id] = i
  }
  const consultasParaTicket = ingresosFiltrados.filter(i => {
    if (i.origen === 'cobro_os') return false
    if (i.consultaId == null) return false
    if (i.tipoPago === 'OBRA_SOCIAL') return i.cobroObraSocialId != null
    return i.estado === 'CONFIRMADO' && Number(i.monto ?? 0) > 0
  })
  const ticketSuma = consultasParaTicket.reduce((s, i) => {
    let monto = Number(i.monto ?? 0)  // coseguro (OS) o monto cobrado (particular)
    if (i.tipoPago === 'OBRA_SOCIAL' && i.cobroObraSocialId) {
      const cobro = cobrosPorId[i.cobroObraSocialId]
      if (cobro && cobro.cantidadIngresos > 0) {
        monto += Number(cobro.monto ?? 0) / cobro.cantidadIngresos
      }
    }
    return s + monto
  }, 0)
  const ticketPromedioNum = consultasParaTicket.length > 0
    ? ticketSuma / consultasParaTicket.length
    : null

  const resumenPorConsultorio = consultorios.map(c => {
    const ingC = ingresos.filter(i => i.consultorioNombre === c.nombre && i.estado === 'CONFIRMADO')
    const egrC = egresos.filter(e => e.consultorioNombre === c.nombre)
    const totalIng = ingC.reduce((s, i) => s + Number(i.monto ?? 0), 0)
    const totalEgr = egrC.reduce((s, e) => s + Number(e.monto ?? 0), 0)
    return { id: c.id, nombre: c.nombre, totalIng, totalEgr, balance: totalIng - totalEgr }
  })

  const navBtnStyle = { background: 'none', border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gray4, borderRadius: 6 }

  if (subVista === 'cobros') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <PageBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <BackBtn onClick={() => setSubVista('dash')} />
            <PageTitle>Cobros de OS · {MESES_LABEL[mes - 1]} {año}</PageTitle>
          </div>
          <Btn variant="outline" onClick={() => setSubVista('nuevo-cobro')} disabled={obrasSociales.length === 0}>+ Registrar cobro</Btn>
        </PageBar>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 16px 24px' : '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cargandoCobros ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : cobros.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>No hay cobros de OS registrados este mes</div>
          ) : (
            cobros.map(c => (
              <CobroOsCard key={c.id} c={c} fmtPesos={fmtPesos} onAbrir={() => setCobroDetalleId(c.id)} onEliminar={() => eliminarCobro(c.id)} />
            ))
          )}
        </div>
        {cobroDetalleId && (
          <ModalCobroOsDetalle apiFetch={apiFetch} cobroId={cobroDetalleId} onCerrar={() => setCobroDetalleId(null)} fmtPesos={fmtPesos} />
        )}
        {confirmDialog}
      </div>
    )
  }

  if (subVista === 'nuevo-cobro') {
    return (
      <VistaNuevoCobroOs
        apiFetch={apiFetch}
        obrasSociales={obrasSociales}
        consultorios={consultorios}
        mediosPago={mediosPago}
        isMobile={isMobile}
        onVolver={() => setSubVista('dash')}
        onCreado={() => { cargar(); cargarCobros(); setSubVista('cobros') }}
      />
    )
  }

  if (subVista === 'anual') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <PageBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackBtn onClick={() => setSubVista('dash')} />
            <PageTitle>Estadísticas anuales</PageTitle>
          </div>
        </PageBar>
        <div style={{ padding: isMobile ? '12px 16px 8px' : '12px 24px 8px', display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {[{ id: '', nombre: 'Total' }, ...consultorios].map(c => {
            const sel = filtroCons === (c.id === '' ? '' : c.nombre)
            return (
              <button key={c.id === '' ? '__total' : c.id}
                onClick={() => { setFiltroCons(c.id === '' ? '' : c.nombre); setFiltroConsId(c.id === '' ? null : c.id) }}
                style={{ background: sel ? T.black : T.white, color: sel ? T.white : T.black, border: `1px solid ${sel ? T.black : T.gray1}`, borderRadius: 20, padding: '0 14px', height: 30, fontFamily: T.font, fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                {c.nombre}
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '4px 16px 24px' : '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cargandoAnual ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : (
            <>
              <DashBarChart datos={estAnuales} isMobile={isMobile} titulo="Ingresos últimos 12 meses" valorField="ingresosTotales" resumenTipo="suma" />
              <DashBarChart datos={estAnuales} isMobile={isMobile} titulo="Consulta promedio últimos 12 meses" valorField="consultaPromedio" resumenTipo="promedio" />
            </>
          )}
        </div>
      </div>
    )
  }

  if (subVista === 'movimientos') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <PageBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackBtn onClick={() => setSubVista('dash')} />
            <PageTitle>Movimientos · {MESES_LABEL[mes - 1]} {año}</PageTitle>
          </div>
        </PageBar>
        <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 16px' : '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '4px 0 12px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 36, paddingLeft: 12, flex: 1, maxWidth: isMobile ? 'none' : 360, borderRadius: 8, background: T.white }}>
                <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
                <input value={buscarMov} onChange={e => setBuscarMov(e.target.value)} placeholder="Buscar por descripción o paciente…"
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }} />
              </div>
              {metaMov && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.06em', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{metaMov.totalElements} movimientos</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { key: null,        label: 'Todos' },
                { key: 'ingreso',   label: 'Ingresos' },
                { key: 'egreso',    label: 'Egresos' },
                { key: 'pendiente', label: 'Pendientes' },
              ].map(({ key, label }) => {
                const sel = filtroTipo === key
                return (
                  <button key={key ?? 'todos'} onClick={() => setFiltroTipo(key)}
                    style={{ fontFamily: T.font, fontSize: 12, fontWeight: sel ? 600 : 400, background: sel ? T.black : T.white, color: sel ? T.white : T.black, border: `1px solid ${sel ? T.black : T.gray1}`, borderRadius: 20, padding: '0 14px', height: 28, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cargandoMovs ? (
              <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
            ) : movs.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscarMov ? 'Sin resultados' : 'Sin movimientos'}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {movs.map((m, idx) => (
                  <MovimientoCard key={idx} m={m} onEliminar={() => eliminarMovimiento(m)} onIrAConsulta={onIrAConsulta} />
                ))}
              </div>
            )}
            {!cargandoMovs && !metaMov?.last && movs.length > 0 && (
              <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
                <Btn variant="outline" onClick={() => cargarMovs(buscarMov, (metaMov?.number ?? 0) + 1)} disabled={cargandoMasMov}>
                  {cargandoMasMov ? 'Cargando…' : 'Cargar más'}
                </Btn>
              </div>
            )}
          </div>

        </div>
        {confirmDialog}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isMobile ? 'auto' : 'hidden', background: T.gray2 }}>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 16px 12px' : '20px 24px 16px', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.font, fontSize: isMobile ? 18 : 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Finanzas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={navBtnStyle} onClick={() => navMes(-1)}>‹</button>
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, minWidth: 110, textAlign: 'center' }}>
              {MESES_LABEL[mes - 1]} {año}
            </span>
            <button style={navBtnStyle} onClick={() => navMes(1)}>›</button>
          </div>
          <button onClick={() => setSubVista('anual')}
                  style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, background: T.white, color: T.black, border: `1px solid ${T.gray1}`, borderRadius: 20, padding: '0 14px', height: 30, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Estadísticas anuales
          </button>
          <button onClick={() => setSubVista('cobros')}
                  style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, background: T.white, color: T.black, border: `1px solid ${T.gray1}`, borderRadius: 20, padding: '0 14px', height: 30, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Cobros de OS
          </button>
        </div>
      </div>

      {/* ── botones consultorio ── */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        {[{ id: '', nombre: 'Total' }, ...consultorios].map(c => {
          const sel = filtroCons === (c.id === '' ? '' : c.nombre)
          return (
            <button key={c.id === '' ? '__total' : c.id}
              onClick={() => { setFiltroCons(c.id === '' ? '' : c.nombre); setFiltroConsId(c.id === '' ? null : c.id) }}
              style={{ background: sel ? T.black : T.white, color: sel ? T.white : T.black, border: `1px solid ${sel ? T.black : T.gray1}`, borderRadius: 20, padding: '0 14px', height: 30, fontFamily: T.font, fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              {c.nombre}
            </button>
          )
        })}
      </div>

      {/* ── botón ver todos los movimientos ── */}
      <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 12px', flexShrink: 0 }}>
        <Btn variant="outline" onClick={() => setSubVista('movimientos')}>Ver todos los movimientos</Btn>
      </div>

      {/* ── stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 12, padding: isMobile ? '0 16px 16px' : '0 24px 16px', flexShrink: 0 }}>
        <StatCard
          inverted
          label="Ingreso"
          value={cargando ? null : fmtPesos(totalConfirmadosNum)}
          sub="cobrado del mes"
          action={{ label: 'Registrar ingreso', onClick: () => setModal(true) }}
        />
        <StatCard
          label="Egreso"
          value={cargando ? null : fmtPesos(totalEgresosNum)}
          sub="del mes"
          style={{ borderLeft: '4px solid #dc2626' }}
          action={{ label: 'Registrar egreso', onClick: () => setModalEgreso(true) }}
        />
        <StatCard
          label="Balance"
          value={cargando ? null : fmtPesos(totalConfirmadosNum - totalEgresosNum)}
          sub="ingreso − egreso"
          style={{ borderLeft: `4px solid ${(totalConfirmadosNum - totalEgresosNum) >= 0 ? '#16a34a' : '#dc2626'}` }}
        />
        <StatCard
          label="Tu consulta promedio"
          value={!cargando && ticketPromedioNum != null ? fmtPesos(ticketPromedioNum) : null}
          sub="del mes"
        />
      </div>

      {/* ── Card Cobros pendientes + CTA Registrar cobro ── */}
      <div style={{ padding: isMobile ? '0 16px 16px' : '0 24px 16px', flexShrink: 0 }}>
        <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderLeft: `4px solid #b45309`, borderRadius: 12, padding: isMobile ? '18px 20px' : '20px 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, alignItems: isMobile ? 'stretch' : 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>
              Cobros pendientes
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span style={{ fontFamily: T.font, fontSize: 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: T.black }}>
                {cargando ? '—' : pendientes.length}
              </span>
              <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4 }}>
                {pendientes.length === 1 ? 'consulta' : 'consultas'}
              </span>
            </div>
            {!cargando && breakdownPendientes.length > 0 && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 16px' }}>
                {breakdownPendientes.map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, paddingTop: 4, borderTop: `1px solid ${T.gray2}` }}>
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key}</span>
                    <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.black, flexShrink: 0 }}>{val.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
            {!cargando && breakdownPendientes.length === 0 && (
              <div style={{ marginTop: 8, fontFamily: T.font, fontSize: 12, color: T.gray4 }}>Sin cobros pendientes este mes.</div>
            )}
          </div>
          <button onClick={() => setSubVista('nuevo-cobro')} disabled={obrasSociales.length === 0}
            style={{
              flexShrink: 0,
              fontFamily: T.font, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              background: obrasSociales.length === 0 ? T.gray7 : T.black,
              color: obrasSociales.length === 0 ? T.gray3 : T.white,
              border: 'none', borderRadius: 100,
              padding: isMobile ? '14px 20px' : '16px 28px',
              cursor: obrasSociales.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: obrasSociales.length === 0 ? 'none' : '0 4px 14px rgba(0,0,0,0.18)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            + Registrar cobro
          </button>
        </div>
      </div>

      <div style={{ ...(isMobile ? {} : { flex: 1 }), overflow: isMobile ? 'visible' : 'hidden', padding: isMobile ? '0 16px 96px' : '0 24px 24px', minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, height: isMobile ? 'auto' : '100%' }}>

          {/* ── columna izquierda: ingresos por origen (particular + cada OS) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', minWidth: 0, ...(isMobile ? {} : { flex: 1 }) }}>
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>Ingresos por origen</span>
              </div>
              <div style={{ ...(isMobile ? {} : { flex: 1 }), display: 'flex', alignItems: 'center', minWidth: 0, width: '100%' }}>
                {cargando && <div style={{ padding: '0 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                {!cargando && breakdownOrigen.length === 0 && <EmptyChart />}
                {!cargando && breakdownOrigen.length > 0 && <PieChart items={breakdownOrigen} />}
              </div>
            </div>
          </div>

          {/* ── columna derecha: medio de pago ── */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', minWidth: 0, ...(isMobile ? {} : { flex: 1 }) }}>
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>Por medio de pago</span>
              </div>
              <div style={{ ...(isMobile ? {} : { flex: 1 }), display: 'flex', alignItems: 'center', minWidth: 0, width: '100%' }}>
                {cargando && <div style={{ padding: '0 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                {!cargando && breakdownMp.length === 0 && <EmptyChart />}
                {!cargando && breakdownMp.length > 0 && <PieChart items={breakdownMp} />}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── modal ingreso libre ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
             onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: T.white, borderRadius: 16, width: 'min(420px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.02em' }}>Nuevo ingreso</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Descripción *</label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                     placeholder="Ej: Honorarios sesión particular"
                     style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Monto *</label>
              <input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                     placeholder="0"
                     style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Tipo</label>
                <select value={form.tipoPago} onChange={e => setForm(f => ({ ...f, tipoPago: e.target.value }))}
                        style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black, background: T.white }}>
                  <option value="">Sin especificar</option>
                  {Object.entries(TIPO_PAGO).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Medio de pago</label>
                <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))}
                        style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black, background: T.white }}>
                  <option value="">Sin especificar</option>
                  {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Consultorio *</label>
              <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))}
                      style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black, background: T.white }}>
                <option value="">Seleccionar…</option>
                {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => { setModal(false); setForm(INGRESO_LIBRE_EMPTY) }}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, background: 'none', border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: T.gray4 }}>
                Cancelar
              </button>
              <button onClick={guardarIngresoLibre} disabled={guardando || !form.descripcion.trim() || !form.monto || !form.consultorioId}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, background: T.black, color: T.white, border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', opacity: (guardando || !form.descripcion.trim() || !form.monto || !form.consultorioId) ? 0.5 : 1 }}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal egreso ── */}
      {modalEgreso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
             onClick={e => e.target === e.currentTarget && setModalEgreso(false)}>
          <div style={{ background: T.white, borderRadius: 16, width: 'min(400px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.02em' }}>Nuevo egreso</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Fecha *</label>
                <input type="date" value={formEgreso.fecha} onChange={e => setFormEgreso(f => ({ ...f, fecha: e.target.value }))}
                       style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Monto *</label>
                <input type="number" value={formEgreso.monto} onChange={e => setFormEgreso(f => ({ ...f, monto: e.target.value }))}
                       placeholder="0"
                       style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Descripción</label>
              <input value={formEgreso.descripcion} onChange={e => setFormEgreso(f => ({ ...f, descripcion: e.target.value }))}
                     placeholder="Ej: Materiales, alquiler, insumos…"
                     style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Consultorio *</label>
              <select value={formEgreso.consultorioId} onChange={e => setFormEgreso(f => ({ ...f, consultorioId: e.target.value }))}
                      style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black, background: T.white }}>
                <option value="">Seleccionar…</option>
                {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => { setModalEgreso(false); setFormEgreso(EGRESO_EMPTY) }}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, background: 'none', border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: T.gray4 }}>
                Cancelar
              </button>
              <button onClick={guardarEgreso} disabled={guardandoEgr || !formEgreso.monto || !formEgreso.consultorioId}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, background: T.black, color: T.white, border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', opacity: (guardandoEgr || !formEgreso.monto || !formEgreso.consultorioId) ? 0.5 : 1 }}>
                {guardandoEgr ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB mobile-only: ingreso / egreso / cobrar OS ── */}
      {isMobile && (
        <FabAcciones acciones={[
          { label: 'Ingreso', onClick: () => setModal(true), variant: 'primary' },
          { label: 'Egreso',  onClick: () => setModalEgreso(true), variant: 'outline' },
          ...(obrasSociales.length > 0 ? [{ label: 'Registrar cobro', onClick: () => setSubVista('nuevo-cobro'), variant: 'outline' }] : []),
        ]} />
      )}

    </div>
  )
}

/* ─── CobroOsCard ────────────────────────────────────────────── */

function CobroOsCard({ c, fmtPesos, onAbrir, onEliminar }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onAbrir} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.white, border: `1px solid ${hov ? T.black : T.gray1}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>{c.obraSocialNombre}{c.consultorioNombre ? ` · ${c.consultorioNombre}` : ''}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.08em' }}>{c.fecha} · {c.cantidadIngresos} {c.cantidadIngresos === 1 ? 'consulta' : 'consultas'}{c.medioPagoNombre ? ` · ${c.medioPagoNombre}` : ''}</span>
      </div>
      <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.black, flexShrink: 0 }}>{fmtPesos(c.montoRecibido)}</span>
      <button onClick={e => { e.stopPropagation(); onEliminar() }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.gray5, display: 'flex', flexShrink: 0 }}
        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = T.red }}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  )
}

/* ─── ModalCobroOsDetalle ───────────────────────────────────── */

function ModalCobroOsDetalle({ apiFetch, cobroId, onCerrar, fmtPesos }) {
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    setCargando(true)
    apiFetch(`/cobros-os/${cobroId}`).then(async res => {
      if (res?.ok) setDetalle(await res.json())
      setCargando(false)
    })
  }, [apiFetch, cobroId])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
         onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div style={{ background: T.white, borderRadius: 16, width: 'min(560px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {cargando || !detalle ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: 11, color: T.gray5, fontFamily: T.font }}>Cargando…</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4 }}>Cobro de obra social</span>
                <div style={{ fontFamily: T.font, fontSize: 18, fontWeight: 700, color: T.black, letterSpacing: '-0.02em', marginTop: 4 }}>{detalle.obraSocialNombre}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gray4, letterSpacing: '0.08em', marginTop: 2 }}>{detalle.fecha}{detalle.consultorioNombre ? ` · ${detalle.consultorioNombre}` : ''}{detalle.medioPagoNombre ? ` · ${detalle.medioPagoNombre}` : ''}</div>
              </div>
              <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.gray4, padding: 4 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: T.gray2, borderRadius: 10, padding: '12px 14px' }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Monto recibido</div>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, marginTop: 2 }}>{fmtPesos(detalle.montoRecibido)}</div>
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Consultas cubiertas</div>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, marginTop: 2 }}>{detalle.ingresos.length}</div>
              </div>
            </div>

            {detalle.descripcion && (
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, padding: '0 4px', lineHeight: 1.5 }}>{detalle.descripcion}</div>
            )}

            <div>
              <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4 }}>Consultas cubiertas ({detalle.ingresos.length})</span>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detalle.ingresos.map(i => (
                  <div key={i.ingresoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 10px', background: T.gray2, borderRadius: 6 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: T.font, fontSize: 12, color: T.black, fontWeight: 500 }}>
                        {i.pacienteApellido && (i.pacienteApellido + (i.pacienteNombre ? `, ${i.pacienteNombre}` : ''))}
                        {!i.pacienteApellido && (i.descripcion || 'Sin descripción')}
                      </div>
                      {i.pacienteApellido && i.descripcion && (
                        <div style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, lineHeight: 1.3, marginTop: 1 }}>{i.descripcion}</div>
                      )}
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', marginTop: 2 }}>{i.fecha}</div>
                    </div>
                    <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black, alignSelf: 'center' }}>{fmtPesos(i.monto)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <Btn variant="outline" onClick={onCerrar}>Cerrar</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── ModalRegistrarCobroOs ─────────────────────────────────── */

const COBRO_OS_EMPTY = { obraSocialId: '', consultorioId: '', fecha: hoyISO(), montoRecibido: '', medioPagoId: '', descripcion: '' }

function VistaNuevoCobroOs({ apiFetch, obrasSociales, consultorios, mediosPago, onVolver, onCreado, isMobile }) {
  const [tab,          setTab]          = useState('os') // 'os' | 'particular'
  const [form,         setForm]         = useState(COBRO_OS_EMPTY)
  const [pendientes,   setPendientes]   = useState([])
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [cargandoPend, setCargandoPend] = useState(false)
  const [guardando,    setGuardando]    = useState(false)
  const [error,        setError]        = useState(null)
  // Pestaña Particular: lista read-only de los pendientes con tipoPago=PARTICULAR.
  const [pendientesPart,setPendientesPart] = useState([])
  const [cargandoPart,  setCargandoPart]   = useState(false)

  useEffect(() => {
    if (!form.obraSocialId || !form.consultorioId) { setPendientes([]); setSeleccionados(new Set()); return }
    setCargandoPend(true)
    apiFetch(`/finanzas/ingresos/pendientes-por-os?obraSocialId=${form.obraSocialId}&consultorioId=${form.consultorioId}`).then(async res => {
      if (res?.ok) {
        const data = await res.json()
        setPendientes(data)
        // Por defecto: arranca con todos seleccionados (lo común es que el pago cubra todos los pendientes del mes).
        setSeleccionados(new Set(data.map(p => p.ingresoId)))
      }
      setCargandoPend(false)
    })
  }, [apiFetch, form.obraSocialId, form.consultorioId])

  useEffect(() => {
    if (tab !== 'particular') return
    setCargandoPart(true)
    apiFetch('/finanzas/ingresos/pendientes-particulares').then(async res => {
      if (res?.ok) setPendientesPart(await res.json())
      setCargandoPart(false)
    })
  }, [tab, apiFetch])

  function toggleIngreso(id) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleTodos() {
    if (seleccionados.size === pendientes.length) setSeleccionados(new Set())
    else setSeleccionados(new Set(pendientes.map(p => p.ingresoId)))
  }

  const fmtPesos = n => n == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const puedeGuardar = form.obraSocialId && form.consultorioId && form.fecha && form.montoRecibido && seleccionados.size > 0 && !guardando

  async function guardar() {
    if (!puedeGuardar) return
    setGuardando(true); setError(null)
    const res = await apiFetch('/cobros-os', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        obraSocialId:  Number(form.obraSocialId),
        consultorioId: Number(form.consultorioId),
        fecha:         form.fecha,
        montoRecibido: Number(form.montoRecibido),
        medioPagoId:   form.medioPagoId ? Number(form.medioPagoId) : null,
        descripcion:   form.descripcion || null,
        ingresoIds:    Array.from(seleccionados),
      }),
    })
    setGuardando(false)
    if (res?.ok) onCreado?.()
    else {
      const err = await res?.json().catch(() => null)
      setError(err?.error || 'Error al registrar el cobro')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <BackBtn onClick={onVolver} />
          <PageTitle>Registrar cobro</PageTitle>
        </div>
      </PageBar>

      {/* ── tabs ── */}
      <div style={{ padding: isMobile ? '0 16px' : '0 24px', borderBottom: `1px solid ${T.gray1}`, background: T.white, flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 0 }}>
          {[
            { key: 'os',         label: 'Obra social' },
            { key: 'particular', label: 'Particular'  },
          ].map(t => {
            const sel = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', fontFamily: T.font, fontSize: 13, fontWeight: sel ? 600 : 400, letterSpacing: '-0.01em', color: sel ? T.black : T.gray4, borderBottom: sel ? `2px solid ${T.black}` : '2px solid transparent', marginBottom: -1 }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* OBRA SOCIAL: layout contable de 3 capas (selector arriba / lista scrolleable / cobro flotante abajo) */}
      {tab === 'os' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Capa 1: card con los selectores de OS y consultorio — fijo arriba */}
          <div style={{ flexShrink: 0, padding: isMobile ? '14px 16px 8px' : '18px 24px 8px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12, padding: '14px 18px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Obra social *</label>
                  <select value={form.obraSocialId} onChange={e => setForm(f => ({ ...f, obraSocialId: e.target.value }))}
                    style={{ width: '100%', height: 40, marginTop: 4, fontFamily: T.font, fontSize: 14, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 12px', outline: 'none', color: form.obraSocialId ? T.black : T.gray5, background: T.white }}>
                    <option value="">Seleccionar…</option>
                    {obrasSociales.map(os => <option key={os.id} value={os.id}>{os.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Consultorio *</label>
                  <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))}
                    style={{ width: '100%', height: 40, marginTop: 4, fontFamily: T.font, fontSize: 14, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 12px', outline: 'none', color: form.consultorioId ? T.black : T.gray5, background: T.white }}>
                    <option value="">Seleccionar…</option>
                    {(consultorios || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Capa 2: card con la lista de pendientes — scrolleable, ocupa el espacio que queda */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, padding: isMobile ? '4px 16px 8px' : '8px 24px 8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12, padding: '14px 18px 12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {!form.obraSocialId || !form.consultorioId ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: T.gray4, fontFamily: T.font }}>
                    Elegí una obra social y un consultorio para ver las consultas pendientes.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>
                        Consultas pendientes ({pendientes.length})
                      </span>
                      {pendientes.length > 0 && (
                        <button type="button" onClick={toggleTodos}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4, padding: 0, textDecoration: 'underline' }}>
                          {seleccionados.size === pendientes.length ? 'Desmarcar todos' : 'Marcar todos'}
                        </button>
                      )}
                    </div>
                    {cargandoPend ? (
                      <div style={{ padding: '24px', textAlign: 'center', fontSize: 11, color: T.gray5, fontFamily: T.font }}>Cargando…</div>
                    ) : pendientes.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: T.gray4, fontFamily: T.font, background: T.gray2, borderRadius: 8 }}>
                        Esta obra social no tiene consultas pendientes de cobro.
                      </div>
                    ) : (
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
                        {pendientes.map(p => {
                          const sel = seleccionados.has(p.ingresoId)
                          const consultaLike = { ...p, tipoPago: 'OBRA_SOCIAL', estadoIngreso: 'PENDIENTE' }
                          return (
                            <ConsultaCard
                              key={p.ingresoId}
                              a={consultaLike}
                              fmtMonto={fmtPesos}
                              fmtTipo={t => t}
                              fullWidth
                              selectable
                              selected={sel}
                              onToggleSelect={() => toggleIngreso(p.ingresoId)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Capa 3: panel flotante con los datos del cobro — visible cuando hay OS + consultorio elegidos */}
          {form.obraSocialId && form.consultorioId && (
            <div style={{ flexShrink: 0, background: T.white, borderTop: `1px solid ${T.gray1}`, boxShadow: '0 -4px 14px rgba(0,0,0,0.06)' }}>
              <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>
                    Datos del cobro
                  </span>
                  <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4 }}>
                    {seleccionados.size > 0
                      ? `${seleccionados.size} ${seleccionados.size === 1 ? 'consulta seleccionada' : 'consultas seleccionadas'}`
                      : 'Tildá las consultas que cubre este pago'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'minmax(140px, 1fr) minmax(140px, 1fr) minmax(160px, 1fr) minmax(180px, 1.4fr)', gap: 10 }}>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Fecha *</label>
                    <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      style={{ width: '100%', height: 38, marginTop: 4, fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 10px', outline: 'none', color: T.black }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Monto *</label>
                    <input type="number" min="0" step="0.01" value={form.montoRecibido}
                      onChange={e => setForm(f => ({ ...f, montoRecibido: e.target.value }))}
                      placeholder="0"
                      style={{ width: '100%', height: 38, marginTop: 4, fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 10px', outline: 'none', color: T.black }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Medio</label>
                    <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))}
                      style={{ width: '100%', height: 38, marginTop: 4, fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 10px', outline: 'none', color: form.medioPagoId ? T.black : T.gray5, background: T.white }}>
                      <option value="">Sin especificar</option>
                      {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Notas</label>
                    <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: comprobante 1234"
                      style={{ width: '100%', height: 38, marginTop: 4, fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '0 10px', outline: 'none', color: T.black }} />
                  </div>
                </div>

                {error && (
                  <div style={{ fontFamily: T.font, fontSize: 12, color: T.red, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8 }}>{error}</div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Btn variant="outline" onClick={onVolver} disabled={guardando}>Cancelar</Btn>
                  <Btn onClick={guardar} disabled={!puedeGuardar}>{guardando ? 'Guardando…' : 'Registrar cobro'}</Btn>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* PARTICULAR: queda con el layout actual (solo lectura por ahora) */}
      {tab === 'particular' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 24px' : '20px 24px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, lineHeight: 1.5 }}>Estas son las consultas particulares pendientes de cobro. Por ahora se muestran a modo informativo.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>
                  Consultas pendientes ({pendientesPart.length})
                </span>
              </div>
              {cargandoPart ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 11, color: T.gray5, fontFamily: T.font }}>Cargando…</div>
              ) : pendientesPart.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, color: T.gray4, fontFamily: T.font, background: T.gray2, borderRadius: 8 }}>
                  No hay consultas particulares pendientes de cobro.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendientesPart.map(p => {
                    const consultaLike = { ...p, tipoPago: 'PARTICULAR', estadoIngreso: 'PENDIENTE' }
                    return (
                      <ConsultaCard
                        key={p.ingresoId}
                        a={consultaLike}
                        fmtMonto={fmtPesos}
                        fmtTipo={t => t}
                        fullWidth
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
