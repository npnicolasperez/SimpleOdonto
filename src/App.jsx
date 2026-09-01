import { useState, useRef, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react'
import { DemoContext } from './demo/DemoContext.js'
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

// Token de la URL de la guía pública. Vive en /bienvenida/{TOKEN}. No es secreto duro
// (se comparte por mail), pero al ser un UUID no es adivinable + Google no lo indexa por
// robots.txt. Para rotarlo: setear VITE_GUIA_TOKEN en Railway (front) + GUIA_TOKEN en el
// back (con el mismo valor) y redeploy.
const GUIA_TOKEN = import.meta.env.VITE_GUIA_TOKEN ?? '2f89a8b7-fde0-4fff-af9e-f63adcad8c68'

// Chunks separados — cada uno solo se descarga cuando el user entra a su ruta correspondiente.
const BienvenidaLanding = lazy(() => import('./BienvenidaLanding.jsx'))
const VistaGuia         = lazy(() => import('./VistaGuia.jsx'))
const DemoApp           = lazy(() => import('./demo/DemoApp.jsx'))

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
export function useIsMobile() {
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
export const T = {
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
  // Pill oscura semi-opaca con borde fino blanco → cada etiqueta es legible aunque se superponga
  // con otra (cada una mantiene su propio fondo). Mejor que un simple outline que se mezcla al
  // solaparse.
  const fontSize = 12
  ctx.font = `bold ${fontSize}px Inter, sans-serif`
  const m = ctx.measureText(texto)
  const padX = 6, padY = 3
  const bw = m.width + padX * 2
  const bh = fontSize + padY * 2
  const bx = x - padX
  const by = y - fontSize - padY + 2
  const r = 5
  const hasRoundRect = typeof ctx.roundRect === 'function'

  ctx.fillStyle = 'rgba(0,0,0,0.78)'
  if (hasRoundRect) { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, r); ctx.fill() }
  else              { ctx.fillRect(bx, by, bw, bh) }

  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1
  if (hasRoundRect) { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, r); ctx.stroke() }
  else              { ctx.strokeRect(bx, by, bw, bh) }

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

  // Página pública de guía / documentación — accesible sin login, solo lectura.
  // La URL incluye un token (UUID) para que no sea adivinable. El token vive en
  // VITE_GUIA_TOKEN (Railway) con fallback local. El link se genera en el back y se
  // envía al lead a mano por mail. Además /robots.txt bloquea el path para Google.
  //
  // Estructura de rutas bajo el token:
  //   /bienvenida/{token}         → Landing con 2 CTAs (guía + demo)
  //   /bienvenida/{token}/guia    → Guía visual (VistaGuia)
  //   /bienvenida/{token}/demo    → Demo interactiva (DemoApp)
  //
  // Todo lazy-loaded: cada chunk solo se descarga al entrar a su ruta.
  const tokenBase = `/bienvenida/${GUIA_TOKEN}`
  const path = window.location.pathname
  if (path === tokenBase) {
    return (
      <>
        <TopLoader />
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', fontFamily: T.font }}>Cargando…</div>}>
          <BienvenidaLanding tokenPath={tokenBase} />
        </Suspense>
      </>
    )
  }
  if (path === `${tokenBase}/guia`) {
    return (
      <>
        <TopLoader />
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', fontFamily: T.font }}>Cargando guía…</div>}>
          <VistaGuia />
        </Suspense>
      </>
    )
  }
  if (path === `${tokenBase}/demo` || path.startsWith(`${tokenBase}/demo/`)) {
    return (
      <>
        <TopLoader />
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', fontFamily: T.font }}>Cargando demo…</div>}>
          <DemoApp />
        </Suspense>
      </>
    )
  }
  // Ruta legacy /demo (sin token) — mantengo activa por retrocompatibilidad.
  if (path === '/demo' || path.startsWith('/demo/')) {
    return (
      <>
        <TopLoader />
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', fontFamily: T.font }}>Cargando demo…</div>}>
          <DemoApp />
        </Suspense>
      </>
    )
  }

  let content
  if (!token) content = <VistaLogin onLogin={handleLogin} />
  else if (!usuario?.perfilCompleto) content = <VistaCompletarPerfil token={token} onLogin={handleLogin} onLogout={handleLogout} />
  else content = <MainLayout token={token} usuario={usuario} onLogout={handleLogout} />
  return <><TopLoader />{content}</>
}

/* ─── MainLayout ─────────────────────────────────────────────── */

const NAV_ITEMS = [
  { key: 'dashboard',      label: 'Inicio',        group: 'Uso diario'    },
  { key: 'pacientes',      label: 'Pacientes',     group: 'Uso diario'    },
  { key: 'turnos',         label: 'Turnos',        group: 'Uso diario'    },
  { key: 'finanzas',       label: 'Finanzas',      group: 'Uso diario'    },
  { key: 'ajustes',        label: 'Ajustes',       group: 'Configuración' },
  { key: 'especialidades', label: 'Especialidades', group: 'Configuración', adminOnly: true },
]

export function MainLayout({ token, usuario, onLogout, apiFetch: apiFetchProp, demoMode = false, extraTopBanner = null }) {
  const [vista, setVista] = useState('dashboard')
  const [consultaEditarInicial,  setConsultaEditarInicial]  = useState(null) // { consultaId, pacienteId } | null — set desde Finanzas para editar una consulta pendiente
  const [finanzasMesInicial,     setFinanzasMesInicial]     = useState(null) // { año, mes } | null
  const [finanzasSubVistaInicial, setFinanzasSubVistaInicial] = useState(null) // 'dash' | 'movimientos' | null
  const [turnosFechaInicial,     setTurnosFechaInicial]     = useState(null) // Date | null
  const [ajustesTabInicial,      setAjustesTabInicial]      = useState(null) // 'medios-pago' | 'obras-sociales' | 'consultorios' | null
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { openAlert, dialog: alertDialog } = useAlert()
  const [reporteEnviando, setReporteEnviando] = useState(false)

  // Auto-cerrar el drawer al pasar a desktop o al navegar
  useEffect(() => { if (!isMobile) setSidebarOpen(false) }, [isMobile])
  useEffect(() => { setSidebarOpen(false) }, [vista])

  // Guard demo: si algún componente intenta navegar a una vista fuera de la whitelist
  // rebotamos a dashboard. Ahora el demo cubre Inicio, Pacientes, Turnos, Estudios, Finanzas y Ajustes.
  const DEMO_VISTAS_PERMITIDAS = new Set(['dashboard', 'pacientes', 'turnos', 'estudios', 'finanzas', 'ajustes'])
  useEffect(() => {
    if (demoMode && !DEMO_VISTAS_PERMITIDAS.has(vista)) {
      setVista('dashboard')
    }
  }, [demoMode, vista])

  function navegar(key) {
    if (key === 'turnos') setTurnosFechaInicial(null)
    setVista(key)
  }

  async function handleGenerarReporte() {
    if (reporteEnviando) return
    setReporteEnviando(true)
    try {
      const res = await apiFetch('/admin/metrics/enviar', { method: 'POST' })
      if (!res) return
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        openAlert(data.message || 'Reporte enviado a los admins configurados.', { title: '✓ Reporte disparado' })
      } else {
        openAlert(data.message || data.error || `Error ${res.status}`, { title: 'No se pudo enviar' })
      }
    } catch {
      openAlert('No se pudo conectar con el servidor.', { title: 'Error' })
    } finally {
      setReporteEnviando(false)
    }
  }

  const apiFetchReal = useCallback(async (path, opts = {}) => {
    const res = await fetchTracked(`${API_URL}${path}`, {
      ...opts,
      headers: { ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...opts.headers },
    })
    if (res.status === 401) { onLogout(); return null }
    return res
  }, [token, onLogout])
  // Modo demo: usa el apiFetch mockeado que le pasa DemoApp. Modo normal: construye el real.
  const apiFetch = apiFetchProp || apiFetchReal

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.white, overflow: 'hidden' }}>

      {extraTopBanner}

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
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 20, animation: 'so-fade 150ms ease-out' }}
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
          <nav style={{ flex: 1, paddingTop: 16, paddingBottom: 8, overflowY: 'auto' }}>
            {(() => {
              const visibles = NAV_ITEMS
                .filter(({ adminOnly }) => !(adminOnly && !usuario?.esAdmin))
                .filter(({ key }) => !demoMode || DEMO_VISTAS_PERMITIDAS.has(key))
              const grupos = []
              const map = new Map()
              for (const it of visibles) {
                const g = it.group ?? ''
                if (!map.has(g)) { map.set(g, []); grupos.push(g) }
                map.get(g).push(it)
              }
              return grupos.map(g => (
                <div key={g} style={{ marginBottom: 8 }}>
                  {g && (
                    <div style={{ padding: '10px 20px 6px', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray3 }}>
                      {g}
                    </div>
                  )}
                  {map.get(g).map(({ key, label }) => (
                    <NavItem key={key} label={label} active={vista === key} onClick={() => navegar(key)} />
                  ))}
                </div>
              ))
            })()}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.gray7}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {usuario?.esAdmin && !demoMode && (
              <Btn variant="outline" size="sm" fullWidth onClick={handleGenerarReporte} disabled={reporteEnviando}>
                {reporteEnviando ? 'Enviando…' : '📊 Generar reporte'}
              </Btn>
            )}
            <Btn variant="outline" size="sm" fullWidth onClick={onLogout}>Cerrar sesión</Btn>
          </div>
        </aside>

        {/* main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
          {vista === 'dashboard'      && <VistaDashboard apiFetch={apiFetch} usuario={usuario} setVista={setVista} setTurnosFechaInicial={setTurnosFechaInicial} />}
          {vista === 'pacientes'      && <VistaPacientes apiFetch={apiFetch} onIrAConsultorios={() => { setAjustesTabInicial('consultorios'); setVista('ajustes') }} usuario={usuario} />}
          {vista === 'turnos'         && <VistaTurnos apiFetch={apiFetch} fechaInicial={turnosFechaInicial} />}
          {vista === 'finanzas'       && <VistaFinanzas apiFetch={apiFetch} mesInicial={finanzasMesInicial} subVistaInicial={finanzasSubVistaInicial} onSubVistaConsumida={() => setFinanzasSubVistaInicial(null)} onIrAConsulta={(consultaId, pacienteId) => { setConsultaEditarInicial({ consultaId, pacienteId }); setFinanzasSubVistaInicial('movimientos'); setVista('editar-consulta') }} />}
          {vista === 'editar-consulta' && <VistaEditarConsultaDesdeFinanzas apiFetch={apiFetch} consultaEditarInicial={consultaEditarInicial} usuario={usuario} onVolver={() => { setConsultaEditarInicial(null); setVista('finanzas') }} />}
          {vista === 'ajustes'        && <VistaAjustes apiFetch={apiFetch} tabInicial={ajustesTabInicial} onTabInicialUsada={() => setAjustesTabInicial(null)} />}
          {vista === 'especialidades' && usuario?.esAdmin && <VistaEspecialidades apiFetch={apiFetch} />}
        </main>
      </div>
      {/* Firma sigue deshabilitada globalmente (chip "Próximamente" en la card de consulta),
          y además nunca se monta en demo (no tiene sentido polear firmas pendientes ahí). */}
      {!demoMode && <FirmaPendienteOverlay apiFetch={apiFetch} />}
      {alertDialog}
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
        width: 'calc(100% - 20px)',
        textAlign: 'left',
        margin: '2px 10px',
        padding: '10px 16px',
        fontSize: 14, letterSpacing: '-0.01em',
        fontFamily: T.font, fontWeight: active ? 600 : 500,
        border: 'none',
        borderRadius: 100,
        background: active ? T.black : hov ? T.gray7 : 'none',
        color: active ? T.white : hov ? T.black : T.gray4,
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
        width: '100%', padding: '13px 16px',
        border: `1px solid ${foc ? T.black : '#e0e0dc'}`,
        outline: 'none', background: T.white,
        fontSize: 15, fontFamily: T.font, color: T.black,
        borderRadius: 10,
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
        width: '100%', padding: '13px 16px',
        border: `1px solid ${foc ? T.black : '#e0e0dc'}`,
        outline: 'none', background: T.white,
        fontSize: 15, fontFamily: T.font, color: T.black,
        borderRadius: 10,
        boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
    />
  )
}

/**
 * Input de fecha tipeable con auto-formato DD/MM/AAAA + botón de calendar picker al costado.
 *
 * API compatible con <Input type="date">: recibe `value` en formato ISO (YYYY-MM-DD) y emite
 * `onChange({ target: { name, value } })` con ISO. Emite '' cuando el texto no es una fecha
 * válida completa, para que el form padre no persista datos parciales.
 *
 * Auto-formatea mientras tipeás dígitos (inserta '/' en las posiciones 2 y 4) y valida en blur
 * — rango razonable: 1900 hasta hoy por default (pensado para fechas de nacimiento; se puede
 * ampliar con las props `min`/`max` en ISO).
 */
function FechaInput({ value, onChange, name, min = '1900-01-01', max = '2100-12-31', style: extraStyle, placeholder = 'DD/MM/AAAA', ...rest }) {
  const [foc, setFoc]       = useState(false)
  const [texto, setTexto]   = useState('')
  const [error, setError]   = useState(false)
  const hiddenDateRef       = useRef(null)
  const lastEmittedRef      = useRef(value ?? '')

  const parsearAISO = (t) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t)
    if (!m) return null
    const dd = +m[1], mm = +m[2], yyyy = +m[3]
    const minYear = +min.slice(0, 4)
    const maxYear = +max.slice(0, 4)
    if (yyyy < minYear || yyyy > maxYear) return null
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
    // Valida día real: si Date normaliza (ej. 31/02 → 03/03), fecha inválida
    const d = new Date(yyyy, mm - 1, dd)
    if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy) return null
    const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    if (iso < min || iso > max) return null
    return iso
  }

  const isoAtexto = (iso) => {
    if (!iso) return ''
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
  }

  // Sync value externo → texto interno. Skip cuando el value entrante coincide con lo que
  // acabamos de emitir (evita pisar lo que el usuario está tipeando por el re-render del padre).
  useEffect(() => {
    if (value === lastEmittedRef.current) return
    lastEmittedRef.current = value ?? ''
    setTexto(isoAtexto(value))
    setError(false)
  }, [value])

  const emitir = (iso) => {
    lastEmittedRef.current = iso ?? ''
    onChange?.({ target: { name, value: iso ?? '' } })
  }

  const onChangeTexto = (e) => {
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 8)
    let out = soloDigitos
    if (soloDigitos.length > 4)      out = soloDigitos.slice(0, 2) + '/' + soloDigitos.slice(2, 4) + '/' + soloDigitos.slice(4)
    else if (soloDigitos.length > 2) out = soloDigitos.slice(0, 2) + '/' + soloDigitos.slice(2)
    setTexto(out)
    setError(false)
    emitir(parsearAISO(out))
  }

  const onBlurCheck = () => {
    setFoc(false)
    if (!texto) { setError(false); return }
    setError(parsearAISO(texto) === null)
  }

  const onPickerChange = (e) => {
    const iso = e.target.value
    if (!iso) { setTexto(''); setError(false); emitir(''); return }
    setTexto(isoAtexto(iso))
    setError(false)
    emitir(iso)
  }

  const abrirPicker = () => {
    const el = hiddenDateRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') { try { el.showPicker() } catch { el.click() } }
    else el.click()
  }

  const borderColor = error ? T.red : (foc ? T.black : '#e0e0dc')

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        value={texto}
        onChange={onChangeTexto}
        onFocus={() => setFoc(true)}
        onBlur={onBlurCheck}
        placeholder={placeholder}
        maxLength={10}
        style={{
          width: '100%', padding: '13px 16px',
          outline: 'none', background: T.white,
          fontSize: 15, fontFamily: T.font, color: T.black,
          borderRadius: 10, boxSizing: 'border-box',
          transition: 'border-color 0.15s',
          ...extraStyle,
          border: `1px solid ${borderColor}`,
          paddingRight: 40,
        }}
      />
      <button type="button" onClick={abrirPicker} aria-label="Abrir calendario"
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: '#888' }}
        onMouseEnter={e => e.currentTarget.style.color = T.black}
        onMouseLeave={e => e.currentTarget.style.color = '#888'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>
      <input ref={hiddenDateRef} type="date" value={value || ''} onChange={onPickerChange}
        min={min} max={max} tabIndex={-1}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0, margin: 0, left: 0, top: 0 }} />
      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 4, fontFamily: T.font }}>Fecha inválida — usá DD/MM/AAAA</div>}
    </div>
  )
}

/**
 * Input de monto en pesos con auto-formato AR (dots = miles, coma = decimal).
 *
 * Existe para evitar el bug clásico de `<input type="number">` donde el usuario tipea "50.000"
 * pensando "cincuenta mil" pero JavaScript lo interpreta como Number("50.000") = 50, guardando
 * silenciosamente $50 en lugar de $50.000.
 *
 * Solución: al usuario le es IMPOSIBLE tipear el punto — solo puede tipear dígitos y coma. Los
 * puntos aparecen automáticamente como separador de miles al display. El componente emite el
 * valor en formato canónico JS (dot como decimal, sin thousand seps), así `Number(form.monto)`
 * en el submit sigue funcionando sin tocar nada del backend.
 *
 * Paste: si pegan "50.000,50" (AR) o "50,000.50" (US) detectamos que el último separador es el
 * decimal — los anteriores son thousand seps y se strippean. Cubre el 99% de los formatos que
 * la gente copia de un WhatsApp/mail.
 *
 * API compatible con `<Input type="number">`: recibe `value` y emite
 * `onChange({ target: { name, value } })`.
 */
function MontoInput({ value, onChange, name, style: extraStyle, placeholder = '0', ...rest }) {
  const canonicalToDisplay = (v) => {
    if (v === '' || v == null) return ''
    const s = String(v)
    const [intPart, decPart] = s.split('.')
    const withThousandSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return decPart != null ? `${withThousandSep},${decPart}` : withThousandSep
  }

  // Paste inteligente: normaliza cualquier formato razonable a display AR "50.000,50"
  const normalizarPaste = (raw) => {
    const soloValidos = raw.replace(/[^\d.,]/g, '')
    if (!soloValidos) return ''
    const lastDot   = soloValidos.lastIndexOf('.')
    const lastComma = soloValidos.lastIndexOf(',')
    let decimalSep, thousandSep
    if (lastDot === -1 && lastComma === -1) return soloValidos
    if (lastDot === -1)   { decimalSep = ','; thousandSep = '.' }
    else if (lastComma === -1) {
      // Solo dots: ambiguo. Si hay UN solo dot con 1-2 dígitos después → interpretación US decimal.
      // Sino → interpretación AR thousand seps (que es la que evita el bug).
      const parts = soloValidos.split('.')
      if (parts.length === 2 && (parts[1].length === 1 || parts[1].length === 2)) {
        decimalSep = '.'; thousandSep = ','
      } else {
        decimalSep = ','; thousandSep = '.'
      }
    }
    else if (lastDot > lastComma) { decimalSep = '.'; thousandSep = ',' }
    else                          { decimalSep = ','; thousandSep = '.' }
    // Devuelve en formato display AR: strippea thousand seps, convierte decimal a coma
    const sinThousands = soloValidos.split(thousandSep).join('')
    return sinThousands.replace(decimalSep, ',')
  }

  const [foc, setFoc]      = useState(false)
  const [texto, setTexto]  = useState(() => canonicalToDisplay(value))
  const lastEmittedRef     = useRef(String(value ?? ''))

  useEffect(() => {
    const s = String(value ?? '')
    if (s === lastEmittedRef.current) return
    lastEmittedRef.current = s
    setTexto(canonicalToDisplay(s))
  }, [value])

  const procesarInput = (raw) => {
    // Solo dígitos y coma. El punto se ignora — solo aparece como thousand sep del display.
    let cleaned = raw.replace(/[^\d,]/g, '')
    // Solo permitir UNA coma (segunda y siguientes se strippean)
    const firstComma = cleaned.indexOf(',')
    if (firstComma !== -1) {
      cleaned = cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, '')
    }
    const [intRaw, decRaw] = cleaned.split(',')
    // Strip leading zeros (excepto el único "0")
    const intClean = intRaw.replace(/^0+(\d)/, '$1')
    const decClean = decRaw != null ? decRaw.slice(0, 2) : null   // max 2 decimales
    // Si solo tipearon coma o ",5", asumimos 0 como parte entera
    const parteEntera = (intClean === '' && decClean != null) ? '0' : intClean

    const withThousandSep = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const display   = decClean != null ? `${withThousandSep},${decClean}` : withThousandSep
    const canonical = decClean != null ? `${parteEntera}.${decClean}` : parteEntera

    setTexto(display)
    lastEmittedRef.current = canonical
    onChange?.({ target: { name, value: canonical } })
  }

  const onChangeInput = (e) => procesarInput(e.target.value)

  const onPaste = (e) => {
    e.preventDefault()
    const pegado = e.clipboardData?.getData('text') ?? ''
    procesarInput(normalizarPaste(pegado))
  }

  const borderColor = foc ? T.black : '#e0e0dc'

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 14, pointerEvents: 'none', fontFamily: T.font, userSelect: 'none' }}>$</span>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={onChangeInput}
        onPaste={onPaste}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '13px 16px',
          background: T.white, outline: 'none',
          fontSize: 15, fontFamily: T.font, color: T.black,
          borderRadius: 10, boxSizing: 'border-box',
          transition: 'border-color 0.15s',
          ...extraStyle,
          border: `1px solid ${borderColor}`,
          paddingLeft: 28,
        }}
      />
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 9, fontFamily: T.mono, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', display: 'block', marginBottom: 7 }}>
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
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(17,17,17,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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

export function Logo({ size = 16 }) {
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
          // Limpiamos credenciales viejas del browser (si el user tenía sesión previa con otra
          // cuenta, su JWT podría matchear por email al row recién activado y saltearse el login
          // con Google). Forzamos siempre el flow de login completo post-activación.
          try {
            localStorage.removeItem('postPagoEmail')
            localStorage.removeItem('so_token')
            localStorage.removeItem('so_usuario')
          } catch {}
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


// ── Precios de los planes (fuente de verdad del front) ──
// Cambiar acá si actualiza el pricing. El back tiene su propia copia en AdminNotificationService.
const PLAN_MENSUAL_PRECIO = 28900
const PLAN_ANUAL_PRECIO   = 21900
const PLAN_ANUAL_TOTAL    = PLAN_ANUAL_PRECIO * 12
const PLAN_AHORRO_PCT     = Math.round((1 - PLAN_ANUAL_PRECIO / PLAN_MENSUAL_PRECIO) * 100)
const fmtPrecio = (n) => n.toLocaleString('es-AR')

function VistaLogin({ onLogin }) {
  const isMobile = useIsMobile()
  const [cargando,        setCargando]        = useState(false)
  const [error,           setError]           = useState(null)
  const [modo,            setModo]            = useState('landing') // 'landing' | 'login' | 'registro' | 'exito' | 'guia' | 'guia-exito'
  const [form,            setForm]            = useState({ nombre: '', apellido: '', email: '', confirmarEmail: '' })
  const [guiaForm,        setGuiaForm]        = useState({ email: '', whatsapp: '' })
  const [turnstileToken,  setTurnstileToken]  = useState(null)
  const [faqAbierta,      setFaqAbierta]      = useState(null)
  const [planAnual,       setPlanAnual]       = useState(true)
  const turnstileRef      = useRef(null)
  const turnstileWidgetId = useRef(null)

  useEffect(() => {
    if (modo !== 'registro' && modo !== 'guia') return
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

  // Cerrar modal con Escape
  useEffect(() => {
    if (modo === 'landing') return
    const onKey = (e) => { if (e.key === 'Escape') { setModo('landing'); setError(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modo])

  // Lock scroll cuando hay modal abierto
  useEffect(() => {
    if (modo === 'landing') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
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
    const emailNorm = form.email.trim().toLowerCase()
    if (!emailNorm.endsWith('@gmail.com')) {
      setError('El email debe ser una cuenta @gmail.com'); return
    }
    if (emailNorm !== form.confirmarEmail.trim().toLowerCase()) {
      setError('Los emails no coinciden'); return
    }
    if (!turnstileToken) { setError('Completá la verificación anti-bot'); return }
    setError(null); setCargando(true)
    try {
      const { confirmarEmail: _ignored, ...payload } = form
      const res = await fetchTracked(`${API_URL}/auth/registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...payload, turnstileToken, plan: planAnual ? 'ANUAL' : 'MENSUAL' }),
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

  async function handleSolicitarGuia(e) {
    e.preventDefault()
    if (!guiaForm.email.trim() || !guiaForm.whatsapp.trim()) { setError('Completá email y WhatsApp'); return }
    if (!turnstileToken) { setError('Completá la verificación anti-bot'); return }
    setError(null); setCargando(true)
    try {
      const res = await fetchTracked(`${API_URL}/auth/solicitar-guia`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: guiaForm.email.trim(), whatsapp: guiaForm.whatsapp.trim(), turnstileToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No pudimos enviar tu solicitud')
        if (window.turnstile && turnstileWidgetId.current !== null) {
          window.turnstile.reset(turnstileWidgetId.current)
        }
        setTurnstileToken(null)
        return
      }
      setModo('guia-exito')
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

  const abrirLogin    = () => { setModo('login');    setError(null) }
  const abrirGuia     = () => { setModo('guia');     setError(null); setGuiaForm({ email: '', whatsapp: '' }) }
  const abrirRegistro = () => { setModo('registro'); setError(null); setForm({ nombre: '', apellido: '', email: '', confirmarEmail: '' }) }
  const cerrarModal = () => { setModo('landing'); setError(null) }
  const scrollA = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const irAPrecio = () => {
    setModo('landing')
    setError(null)
    setTimeout(() => document.getElementById('precio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  // ── Contenido de las secciones ──────────────────────────────────
  const features = [
    {
      title: 'Agenda de turnos',
      desc:  'Sincronizada con Google Calendar. Nunca más un turno olvidado ni superpuesto.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      ),
    },
    {
      title: 'Historia clínica digital',
      desc:  'Cada consulta, indicación y estudio del paciente en un solo perfil. Con odontograma para odontología.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M9 13h6M9 17h4"/>
        </svg>
      ),
    },
    {
      title: 'Cobros y finanzas claros',
      desc:  'Ingresos, egresos, cobros pendientes y por obra social. Sabés cuánto ganás realmente.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/>
          <path d="M7 15l4-4 4 4 5-6"/>
        </svg>
      ),
    },
    {
      title: 'Estudios y radiografías',
      desc:  'Subí, anotá y compartí estudios con tus pacientes desde cualquier dispositivo.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      ),
    },
  ]

  const pasosDemo = [
    { title: 'Solicitá el demo',        desc: 'Desde el botón "Probá HolaDoc gratis", dejás tu mail y WhatsApp.' },
    { title: 'Te enviamos el link',     desc: 'Recibís por mail el acceso a la guía visual + demo interactiva con datos de ejemplo.' },
    { title: 'Explorás cuando quieras', desc: 'Sin registrarte, sin cargar tus datos, sin tarjeta y sin límite de tiempo.' },
  ]

  const pasosSuscripcion = [
    { title: 'Elegí tu plan',      desc: 'Mensual o anual desde la sección de precios.' },
    { title: 'Solicitá tu cuenta', desc: 'Completás tus datos con el plan elegido y enviás el formulario.' },
    { title: 'Pagá con seguridad', desc: 'Te enviamos por mail el link de Mercado Pago. Cuando confirmemos el cobro, activamos tu cuenta.',
      icon: <img src="/landing/mp-logo-sin-fondo.png" alt="Mercado Pago" style={{ height: 18, width: 'auto', display: 'inline-block', verticalAlign: 'middle', marginLeft: 8 }} /> },
    { title: 'Empezás a usarlo',   desc: 'Ingresás con Google y arrancás a trabajar con tus pacientes reales.' },
  ]

  const faqs = [
    { q: '¿Qué es HolaDoc?',                    a: 'Un sistema web para que profesionales de la salud gestionen sus turnos, pacientes, historia clínica y finanzas desde un solo lugar, sin necesidad de instalar nada.' },
    { q: '¿Cuánto cuesta?',                     a: `$${fmtPrecio(PLAN_MENSUAL_PRECIO)}/mes en plan mensual, o $${fmtPrecio(PLAN_ANUAL_PRECIO)}/mes si contratás por año (ahorrás ~${PLAN_AHORRO_PCT}%). Un solo plan que incluye todas las funcionalidades sin límites, con soporte por mail y WhatsApp. Además tenés 7 días de prueba gratis para conocer el sistema sin cargo.` },
    { q: '¿Para quién está dirigido?',          a: 'Para cualquier profesional de la salud que atienda pacientes: odontólogos, kinesiólogos, psicólogos, nutricionistas, médicos generalistas, entre otros. Las funciones específicas como el odontograma aparecen solo si tu especialidad lo requiere.' },
  ]

  const showModal = modo !== 'landing'

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: T.white, color: T.black, fontFamily: T.font }}>
      <style>{`
        @keyframes soPulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        @keyframes soFadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      `}</style>

      {/* ── TOP BAR STICKY ────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderBottom: `1px solid ${T.gray1}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: isMobile ? '12px 20px' : '16px 40px' }}>
          <LoginLogo size={16} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, lineHeight: 1.3 }}>
              {!isMobile && <span style={{ color: T.gray4 }}>¿Ya probaste HolaDoc y querés crear tu cuenta?</span>}
              <button onClick={irAPrecio}
                style={{ background: 'none', border: 'none', padding: 0, color: T.black, fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                Solicitar acceso
              </button>
            </div>
            <button onClick={abrirLogin}
              style={{ background: T.black, color: T.white, border: 'none', borderRadius: 100, padding: '9px 18px', fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '48px 20px 60px' : '80px 40px 100px', background: T.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr', gap: isMobile ? 44 : 64, alignItems: 'start' }}>
          <div style={{ animation: 'soFadeUp 0.45s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '5px 12px', fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, marginBottom: 18 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.black, animation: 'soPulse 2s ease infinite' }} />
              Gestión clínica · Simple
            </div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 34 : 54, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.035em', color: T.black }}>
              Ordená tu consultorio en un solo lugar
            </h1>
            <p style={{ margin: '20px 0 0', fontSize: isMobile ? 15 : 17.5, lineHeight: 1.55, color: T.gray4, maxWidth: 540 }}>
              Turnos, historia clínica, cobros y estudios — todo en HolaDoc. Sin planillas, sin cuadernos, sin perder tiempo.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', marginTop: 32 }}>
              <button onClick={abrirGuia}
                style={{ background: T.black, color: T.white, border: `1.5px solid ${T.black}`, borderRadius: 12, padding: '15px 26px', fontFamily: T.font, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)' }}>
                Probá HolaDoc gratis
              </button>
              <a href="#features" onClick={scrollA('features')}
                style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Ver cómo funciona ↓
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 12 : 24, marginTop: 28, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5 }}>
              <span>· Sin tarjeta de crédito</span>
              <span>· Cancelás cuando quieras</span>
            </div>
          </div>

          {/* HERO VISUAL — desktop + mobile flotante + ejemplo cefalometría */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 32 : 48, width: '100%', animation: 'soFadeUp 0.55s ease' }}>
            {/* 1. Dashboard finanzas con overlay del mobile */}
            <div style={{ position: 'relative' }}>
              <img src="/landing/desktop.png" alt="Panel de finanzas de HolaDoc"
                style={{
                  width: '100%', height: 'auto', display: 'block',
                  borderRadius: 16,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08)',
                  border: `1px solid ${T.gray1}`,
                }} />
              {!isMobile && (
                <img src="/landing/mobile.jpeg" alt="Perfil de paciente en HolaDoc"
                  style={{
                    position: 'absolute', bottom: '-8%', left: '-6%',
                    width: '32%', height: 'auto',
                    borderRadius: 18,
                    boxShadow: '0 22px 42px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.14)',
                    border: `5px solid ${T.white}`,
                  }} />
              )}
            </div>

            {/* 2. Ejemplo cefalometría — trazado sobre estudios */}
            <div>
              <img src="/guia/ejemplo.png" alt="Análisis cefalométrico realizado sobre una telerradiografía lateral, con planos anatómicos trazados y ángulos medidos"
                style={{
                  width: '100%', height: 'auto', display: 'block',
                  borderRadius: 16,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.16), 0 4px 10px rgba(0,0,0,0.08)',
                  border: `1px solid ${T.gray1}`,
                }} />
              <div style={{ marginTop: 12, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray4, textAlign: 'center' }}>
                Trazá líneas y medí ángulos sobre tus estudios
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ background: T.gray2, padding: isMobile ? '60px 20px' : '100px 40px', borderTop: `1px solid ${T.gray1}`, borderBottom: `1px solid ${T.gray1}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 10 }}>Funcionalidades</div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: '-0.028em', color: T.black }}>Más motivos para elegir HolaDoc</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 18, padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'transform 0.18s, box-shadow 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: T.black, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em', color: T.black }}>{f.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: T.gray4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: T.white, padding: isMobile ? '60px 20px' : '100px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 10 }}>Empezar</div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: '-0.028em', color: T.black }}>Cómo funciona</h2>
            <p style={{ margin: '14px auto 0', fontSize: isMobile ? 14.5 : 16, lineHeight: 1.6, color: T.gray4, maxWidth: 560 }}>
              Hay dos formas de arrancar con HolaDoc — elegí la que te venga mejor.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 24 : 24 }}>

            {/* Track A — Demo sin costo */}
            <div style={{ background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 18, padding: isMobile ? '28px 24px' : '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4, marginBottom: 8 }}>
                  Sin costo · Sin tarjeta
                </div>
                <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.black }}>
                  Solo querés conocerlo
                </div>
                <div style={{ fontSize: 13.5, color: T.gray4, marginTop: 6, lineHeight: 1.5 }}>
                  Explorá la app antes de decidir, sin compromiso.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
                {pasosDemo.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, fontSize: 13, fontWeight: 800, color: T.black, flexShrink: 0, background: T.white }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.015em', color: T.black }}>{s.title}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.55, color: T.gray4, marginTop: 4 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={abrirGuia}
                style={{ marginTop: 'auto', background: T.black, color: T.white, border: `1.5px solid ${T.black}`, borderRadius: 12, padding: '13px 22px', fontFamily: T.font, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)' }}>
                Probá HolaDoc gratis
              </button>
            </div>

            {/* Track B — Suscripción */}
            <div style={{ background: T.black, border: `1px solid ${T.black}`, borderRadius: 18, padding: isMobile ? '28px 24px' : '32px 28px', display: 'flex', flexDirection: 'column', gap: 20, color: T.white }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a3a3a3', marginBottom: 8 }}>
                  Con suscripción
                </div>
                <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.white }}>
                  Querés empezar a usarlo
                </div>
                <div style={{ fontSize: 13.5, color: '#a3a3a3', marginTop: 6, lineHeight: 1.5 }}>
                  Cargá tus pacientes reales y hacé de HolaDoc tu sistema del día a día.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
                {pasosSuscripcion.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, fontSize: 13, fontWeight: 800, color: T.white, flexShrink: 0, background: 'transparent' }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.015em', color: T.white, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{s.title}</span>
                        {s.icon}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#c4c4c4', marginTop: 4 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={irAPrecio}
                style={{ marginTop: 'auto', background: T.white, color: T.black, border: `1.5px solid ${T.white}`, borderRadius: 12, padding: '13px 22px', fontFamily: T.font, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                Ver planes →
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRECIO ───────────────────────────────────────────── */}
      <section id="precio" style={{ background: T.gray2, padding: isMobile ? '60px 20px' : '100px 40px', borderTop: `1px solid ${T.gray1}` }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 10 }}>Precio</div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: '-0.028em', color: T.black }}>Un plan, todo incluido</h2>
            <p style={{ margin: '14px auto 0', fontSize: isMobile ? 14.5 : 16, lineHeight: 1.6, color: T.gray4, maxWidth: 480 }}>
              Sin niveles ni funcionalidades bloqueadas. Todo lo que ves en HolaDoc lo tenés desde el primer día.
            </p>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 20, padding: isMobile ? '32px 24px' : '44px 40px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>

            {/* Toggle Mensual / Anual */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: 4, display: 'inline-flex', gap: 2 }}>
                <button onClick={() => setPlanAnual(false)}
                  style={{ background: !planAnual ? T.black : 'transparent', color: !planAnual ? T.white : T.gray4, border: 'none', borderRadius: 100, padding: '8px 18px', fontFamily: T.font, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}>
                  Mensual
                </button>
                <button onClick={() => setPlanAnual(true)}
                  style={{ background: planAnual ? T.black : 'transparent', color: planAnual ? T.white : T.gray4, border: 'none', borderRadius: 100, padding: '8px 18px', fontFamily: T.font, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Anual
                  <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 100, letterSpacing: '0.02em' }}>-{PLAN_AHORRO_PCT}%</span>
                </button>
              </div>
            </div>

            {/* Precio */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray5 }}>Plan HolaDoc completo</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 14 }}>
                <span style={{ fontSize: isMobile ? 26 : 30, fontWeight: 700, color: T.gray4, letterSpacing: '-0.02em' }}>$</span>
                <span style={{ fontSize: isMobile ? 52 : 64, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: T.black }}>
                  {fmtPrecio(planAnual ? PLAN_ANUAL_PRECIO : PLAN_MENSUAL_PRECIO)}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: T.gray4, marginTop: 6 }}>
                por mes
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5, minHeight: 16 }}>
                {planAnual && (
                  <span>Pagás ${fmtPrecio(PLAN_ANUAL_TOTAL)} una vez y te olvidás por el resto del año</span>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Pago seguro con Mercado Pago</span>
                  <img src="/landing/mp-logo.png" alt="Mercado Pago" style={{ height: 16, width: 'auto', display: 'inline-block' }} />
                </div>
              </div>
            </div>

            {/* Features incluidas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              {[
                'Pacientes ilimitados',
                'Turnos sincronizados con Google Calendar',
                'Historia clínica + odontograma para odontología',
                'Cobros, ingresos y egresos con reportes',
                'Estudios con anotaciones (radiografías, cefalometría)',
                'Soporte por mail y WhatsApp',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: T.black, lineHeight: 1.5 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" fill={T.black} />
                    <path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={abrirRegistro}
                style={{ width: '100%', maxWidth: 320, padding: '14px 26px', background: T.black, color: T.white, border: 'none', borderRadius: 12, fontFamily: T.font, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)' }}>
                Solicitar acceso
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: T.white, padding: isMobile ? '60px 20px' : '100px 40px', borderTop: `1px solid ${T.gray1}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 10 }}>Dudas</div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 38, fontWeight: 800, letterSpacing: '-0.028em', color: T.black }}>Preguntas frecuentes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((f, i) => {
              const abierta = faqAbierta === i
              return (
                <div key={i} style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12, overflow: 'hidden' }}>
                  <button onClick={() => setFaqAbierta(abierta ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, textAlign: 'left' }}>
                    {f.q}
                    <span style={{ fontSize: 22, color: T.gray4, transform: abierta ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, lineHeight: 1 }}>+</span>
                  </button>
                  {abierta && (
                    <div style={{ padding: '0 22px 20px', fontSize: 14, lineHeight: 1.65, color: T.gray4 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ background: T.black, color: T.white, padding: isMobile ? '60px 20px' : '100px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 42, fontWeight: 800, letterSpacing: '-0.028em', color: T.white, lineHeight: 1.1 }}>
            ¿Listo para probarlo?
          </h2>
          <p style={{ margin: '18px auto 32px', fontSize: isMobile ? 15 : 16.5, lineHeight: 1.6, color: '#a3a3a3', maxWidth: 520 }}>
            Solicitá acceso en 30 segundos. Te mandamos el link con guía visual + demo interactiva por mail.
          </p>
          <button onClick={abrirGuia}
            style={{ background: T.white, color: T.black, border: 'none', borderRadius: 12, padding: '15px 30px', fontFamily: T.font, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
            Probá HolaDoc gratis
          </button>
          <div style={{ marginTop: 20, fontSize: 13, color: '#a3a3a3' }}>
            ¿Ya te decidiste?{' '}
            <button onClick={irAPrecio}
              style={{ background: 'none', border: 'none', padding: 0, color: T.white, fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
              Ver planes →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: T.black, borderTop: '1px solid #1a1a1a', padding: '24px 20px', textAlign: 'center', color: '#666', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em' }}>
        holadocapp.com · para profesionales de la salud
      </footer>

      {/* ── MODAL (login / registro / guía / éxitos) ─────────── */}
      {showModal && (
        <div onClick={cerrarModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'soFadeUp 0.2s ease',
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%', maxWidth: 440,
              maxHeight: '92vh', overflowY: 'auto',
              background: T.white,
              border: `1px solid ${T.gray1}`,
              borderRadius: 18,
              padding: isMobile ? '2rem 1.5rem' : '2.5rem',
              boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
            }}>

            {/* Close button */}
            <button onClick={cerrarModal} aria-label="Cerrar"
              style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, color: T.gray4, lineHeight: 1, padding: '6px 10px', fontFamily: T.font }}>
              ×
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <LoginLogo size={20} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>
                {modo === 'login'      && 'Iniciar sesión'}
                {modo === 'registro'   && 'Solicitá acceso'}
                {modo === 'exito'      && 'Recibimos tu solicitud'}
                {modo === 'guia'       && 'Probá HolaDoc'}
                {modo === 'guia-exito' && 'Te lo mandamos por mail'}
              </div>
              <div style={{ fontSize: 12.5, color: T.gray3, marginTop: 5, lineHeight: 1.55 }}>
                {modo === 'login'      && 'Ingresá con tu cuenta de Google.'}
                {modo === 'registro'   && 'Completá el formulario y te contactamos para darte acceso anticipado.'}
                {modo === 'exito'      && 'En breve te enviaremos un mail con el link para completar el pago de tu suscripción mensual. Cuando confirmemos tu pago, recibirás un segundo mail avisándote que tu cuenta ya está activa. Desde ese momento vas a poder ingresar con tu cuenta de Google en holadocapp.com.'}
                {modo === 'guia'       && 'Dejanos tu contacto y te mandamos el link para conocer HolaDoc — con guía visual y demo interactiva. Sin compromiso.'}
                {modo === 'guia-exito' && 'Recibimos tu pedido. Te vamos a mandar el link con la guía y el demo por mail en las próximas horas.'}
              </div>
            </div>

            {/* LOGIN */}
            {modo === 'login' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44, marginTop: 8 }}>
                  {cargando
                    ? <span style={{ fontSize: 12, color: T.gray5, fontFamily: T.mono, letterSpacing: '0.1em', alignSelf: 'center' }}>Conectando…</span>
                    : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Error al iniciar sesión con Google')} locale="es" text="signin_with" size="large" width="320" />
                  }
                </div>
                {error && <div style={{ marginTop: 12, textAlign: 'center' }}><ErrorMsg>{error}</ErrorMsg></div>}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.gray1}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, color: T.gray4, lineHeight: 1.55 }}>
                    ¿Todavía no tenés cuenta?
                  </div>
                  <button type="button" onClick={irAPrecio}
                    style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.black, textDecoration: 'underline' }}>
                    Registrarme
                  </button>
                </div>
              </>
            )}

            {/* REGISTRO */}
            {modo === 'registro' && (
              <form onSubmit={handleRegistro}>
                {/* Selector de plan — mini versión del toggle de la sección de precio. Arranca
                    seteado con la opción que el usuario eligió en el pricing card; puede cambiarla
                    directo desde acá sin volver arriba. */}
                <div style={{ padding: '16px', marginBottom: 18, background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5, textAlign: 'center', marginBottom: 12 }}>
                    Plan seleccionado
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                    <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: 3, display: 'inline-flex', gap: 2 }}>
                      <button type="button" onClick={() => setPlanAnual(false)}
                        style={{ background: !planAnual ? T.black : 'transparent', color: !planAnual ? T.white : T.gray4, border: 'none', borderRadius: 100, padding: '6px 14px', fontFamily: T.font, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}>
                        Mensual
                      </button>
                      <button type="button" onClick={() => setPlanAnual(true)}
                        style={{ background: planAnual ? T.black : 'transparent', color: planAnual ? T.white : T.gray4, border: 'none', borderRadius: 100, padding: '6px 14px', fontFamily: T.font, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        Anual
                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 100, letterSpacing: '0.02em' }}>-{PLAN_AHORRO_PCT}%</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: T.gray4, letterSpacing: '-0.02em' }}>$</span>
                      <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: T.black }}>
                        {fmtPrecio(planAnual ? PLAN_ANUAL_PRECIO : PLAN_MENSUAL_PRECIO)}
                      </span>
                      <span style={{ fontSize: 12, color: T.gray4 }}>/mes</span>
                    </div>
                    {planAnual && (
                      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5, marginTop: 6 }}>
                        Pago único de ${fmtPrecio(PLAN_ANUAL_TOTAL)} al año
                      </div>
                    )}
                  </div>
                </div>
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
                  <label style={labelStyle}>Email de Gmail</label>
                  <input
                    style={{ ...inputStyle, borderColor: (form.email && !form.email.trim().toLowerCase().endsWith('@gmail.com')) ? T.red : T.gray1 }}
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="maria.lopez@gmail.com"
                    pattern=".+@gmail\.com"
                    title="Ingresá una cuenta @gmail.com"
                    required
                    onFocus={e => e.target.style.borderColor = T.black}
                    onBlur={e => { if (!e.target.value || e.target.value.trim().toLowerCase().endsWith('@gmail.com')) e.target.style.borderColor = T.gray1 }}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Confirmar email</label>
                  <input
                    style={{ ...inputStyle, borderColor: (form.confirmarEmail && form.email.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) ? T.red : T.gray1 }}
                    type="email"
                    value={form.confirmarEmail}
                    onChange={e => setForm(f => ({ ...f, confirmarEmail: e.target.value }))}
                    onPaste={e => e.preventDefault()}
                    placeholder="maria.lopez@gmail.com"
                    required
                  />
                </div>

                <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0f5ff', border: '1px solid #c7d7ff', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285f4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbc05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335"/>
                  </svg>
                  <div style={{ fontSize: 11.5, color: T.gray4, lineHeight: 1.55 }}>
                    <strong style={{ color: T.black, fontWeight: 700 }}>HolaDoc funciona solo con cuentas de Google.</strong>{' '}
                    Usamos el ecosistema de Google (login sin contraseñas + sincronización con Google Calendar para tus turnos + acceso desde cualquier dispositivo) para que tengas la mejor experiencia posible sin recordar credenciales.
                  </div>
                </div>

                <div ref={turnstileRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, minHeight: 65 }} />

                {error && <div style={{ marginBottom: 10 }}><ErrorMsg>{error}</ErrorMsg></div>}

                <button type="submit" disabled={cargando || !turnstileToken} style={{ width: '100%', padding: '13px', background: T.black, color: T.white, border: 'none', borderRadius: 10, fontFamily: T.font, fontWeight: 700, fontSize: 13.5, cursor: (cargando || !turnstileToken) ? 'not-allowed' : 'pointer', opacity: (cargando || !turnstileToken) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  {cargando ? 'Enviando…' : 'Solicitar acceso'}
                </button>

                <button type="button" onClick={cerrarModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', margin: '14px 0 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </form>
            )}

            {/* GUÍA */}
            {modo === 'guia' && (
              <form onSubmit={handleSolicitarGuia}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={guiaForm.email} onChange={e => setGuiaForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@consultorio.com" required onFocus={e => e.target.style.borderColor = T.black} onBlur={e => e.target.style.borderColor = T.gray1} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>WhatsApp</label>
                  <input style={inputStyle} type="tel" value={guiaForm.whatsapp} onChange={e => setGuiaForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+54 351 555 5555" required onFocus={e => e.target.style.borderColor = T.black} onBlur={e => e.target.style.borderColor = T.gray1} />
                </div>

                <div ref={turnstileRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, minHeight: 65 }} />

                {error && <div style={{ marginBottom: 10 }}><ErrorMsg>{error}</ErrorMsg></div>}

                <button type="submit" disabled={cargando || !turnstileToken} style={{ width: '100%', padding: '13px', background: T.black, color: T.white, border: 'none', borderRadius: 10, fontFamily: T.font, fontWeight: 700, fontSize: 13.5, cursor: (cargando || !turnstileToken) ? 'not-allowed' : 'pointer', opacity: (cargando || !turnstileToken) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  {cargando ? 'Enviando…' : 'Enviarme la guía'}
                </button>

                <button type="button" onClick={cerrarModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', margin: '14px 0 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </form>
            )}

            {/* GUÍA ÉXITO */}
            {modo === 'guia-exito' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <button type="button" onClick={() => { setGuiaForm({ email: '', whatsapp: '' }); cerrarModal() }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </div>
            )}

            {/* REGISTRO ÉXITO */}
            {modo === 'exito' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 16px', background: T.white, border: `1.5px solid ${T.gray1}`, borderRadius: 10, textDecoration: 'none', color: T.black, fontFamily: T.font, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.black; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.gray1; e.currentTarget.style.boxShadow = 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M22 5.5v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-13" stroke="#5f6368" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 5.5 12 13l10-7.5" stroke="#5f6368" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13 3.2 4.5A2 2 0 0 1 4.6 4h14.8a2 2 0 0 1 1.4.5L12 13z" fill="#ea4335"/>
                  </svg>
                  Abrir Gmail
                  <span style={{ fontSize: 14, marginLeft: 2, opacity: 0.6 }}>↗</span>
                </a>
                <button type="button" onClick={() => { setForm({ nombre: '', apellido: '', email: '', confirmarEmail: '' }); cerrarModal() }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray3 }}>
                  ← Volver al inicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── VistaCompletarPerfil ───────────────────────────────────── */

function VistaCompletarPerfil({ token, onLogin, onLogout }) {
  const [form,           setForm]           = useState({ especialidadId: '' })
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
        body: JSON.stringify({ especialidadId: Number(form.especialidadId) })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar el perfil'); return }
      onLogin(data)
    } catch { setError('No se pudo conectar con el servidor') }
    finally { setCargando(false) }
  }

  const selectStyle = { width: '100%', padding: '13px 16px', border: '1px solid #e0e0dc', borderRadius: 10, outline: 'none', background: T.white, fontSize: 15, fontFamily: T.font, color: T.black, boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }

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
  const isMobile     = useIsMobile()
  const [dash,        setDash]        = useState(null)
  const [turnosHoy,   setTurnosHoy]   = useState([])
  const [cargando,    setCargando]    = useState(true)  // carga inicial: oculta widgets
  const [cargandoMes, setCargandoMes] = useState(false) // cambio de mes: solo afecta métricas
  const cargadoRef = useRef(false)
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

  useEffect(() => {
    if (!cargadoRef.current) setCargando(true)
    else setCargandoMes(true)
    const mesParam = `${mesSel.año}-${pad(mesSel.mes)}`
    apiFetch(`/dashboard?mes=${mesParam}`).then(async (res) => {
      if (res?.ok) { setDash(await res.json()); cargadoRef.current = true }
      setCargando(false)
      setCargandoMes(false)
    })
  }, [apiFetch, mesSel])

  const mesNombre = new Date(mesSel.año, mesSel.mes - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

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
  const esMesActual = (() => { const n = new Date(); return mesSel.año === n.getFullYear() && mesSel.mes === n.getMonth() + 1 })()
  const mesAnteriorNombre = new Date(mesSel.año, mesSel.mes - 2, 1).toLocaleDateString('es-AR', { month: 'long' })

  // Formatos
  const fmtPesos = n => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const hoy = new Date()
  const fechaHoyStr = `${DIAS[hoy.getDay()]} ${hoy.getDate()} DE ${MESES_LARGO[hoy.getMonth()].toUpperCase()}`
  const saludo = (() => {
    const h = hoy.getHours()
    if (h < 12) return 'Buen día'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  // Turnos de hoy: identificar el próximo (primer PENDIENTE/CONFIRMADO cuya hora es >= ahora)
  const nowMs = Date.now()
  const proximoIdx = turnosHoy.findIndex(t => new Date(t.fechaHora).getTime() >= nowMs)
  const fmtHora = iso => {
    const d = new Date(iso)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const proximoTexto = proximoIdx >= 0 ? fmtHora(turnosHoy[proximoIdx].fechaHora) : '—'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: T.gray2 }}>

      {/* ── Header: saludo + fecha ── */}
      <div style={{ padding: isMobile ? '20px 16px 8px' : '32px 32px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: T.font, fontSize: isMobile ? 24 : 30, fontWeight: 700, letterSpacing: '-0.02em', color: T.black, lineHeight: 1.15 }}>
            {saludo}, {usuario?.nombre}
          </div>
          <div style={{ fontFamily: T.font, fontSize: 14, color: T.gray4, marginTop: 6 }}>
            Esto es lo que tenés hoy.
          </div>
        </div>
        <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.2em', color: T.gray4, textTransform: 'uppercase', marginTop: 8 }}>
          {fechaHoyStr}
        </span>
      </div>

      <div style={{ padding: isMobile ? '0 16px 24px' : '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Card negro grande: TU AGENDA DE HOY ── */}
        <div style={{ background: T.black, borderRadius: 16, padding: isMobile ? '18px 16px' : '24px 28px', boxShadow: '0 6px 30px rgba(0,0,0,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
              Tu agenda de <span style={{ color: T.white, fontWeight: 700 }}>hoy</span>
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>
              {turnosHoy.length} turnos · próximo {proximoTexto}
            </span>
          </div>
          {turnosHoy.length === 0 ? (
            <div style={{ padding: '32px 8px', textAlign: 'center', fontFamily: T.font, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              No tenés turnos programados para hoy.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {turnosHoy.map((t, i) => {
                const esProximo = i === proximoIdx
                const nombre = t.pacienteNombre && t.pacienteApellido
                  ? `${t.pacienteNombre} ${t.pacienteApellido}`
                  : (t.nombrePacienteLibre || '—')
                const partes = []
                if (t.motivo) partes.push(t.motivo)
                if (t.obraSocialNombre) partes.push(t.obraSocialNombre)
                else if (t.tipoPago === 'PARTICULAR') partes.push('Particular')
                if (t.consultorioNombre) partes.push(t.consultorioNombre)
                const descripcion = partes.join(' · ')
                const estado = t.estado === 'CONFIRMADO' ? 'CONFIRMADO' : 'SIN CONFIRMAR'
                const estadoColor = t.estado === 'CONFIRMADO' ? '#4ade80' : '#fb923c'
                const estadoBg = t.estado === 'CONFIRMADO' ? 'rgba(74,222,128,0.12)' : 'rgba(251,146,60,0.14)'
                return (
                  <div key={t.id} onClick={() => setVista?.('turnos')}
                    style={{
                      background: esProximo ? T.white : 'rgba(255,255,255,0.04)',
                      border: esProximo ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: isMobile ? '12px 14px' : '16px 20px',
                      display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20, cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: T.font, fontSize: isMobile ? 20 : 22, fontWeight: 700, color: esProximo ? T.black : T.white, letterSpacing: '-0.02em', minWidth: 64, flexShrink: 0 }}>
                      {fmtHora(t.fechaHora)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: esProximo ? T.black : T.white, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nombre}
                      </div>
                      {descripcion && (
                        <div style={{ fontFamily: T.font, fontSize: 12.5, color: esProximo ? T.gray4 : 'rgba(255,255,255,0.55)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {descripcion}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontFamily: T.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                      background: esProximo ? T.black : estadoBg,
                      color: esProximo ? T.white : estadoColor,
                      border: esProximo ? 'none' : `1px solid ${estadoColor}30`,
                      padding: '5px 12px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {esProximo ? 'PRÓXIMO' : estado}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Alertas: turnos próximos 7 días + cobros históricos OS ── */}
        {!cargando && dash != null && (dash.turnosPendientesManana > 0 || dash.cobrosPendientesCantidad > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            {dash.turnosPendientesManana > 0 && (
              <button onClick={() => {
                const manana = new Date(); manana.setDate(manana.getDate() + 1); manana.setHours(0,0,0,0)
                setTurnosFechaInicial?.(manana)
                setVista?.('turnos')
              }} style={{ all: 'unset', cursor: 'pointer', background: T.white, border: `1px solid ${T.gray1}`, borderLeft: '4px solid #d97742', borderRadius: 16, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontFamily: T.font, fontSize: 42, fontWeight: 800, color: T.black, letterSpacing: '-0.04em', lineHeight: 1, minWidth: 44, textAlign: 'center' }}>
                  {dash.turnosPendientesManana}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>
                    {dash.turnosPendientesManana === 1 ? 'Turno sin confirmar' : 'Turnos sin confirmar'}
                  </div>
                  <div style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, marginTop: 3 }}>
                    Enviá un recordatorio a tu paciente
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray3, marginTop: 6 }}>
                    Próximos 7 días · independiente del mes
                  </div>
                </div>
                <span style={{ fontSize: 18, color: T.gray3 }}>→</span>
              </button>
            )}
            {dash.cobrosPendientesCantidad > 0 && (
              <button onClick={() => setVista?.('finanzas')}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(17,17,17,.07)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
                style={{ all: 'unset', cursor: 'pointer', background: T.white, border: '1px solid #e0e0dc', borderLeft: '4px solid #d97742', borderRadius: 16, padding: '22px 26px', display: 'flex', alignItems: 'flex-start', gap: '1.4rem', transition: 'all .15s' }}>
                <span style={{ fontFamily: T.font, fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: T.black, flexShrink: 0, minWidth: 44 }}>
                  {dash.cobrosPendientesCantidad}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, marginBottom: '0.35rem' }}>
                    Cobros pendientes
                  </div>
                  {(() => {
                    const entries = Object.entries(dash.pendientesOsNombres ?? {}).sort((a, b) => b[1] - a[1])
                    return (<>
                      <div style={{ fontFamily: T.mono, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: entries.length > 0 ? '0.85rem' : 0 }}>
                        Total histórico · independiente del mes
                      </div>
                      {entries.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {entries.map(([nombre, cant], i) => {
                            const paleta = ['#4a90d9', '#5baee0', '#7ec2e8', '#2e7fd6', '#3b6ea8']
                            const color = nombre === 'Particular' ? '#111' : paleta[i % paleta.length]
                            return (
                              <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 3, background: color, flexShrink: 0 }} />
                                <span style={{ fontFamily: T.font, fontSize: '0.88rem', fontWeight: 700, color: '#111' }}>{cant}</span>
                                <span style={{ fontFamily: T.font, fontSize: '0.85rem', color: '#555' }}>{nombre}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>)
                  })()}
                </div>
                <span style={{ color: '#ccc', fontSize: '1.3rem', marginTop: '0.2rem', flexShrink: 0 }}>→</span>
              </button>
            )}
          </div>
        )}

        {/* ── Widget del mes: selector + 4 KPIs ── */}
        <div style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.35rem 1.75rem', borderBottom: `1px solid #f0f0ec` }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray4 }}>Tu mes</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '4px 6px', background: '#fafafa' }}>
              <button onClick={prevMes} style={{ all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.gray4, fontFamily: T.mono, fontSize: 14 }}>‹</button>
              <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', padding: '0 8px', color: T.black, minWidth: 88, textAlign: 'center', textTransform: 'uppercase' }}>
                {new Date(mesSel.año, mesSel.mes - 1, 1).toLocaleDateString('es-AR', { month: 'short' })} {mesSel.año}
              </span>
              <button onClick={nextMes} disabled={esMesActual} style={{ all: 'unset', cursor: esMesActual ? 'default' : 'pointer', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: esMesActual ? T.gray2 : T.gray4, fontFamily: T.mono, fontSize: 14 }}>›</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', padding: isMobile ? '1.25rem' : '1.5rem 1.75rem', gap: isMobile ? '1.25rem' : 0 }}>
            <div style={{ padding: isMobile ? 0 : '0 1.5rem 0 0', borderRight: isMobile ? 'none' : `1px solid #f0f0ec` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 10 }}>Ingresos</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 300, color: T.gray3, letterSpacing: '-0.02em', lineHeight: 1 }}>$</span>
                <span style={{ fontFamily: T.font, fontSize: 32, fontWeight: 800, color: T.black, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {(cargando || cargandoMes) ? '—' : fmtPesos(dash?.facturadoMes || 0).replace('$', '').trim()}
                </span>
              </div>
              <span style={{ fontFamily: T.font, fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 6, display: 'inline-block' }}>↑ vs {mesAnteriorNombre}</span>
            </div>
            <div style={{ padding: isMobile ? 0 : '0 1.5rem', borderRight: isMobile ? 'none' : `1px solid #f0f0ec` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 10 }}>Consultas</div>
              <div style={{ fontFamily: T.font, fontSize: 32, fontWeight: 800, color: T.black, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {(cargando || cargandoMes) ? '—' : (dash?.consultasMes ?? 0)}
              </div>
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, marginTop: 6, display: 'inline-block' }}>este mes</span>
            </div>
            <div style={{ padding: isMobile ? 0 : '0 1.5rem', borderRight: isMobile ? 'none' : `1px solid #f0f0ec` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 10 }}>Promedio x día</div>
              <div style={{ fontFamily: T.font, fontSize: 32, fontWeight: 800, color: T.black, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {(cargando || cargandoMes) ? '—' : (dash?.promedioConsultasPorDia != null ? dash.promedioConsultasPorDia.toFixed(1).replace('.', ',') : '—')}
              </div>
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, marginTop: 6, display: 'inline-block' }}>consultas</span>
            </div>
            <div style={{ padding: isMobile ? 0 : '0 0 0 1.5rem' }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 10 }}>Pacientes</div>
              <div style={{ fontFamily: T.font, fontSize: 32, fontWeight: 800, color: T.black, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {(cargando || cargandoMes) ? '—' : (dash?.pacientesTotal ?? 0)}
              </div>
              <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, marginTop: 6, display: 'inline-block' }}>activos</span>
            </div>
          </div>
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

/* ─── VistaAjustes + VistaABMSimple ────────────────────────────── */

const AJUSTES_TABS = [
  { key: 'medios-pago',    label: 'Medios de pago',   endpoint: '/medios-pago',    panelTitulo: 'Nuevo medio de pago', panelTituloEditar: 'Editar medio de pago', addLabel: '+ Agregar medio de pago', msgVacio: 'No hay medios de pago registrados', msgConfirmar: '¿Eliminar este medio de pago?', placeholder: 'Ej: Efectivo, Transferencia, Mercado Pago…', searchPlaceholder: 'Buscar medio de pago…' },
  { key: 'obras-sociales', label: 'Obras sociales',   endpoint: '/obras-sociales', panelTitulo: 'Nueva obra social',   panelTituloEditar: 'Editar obra social',   addLabel: '+ Agregar obra social',   msgVacio: 'No hay obras sociales registradas', msgConfirmar: '¿Eliminar esta obra social?',  placeholder: 'Ej: OSDE, Swiss Medical, IOMA…',      searchPlaceholder: 'Buscar obra social…' },
  { key: 'consultorios',   label: 'Consultorios',     endpoint: '/consultorios',   panelTitulo: 'Nuevo consultorio',   panelTituloEditar: 'Editar consultorio',   addLabel: '+ Agregar consultorio',   msgVacio: 'No hay consultorios registrados',   msgConfirmar: '¿Eliminar este consultorio?',  placeholder: 'Ej: Casa Central, Sucursal Norte…',    searchPlaceholder: 'Buscar consultorio…' },
]

function VistaAjustes({ apiFetch, tabInicial, onTabInicialUsada }) {
  const isMobile = useIsMobile()
  const [tab,     setTab]     = useState(tabInicial || 'medios-pago')
  const [counts,  setCounts]  = useState({})
  const [allData, setAllData] = useState({}) // datos precargados por tab key

  useEffect(() => {
    if (tabInicial) { setTab(tabInicial); onTabInicialUsada?.() }
  }, [tabInicial, onTabInicialUsada])

  // Carga los 3 tabs en paralelo — una sola vez al montar
  useEffect(() => {
    let cancelado = false
    Promise.all(AJUSTES_TABS.map(t => apiFetch(t.endpoint).then(r => r?.ok ? r.json() : null)))
      .then(results => {
        if (cancelado) return
        const c = {}, d = {}
        AJUSTES_TABS.forEach((t, i) => {
          if (Array.isArray(results[i])) { c[t.key] = results[i].length; d[t.key] = results[i] }
        })
        setCounts(c)
        setAllData(d)
      })
    return () => { cancelado = true }
  }, [apiFetch])

  const activo = AJUSTES_TABS.find(t => t.key === tab) ?? AJUSTES_TABS[0]

  function onCountChange(key, next) {
    setCounts(prev => ({ ...prev, [key]: next }))
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <div style={{ padding: isMobile ? '20px 16px 4px' : '28px 32px 4px', flexShrink: 0 }}>
        <div style={{ fontFamily: T.font, fontSize: isMobile ? 24 : 30, fontWeight: 700, letterSpacing: '-0.02em', color: T.black, lineHeight: 1.15 }}>
          Configuración
        </div>
        <div style={{ fontFamily: T.font, fontSize: 14, color: T.gray4, marginTop: 6 }}>
          Los catálogos que usás para registrar consultas, cobros y turnos.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: isMobile ? '18px 16px 0' : '22px 32px 0', flexShrink: 0, display: 'flex', gap: isMobile ? 20 : 34, borderBottom: `1px solid ${T.gray1}`, overflowX: 'auto' }}>
        {AJUSTES_TABS.map(t => {
          const active = t.key === tab
          const count = counts[t.key]
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: T.font, fontSize: 15, fontWeight: active ? 700 : 500,
                letterSpacing: '-0.01em',
                color: active ? T.black : T.gray4,
                padding: '12px 2px 14px',
                borderBottom: active ? `2px solid ${T.black}` : '2px solid transparent',
                marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              {count != null && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 22, height: 22, padding: '0 7px',
                  borderRadius: 100,
                  background: active ? T.black : T.gray1,
                  color:      active ? T.white : T.gray4,
                  fontFamily: T.font, fontSize: 11, fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <VistaABMSimple
          key={activo.key}
          apiFetch={apiFetch}
          endpoint={activo.endpoint}
          initialItems={allData[activo.key]}
          panelTitulo={activo.panelTitulo}
          panelTituloEditar={activo.panelTituloEditar}
          addLabel={activo.addLabel}
          msgVacio={activo.msgVacio}
          msgConfirmar={activo.msgConfirmar}
          placeholder={activo.placeholder}
          searchPlaceholder={activo.searchPlaceholder}
          onCountChange={next => onCountChange(activo.key, next)}
        />
      </div>
    </div>
  )
}

/**
 * Fila simple de un catálogo — parte de una tarjeta agrupada. Editar + trash aparecen en hover.
 */
function NombreRow({ item, onEditar, onEliminar, isLast }) {
  const [hov, setHov] = useState(false)
  const readonly = item.sistema === true
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '20px 24px',
        borderBottom: isLast ? 'none' : `1px solid ${T.gray1}`,
        background: hov && !readonly ? T.gray2 : T.white,
        transition: 'background 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nombre}
        </div>
        {readonly && (
          <span title="No se puede editar ni eliminar" style={{ display: 'inline-flex', color: T.gray3, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        )}
      </div>
      {!readonly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button onClick={onEditar}
            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = T.black }}
            onMouseLeave={e => e.currentTarget.style.color = T.gray4}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gray4, padding: 4, display: 'flex', transition: 'color 0.15s' }}
            title="Editar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={onEliminar}
            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = T.red }}
            onMouseLeave={e => e.currentTarget.style.color = T.gray4}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gray4, padding: 4, display: 'flex', transition: 'color 0.15s' }}
            title="Eliminar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

function VistaABMSimple({ apiFetch, endpoint, initialItems, titulo, panelTitulo, panelTituloEditar, addLabel, msgVacio, msgConfirmar, placeholder, searchPlaceholder, onCountChange, embedded = true }) {
  const isMobile = useIsMobile()
  const [items,     setItems]     = useState(initialItems ?? [])
  const [cargando,  setCargando]  = useState(initialItems == null)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando,  setEditando]  = useState(null) // { id, nombre } | null
  const [nombre,    setNombre]    = useState('')
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [buscar,    setBuscar]    = useState('')
  const { openConfirm, dialog }   = useConfirm()
  const { openAlert,   dialog: alertDialog } = useAlert()

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch(endpoint)
    if (!res) return
    if (res.ok) {
      const data = await res.json()
      setItems(data)
      onCountChange?.(data.length)
    } else setError('Error al cargar')
    setCargando(false)
  }, [apiFetch, endpoint, onCountChange])

  useEffect(() => {
    if (initialItems != null) return // ya vienen precargados desde VistaAjustes
    cargar()
  }, [cargar, initialItems])

  function abrirNuevo()      { setEditando(null); setNombre(''); setFormErr(null); setPanelOpen(true) }
  function abrirEditar(item) { setEditando(item); setNombre(item.nombre); setFormErr(null); setPanelOpen(true) }
  function cerrarPanel()     { setPanelOpen(false); setEditando(null); setNombre(''); setFormErr(null) }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setFormErr('El nombre es requerido'); return }
    setFormErr(null); setGuardando(true)
    const url    = editando ? `${endpoint}/${editando.id}` : endpoint
    const method = editando ? 'PUT' : 'POST'
    const res = await apiFetch(url, { method, body: JSON.stringify({ nombre: nombre.trim() }) })
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
      openAlert(body?.error || 'No se puede eliminar porque está en uso.', { title: 'No se puede eliminar' })
      return
    }
    openAlert('Error al eliminar. Intentá de nuevo.', { title: 'Error' })
  }

  const filtrados = buscar.trim()
    ? items.filter(i => i.nombre.toLowerCase().includes(buscar.toLowerCase()))
    : items

  const msgEmpty = buscar.trim() ? 'Sin resultados' : msgVacio

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      {!embedded && (
        <PageBar>
          <PageTitle>{titulo}</PageTitle>
          {!isMobile && <Btn onClick={abrirNuevo}>{addLabel}</Btn>}
        </PageBar>
      )}

      <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 96px' : '20px 32px 24px', display: 'flex', flexDirection: 'column' }}>

        {/* Search + add button en la misma fila */}
        <div style={{ padding: '0 0 18px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 48, paddingLeft: 18, flex: 1, borderRadius: 12, background: T.white, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 15, color: T.gray3, marginRight: 10, lineHeight: 1 }}>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder={searchPlaceholder || 'Buscar…'}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: T.font, color: T.black, letterSpacing: '0.01em', width: '100%', paddingRight: 16 }} />
          </div>
          {!isMobile && <Btn onClick={abrirNuevo}>{addLabel}</Btn>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray1}`, padding: '48px 24px', textAlign: 'center', fontSize: 12, color: T.gray4, fontFamily: T.font }}>{msgEmpty}</div>
          ) : (
            <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray1}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              {filtrados.map((item, i) => (
                <NombreRow
                  key={item.id}
                  item={item}
                  isLast={i === filtrados.length - 1}
                  onEditar={() => abrirEditar(item)}
                  onEliminar={() => handleEliminar(item.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? (panelTituloEditar || 'Editar') : panelTitulo} width={380}
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
      {alertDialog}

      {isMobile && !panelOpen && (
        <FabAcciones acciones={[
          { label: addLabel.replace(/^[+ ]+/, ''), onClick: abrirNuevo, variant: 'primary' },
        ]} />
      )}
    </div>
  )
}

function VistaEspecialidades({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/especialidades" titulo="Especialidades" panelTitulo="Nueva especialidad" panelTituloEditar="Editar especialidad" addLabel="+ Agregar" msgVacio="No hay especialidades registradas" msgConfirmar="¿Eliminar esta especialidad?" placeholder="Ej: Ortodoncia, Endodoncia, Periodoncia…" searchPlaceholder="Buscar especialidad…" embedded={false} />
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
        style={{ width: '100%', padding: '13px 16px', border: '1px solid #e0e0dc', borderRadius: 10, fontFamily: T.font, fontSize: 15, color: T.black, outline: 'none', boxSizing: 'border-box', background: T.white }}
      />
      {filtrados.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.white, border: '1px solid #e0e0dc', borderRadius: 10, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          {filtrados.map(p => (
            <div key={p.id}
              onMouseDown={() => { onChange(p.id); setQuery('') }}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontFamily: T.font, color: T.black, borderBottom: '1px solid #f0f0ec' }}
              onMouseEnter={e => e.currentTarget.style.background = T.gray2}
              onMouseLeave={e => e.currentTarget.style.background = T.white}
            >
              <span style={{ fontWeight: 600 }}>{p.apellido}, {p.nombre}</span>
              {p.dni && <span style={{ fontSize: 12, color: T.gray4, marginLeft: 8 }}>DNI {p.dni}</span>}
            </div>
          ))}
        </div>
      )}
      {query.length > 0 && filtrados.length === 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.white, border: '1px solid #e0e0dc', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: T.gray4, fontFamily: T.font, zIndex: 50 }}>
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
      {/* ── Header sticky ── */}
      <div style={{ flexShrink: 0, background: T.white, borderBottom: '1px solid #e0e0dc', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button type="button" onClick={onVolver}
            style={{ width: 44, height: 44, border: '1px solid #e0e0dc', borderRadius: 12, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: T.gray4, fontFamily: T.font }}>
            ←
          </button>
          <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black }}>Nuevo paciente</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={onVolver} disabled={guardando}
            style={{ background: 'transparent', border: 'none', color: T.gray4, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '10px 16px', fontFamily: T.font }}>
            Cancelar
          </button>
          <button type="submit" form="form-nuevo-paciente" disabled={guardando}
            style={{ background: T.black, color: T.white, border: 'none', borderRadius: 100, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: guardando ? 'default' : 'pointer', fontFamily: T.font }}>
            {guardando ? 'Guardando…' : 'Guardar paciente'}
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <form id="form-nuevo-paciente" onSubmit={handleCrear} style={{ maxWidth: 760, margin: '0 auto', padding: '2rem' }}>
          <p style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', marginBottom: '1.5rem' }}>
            <span style={{ color: '#d97742' }}>*</span> Campo obligatorio
          </p>
          <PacienteFormFields
            form={form}
            handleChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
            setField={(name, val) => setForm(p => ({ ...p, [name]: val }))}
            apiFetch={apiFetch}
          />
          <ErrorMsg>{err}</ErrorMsg>
        </form>
      </div>
    </div>
  )
}

function VistaEditarPaciente({ apiFetch, id, onVolver, onGuardado }) {
  const [form,      setForm]      = useState(VACÍO_FORM)
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [err,       setErr]       = useState(null)

  useEffect(() => {
    setCargando(true)
    apiFetch(`/pacientes/${id}`).then(async res => {
      if (res?.ok) {
        const p = await res.json()
        setForm({
          nombre:               p.nombre        ?? '',
          apellido:             p.apellido      ?? '',
          dni:                  p.dni           ?? '',
          fechaNac:             p.fechaNac      ?? '',
          telefono:             p.telefono      ?? '',
          email:                p.email         ?? '',
          direccion:            p.direccion     ?? '',
          obrasSociales:        (p.obrasSociales ?? []).map(o => ({
            obraSocialId: o.obraSocialId,
            nombre:       o.nombre,
            nroAfiliado:  o.nroAfiliado ?? '',
            plan:         o.plan        ?? '',
            titular:      o.titular     ?? '',
          })),
          ocupacion:            p.ocupacion            ?? '',
          grupoSanguineo:       p.grupoSanguineo       ?? '',
          alergias:             p.alergias             ?? '',
          medicaciones:         p.medicaciones         ?? '',
          antecedentes:         p.antecedentes         ?? '',
          antecedentesFamiliares: p.antecedentesFamiliares ?? '',
          peso:                 p.peso   != null ? String(p.peso)   : '',
          altura:               p.altura != null ? String(p.altura) : '',
        })
      }
      setCargando(false)
    })
  }, [apiFetch, id])

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.apellido.trim() || !form.nombre.trim()) { setErr('Apellido y nombre son requeridos'); return }
    setErr(null); setGuardando(true)
    const body = { nombre: form.nombre, apellido: form.apellido, dni: form.dni || null, fechaNac: form.fechaNac || null, telefono: form.telefono || null, email: form.email || null, direccion: form.direccion || null, obrasSociales: buildObrasSocialesBody(form.obrasSociales), ocupacion: form.ocupacion || null, grupoSanguineo: form.grupoSanguineo || null, alergias: form.alergias || null, medicaciones: form.medicaciones || null, antecedentes: form.antecedentes || null, antecedentesFamiliares: form.antecedentesFamiliares || null, peso: form.peso ? Number(form.peso) : null, altura: form.altura ? Number(form.altura) : null }
    const res = await apiFetch(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    if (!res) { setGuardando(false); return }
    if (res.ok) {
      onGuardado?.()
    } else {
      const e = await res.json().catch(() => null)
      setErr(e?.error || 'Error al guardar')
      setGuardando(false)
    }
  }

  if (cargando) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11, color: T.gray4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      Cargando…
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      {/* ── Header sticky ── */}
      <div style={{ flexShrink: 0, background: T.white, borderBottom: '1px solid #e0e0dc', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button type="button" onClick={onVolver}
            style={{ width: 44, height: 44, border: '1px solid #e0e0dc', borderRadius: 12, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: T.gray4, fontFamily: T.font }}>
            ←
          </button>
          <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black }}>Editar paciente</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={onVolver} disabled={guardando}
            style={{ background: 'transparent', border: 'none', color: T.gray4, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '10px 16px', fontFamily: T.font }}>
            Cancelar
          </button>
          <button type="submit" form="form-editar-paciente" disabled={guardando}
            style={{ background: T.black, color: T.white, border: 'none', borderRadius: 100, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: guardando ? 'default' : 'pointer', fontFamily: T.font }}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <form id="form-editar-paciente" onSubmit={handleGuardar} style={{ maxWidth: 760, margin: '0 auto', padding: '2rem' }}>
          <p style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', marginBottom: '1.5rem' }}>
            <span style={{ color: '#d97742' }}>*</span> Campo obligatorio
          </p>
          <PacienteFormFields
            form={form}
            handleChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
            setField={(name, val) => setForm(p => ({ ...p, [name]: val }))}
            apiFetch={apiFetch}
          />
          <ErrorMsg>{err}</ErrorMsg>
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
  function abrirEditarPaciente()       { setSub('editar-paciente') }

  if (sub === 'lista')            return <ListaPacientes apiFetch={apiFetch} onDetalle={abrirDetalle} onNuevo={() => setSub('nuevo')} />
  if (sub === 'nuevo')            return <VistaNuevoPaciente apiFetch={apiFetch} onVolver={() => setSub('lista')} onCreado={abrirDetalle} />
  if (sub === 'detalle')          return <DetallePaciente apiFetch={apiFetch} id={pacienteId} onVolver={volver} onNuevoEstudio={abrirNuevoEstudio} onAbrirEstudio={abrirEstudioExistente} onIrAConsultorios={onIrAConsultorios} onIniciarConsulta={abrirNuevaConsulta} onEditarConsulta={abrirEditarConsulta} onEditarPaciente={abrirEditarPaciente} usuario={usuario} />
  if (sub === 'editar-paciente')  return <VistaEditarPaciente apiFetch={apiFetch} id={pacienteId} onVolver={volverADetalle} onGuardado={volverADetalle} />
  if (sub === 'estudios')         return <VistaEstudios apiFetch={apiFetch} pacienteIdInicial={pacienteId} estudioIdInicial={estudioIdAbierto} onVolver={volverADetalle} />
  if (sub === 'nueva-consulta')   return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteId} onVolver={volverADetalle} usuario={usuario} consulta={consultaActual} />
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
  const [meta,        setMeta]        = useState(null)
  const [cargando,    setCargando]    = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error,       setError]       = useState(null)

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

      <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 96px' : '8px 32px 24px', display: 'flex', flexDirection: 'column' }}>

        {/* ── Search + count ── */}
        <div style={{ padding: '4px 0 18px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 48, paddingLeft: 18, flex: 1, borderRadius: 12, background: T.white, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 15, color: T.gray3, marginRight: 10, lineHeight: 1 }}>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre o DNI…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: T.font, color: T.black, letterSpacing: '0.01em', width: '100%', paddingRight: 16 }} />
          </div>
          {!isMobile && meta && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gray4, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>{meta.totalElements} pacientes</span>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : error ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, color: T.red, fontFamily: T.font }}>{error}</div>
          ) : pacientes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msgVacio}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

/** Devuelve edad en años a partir de un ISO YYYY-MM-DD. Null si no hay fecha. */
function calcularEdad(fechaNacISO) {
  if (!fechaNacISO) return null
  const [y, m, d] = fechaNacISO.split('-').map(Number)
  if (!y) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - y
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--
  return edad
}

/** "Hace 3 días", "Hace 2 meses", "Hoy", "Ayer" — a partir de un ISO YYYY-MM-DD. */
function relativeDias(fechaISO) {
  if (!fechaISO) return null
  const [y, m, d] = fechaISO.split('-').map(Number)
  if (!y) return null
  const t = new Date(y, m - 1, d).getTime()
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const diff = Math.round((hoy.getTime() - t) / (1000 * 60 * 60 * 24))
  if (diff === 0)  return 'Hoy'
  if (diff === 1)  return 'Ayer'
  if (diff < 7)    return `Hace ${diff} días`
  if (diff < 30)   { const s = Math.floor(diff / 7); return s === 1 ? 'Hace 1 semana' : `Hace ${s} semanas` }
  if (diff < 365)  { const m2 = Math.floor(diff / 30); return m2 === 1 ? 'Hace 1 mes' : `Hace ${m2} meses` }
  const a = Math.floor(diff / 365)
  return a === 1 ? 'Hace 1 año' : `Hace ${a} años`
}

/** "10/7" a partir de ISO YYYY-MM-DD. */
function fechaCorta(fechaISO) {
  if (!fechaISO) return null
  const [, m, d] = fechaISO.split('-').map(Number)
  return `${d}/${m}`
}

function PacienteCard({ paciente: p, onClick, onEliminar, apiFetch }) {
  const isMobile = useIsMobile()
  const [hov, setHov] = useState(false)
  const { openConfirm, dialog } = useConfirm()

  async function handleEliminar(e) {
    e.stopPropagation()
    if (!await openConfirm(`¿Eliminar a ${p.apellido}, ${p.nombre}?`)) return
    const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
    if (res && res.ok) onEliminar()
  }

  const inicial = (s) => (s ?? '').trim().charAt(0).toUpperCase()
  const iniciales = `${inicial(p.apellido)}${inicial(p.nombre)}` || '—'
  const edad      = calcularEdad(p.fechaNac)
  const ultima    = relativeDias(p.ultimaVisita)
  const proximo   = fechaCorta(p.proximoTurno)
  const osNombre  = p.obrasSociales?.[0]?.obraSocialNombre
  const osExtra   = (p.obrasSociales?.length ?? 0) > 1 ? ` +${p.obrasSociales.length - 1}` : ''

  return (
    <>
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: T.white, borderRadius: 14,
        border: `1px solid ${hov ? T.gray3 : T.gray1}`,
        padding: isMobile ? '14px 16px' : '20px 24px',
        display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20,
        cursor: 'pointer', position: 'relative',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12,
        background: T.black, color: T.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.font, fontSize: isMobile ? 15 : 17, fontWeight: 700,
        letterSpacing: '0.02em', flexShrink: 0,
      }}>
        {iniciales}
      </div>

      {/* Center: nombre + meta */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontFamily: T.font, fontSize: isMobile ? 15 : 17, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.apellido}, {p.nombre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {p.dni && (
            <span style={{ fontFamily: T.font, fontSize: 12.5, color: T.gray4, letterSpacing: '0.01em' }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gray3, letterSpacing: '0.1em', marginRight: 6 }}>DNI</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.black, fontWeight: 500 }}>{p.dni}</span>
            </span>
          )}
          {edad != null && (
            <span style={{ fontFamily: T.font, fontSize: 12.5, color: T.gray4 }}>{edad} años</span>
          )}
        </div>
        {osNombre && (
          <div>
            <span style={{
              display: 'inline-block',
              fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: T.gray5, background: T.gray2,
              borderRadius: 6, padding: '3px 8px',
            }}>
              {osNombre}{osExtra}
            </span>
          </div>
        )}
      </div>

      {/* Right: última visita + próximo turno */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 140, textAlign: 'right', marginRight: 12 }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray4 }}>
            Última visita
          </span>
          <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>
            {ultima ?? '—'}
          </span>
          {proximo && (
            <span style={{ fontFamily: T.font, fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
              Próximo turno: {proximo}
            </span>
          )}
        </div>
      )}

      {/* handleEliminar queda definido arriba por si en el futuro se agrega el botón. */}
      {!isMobile && (
        <div style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: T.font, fontSize: 18, color: T.gray3 }}>→</span>
        </div>
      )}
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

function DetallePaciente({ apiFetch, id, onVolver, onNuevoEstudio, onAbrirEstudio, onIrAConsultorios, onIniciarConsulta, onEditarConsulta, onEditarPaciente, usuario }) {
  const isMobile = useIsMobile()
  const demoMode = useContext(DemoContext)
  const [paciente,        setPaciente]        = useState(null)
  const [cargando,        setCargando]        = useState(true)
  const [error,           setError]           = useState(null)
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
              {demoMode && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontFamily: T.font, fontSize: 12.5, lineHeight: 1.55, color: '#1e40af' }}>
                  <strong style={{ fontWeight: 700 }}>ℹ Solo visible para odontología.</strong> Esta pantalla se activa automáticamente cuando la especialidad configurada es odontología. En el demo la mostramos siempre.
                </div>
              )}
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
          footer={<Btn variant="outline" onClick={() => { setDatosOpen(false); onEditarPaciente?.() }}>Editar paciente</Btn>}
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

        {dialog}

        {!datosOpen && (
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
            <div style={{ width: 52, height: 52, borderRadius: 14, background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

          {/* clinical summary */}
          {(() => {
            const pendientes = consultas.filter(c => c.estadoIngreso === 'PENDIENTE')
            const saldo = pendientes.reduce((s, c) => s + Number(c.monto ?? 0), 0)
            return (
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, background: T.gray2 }}>
                {p.alergias && <SummaryRow icon="⚠" iconBg="#fef2f0" iconColor="#e05a4a" label="Alergias" value={p.alergias} />}
                {saldo > 0 && (
                  <SummaryRow icon="$" iconBg="#fff8f0" iconColor="#d97742" label="Saldo pendiente"
                    value={`$${Number(saldo).toLocaleString('es-AR')} en ${pendientes.length} consulta${pendientes.length !== 1 ? 's' : ''}`} />
                )}
                <SummaryRow icon="→" iconBg="#f0f9f4" iconColor="#22a565" label="Próximo turno"
                  value={p.proximoTurno ? fechaCorta(p.proximoTurno) : 'Sin turnos agendados'} />
              </div>
            )
          })()}

          {/* scroll area con secciones de datos */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* datos clínicos */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.gray1}` }}>
              <SeccionLabel>Datos clínicos</SeccionLabel>
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

            {/* cobertura */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.gray1}` }}>
              <SeccionLabel>Cobertura</SeccionLabel>
              <ObrasSocialesList obrasSociales={p.obrasSociales} />
            </div>

            {/* datos personales */}
            <div style={{ padding: '14px 20px' }}>
              <SeccionLabel>Datos personales</SeccionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <DatoClinico label="DNI"          value={p.dni} />
                <DatoClinico label="Nacimiento"   value={p.fechaNac ? fmtFecha(p.fechaNac) : null} />
                <DatoClinico label="Teléfono"     value={p.telefono} />
                <DatoClinico label="Email"        value={p.email} truncate />
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Dirección" value={p.direccion} truncate /></div>
              </div>
            </div>

          </div>

          {/* footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5 }}>
              Reg. {fmtFecha(p.dateCreated)}
            </span>
            <Btn variant="outline" size="sm" onClick={() => onEditarPaciente?.()}>Editar paciente</Btn>
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
                <button key={key} onClick={() => setTab(key)} style={{ padding: '16px 0', marginRight: 28, fontSize: 14, fontWeight: 600, border: 'none', borderBottom: tab === key ? `2px solid ${T.black}` : '2px solid transparent', background: 'none', color: tab === key ? T.black : T.gray3, cursor: 'pointer', fontFamily: T.font, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {label}
                  {count != null && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gray5 }}>{count}</span>}
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
                  {demoMode && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontFamily: T.font, fontSize: 12.5, lineHeight: 1.55, color: '#1e40af' }}>
                  <strong style={{ fontWeight: 700 }}>ℹ Solo visible para odontología.</strong> Esta pantalla se activa automáticamente cuando la especialidad configurada es odontología. En el demo la mostramos siempre.
                </div>
              )}
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
    motivo:                consulta.motivo        || '',
    descripcion:           consulta.descripcion   || '',
    monto:                 consulta.monto != null ? String(consulta.monto) : '',
    tipoPago:              consulta.tipoPago || 'PARTICULAR',
    medioPagoId:           consulta.medioPagoId ? String(consulta.medioPagoId) : '',
    obraSocialId:          consulta.obraSocialId ? String(consulta.obraSocialId) : '',
  } : { consultorioId: '', fecha: hoyISO(), motivo: '', descripcion: '', monto: '', tipoPago: 'PARTICULAR', medioPagoId: '', obraSocialId: '' })
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
      motivo:                form.motivo        || null,
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

  // Estilos del formulario — coinciden con el diseño del mockup
  const fCard    = { background: T.white, borderRadius: 16, border: '1px solid #e0e0dc', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '1.75rem', marginBottom: '1.25rem' }
  const fSecLbl  = { fontFamily: T.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', marginBottom: '1.5rem', display: 'block' }
  const fLbl     = { display: 'block', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 7 }
  const fInp     = { width: '100%', padding: '13px 16px', border: '1px solid #e0e0dc', borderRadius: 10, fontFamily: T.font, fontSize: 15, background: T.white, outline: 'none', color: T.black, boxSizing: 'border-box', transition: 'border-color .15s' }
  const fSel     = { ...fInp, cursor: 'pointer', appearance: 'none' }
  const fDivider = { height: 1, background: '#f0f0ec', margin: '1.25rem 0' }

  // Toggle segmentado grande (tipo de pago, estado cobro)
  const SegToggle = ({ options, value, onChange }) => (
    <div style={{ display: 'flex', border: `1.5px solid ${T.gray1}`, borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
      {options.map((op, idx) => {
        const sel = value === op.val
        return (
          <button key={op.val} type="button" onClick={() => onChange(op.val)}
            style={{ padding: '0.78rem 1.75rem', fontFamily: T.font, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', color: sel ? T.white : T.gray3, background: sel ? T.black : T.white, border: 'none', borderRight: idx < options.length - 1 ? `1px solid ${T.gray1}` : 'none', transition: 'all .15s', userSelect: 'none' }}>
            {op.label}
          </button>
        )
      })}
    </div>
  )

  const InfoBanner = ({ children, variant = 'neutral' }) => (
    <div style={{ borderRadius: 10, padding: '0.9rem 1.15rem', fontSize: '0.82rem', lineHeight: 1.55, marginTop: '1.25rem', background: variant === 'warning' ? '#fff8f0' : '#fafafa', border: `1px solid ${variant === 'warning' ? '#f0e0cc' : '#f0f0ec'}`, color: variant === 'warning' ? '#b07030' : T.gray4 }}>
      {children}
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── header sticky ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 14px' : '1rem 2rem', borderBottom: `1px solid ${T.gray1}`, background: T.white, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <BackBtn onClick={onVolver} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {modoEdicion && (
            <button type="button" onClick={handleEliminar} disabled={guardando}
              style={{ background: 'transparent', border: 'none', color: T.gray3, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0.8rem 1rem', fontFamily: T.font }}>
              Eliminar
            </button>
          )}
          {!modoEdicion && !isMobile && (
            <button type="button" onClick={onVolver}
              style={{ background: 'transparent', border: 'none', color: T.gray3, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0.8rem 1rem', fontFamily: T.font }}>
              Cancelar
            </button>
          )}
          <button type="button" onClick={handleGuardar} disabled={guardando}
            style={{ background: T.black, color: T.white, border: 'none', borderRadius: 100, padding: '0.85rem 2rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: T.font, opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Guardar consulta'}
          </button>
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: T.gray2 }}>
        <form onSubmit={handleGuardar} style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '1rem' : '2rem', paddingBottom: isMobile ? 80 : '2rem' }}>

          {/* Banner del paciente */}
          {p && (
            <div style={{ background: T.black, borderRadius: 16, padding: '1.15rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: T.white, color: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, fontFamily: T.font }}>
                {p.nombre?.[0]}{p.apellido?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontSize: '1rem', fontWeight: 700, color: T.white }}>{p.apellido}, {p.nombre}</div>
                <div style={{ fontFamily: T.font, fontSize: '0.75rem', color: T.gray3, marginTop: 2 }}>
                  {[p.fechaNac && (() => { const e = new Date().getFullYear() - new Date(p.fechaNac).getFullYear(); return `${e} años` })(), p.obrasSociales?.[0]?.obraSocialNombre, p.grupoSanguineo].filter(Boolean).join(' · ')}
                </div>
              </div>
              {p.alergias && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(224,90,74,.18)', color: '#e0705a', fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 100, flexShrink: 0, fontFamily: T.font }}>
                  ⚠ Alérgico a {p.alergias}
                </div>
              )}
            </div>
          )}

          {/* Nota campos obligatorios */}
          <div style={{ fontSize: '0.75rem', color: T.gray5, marginBottom: '1.5rem', fontFamily: T.font }}>
            <span style={{ color: '#d97742' }}>*</span> Campo obligatorio
          </div>

          {/* ── Card: Datos de la consulta ── */}
          <div style={fCard}>
            <span style={fSecLbl}>Datos de la consulta</span>

            {/* Fecha + Consultorio */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={fLbl}>Fecha <span style={{ color: '#d97742' }}>*</span></label>
                <FechaInput value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div>
                <label style={fLbl}>Consultorio <span style={{ color: '#d97742' }}>*</span></label>
                <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))} style={fSel}>
                  <option value="">Seleccioná un consultorio...</option>
                  {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* Motivo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fLbl}>Motivo <span style={{ color: '#d97742' }}>*</span></label>
              <Input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                placeholder="Ej: Dolor de muela, Control, Limpieza, Extracción..."
                style={{}} />
              <div style={{ fontSize: '0.72rem', color: T.gray5, marginTop: 6, fontFamily: T.font }}>
                Razón por la que viene el paciente. Se mostrará como título en la historia clínica.
              </div>
            </div>

            {/* Notas clínicas */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fLbl}>Notas clínicas</label>
              <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Observaciones, diagnóstico, tratamiento realizado, indicaciones, próximos pasos..."
                style={{ minHeight: 130 }} />
            </div>

            {/* Archivos adjuntos */}
            <div>
              <label style={fLbl}>Archivos adjuntos</label>
              {(archivosExist.length > 0 || archivos.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {archivosExist.map(arch => (
                    <span key={arch.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid ${T.gray1}`, borderRadius: 8, fontSize: 10, fontFamily: T.font, color: T.gray4, background: T.white }}>
                      📎 {arch.nombre}
                      <button type="button" onClick={() => handleEliminarArchivoExist(arch.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: '#c00', lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                    </span>
                  ))}
                  {archivos.map((fi, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid #d4edda`, borderRadius: 8, fontSize: 10, fontFamily: T.font, color: T.gray4, background: '#f8fff8' }}>
                      📎 {fi.name}
                      <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: T.gray4, lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', border: `1.5px dashed #d0d0cc`, borderRadius: 10, background: '#fafafa', fontSize: '0.85rem', fontWeight: 600, color: T.gray4, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s' }}>
                  + Adjuntar archivo
                  <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])} />
                </label>
                <span style={{ fontSize: '0.75rem', color: T.gray5, fontFamily: T.font }}>Imagen o PDF · Rx, estudios, recetas</span>
              </div>
            </div>
          </div>

          {/* ── Card: Pago ── */}
          <div style={fCard}>
            <span style={fSecLbl}>Pago</span>

            {/* Tipo de pago */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fLbl}>Tipo de pago <span style={{ color: '#d97742' }}>*</span></label>
              {bloqueadoPorCobro ? (
                <div style={{ ...fInp, color: T.gray4, background: T.gray2 }}>Obra social</div>
              ) : (
                <SegToggle
                  options={Object.entries(TIPO_PAGO).filter(([op]) => op !== 'OTRO').map(([op, label]) => ({ val: op, label }))}
                  value={form.tipoPago}
                  onChange={op => setForm(f => {
                    const next = { ...f, tipoPago: op }
                    if (op === 'OBRA_SOCIAL' && !f.obraSocialId && paciente?.obrasSociales?.length > 0)
                      next.obraSocialId = String(paciente.obrasSociales[0].obraSocialId)
                    return next
                  })}
                />
              )}
            </div>

            {/* Particular */}
            {!esObraSocial && !bloqueadoPorCobro && (
              <>
                <div style={fDivider} />
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={fLbl}>Estado <span style={{ color: '#d97742' }}>*</span></label>
                  <SegToggle
                    options={[{ val: 'cobrar', label: 'Cobrar ahora' }, { val: 'pendiente_con_monto', label: 'Dejar pendiente' }]}
                    value={estadoCobro}
                    onChange={setEstadoCobro}
                  />
                </div>
                {mostrarMonto && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (mostrarMedioPago ? '1fr 1fr' : 'minmax(140px,280px)'), gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={fLbl}>Monto <span style={{ color: '#d97742' }}>*</span></label>
                      <MontoInput value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
                    </div>
                    {mostrarMedioPago && (
                      <div>
                        <label style={fLbl}>Medio de pago <span style={{ color: '#d97742' }}>*</span></label>
                        <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))} style={fSel}>
                          <option value="">Seleccionar...</option>
                          {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {cobrarDespues && (
                  <InfoBanner variant="warning">
                    Esta consulta quedará <strong style={{ color: '#d97742' }}>pendiente de cobro</strong>. Podés registrar el pago cuando lo recibas desde la ficha del paciente.
                  </InfoBanner>
                )}
              </>
            )}

            {/* Obra Social */}
            {esObraSocial && (
              <>
                <div style={fDivider} />
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={fLbl}>Obra social <span style={{ color: '#d97742' }}>*</span></label>
                  {bloqueadoPorCobro ? (
                    <div style={{ ...fInp, color: T.gray4, background: T.gray2 }}>{consulta?.obraSocialNombre || '—'}</div>
                  ) : paciente?.obrasSociales?.length > 0 ? (
                    <select value={form.obraSocialId} onChange={e => setForm(f => ({ ...f, obraSocialId: e.target.value }))} style={{ ...fSel, maxWidth: 400 }}>
                      <option value="">Seleccionar…</option>
                      {paciente.obrasSociales.map(os => (
                        <option key={os.obraSocialId} value={os.obraSocialId}>{os.obraSocialNombre}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: 11, fontFamily: T.font, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem 1rem', lineHeight: 1.55 }}>
                      Este paciente no tiene obras sociales registradas. Agregale una desde su ficha.
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={fLbl}>Coseguro (opcional)</label>
                  <div style={{ maxWidth: 280 }}>
                    <MontoInput value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
                  </div>
                </div>
                {coseguroConMonto && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={fLbl}>Medio de pago del coseguro <span style={{ color: '#d97742' }}>*</span></label>
                    <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))} style={{ ...fSel, maxWidth: 320 }}>
                      <option value="">Seleccionar…</option>
                      {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                    </select>
                  </div>
                )}
                {!estabaEnBatch && (
                  <InfoBanner variant="neutral">
                    Esta consulta queda <strong>pendiente de cobro</strong>. Cuando la obra social te pague, vas a Finanzas → "Registrar cobro".
                  </InfoBanner>
                )}
              </>
            )}

            {/* Cobro batch */}
            {bloqueadoPorCobro && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: T.gray2, border: `1px solid ${T.gray1}`, borderRadius: 10, marginTop: '1.25rem' }}>
                <span style={{ fontSize: 12, fontFamily: T.font, color: T.black, lineHeight: 1.55, fontWeight: 500 }}>Esta consulta ya está <strong>cobrada</strong> dentro de un pago de obra social.</span>
                <span style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, lineHeight: 1.55 }}>Para modificar el pago, primero marcala de nuevo como pendiente.</span>
                <button type="button" onClick={() => setDesvincularBatch(true)}
                  style={{ alignSelf: 'flex-start', marginTop: 2, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '6px 14px', fontFamily: T.font, fontSize: 11, fontWeight: 600, color: '#b45309', cursor: 'pointer' }}>
                  Marcar de nuevo como pendiente
                </button>
              </div>
            )}
            {esObraSocial && estabaEnBatch && desvincularBatch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginTop: '1.25rem' }}>
                <span style={{ fontSize: 11, fontFamily: T.font, color: '#b45309', lineHeight: 1.55 }}>Al guardar, esta consulta vuelve a quedar <strong>pendiente de cobro</strong>. El pago de OS registrado no se borra.</span>
                <button type="button" onClick={() => setDesvincularBatch(false)}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontFamily: T.font, fontSize: 11, color: T.gray4, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                  Cancelar — dejarla cobrada
                </button>
              </div>
            )}
          </div>

          {/* ── Card: Odontograma — solo para odontólogos, oculto en mobile ── */}
          {esOdontologo && !isMobile && (
            <div style={fCard}>
              <span style={fSecLbl}>Odontograma</span>
              <Odontograma apiFetch={apiFetch} pacienteId={pacienteId} />
            </div>
          )}

          {/* ── Card: Firma del paciente ──
              TEMPORALMENTE DESHABILITADO — la funcionalidad queda intacta en código para
              cuando la reactivemos. Solo se oculta el interactivo con pointerEvents:none +
              opacity, y se agrega un chip "Próximamente". Se saca en una versión futura. */}
          <div style={{ ...fCard, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={fSecLbl}>Firma del paciente (opcional)</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: T.mono, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#92400e', background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: 100, padding: '3px 10px',
                transform: 'translateY(-1px)',
              }}>
                <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                Próximamente
              </span>
            </div>
            <div aria-disabled="true" style={{ opacity: 0.45, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    <Btn onClick={handleSolicitarFirma} disabled>
                      {idActual ? 'Solicitar firma del paciente' : 'Guardar y solicitar firma'}
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
  const [orden, setOrden] = useState('reciente')

  if (cargando) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
  )
  if (consultas.length === 0) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin consultas registradas</div>
  )

  const fmtMonto = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const fmtTipo  = t => TIPO_PAGO[t] ?? t

  const getFechaSort = c => {
    if (c.fecha) {
      const [y, mo, d] = c.fecha.split('-').map(Number)
      return new Date(y, mo - 1, d)
    }
    return new Date(c.dateCreated || 0)
  }

  const sorted = [...consultas].sort((a, b) =>
    orden === 'reciente' ? getFechaSort(b) - getFechaSort(a) : getFechaSort(a) - getFechaSort(b)
  )

  // Agrupar por mes/año
  const grupos = []
  let currentKey = null
  for (const c of sorted) {
    const d = getFechaSort(c)
    const key = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    if (key !== currentKey) { grupos.push({ key, items: [] }); currentKey = key }
    grupos[grupos.length - 1].items.push(c)
  }

  return (
    <div>
      {/* Toolbar ordenar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Ordenar por</div>
        <div style={{ display: 'flex', border: `1px solid ${T.gray1}`, borderRadius: 100, overflow: 'hidden' }}>
          {['reciente', 'antiguo'].map(op => (
            <div key={op} onClick={() => setOrden(op)}
              style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
                background: orden === op ? T.black : T.white, color: orden === op ? T.white : T.gray3, transition: 'all 0.15s' }}>
              {op === 'reciente' ? 'Más reciente' : 'Más antiguo'}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: T.gray1 }} />
        {grupos.map((grupo, gi) => (
          <div key={grupo.key}>
            <div style={{ position: 'relative', margin: gi === 0 ? '0 0 14px' : '20px 0 14px',
              fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray5 }}>
              <div style={{ position: 'absolute', left: -25, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, borderRadius: '50%', background: T.gray2, border: `2px solid ${T.gray6}` }} />
              {grupo.key}
            </div>
            {grupo.items.map(c => (
              <TLConsultaCard key={c.id} c={c} fmtMonto={fmtMonto} fmtTipo={fmtTipo}
                onEditar={() => onEditarConsulta?.(c)} apiFetch={apiFetch} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TLConsultaCard({ c, fmtMonto, fmtTipo, onEditar, apiFetch }) {
  const [open, setOpen]   = useState(false)
  const [hov, setHov]     = useState(false)

  const pendiente = c.estadoIngreso === 'PENDIENTE'
  const tipoLabel = c.tipoPago === 'OBRA_SOCIAL' && c.obraSocialNombre
    ? c.obraSocialNombre
    : fmtTipo ? fmtTipo(c.tipoPago) : null

  const fmtRelativa = fechaStr => {
    if (!fechaStr) return ''
    let d
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [y, mo, dd] = fechaStr.split('-').map(Number)
      d = new Date(y, mo - 1, dd)
    } else {
      d = new Date(fechaStr)
    }
    const hoy = new Date(); hoy.setHours(0,0,0,0); d.setHours(0,0,0,0)
    const dias = Math.round((hoy - d) / 86400000)
    if (dias === 0) return 'hoy'
    if (dias === 1) return 'ayer'
    if (dias < 30) return `hace ${dias} días`
    const meses = Math.floor(dias / 30)
    if (meses < 12) return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
    const anios = Math.floor(dias / 365)
    return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`
  }

  async function handleDescargar(archivo) {
    const res = await apiFetch(`/consultas/${c.id}/archivos/${archivo.id}`)
    if (!res?.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = archivo.nombre; link.click()
    URL.revokeObjectURL(url)
  }

  const titulo  = c.motivo || c.descripcion || '(sin motivo)'
  const detalle = c.motivo ? c.descripcion : null

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      {/* Nodo de la línea de tiempo */}
      <div style={{ position: 'absolute', left: -25, top: 22, width: 11, height: 11, borderRadius: '50%',
        background: pendiente ? '#d97742' : T.black, border: `3px solid ${T.white}`,
        boxShadow: `0 0 0 1px ${T.gray1}`, zIndex: 1 }} />

      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ border: `1px solid ${hov ? T.black : T.gray1}`,
          borderLeft: `${pendiente ? '4px' : '1px'} solid ${pendiente ? '#d97742' : hov ? T.black : T.gray1}`,
          borderRadius: 14, overflow: 'hidden', background: T.white, transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: hov ? '0 4px 16px rgba(17,17,17,.05)' : '0 1px 3px rgba(0,0,0,.04)' }}
      >
        {/* Cabecera — click abre/cierra detalle */}
        <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.35, fontFamily: T.font, color: T.black }}>{titulo}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {c.consultorioNombre && (
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray5 }}>{c.consultorioNombre}</span>
              )}
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 500, color: T.gray4 }}>{c.fecha || fmtFecha(c.dateCreated)}</span>
                <span style={{ fontSize: 11, color: T.gray5 }}>{fmtRelativa(c.fecha || c.dateCreated)}</span>
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: T.font, color: T.black }}>
              {c.monto != null ? fmtMonto(c.monto) : '—'}
            </div>
            {pendiente
              ? <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d97742', background: '#fff8f0', padding: '3px 8px', borderRadius: 100 }}>Cobro pendiente</span>
              : tipoLabel
                ? <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4, background: T.gray2, padding: '3px 8px', borderRadius: 100 }}>{tipoLabel}</span>
                : null
            }
          </div>
          <div style={{ color: T.gray6, fontSize: 14, marginTop: 2, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', lineHeight: 1 }}>›</div>
        </div>

        {/* Detalle expandible */}
        {open && (
          <div style={{ borderTop: `1px solid ${T.gray7}`, padding: '14px 18px' }}>
            {detalle
              ? <div style={{ fontSize: 14, color: T.gray4, lineHeight: 1.65, fontFamily: T.font }}>{detalle}</div>
              : <div style={{ fontSize: 13, color: T.gray5, fontStyle: 'italic', fontFamily: T.font }}>Sin descripción adicional</div>
            }
            {c.archivos?.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.archivos.map(arch => (
                  <button key={arch.id} onClick={e => { e.stopPropagation(); handleDescargar(arch) }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                      border: `1px solid ${T.gray1}`, borderRadius: 8, background: T.gray2, cursor: 'pointer',
                      fontFamily: T.font, fontSize: 11, color: T.gray4, letterSpacing: '0.04em' }}>
                    📎 {arch.nombre}
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={e => { e.stopPropagation(); onEditar() }}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', border: `1px solid ${T.gray1}`,
                  borderRadius: 100, background: T.white, cursor: 'pointer', fontFamily: T.font, color: T.gray3 }}>
                Editar
              </button>
            </div>
          </div>
        )}
      </div>
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

function SeccionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.gray5, flexShrink: 0 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: T.gray7 }} />
    </div>
  )
}

function SummaryRow({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5, marginBottom: 2 }}>{label}</div>
        <strong style={{ fontFamily: T.font, fontSize: 12, color: T.black, fontWeight: 600 }}>{value}</strong>
      </div>
    </div>
  )
}

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

  const osInp = { height: 'auto', padding: '13px 16px', borderRadius: 10, fontSize: 15, border: '1px solid #e0e0dc' }
  const osLbl = { display: 'block', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 7 }
  const osFld = { marginBottom: '1rem' }

  const BtnAdd = () => (
    <button type="button" onClick={agregar}
      style={{ width: '100%', padding: '0.85rem', border: '1.5px dashed #d0d0cc', borderRadius: 12, background: T.white, fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.gray4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      + Agregar otra obra social
    </button>
  )

  if (lista.length === 0) {
    return <BtnAdd />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {lista.map((os, idx) => (
        <div key={idx} style={{ background: '#fafafa', border: '1px solid #e0e0dc', borderRadius: 12, padding: '1.25rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: idx === 0 ? T.black : T.gray4, fontWeight: idx === 0 ? 600 : 400 }}>
              {idx === 0 ? 'Principal' : `Obra social ${idx + 1}`}
            </span>
            <button type="button" onClick={() => quitar(idx)} title="Quitar"
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#bbb', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: T.font }}>
              ✕
            </button>
          </div>
          <div style={osFld}>
            <label style={osLbl}>Obra social / Prepaga <span style={{ color: '#d97742' }}>*</span></label>
            <ObraSocialSelector apiFetch={apiFetch} value={os.obraSocialId}
              onChange={e => update(idx, { obraSocialId: e.target.value })} />
          </div>
          <div style={osFld}>
            <label style={osLbl}>Nro. de afiliado</label>
            <Input value={os.nroAfiliado} onChange={e => update(idx, { nroAfiliado: e.target.value })} style={osInp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
            <div>
              <label style={osLbl}>Plan</label>
              <Input value={os.plan} onChange={e => update(idx, { plan: e.target.value })} style={osInp} />
            </div>
            <div>
              <label style={osLbl}>Titular</label>
              <Input value={os.titular} onChange={e => update(idx, { titular: e.target.value })} style={osInp} />
            </div>
          </div>
        </div>
      ))}
      {lista.length < 2 && <BtnAdd />}
    </div>
  )
}

/* ─── PacienteFormFields (shared form sections) ──────────────── */

function PacienteFormFields({ form, handleChange, setField, apiFetch }) {
  const fCard  = { background: T.white, border: '1px solid #e0e0dc', borderRadius: 16, padding: '1.75rem', marginBottom: '1.25rem' }
  const fCLbl  = { fontFamily: T.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', marginBottom: '1.5rem', display: 'block' }
  const fLbl   = { display: 'block', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 7 }
  const fFld   = { marginBottom: '1.1rem' }
  const fRow2  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }
  const fRow3  = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }
  const fInp   = { height: 'auto', padding: '13px 16px', borderRadius: 10, fontSize: 15, border: '1px solid #e0e0dc' }
  const fHint  = { fontFamily: T.font, fontSize: 11, color: '#aaa', marginTop: 6 }
  const fAlert = { fontFamily: T.font, fontSize: 11, color: '#e05a4a', fontWeight: 600, marginTop: 6 }

  return (
    <>
      {/* ── Datos personales ── */}
      <div style={fCard}>
        <span style={fCLbl}>Datos personales</span>
        <div style={fRow2}>
          <div>
            <label style={fLbl}>Nombre <span style={{ color: '#d97742' }}>*</span></label>
            <Input required name="nombre" value={form.nombre} onChange={handleChange} style={fInp} placeholder="Juan" />
          </div>
          <div>
            <label style={fLbl}>Apellido <span style={{ color: '#d97742' }}>*</span></label>
            <Input required name="apellido" value={form.apellido} onChange={handleChange} style={fInp} placeholder="López" />
          </div>
        </div>
        <div style={fRow2}>
          <div>
            <label style={fLbl}>DNI</label>
            <Input name="dni" value={form.dni} onChange={handleChange} style={fInp} placeholder="35.123.456" />
          </div>
          <div>
            <label style={fLbl}>Fecha de nacimiento</label>
            <FechaInput name="fechaNac" value={form.fechaNac} onChange={handleChange} style={fInp} max={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
          <div>
            <label style={fLbl}>Ocupación</label>
            <Input name="ocupacion" value={form.ocupacion} onChange={handleChange} style={fInp} placeholder="Técnico en programación" />
          </div>
          <div />
        </div>
      </div>

      {/* ── Contacto ── */}
      <div style={fCard}>
        <span style={fCLbl}>Contacto</span>
        <div style={fRow2}>
          <div style={fFld}>
            <label style={fLbl}>Teléfono / WhatsApp</label>
            <Input name="telefono" value={form.telefono} onChange={handleChange} style={fInp} placeholder="0351 704-4827" />
            <p style={fHint}>Se usa para recordatorios de turno</p>
          </div>
          <div style={fFld}>
            <label style={fLbl}>Email</label>
            <Input type="email" name="email" value={form.email} onChange={handleChange} style={fInp} placeholder="juan@email.com" />
          </div>
        </div>
        <div>
          <label style={fLbl}>Dirección</label>
          <Input name="direccion" value={form.direccion} onChange={handleChange} style={fInp} placeholder="Martín Coronado 2668" />
        </div>
      </div>

      {/* ── Cobertura médica ── */}
      <div style={fCard}>
        <span style={fCLbl}>Cobertura médica</span>
        <ObrasSocialesEditor
          apiFetch={apiFetch}
          lista={form.obrasSociales || []}
          onChange={(nueva) => setField('obrasSociales', nueva)}
        />
      </div>

      {/* ── Datos clínicos ── */}
      <div style={fCard}>
        <span style={fCLbl}>Datos clínicos</span>
        <div style={{ background: '#fafafa', border: '1px solid #f0f0ec', borderRadius: 10, padding: '0.85rem 1.1rem', fontSize: 12, color: '#888', lineHeight: 1.55, marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: T.font }}>
          <span style={{ color: '#d97742', flexShrink: 0 }}>⚠</span>
          <span>Alergias y medicaciones aparecen <strong>destacadas en cada consulta</strong>. Completalas ahora para no olvidarlas.</span>
        </div>
        <div style={fRow3}>
          <div>
            <label style={fLbl}>Grupo sanguíneo</label>
            <Input name="grupoSanguineo" value={form.grupoSanguineo} onChange={handleChange} style={fInp} placeholder="Ej: A+" />
          </div>
          <div>
            <label style={fLbl}>Peso (kg)</label>
            <Input type="number" step="0.1" min="0" name="peso" value={form.peso} onChange={handleChange} style={fInp} placeholder="80" />
          </div>
          <div>
            <label style={fLbl}>Altura (cm)</label>
            <Input type="number" min="0" name="altura" value={form.altura} onChange={handleChange} style={fInp} placeholder="175" />
          </div>
        </div>
        <div style={fFld}>
          <label style={fLbl}>Alergias</label>
          <Input name="alergias" value={form.alergias} onChange={handleChange} style={fInp} placeholder="Ej: Penicilina, ibuprofeno..." />
          <p style={fAlert}>⚠ Esta información se mostrará como alerta en cada consulta</p>
        </div>
        <div style={fFld}>
          <label style={fLbl}>Medicaciones actuales</label>
          <Input name="medicaciones" value={form.medicaciones} onChange={handleChange} style={fInp} placeholder="Ej: Escitalopram 10mg" />
        </div>
        <div style={fFld}>
          <label style={fLbl}>Antecedentes personales</label>
          <Input name="antecedentes" value={form.antecedentes} onChange={handleChange} style={fInp} placeholder="Cirugías, enfermedades crónicas..." />
        </div>
        <div>
          <label style={fLbl}>Antecedentes familiares</label>
          <Input name="antecedentesFamiliares" value={form.antecedentesFamiliares} onChange={handleChange} style={fInp} placeholder="Enfermedades hereditarias relevantes..." />
        </div>
      </div>
    </>
  )
}

/* ─── VistaEditarConsultaDesdeFinanzas ───────────────────────────
 * Puente Finanzas → Movimientos → click en consulta pendiente.
 * Trae la consulta por id y monta VistaNuevaConsulta en modo edición.
 * onVolver siempre lleva de vuelta a Finanzas.
 */
function VistaEditarConsultaDesdeFinanzas({ apiFetch, consultaEditarInicial, usuario, onVolver }) {
  const [consulta,   setConsulta]   = useState(null)
  const [pacienteId, setPacienteId] = useState(null)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!consultaEditarInicial?.consultaId) { onVolver?.(); return }
    let cancelled = false
    apiFetch(`/consultas/${consultaEditarInicial.consultaId}`).then(async res => {
      if (cancelled) return
      if (res?.ok) {
        const data = await res.json()
        setConsulta(data)
        setPacienteId(data.pacienteId ?? consultaEditarInicial.pacienteId)
      } else {
        setError('No se pudo cargar la consulta')
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaEditarInicial?.consultaId])

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <PageBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <BackBtn onClick={onVolver} />
            <PageTitle>Consulta</PageTitle>
          </div>
        </PageBar>
        <div style={{ padding: '4rem', textAlign: 'center', fontSize: 12, color: T.red, fontFamily: T.font }}>{error}</div>
      </div>
    )
  }
  if (!consulta) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
      </div>
    )
  }
  return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteId} onVolver={onVolver} usuario={usuario} consulta={consulta} />
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

/**
 * Mini-ilustración SVG de un reglero para los pasos 2 y 3 del calibrado. Muestra 3 marcas largas
 * separadas por marcas chicas (intermedias en mm) y resalta cuál hay que clickear según `marca`
 * (1 → primera marca larga; 2 → segunda).
 */
function ReglaIlustrativa({ marca = 1 }) {
  const W = 240, H = 56
  const yBase = 38
  // Posiciones X de las 3 marcas largas (centro-izquierda, centro, centro-derecha).
  const xLargas = [40, 120, 200]
  // 4 marcas chicas equidistantes entre cada par de marcas largas.
  const xChicas = []
  for (let g = 0; g < xLargas.length - 1; g++) {
    const start = xLargas[g], end = xLargas[g + 1], step = (end - start) / 5
    for (let i = 1; i <= 4; i++) xChicas.push(start + step * i)
  }
  const xMarcaActiva = marca === 1 ? xLargas[0] : xLargas[1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* Línea base de la regla */}
      <line x1="0" y1={yBase} x2={W} y2={yBase} stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
      {/* Marcas chicas (mm intermedios) */}
      {xChicas.map((x, i) => (
        <line key={`c${i}`} x1={x} y1={yBase} x2={x} y2={yBase - 6} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      ))}
      {/* Marcas largas (cada 10 mm) */}
      {xLargas.map((x, i) => (
        <line key={`l${i}`} x1={x} y1={yBase} x2={x} y2={yBase - 14} stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" />
      ))}
      {/* Indicador "10 mm" entre la 1ª y 2ª marca larga */}
      <line x1={xLargas[0]} y1={yBase + 10} x2={xLargas[1]} y2={yBase + 10} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" markerStart="url(#arrowL)" markerEnd="url(#arrowR)" />
      <text x={(xLargas[0] + xLargas[1]) / 2} y={yBase + 8} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="0.06em">10 MM</text>
      {/* Marca activa: flecha apuntando desde arriba hacia la marca larga (sin tapar la regla). */}
      <polygon
        points={`${xMarcaActiva},${yBase - 17} ${xMarcaActiva - 5},${yBase - 25} ${xMarcaActiva + 5},${yBase - 25}`}
        fill="#fbbf24"
        stroke="#000"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VistaEstudios({ apiFetch, pacienteIdInicial = null, estudioIdInicial = null, onVolver = null }) {
  const isMobile = useIsMobile()
  const demoMode = useContext(DemoContext)
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
  // Trackea la última herramienta seleccionada manualmente desde el toolbar. Sirve para mostrar
  // el banner de instrucciones SOLO cuando el user eligió la herramienta — no en auto-switches
  // internos (ej. calibrar → longitud al terminar).
  const [herramientaUserSelected, setHerramientaUserSelected] = useState(null)
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
      // skipSaveRef = true ANTES del setTrazos([]) — sino el useEffect de autosave dispara
      // primero con trazos=[] y sobreescribe los trazos reales en el back. El ResizeObserver
      // setea skipSaveRef de nuevo cuando inyecta los trazos reales, pero para entonces el
      // back ya recibió el [].
      skipSaveRef.current = true
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

  // ── Demo mode: cuando el user hace "+ Nuevo estudio", auto-cargamos la radiografía
  // preloaded (/demo/estudio.jpg) y saltamos directo al editor. Skip del file picker.
  useEffect(() => {
    if (!demoMode || sub !== 'upload' || subiendo || estudioId) return
    const pacId = pacienteIdInicial ?? pacIdUpload
    if (!pacId) return // sin paciente no arrancamos — el modal de selección se muestra igual
    let cancelado = false
    fetch('/demo/estudio.jpg')
      .then(r => r.blob())
      .then(blob => {
        if (cancelado) return
        const file = new File([blob], 'Radiografia-demo.jpg', { type: blob.type || 'image/jpeg' })
        procesarArchivo(file, 'Estudio demo')
      })
      .catch(() => {})
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, sub, pacIdUpload, pacienteIdInicial])

  // ── Demo mode: si la auto-subida falla (ej. límite alcanzado, el mock devuelve 403)
  // el user quedaba stuck en la pantalla "Nuevo estudio" viendo un error feo. Detectamos
  // el fallo por errSubida y volvemos a la ficha del paciente. El modal global del demo
  // (DemoApp → 'demo-limit') ya le explicó por qué no se pudo.
  useEffect(() => {
    if (!demoMode || !errSubida || !onVolver) return
    const t = setTimeout(() => { setErrSubida(null); onVolver() }, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, errSubida])

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
    skipSaveRef.current = true
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
        dibujarEtiqueta(ctx, `${t.grados.toFixed(1)}°`, t.vx + (r + 35) * Math.cos(midA) - 14, t.vy + (r + 35) * Math.sin(midA) + 5)
      } else if (t.tipo === 'angulo-lineas') {
        ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = 2
        const fa1 = anguloHaciaLinea(t.ix, t.iy, t.a1, t.mid1x, t.mid1y)
        const fa2 = anguloHaciaLinea(t.ix, t.iy, t.a2, t.mid2x, t.mid2y)
        const arm1x = t.ix + 50 * Math.cos(fa1), arm1y = t.iy + 50 * Math.sin(fa1)
        const arm2x = t.ix + 50 * Math.cos(fa2), arm2y = t.iy + 50 * Math.sin(fa2)
        ctx.beginPath(); ctx.arc(t.ix, t.iy, 4, 0, Math.PI * 2); ctx.fill()
        const { midA, r } = dibujarArco(ctx, t.ix, t.iy, arm1x, arm1y, arm2x, arm2y)
        dibujarEtiqueta(ctx, `${t.grados.toFixed(1)}°`, t.ix + (r + 35) * Math.cos(midA) - 14, t.iy + (r + 35) * Math.sin(midA) + 5)
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
    // Helper: oculta el banner cuando se completa la operación. El user puede volver a clickear
    // la herramienta en el toolbar para que reaparezca.
    const completar = () => setHerramientaUserSelected(null)
    if (herramienta === 'punto') { setTrazos(prev => [...prev, { tipo: 'punto', x, y, grosor, color }]); completar() }
    else if (herramienta === 'linea') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'linea', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y, color, grosor }]); setPrimerPunto(null); completar() }
    } else if (herramienta === 'longitud') {
      const idx = lineaCercana(x, y); if (idx === -1) return
      const t = trazos[idx]; const px = Math.hypot(t.x2 - t.x1, t.y2 - t.y1)
      setTrazos(prev => [...prev, { tipo: 'longitud', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, px, mm: px / escala }])
      completar()
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
        completar()
      } else setLineasSel(nuevasSel)
    } else if (herramienta === 'circulo') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { const r = Math.hypot(x-primerPunto.x, y-primerPunto.y); setTrazos(prev => [...prev, { tipo: 'circulo', cx: primerPunto.x, cy: primerPunto.y, rx: x, ry: y, r, color, grosor }]); setPrimerPunto(null); completar() }
    } else if (herramienta === 'cuadrado') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'cuadrado', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y, color, grosor }]); setPrimerPunto(null); completar() }
    } else if (herramienta === 'borrar') {
      const idx = trazoCercanoParaBorrar(x, y, trazos); if (idx === -1) return
      setTrazos(prev => prev.filter((_, i) => i !== idx)); setBorrarHover(-1)
      completar()
    } else if (herramienta === 'calibrar') {
      // Obligamos zoom >= 1.5x antes de aceptar clicks de calibrado — sin zoom, la precisión al
      // marcar las marcas del reglero es pobre y la escala queda inexacta. El banner del paso 1
      // sigue visible hasta que el user ajuste el zoom.
      if (zoom < 1.5) return
      if (!primerPunto) { setPrimerPunto({ x, y }) }
      else {
        const px = Math.hypot(x - primerPunto.x, y - primerPunto.y)
        const nuevaEscala = parseFloat((px / 10).toFixed(4))
        setEscala(nuevaEscala)
        setCalibrado(true)
        setPrimerPunto(null)
        setHerramienta('longitud')
        completar()
        // Persistimos la calibración de inmediato — el autosave debounced sólo escucha
        // cambios de `trazos` y `descripcion`, así que sin este PUT explícito la escala se
        // perdería si el usuario vuelve atrás sin hacer otra acción.
        if (estudioId && canvasRef.current) {
          const canvas = canvasRef.current
          if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
          setEstadoGuardado('guardando')
          apiFetch(`/estudios/${estudioId}`, {
            method: 'PUT',
            body: JSON.stringify({
              trazos: normalizarTrazos(trazos, canvas.width, canvas.height),
              escala: nuevaEscala,
              pacienteId: pacienteIdInicial ?? null,
              descripcion,
            }),
          }).then(res => setEstadoGuardado(res?.ok ? 'guardado' : null))
        }
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
  // Instrucciones contextuales por herramienta + estado. Render como banner destacado arriba del
  // canvas (no como hint chiquito en el toolbar). { titulo, detalle, paso?, total? }.
  const stepInfo = (() => {
    if (herramienta === 'calibrar' && zoom < 1.5 && !primerPunto) return { titulo: 'Calibrá el estudio',     detalle: 'Encontrá el reglero en la imagen y hacé zoom para verlo grande (mínimo 150%). Más zoom = mediciones más precisas.', paso: 1, total: 3 }
    if (herramienta === 'calibrar' && zoom >= 1.5 && !primerPunto) return { titulo: 'Calibrá el estudio',    detalle: 'Hacé click sobre una marca larga del reglero',                                                                       paso: 2, total: 3, calibrarMarca: 1 }
    if (herramienta === 'calibrar' &&  primerPunto)                return { titulo: 'Seguí calibrando',      detalle: 'Hacé click sobre la siguiente marca larga (separada 10 mm)',                                                          paso: 3, total: 3, calibrarMarca: 2 }
    if (herramienta === 'longitud')                  return { titulo: 'Medí una línea',             detalle: 'Hacé click sobre cualquier línea que hayas trazado para medirla' }
    if (herramienta === 'angulo-lineas' && lineasSel.length === 0) return { titulo: 'Medí un ángulo', detalle: 'Hacé click sobre la primera línea',  paso: 1, total: 2 }
    if (herramienta === 'angulo-lineas' && lineasSel.length === 1) return { titulo: 'Medí un ángulo', detalle: 'Hacé click sobre la segunda línea',  paso: 2, total: 2 }
    if (herramienta === 'linea'   &&  primerPunto)   return { titulo: 'Trazá la línea',             detalle: 'Hacé click para fijar el segundo punto',                          paso: 2, total: 2 }
    if (herramienta === 'linea'   && !primerPunto)   return { titulo: 'Trazá una línea',            detalle: 'Hacé click para fijar el primer punto',                           paso: 1, total: 2 }
    if (herramienta === 'circulo' && !primerPunto)   return { titulo: 'Dibujá un círculo',          detalle: 'Hacé click para fijar el centro',                                  paso: 1, total: 2 }
    if (herramienta === 'circulo' &&  primerPunto)   return { titulo: 'Dibujá un círculo',          detalle: 'Hacé click para fijar el radio',                                   paso: 2, total: 2 }
    if (herramienta === 'cuadrado' && !primerPunto)  return { titulo: 'Dibujá un cuadrado',         detalle: 'Hacé click para fijar la primera esquina',                         paso: 1, total: 2 }
    if (herramienta === 'cuadrado' &&  primerPunto)  return { titulo: 'Dibujá un cuadrado',         detalle: 'Hacé click para fijar la esquina opuesta',                         paso: 2, total: 2 }
    if (herramienta === 'borrar')                    return { titulo: 'Borrar trazo',               detalle: 'Hacé click sobre un trazo para eliminarlo' }
    return null
  })()
  const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M3 19 L8 19 L19 8 L14 3 L3 14 Z" fill="white" stroke="#444" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 14 L8 9 L13 14 L8 19 L3 19 Z" fill="#fca5a5" stroke="#444" stroke-width="1.5" stroke-linejoin="round"/></svg>')}") 3 19, crosshair`
  // Lapicito SVG con la punta en (1, 21). Hotspot en la punta para que el trazo arranque exactamente
  // donde el usuario apunta. Fallback a crosshair si el navegador no acepta el url().
  const PENCIL_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M1 21 L4.5 17.5 L4.5 19.5 L2.5 21.5 Z" fill="#1f2937"/><path d="M4.5 17.5 L7 15 L9 17 L6.5 19.5 Z" fill="#fbbf24" stroke="#1f2937" stroke-width="0.6"/><path d="M7 15 L16 6 L18.5 8.5 L9 18 Z" fill="#fcd34d" stroke="#1f2937" stroke-width="0.8" stroke-linejoin="round"/><path d="M16 6 L18 4 L20.5 6.5 L18.5 8.5 Z" fill="#f87171" stroke="#1f2937" stroke-width="0.6" stroke-linejoin="round"/></svg>')}") 1 21, crosshair`
  // Lapicito blanco con contorno oscuro fino — visible sobre fondos claros y oscuros (radiografías).
  // La punta queda en negro sólido para que se note exactamente dónde apunta.
  // Hotspot en (1,21).
  const PENCIL_CURSOR_V2 = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><path d="M1 21 L4.5 17.5 L4.5 19.5 L2.5 21.5 Z" fill="#111827"/><path d="M4.5 17.5 L7 15 L9 17 L6.5 19.5 Z" fill="#ffffff" stroke="#111827" stroke-width="0.7"/><path d="M7 15 L16 6 L18.5 8.5 L9 18 Z" fill="#ffffff" stroke="#111827" stroke-width="0.7" stroke-linejoin="round"/><path d="M16 6 L18 4 L20.5 6.5 L18.5 8.5 Z" fill="#ffffff" stroke="#111827" stroke-width="0.7" stroke-linejoin="round"/></svg>')}") 1 21, crosshair`
  const canvasCursor = herramienta === 'borrar' ? ERASER_CURSOR : (herramienta === 'angulo-lineas' || herramienta === 'longitud') ? (lineaHover !== -1 ? 'pointer' : 'default') : PENCIL_CURSOR_V2

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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
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
              <SideToolBtn active={herramienta === key} onClick={() => { resetInProgress(); setHerramienta(key); setHerramientaUserSelected(key) }}>
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
                  onClick={() => { resetInProgress(); setHerramienta(efectivo); setHerramientaUserSelected(efectivo) }}
                  title={key === 'longitud' && !calibrado ? 'Calibrá primero la imagen' : key === 'calibrar' ? (calibrado ? 'Estudio calibrado · Click para recalibrar' : 'Estudio sin calibrar') : undefined}
                >
                  <Ico />{label}
                  {key === 'longitud' && !calibrado && <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 12, lineHeight: 1 }}>⚠</span>}
                  {key === 'calibrar' && (
                    <span style={{ marginLeft: 'auto', color: calibrado ? '#16a34a' : '#dc2626', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>
                      {calibrado ? '✓' : '✗'}
                    </span>
                  )}
                </SideToolBtn>
                {key === 'calibrar' && calibrado && (
                  <div style={{ padding: '2px 14px 6px 36px', fontSize: 9, fontFamily: T.font, color: T.gray4, letterSpacing: '0.04em' }}>
                    Calibrado en: {escala.toFixed(2)} px/mm
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

        </div>

        {/* Card imagen / canvas — wrapper externo para overlays no-scrolleables */}
        <div style={{ flex: 1, position: 'relative', background: T.black, borderRadius: 12, overflow: 'hidden' }}>
          {/* Banner contextual de instrucción — fijo en la parte superior del canvas, fuera del
              scroll del contenido. Solo aparece si el user seleccionó manualmente la herramienta
              (no en auto-switches internos como calibrar → longitud). */}
          {stepInfo && herramientaUserSelected === herramienta && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              background: 'rgba(17,17,17,0.92)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10, padding: '10px 16px', zIndex: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)', maxWidth: 'calc(100% - 24px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                {stepInfo.paso && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: T.white, color: T.black, fontFamily: T.mono, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {stepInfo.paso}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stepInfo.titulo}
                  </span>
                  <span style={{ fontFamily: T.font, fontSize: 11.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>
                    {stepInfo.detalle}
                  </span>
                </div>
                {stepInfo.total && (
                  <span style={{ fontFamily: T.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', paddingLeft: 4, borderLeft: '1px solid rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}>
                    {stepInfo.paso}/{stepInfo.total}
                  </span>
                )}
              </div>
              {stepInfo.calibrarMarca && (
                <ReglaIlustrativa marca={stepInfo.calibrarMarca} />
              )}
            </div>
          )}
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
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${hov ? T.black : T.gray1}`, background: T.white, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.15s, box-shadow 0.15s', borderRadius: 14, boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' }}
    >
      {/* Izquierda: título + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.black, fontFamily: T.font, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</div>
        <div style={{ marginTop: 5, fontSize: 12, fontFamily: T.font, color: T.gray5 }}>
          {a.cantidadTrazos} {a.cantidadTrazos === 1 ? 'trazo' : 'trazos'}
          {tienePaciente && ` · ${a.pacienteApellido}, ${a.pacienteNombre}`}
        </div>
        {!tienePaciente && onAsignar && (
          <button onClick={e => { e.stopPropagation(); onAsignar() }}
            style={{ marginTop: 6, background: 'none', border: `1px solid ${T.gray1}`, borderRadius: 4, padding: '3px 10px', fontFamily: T.mono, fontSize: 9, color: T.gray4, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            + Asignar paciente
          </button>
        )}
      </div>

      {/* Derecha: fecha + botón eliminar (solo en hover) */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: T.mono, fontSize: 13, color: T.gray5 }}>{fmtFecha(a.lastUpdated || a.dateCreated)}</span>
        {onEliminar && (
          <button onClick={e => { e.stopPropagation(); onEliminar() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.gray6, display: hov ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.gray6}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        )}
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
  PENDIENTE:  { bg: '#fdf8d0', border: '#d4c45a', text: '#6b5c0a' },
  CONFIRMADO: { bg: '#d4f0e0', border: '#7dd8a0', text: '#1a5c38' },
  CANCELADO:  { bg: '#fde8e8', border: '#e8a0a0', text: '#7a1a1a' },
}

const VACÍO_TURNO = {
  pacienteId: '',
  nombrePacienteLibre: '',
  nombreLib: '',
  apellidoLib: '',
  telefonoLib: '',
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
  const [popupTurno, setPopupTurno] = useState(null)
  const [popupPos,   setPopupPos]   = useState({ x: 0, y: 0 })
  const [cancelando, setCancelando] = useState(false)

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
    const esLib = !turno.pacienteId && !!turno.nombrePacienteLibre
    setForm({
      pacienteId:          turno.pacienteId ?? '',
      nombrePacienteLibre: turno.nombrePacienteLibre ?? '',
      nombreLib:           esLib ? (turno.nombrePacienteLibre ?? '') : '',
      apellidoLib:         '',
      telefonoLib:         '',
      consultorioId:       turno.consultorioId ?? '',
      fechaHora:           formatFechaHoraInput(turno.fechaHora),
      duracionMinutos:     turno.duracionMinutos ?? 30,
      motivo:              turno.motivo ?? '',
      estado:              turno.estado ?? 'PENDIENTE',
    })
    setUsarPacienteLib(esLib)
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
    const nombreLibCombinado = usarPacienteLib
      ? [form.apellidoLib.trim(), form.nombreLib.trim()].filter(Boolean).join(', ') || null
      : null
    if (usarPacienteLib && !form.nombreLib.trim()) {
      setFormErr('Ingresá el nombre del paciente'); return
    }
    if (!usarPacienteLib && !form.pacienteId) {
      setFormErr('Seleccioná un paciente'); return
    }
    if (!form.fechaHora) { setFormErr('Ingresá fecha y hora'); return }
    if (!form.consultorioId) { setFormErr('Seleccioná un consultorio'); return }
    setFormErr(null); setGuardando(true)

    const body = {
      pacienteId:          usarPacienteLib ? null : (form.pacienteId ? Number(form.pacienteId) : null),
      nombrePacienteLibre: nombreLibCombinado,
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

  function mostrarPopup(e, t) {
    e.stopPropagation()
    setPopupTurno(t)
    setPopupPos({ x: e.clientX, y: e.clientY })
  }
  function cerrarPopup() { setPopupTurno(null) }
  async function handleConfirmarDesdePopup() {
    if (!popupTurno) return
    setCancelando(true)
    const t = popupTurno
    const body = {
      pacienteId:          t.pacienteId || null,
      nombrePacienteLibre: t.nombrePacienteLibre || null,
      consultorioId:       t.consultorioId || null,
      fechaHora:           t.fechaHora,
      duracionMinutos:     t.duracionMinutos || 30,
      motivo:              t.motivo || null,
      estado:              'CONFIRMADO',
    }
    const res = await apiFetch(`/turnos/${t.id}`, { method: 'PUT', body: JSON.stringify(body) })
    if (res?.ok) { cerrarPopup(); cargarTurnos() }
    setCancelando(false)
  }
  async function handleCancelarDesdePopup() {
    if (!popupTurno) return
    setCancelando(true)
    const t = popupTurno
    const res = await apiFetch(`/turnos/${t.id}`, { method: 'DELETE' })
    if (res?.ok || res?.status === 204) { cerrarPopup(); cargarTurnos() }
    setCancelando(false)
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
    width: '100%', padding: '13px 16px',
    border: '1px solid #e0e0dc', borderRadius: 10,
    fontFamily: T.font, fontSize: 15, color: T.black,
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
    <div onClick={cerrarPopup} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* top bar */}
      <PageBar>
        <PageTitle>Turnos</PageTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {calConectado != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f6f6f4', border: '1px solid #e8e8e4', borderRadius: 100, padding: '5px 14px 5px 10px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src="/google_calendar_icon.png" alt="" style={{ width: 16, height: 16, display: 'block' }} />
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: calConectado ? '#22c55e' : '#ef4444', border: '1.5px solid #f6f6f4' }} />
              </div>
              <span style={{ fontFamily: T.font, fontSize: 12, color: '#666' }}>
                {calConectado ? 'Sincronizado automáticamente' : 'No conectado'}
              </span>
              <button onClick={calConectado ? desconectarCalendar : conectarCalendar}
                style={{ fontFamily: T.font, fontSize: 12, color: calConectado ? '#888' : T.black, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                {calConectado ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          )}
          <Btn onClick={() => abrirNuevoConChequeoCal(new Date())}>+ Nuevo turno</Btn>
        </div>
      </PageBar>

      {/* body: calendar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* toolbar: nav + período + leyenda + vista pills */}
        <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* left: Hoy + arrows + period title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <button onClick={() => {
                if (modoVista === 'mes') setMesAncla(new Date())
                else if (modoVista === 'semana') setRangoInicio(startOfWeek(new Date()))
                else { const d = new Date(); d.setHours(0,0,0,0); setRangoInicio(d) }
              }}
              disabled={esHoyEnVista}
              style={{ background: T.white, border: `1px solid ${T.gray1}`, cursor: esHoyEnVista ? 'default' : 'pointer', height: 34, padding: '0 16px', fontFamily: T.font, fontSize: 13, fontWeight: 500, color: esHoyEnVista ? T.gray3 : T.black, borderRadius: 100, flexShrink: 0 }}>
              Hoy
            </button>
            <button onClick={() => {
                if (modoVista === 'mes') setMesAncla(a => new Date(a.getFullYear(), a.getMonth() - 1, 1))
                else setRangoInicio(s => addDays(s, -cantDiasRango))
              }}
              aria-label="Anterior"
              style={{ background: T.white, border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: T.gray5, flexShrink: 0 }}>
              ‹
            </button>
            <button onClick={() => {
                if (modoVista === 'mes') setMesAncla(a => new Date(a.getFullYear(), a.getMonth() + 1, 1))
                else setRangoInicio(s => addDays(s, cantDiasRango))
              }}
              aria-label="Siguiente"
              style={{ background: T.white, border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: T.gray5, flexShrink: 0 }}>
              ›
            </button>
            <span style={{ fontFamily: T.font, fontSize: 20, color: T.black, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>
              {(() => {
                if (modoVista === 'dia') {
                  const d = diasRango[0] || rangoInicio
                  return `${d.getDate()} de ${MESES_LABEL[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`
                }
                if (modoVista === 'semana') {
                  const d1 = diasRango[0] || rangoInicio
                  return `Semana del ${d1.getDate()} de ${MESES_LABEL[d1.getMonth()].toLowerCase()} de ${d1.getFullYear()}`
                }
                return `${MESES_LABEL[mesAncla.getMonth()]} de ${mesAncla.getFullYear()}`
              })()}
            </span>
          </div>
          {/* right: legend + view pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {[['PENDIENTE','Pendiente'],['CONFIRMADO','Confirmado']].map(([estado, label]) => {
                const col = ESTADO_TURNO_COLORS[estado]
                return (
                  <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.border, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5 }}>{label}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', border: `1px solid ${T.gray1}`, borderRadius: 100, overflow: 'hidden' }}>
              {[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([val, label], i) => {
                const active = modoVista === val
                return (
                  <button key={val} onClick={() => cambiarModoVista(val)}
                    style={{ padding: '0 14px', height: 34, fontFamily: T.font, fontSize: 13, fontWeight: active ? 700 : 400, background: active ? T.black : T.white, color: active ? T.white : T.black, border: 'none', borderLeft: i > 0 ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', transition: 'all .15s' }}>
                    {label}
                  </button>
                )
              })}
            </div>
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
                              onClick={e => mostrarPopup(e, t)}
                              style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 3, padding: '2px 5px', fontSize: 10, color: col.text, fontFamily: T.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', gap: 4, cursor: 'pointer' }}>
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
                              onClick={e => mostrarPopup(e, t)}
                              style={{ position: 'absolute', top, height, ...positioning, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', overflow: 'hidden', zIndex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, boxSizing: 'border-box' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: col.text, fontFamily: T.mono, lineHeight: 1.1, flexShrink: 0 }}>{formatHora(t.fechaHora)}</span>
                              <span style={{ fontSize: 11, color: col.text, fontFamily: T.font, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{t.pacienteApellido || t.nombrePacienteLibre || 'Sin nombre'}</span>
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
      {turnoPopup()}
      {confirmDialog}
    </div>
  )

  function turnoModal() {
    if (!modalOpen) return null
    const mLbl = { display: 'block', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 7 }
    const pacSelec = pacientes.find(p => String(p.id) === String(form.pacienteId))

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 8 : 24 }}
        onClick={cerrarModal}>
        <div style={{ background: T.white, borderRadius: 20, width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(17,17,17,.18)' }}
          onClick={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.75rem', borderBottom: '1px solid #f0f0ec', flexShrink: 0 }}>
            <span style={{ fontFamily: T.font, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em', color: T.black }}>{editId ? 'Editar turno' : 'Nuevo turno'}</span>
            <button type="button" onClick={cerrarModal}
              style={{ width: 32, height: 32, background: '#f6f6f4', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '1.1rem', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* ── Body ── */}
          <form onSubmit={handleGuardar} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Segmented toggle paciente */}
            <div style={{ display: 'flex', border: '1.5px solid #e0e0dc', borderRadius: 10, overflow: 'hidden' }}>
              {[{ val: false, label: 'Paciente registrado' }, { val: true, label: 'Nuevo paciente' }].map(({ val, label }, idx) => {
                const active = usarPacienteLib === val
                return (
                  <button key={label} type="button" onClick={() => setUsarPacienteLib(val)}
                    style={{ flex: 1, padding: '0.78rem 1rem', fontFamily: T.font, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', color: active ? T.white : '#888', background: active ? T.black : T.white, border: 'none', borderRight: idx === 0 ? '1px solid #e0e0dc' : 'none', transition: 'all .15s', userSelect: 'none' }}>
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Paciente registrado */}
            {!usarPacienteLib && (
              <div>
                <label style={mLbl}>Paciente <span style={{ color: '#d97742' }}>*</span></label>
                {pacSelec ? (
                  <div style={{ background: '#f6f6f4', border: '1px solid #e0e0dc', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: T.black, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, fontFamily: T.font }}>
                      {pacSelec.nombre?.[0]}{pacSelec.apellido?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.font, fontSize: '0.92rem', fontWeight: 700, color: T.black }}>{pacSelec.apellido}, {pacSelec.nombre}</div>
                      <div style={{ fontFamily: T.font, fontSize: '0.72rem', color: '#888', marginTop: 2 }}>
                        {[
                          pacSelec.fechaNac && (() => { const e = new Date().getFullYear() - new Date(pacSelec.fechaNac).getFullYear(); return `${e} años` })(),
                          pacSelec.obrasSociales?.[0]?.obraSocialNombre,
                          pacSelec.dni && `DNI ${pacSelec.dni}`,
                        ].filter(Boolean).join(' · ')}
                      </div>
                      {pacSelec.alergias && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef2f0', color: '#e05a4a', fontSize: '0.66rem', fontWeight: 600, padding: '0.22rem 0.55rem', borderRadius: 100, marginTop: '0.35rem', fontFamily: T.font }}>
                          ⚠ Alérgico a {pacSelec.alergias}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, pacienteId: '' }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '1.1rem', lineHeight: 1, padding: 4, flexShrink: 0 }}
                      title="Cambiar paciente">×</button>
                  </div>
                ) : (
                  <PacientePicker
                    pacientes={pacientes}
                    value={form.pacienteId}
                    onChange={id => setForm(f => ({ ...f, pacienteId: id }))}
                  />
                )}
              </div>
            )}

            {/* Nuevo paciente inline */}
            {usarPacienteLib && (
              <div style={{ background: '#fafafa', border: '1px solid #e8e8e4', borderRadius: 12, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ fontFamily: T.font, fontSize: '0.78rem', color: '#888' }}>
                  ℹ Se creará un nuevo paciente al guardar. Podés completar sus datos después.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={mLbl}>Nombre <span style={{ color: '#d97742' }}>*</span></label>
                    <Input value={form.nombreLib} onChange={e => setForm(f => ({ ...f, nombreLib: e.target.value }))} placeholder="Juan" />
                  </div>
                  <div>
                    <label style={mLbl}>Apellido</label>
                    <Input value={form.apellidoLib} onChange={e => setForm(f => ({ ...f, apellidoLib: e.target.value }))} placeholder="López" />
                  </div>
                </div>
                <div>
                  <label style={mLbl}>Teléfono / WhatsApp</label>
                  <Input value={form.telefonoLib} onChange={e => setForm(f => ({ ...f, telefonoLib: e.target.value }))} placeholder="0351 704-4827" />
                </div>
              </div>
            )}

            <div style={{ height: 1, background: '#f0f0ec' }} />

            {/* Fecha + Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={mLbl}>Fecha <span style={{ color: '#d97742' }}>*</span></label>
                <Input type="date" value={(form.fechaHora || '').split('T')[0]} onChange={e => setForm(f => ({ ...f, fechaHora: e.target.value + 'T' + ((f.fechaHora || '').split('T')[1] || '09:00') }))} />
              </div>
              <div>
                <label style={mLbl}>Hora <span style={{ color: '#d97742' }}>*</span></label>
                <Input type="time" value={(form.fechaHora || '').split('T')[1] || ''} onChange={e => setForm(f => ({ ...f, fechaHora: ((f.fechaHora || '').split('T')[0] || '') + 'T' + e.target.value }))} />
              </div>
            </div>

            {/* Duración como pills */}
            <div>
              <label style={mLbl}>Duración</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[30, 45, 60, 90].map(m => {
                  const active = form.duracionMinutos === m
                  return (
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, duracionMinutos: m }))}
                      style={{ padding: '0.55rem 1rem', border: `1.5px solid ${active ? T.black : '#e0e0dc'}`, borderRadius: 100, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: active ? T.white : '#888', background: active ? T.black : T.white, fontFamily: T.font, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                      {m} min
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Consultorio + Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={mLbl}>Consultorio <span style={{ color: '#d97742' }}>*</span></label>
                <select name="consultorioId" value={form.consultorioId} onChange={handleChange} style={selectStyle}>
                  <option value="">Seleccioná...</option>
                  {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={mLbl}>Estado</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[['PENDIENTE', 'Pendiente'], ['CONFIRMADO', 'Confirmado']].map(([val, label]) => {
                    const active = form.estado === val
                    return (
                      <button key={val} type="button" onClick={() => setForm(f => ({ ...f, estado: val }))}
                        style={{ padding: '0.6rem 1.1rem', border: `1.5px solid ${active ? T.black : '#e0e0dc'}`, borderRadius: 100, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', background: active ? T.black : T.white, color: active ? T.white : '#888', fontFamily: T.font, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label style={mLbl}>Motivo del turno</label>
              <Textarea name="motivo" value={form.motivo} onChange={handleChange} style={{ height: 90, resize: 'none' }} placeholder="Ej: Control, Limpieza, Dolor de muela, Primera consulta…" />
            </div>

            {formErr && <ErrorMsg>{formErr}</ErrorMsg>}
          </form>

          {/* ── Footer ── */}
          <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid #f0f0ec', display: 'flex', justifyContent: editId ? 'space-between' : 'flex-end', alignItems: 'center', flexShrink: 0 }}>
            {editId && (
              <button type="button" onClick={handleEliminar} disabled={guardando}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: '0.85rem', fontWeight: 600, color: T.red, padding: 0 }}>
                Eliminar turno
              </button>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={cerrarModal} disabled={guardando}
                style={{ background: T.white, border: '1.5px solid #e0e0dc', borderRadius: 100, padding: '0.82rem 1.5rem', fontFamily: T.font, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', color: '#888', transition: 'all .15s' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleGuardar} disabled={guardando}
                style={{ background: T.black, color: T.white, border: 'none', borderRadius: 100, padding: '0.82rem 2rem', fontFamily: T.font, fontWeight: 700, fontSize: '0.88rem', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1, transition: 'all .15s' }}>
                {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear turno'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function turnoPopup() {
    if (!popupTurno) return null
    const t = popupTurno
    const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
    const iniciales = ((t.pacienteApellido || '')[0] || (t.pacienteNombre || t.nombrePacienteLibre || '')[0] || '?').toUpperCase()
    const PW = 292
    const vw = window.innerWidth, vh = window.innerHeight
    let left = popupPos.x + 16, top = popupPos.y - 16
    if (left + PW > vw - 16) left = popupPos.x - PW - 16
    if (top + 320 > vh - 16) top = vh - 336
    if (top < 8) top = 8
    function Row({ label, children }) {
      return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', minWidth: 50, paddingTop: 2 }}>{label}</span>
          <span style={{ fontFamily: T.font, fontSize: 13, color: T.black, wordBreak: 'break-word' }}>{children}</span>
        </div>
      )
    }
    return (
      <div onClick={cerrarPopup} style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', left, top, width: PW,
          background: T.white, borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e8e8e4',
          padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem',
        }}>
          {/* patient header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.black, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: T.font, flexShrink: 0 }}>
                {iniciales}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePaciente(t)}</div>
                <span style={{ display: 'inline-block', marginTop: 3, padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600, fontFamily: T.font, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{t.estado}</span>
              </div>
            </div>
            <button onClick={cerrarPopup} style={{ width: 26, height: 26, background: '#f6f6f4', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', color: '#888', flexShrink: 0, lineHeight: 1 }}>×</button>
          </div>
          {/* details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Row label="Hora">{formatHora(t.fechaHora)}{t.duracionMinutos ? ` · ${t.duracionMinutos} min` : ''}</Row>
            {t.consultorioNombre && <Row label="Lugar">{t.consultorioNombre}</Row>}
            {t.motivo            && <Row label="Motivo">{t.motivo}</Row>}
          </div>
          {/* actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid #f0f0ec', paddingTop: '0.75rem' }}>
            {t.estado === 'PENDIENTE' && (
              <button onClick={handleConfirmarDesdePopup} disabled={cancelando}
                style={{ width: '100%', padding: '0.6rem 1rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontFamily: T.font, fontWeight: 700, fontSize: 13, cursor: cancelando ? 'default' : 'pointer', textAlign: 'left', opacity: cancelando ? 0.7 : 1 }}>
                {cancelando ? 'Confirmando…' : '✓ Confirmar turno'}
              </button>
            )}
            <button onClick={() => { cerrarPopup(); abrirEditar(t); cargarFormDeps() }}
              style={{ width: '100%', padding: '0.6rem 1rem', background: T.black, color: T.white, border: 'none', borderRadius: 8, fontFamily: T.font, fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
              Editar turno
            </button>
            <button onClick={handleCancelarDesdePopup} disabled={cancelando}
              style={{ width: '100%', padding: '0.6rem 1rem', background: '#fff5f5', color: '#c0392b', border: '1px solid #fde0de', borderRadius: 8, fontFamily: T.font, fontWeight: 600, fontSize: 13, cursor: cancelando ? 'default' : 'pointer', textAlign: 'left', opacity: cancelando ? 0.7 : 1 }}>
              {cancelando ? 'Eliminando…' : t.estado === 'CANCELADO' ? 'Eliminar turno' : 'Cancelar turno'}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

/* ─── helpers ────────────────────────────────────────────────── */

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} type="button"
      style={{ width: 44, height: 44, border: '1px solid #e0e0dc', borderRadius: 12, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: T.gray4, fontFamily: T.font, flexShrink: 0 }}>
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

/* ─── VistaFinanzas ──────────────────────────────────────────── */

const fmtPesos = n => n == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const MESES_LABEL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function mesStr(year, month) {
  return `${String(year)}-${String(month).padStart(2, '0')}`
}

const INGRESO_LIBRE_EMPTY = { descripcion: '', monto: '', tipoPago: 'OTRO', medioPagoId: '', consultorioId: '' }
const EGRESO_EMPTY = { fecha: new Date().toISOString().slice(0, 10), monto: '', descripcion: '', consultorioId: '' }

function VistaFinanzas({ apiFetch, onIrAConsulta, mesInicial, subVistaInicial, onSubVistaConsumida }) {
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
  const [filtroTipo,   setFiltroTipo]   = useState(null)
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
  // Cobros pendientes — nuevo diseño
  const [tabCobros,       setTabCobros]       = useState('os')
  const [pendientesOs,    setPendientesOs]    = useState([])
  const [pendientesPart,  setPendientesPart]  = useState([])
  const [cargandoPendOs,  setCargandoPendOs]  = useState(false)
  const [cargandoPendPart,setCargandoPendPart]= useState(false)
  const [selectedOs,      setSelectedOs]      = useState(new Set())
  const [filtroOsCobros,  setFiltroOsCobros]  = useState('')   // nombre OS
  const [filtroConsCobros,setFiltroConsCobros]= useState('')   // nombre consultorio
  const [formCobroOs,     setFormCobroOs]     = useState({ fecha: new Date().toISOString().slice(0,10), monto: '', medioPagoId: '', descripcion: '' })
  const [guardandoCobroOs,setGuardandoCobroOs]= useState(false)
  const [expandedPart,    setExpandedPart]    = useState(new Set())
  const [formsPart,       setFormsPart]       = useState({})   // { [ingresoId]: { fecha, monto, medioPagoId } }
  const [guardandoPart,   setGuardandoPart]   = useState(new Set())
  // Avisar al parent que ya consumimos el subVistaInicial (para que lo limpie y no se reaplique en próximas visitas).
  useEffect(() => {
    if (subVistaInicial) onSubVistaConsumida?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const { openConfirm, dialog: confirmDialog } = useConfirm()

  async function eliminarMovimiento(m) {
    let mensaje, path
    if (m.origen === 'cobro_os') {
      mensaje = '¿Eliminar este cobro de obra social? Las consultas asociadas van a volver a estado PENDIENTE.'
      path    = `/cobros-os/${m.id}`
    } else if (m.origen === 'egreso') {
      mensaje = '¿Eliminar este egreso? Esta acción no se puede deshacer.'
      path    = `/finanzas/egresos/${m.id}`
    } else {
      mensaje = '¿Eliminar este ingreso? Esta acción no se puede deshacer.'
      path    = `/finanzas/ingresos/${m.id}`
    }
    const ok = await openConfirm(mensaje)
    if (!ok) return
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
    // El gráfico anual ahora vive embebido en la vista dash, así que cargamos las estadísticas
    // en la vista principal y también cuando se abre la sub-vista anual (por si sigue existiendo).
    if (subVista !== 'dash' && subVista !== 'anual') return
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
    // Cargar pendientes para el nuevo diseño
    setCargandoPendOs(true)
    apiFetch('/finanzas/ingresos/pendientes-os').then(async r => {
      if (r?.ok) setPendientesOs(await r.json())
      setCargandoPendOs(false)
    })
    setCargandoPendPart(true)
    apiFetch('/finanzas/ingresos/pendientes-particulares').then(async r => {
      if (r?.ok) setPendientesPart(await r.json())
      setCargandoPendPart(false)
    })
    setSelectedOs(new Set())
    setFiltroOsCobros('')
    setFiltroConsCobros('')
    setExpandedPart(new Set())
    setFormsPart({})
  }, [subVista, cargarCobros, apiFetch])

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
    if (!form.descripcion.trim() || !form.monto || !form.medioPagoId || !form.consultorioId) return
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

  // Variante solo para el gráfico "Ingresos por origen": dentro de cada OS distingue coseguro (cobrado
  // al paciente en el momento de la consulta, origen !== 'cobro_os') de cobro real (el pago que registró
  // la obra social vía "Registrar cobro", que llega como ingreso virtual con origen === 'cobro_os').
  // Ambos comparten tipoPago=OBRA_SOCIAL en los datos, así que la única forma de diferenciarlos sin tocar
  // el modelo es por 'origen' + que haya monto > 0. El widget "Cobros pendientes" NO usa esta variante:
  // ahí solo importa de qué obra social es, no si ya se cobró el coseguro.
  const claveOrigenConCoseguro = i => {
    if (i.tipoPago === 'OBRA_SOCIAL' && i.obraSocialNombre) {
      const esCoseguro = i.origen !== 'cobro_os' && Number(i.monto ?? 0) > 0
      return esCoseguro ? `${i.obraSocialNombre} · Coseguro` : i.obraSocialNombre
    }
    return claveOrigen(i)
  }
  const breakdownOrigen = agrupar(confirmados, claveOrigenConCoseguro)

  // Pendientes agrupados por origen simple (Particular + cada OS) — para el card "Cobros pendientes".
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
    const hoyStr = new Date().toISOString().slice(0, 10)

    // OS tab: filter + group
    const osFiltrados = pendientesOs.filter(p =>
      (!filtroOsCobros   || p.obraSocialNombre  === filtroOsCobros)  &&
      (!filtroConsCobros || p.consultorioNombre  === filtroConsCobros)
    )
    const osGroups = osFiltrados.reduce((acc, p) => {
      const key = p.obraSocialNombre || 'Sin obra social'
      if (!acc[key]) acc[key] = { obraSocialNombre: key, items: [] }
      acc[key].items.push(p)
      return acc
    }, {})
    const osGroupList = Object.values(osGroups)
    const osNombresUniq      = [...new Set(pendientesOs.map(p => p.obraSocialNombre).filter(Boolean))]
    const consNombresUniq    = [...new Set(pendientesOs.map(p => p.consultorioNombre).filter(Boolean))]

    const toggleOsRow = (ingresoId) => {
      setSelectedOs(prev => { const n = new Set(prev); n.has(ingresoId) ? n.delete(ingresoId) : n.add(ingresoId); return n })
    }
    const selectAllOs = () => setSelectedOs(new Set(osFiltrados.map(p => p.ingresoId)))

    async function registrarCobroOs() {
      if (selectedOs.size === 0 || !formCobroOs.fecha || !formCobroOs.monto || !formCobroOs.medioPagoId) return
      setGuardandoCobroOs(true)
      // Group by (obraSocialId, consultorioId) → submit one cobro per group
      const byGroup = {}
      osFiltrados.filter(p => selectedOs.has(p.ingresoId)).forEach(p => {
        const key = `${p.obraSocialNombre}__${p.consultorioId}`
        if (!byGroup[key]) byGroup[key] = { obraSocialNombre: p.obraSocialNombre, consultorioId: p.consultorioId, ids: [] }
        byGroup[key].ids.push(p.ingresoId)
      })
      // Need obraSocialId — find it from obrasSociales list
      const osMap = {}; obrasSociales.forEach(os => { osMap[os.nombre] = os.id })
      const groups = Object.values(byGroup)
      let ok = true
      for (const g of groups) {
        const osId = osMap[g.obraSocialNombre]
        if (!osId || !g.consultorioId) continue
        const res = await apiFetch('/cobros-os', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ obraSocialId: osId, consultorioId: g.consultorioId, fecha: formCobroOs.fecha, montoRecibido: Number(formCobroOs.monto), medioPagoId: Number(formCobroOs.medioPagoId), descripcion: formCobroOs.descripcion || null, ingresoIds: g.ids }),
        })
        if (!res?.ok) { ok = false }
      }
      setGuardandoCobroOs(false)
      if (ok) {
        cargar(); cargarCobros()
        const r1 = await apiFetch('/finanzas/ingresos/pendientes-os')
        if (r1?.ok) setPendientesOs(await r1.json())
        setSelectedOs(new Set())
        setFormCobroOs({ fecha: hoyStr, monto: '', medioPagoId: '', descripcion: '' })
      }
    }

    async function confirmarParticular(ingresoId) {
      const f = formsPart[ingresoId]
      if (!f?.fecha || !f?.monto) return
      setGuardandoPart(prev => new Set(prev).add(ingresoId))
      const res = await apiFetch(`/finanzas/ingresos/${ingresoId}/confirmar-particular`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: f.fecha, monto: Number(f.monto), medioPagoId: f.medioPagoId ? Number(f.medioPagoId) : null }),
      })
      setGuardandoPart(prev => { const n = new Set(prev); n.delete(ingresoId); return n })
      if (res?.ok) {
        cargar()
        const r2 = await apiFetch('/finanzas/ingresos/pendientes-particulares')
        if (r2?.ok) setPendientesPart(await r2.json())
        setExpandedPart(prev => { const n = new Set(prev); n.delete(ingresoId); return n })
      }
    }

    const fmtFechaCorta = (dateStr) => {
      if (!dateStr) return '—'
      const [, mo, d] = dateStr.split('-')
      return `${parseInt(d,10).toString().padStart(2,'0')}/${mo}`
    }

    const selCount = selectedOs.size
    const canRegistrarOs = selCount > 0 && formCobroOs.fecha && formCobroOs.monto && formCobroOs.medioPagoId

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2, position: 'relative' }}>

        {/* Header */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.gray1}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <BackBtn onClick={() => setSubVista('dash')} />
          <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Cobros pendientes</span>
        </div>

        {/* Tabs */}
        <div style={{ background: T.white, borderBottom: `1px solid ${T.gray1}`, padding: '0 24px', display: 'flex', flexShrink: 0 }}>
          {[
            { key: 'os',         label: 'Obra social', count: pendientesOs.length },
            { key: 'particular', label: 'Particular',  count: pendientesPart.length },
          ].map(t => {
            const sel = tabCobros === t.key
            return (
              <button key={t.key} onClick={() => setTabCobros(t.key)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', fontFamily: T.font, fontSize: 14, fontWeight: 600, color: sel ? T.black : T.gray4, borderBottom: sel ? `2px solid ${T.black}` : '2px solid transparent', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7 }}>
                {t.label}
                <span style={{ fontFamily: T.mono, fontSize: 10, background: sel ? T.black : T.gray2, color: sel ? T.white : T.gray4, border: `1px solid ${sel ? T.black : T.gray1}`, borderRadius: 100, padding: '2px 8px' }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 140px' : '24px 24px 140px' }}>

          {/* ── OBRA SOCIAL TAB ── */}
          {tabCobros === 'os' && (
            <div>
              {/* Filter bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' }}>Filtrar por</span>
                <select value={filtroOsCobros} onChange={e => setFiltroOsCobros(e.target.value)}
                  style={{ padding: '8px 28px 8px 14px', border: `1.5px solid ${filtroOsCobros ? T.black : T.gray1}`, borderRadius: 100, fontFamily: T.font, fontSize: 12, background: T.white, outline: 'none', color: T.black, cursor: 'pointer', appearance: 'none' }}>
                  <option value="">Todas las obras sociales</option>
                  {osNombresUniq.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={filtroConsCobros} onChange={e => setFiltroConsCobros(e.target.value)}
                  style={{ padding: '8px 28px 8px 14px', border: `1.5px solid ${filtroConsCobros ? T.black : T.gray1}`, borderRadius: 100, fontFamily: T.font, fontSize: 12, background: T.white, outline: 'none', color: T.black, cursor: 'pointer', appearance: 'none' }}>
                  <option value="">Todos los consultorios</option>
                  {consNombresUniq.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {osFiltrados.length > 0 && (
                  <button onClick={selectAllOs}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.gray4, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    Seleccionar todas
                  </button>
                )}
              </div>

              {cargandoPendOs ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
              ) : osFiltrados.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>No hay cobros de OS pendientes</div>
              ) : (
                osGroupList.map(group => (
                  <div key={group.obraSocialNombre} style={{ marginBottom: 24 }}>
                    {/* Group header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', marginBottom: 10, borderBottom: `1px solid #e8e8e4` }}>
                      <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700 }}>{group.obraSocialNombre}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 10, background: '#f0f4f9', color: '#4a7ab0', border: '1px solid #ccdaec', borderRadius: 100, padding: '3px 10px' }}>Obra social</span>
                      <span style={{ fontFamily: T.font, fontSize: 12, color: '#aaa', marginLeft: 'auto' }}>{group.items.length} consulta{group.items.length !== 1 ? 's' : ''} pendiente{group.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    {/* Rows */}
                    {group.items.map(p => {
                      const sel = selectedOs.has(p.ingresoId)
                      return (
                        <div key={p.ingresoId} onClick={() => toggleOsRow(p.ingresoId)}
                          style={{ background: sel ? '#fafafa' : T.white, border: `1.5px solid ${sel ? T.black : '#e0e0dc'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none', transition: 'all 0.12s' }}>
                          {/* Checkbox */}
                          <div style={{ width: 22, height: 22, border: `2px solid ${sel ? T.black : '#d0d0cc'}`, borderRadius: 6, background: sel ? T.black : T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
                            {sel && <span style={{ color: T.white, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{p.pacienteApellido}, {p.pacienteNombre}</div>
                            {p.descripcion && <div style={{ fontFamily: T.font, fontSize: 12, color: '#555', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</div>}
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {p.fecha && <span style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{fmtFechaCorta(p.fecha?.toString ? p.fecha.toString() : String(p.fecha))}</span>}
                              {p.consultorioNombre && <span style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.consultorioNombre}</span>}
                            </div>
                          </div>
                          {/* Coseguro */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {p.monto != null && Number(p.monto) > 0
                              ? <span style={{ fontFamily: T.mono, fontSize: 11, background: '#d4f0e0', color: '#1a6b3a', border: '1px solid #a8dcc0', borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap' }}>coseguro {fmtPesos(p.monto)}</span>
                              : <span style={{ fontFamily: T.font, fontSize: 12, color: '#ccc' }}>Sin coseguro</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── PARTICULAR TAB ── */}
          {tabCobros === 'particular' && (
            <div>
              <div style={{ background: '#fff8f0', border: '1px solid #f0e0cc', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#b07030', lineHeight: 1.55, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>⚡</span>
                <span>Estas consultas quedaron pendientes de cobro. Expandí cada una para registrar el pago cuando lo recibas.</span>
              </div>

              {cargandoPendPart ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
              ) : pendientesPart.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>No hay cobros particulares pendientes</div>
              ) : (
                pendientesPart.map(p => {
                  const isOpen = expandedPart.has(p.ingresoId)
                  const f = formsPart[p.ingresoId] ?? {}
                  const isGuardando = guardandoPart.has(p.ingresoId)
                  const canGuardar = f.fecha && f.monto && !isGuardando
                  const fechaStr = p.fecha ? String(p.fecha) : ''
                  const [fy, fm, fd] = fechaStr.split('-')
                  const fechaFmt = fechaStr ? `${fd}/${fm}/${fy}` : '—'
                  return (
                    <div key={p.ingresoId} style={{ background: T.white, border: `1.5px solid ${isOpen ? T.black : '#e0e0dc'}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
                      {/* Head */}
                      <div onClick={() => {
                        setExpandedPart(prev => { const n = new Set(prev); n.has(p.ingresoId) ? n.delete(p.ingresoId) : n.add(p.ingresoId); return n })
                        setFormsPart(prev => prev[p.ingresoId] ? prev : { ...prev, [p.ingresoId]: { fecha: hoyStr, monto: p.monto != null ? String(p.monto) : '', medioPagoId: '' } })
                      }}
                        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{p.pacienteApellido}, {p.pacienteNombre}</div>
                          {p.descripcion && <div style={{ fontFamily: T.font, fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.descripcion}{p.consultorioNombre ? ` · ${p.consultorioNombre}` : ''}</div>}
                          <div style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{fechaFmt}</div>
                        </div>
                        <div style={{ textAlign: 'right', marginRight: 8 }}>
                          <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700 }}>{fmtPesos(p.monto)}</div>
                          <div style={{ fontFamily: T.font, fontSize: 11, color: '#d97742', fontWeight: 600, marginTop: 2 }}>Monto original</div>
                        </div>
                        <span style={{ color: '#ccc', fontSize: 14, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', display: 'inline-block' }}>›</span>
                      </div>
                      {/* Body */}
                      {isOpen && (
                        <div onClick={e => e.stopPropagation()} style={{ padding: '16px 18px', borderTop: `1px solid #f0f0ec`, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Fecha del cobro *</label>
                              <FechaInput value={f.fecha ?? ''}
                                onChange={e => setFormsPart(prev => ({ ...prev, [p.ingresoId]: { ...prev[p.ingresoId], fecha: e.target.value } }))}
                                style={{ padding: '10px 12px', borderRadius: 9, fontSize: 14 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Monto cobrado *</label>
                              <MontoInput value={f.monto ?? ''}
                                onChange={e => setFormsPart(prev => ({ ...prev, [p.ingresoId]: { ...prev[p.ingresoId], monto: e.target.value } }))}
                                style={{ padding: '10px 12px', borderRadius: 9, fontSize: 14 }} />
                              {p.monto != null && <span style={{ fontFamily: T.font, fontSize: 11, color: '#aaa' }}>Pre-cargado con <strong style={{ color: '#d97742' }}>{fmtPesos(p.monto)}</strong> · podés modificarlo</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Medio de pago</label>
                              <select value={f.medioPagoId ?? ''}
                                onChange={e => setFormsPart(prev => ({ ...prev, [p.ingresoId]: { ...prev[p.ingresoId], medioPagoId: e.target.value } }))}
                                style={{ padding: '10px 12px', border: '1.5px solid #e0e0dc', borderRadius: 9, fontFamily: T.font, fontSize: 14, background: T.white, outline: 'none', color: f.medioPagoId ? T.black : T.gray4, cursor: 'pointer', appearance: 'none' }}>
                                <option value="">Seleccionar…</option>
                                {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                              </select>
                            </div>
                          </div>
                          <button onClick={() => confirmarParticular(p.ingresoId)} disabled={!canGuardar}
                            style={{ background: canGuardar ? T.black : '#d0d0cc', color: T.white, border: 'none', borderRadius: 100, padding: '10px 22px', fontFamily: T.font, fontWeight: 700, fontSize: 14, cursor: canGuardar ? 'pointer' : 'not-allowed', alignSelf: 'flex-end' }}>
                            {isGuardando ? 'Registrando…' : 'Registrar cobro'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ── Sticky footer OS (aparece cuando hay seleccionados) ── */}
        {tabCobros === 'os' && selCount > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: T.white, borderTop: `1px solid ${T.gray1}`, padding: '16px 24px', zIndex: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'start', maxWidth: 1200 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ visibility: 'hidden', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em' }}>&nbsp;</span>
                <div>
                  <span style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{selCount} consulta{selCount !== 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, marginLeft: 5 }}>seleccionada{selCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Fecha del cobro *</label>
                <FechaInput value={formCobroOs.fecha}
                  onChange={e => setFormCobroOs(f => ({ ...f, fecha: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 9, fontSize: 14, height: 40 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Monto recibido *</label>
                <MontoInput value={formCobroOs.monto}
                  onChange={e => setFormCobroOs(f => ({ ...f, monto: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 9, fontSize: 14, height: 40 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Medio de pago *</label>
                <select value={formCobroOs.medioPagoId}
                  onChange={e => setFormCobroOs(f => ({ ...f, medioPagoId: e.target.value }))}
                  style={{ padding: '10px 12px', border: `1.5px solid ${T.gray1}`, borderRadius: 9, fontFamily: T.font, fontSize: 14, background: T.white, outline: 'none', color: formCobroOs.medioPagoId ? T.black : T.gray5, boxSizing: 'border-box', height: 40, appearance: 'none' }}>
                  <option value="" disabled>Seleccionar…</option>
                  {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Descripción (opcional)</label>
                <input type="text" value={formCobroOs.descripcion}
                  onChange={e => setFormCobroOs(f => ({ ...f, descripcion: e.target.value }))}
                  style={{ padding: '10px 12px', border: `1.5px solid ${T.gray1}`, borderRadius: 9, fontFamily: T.font, fontSize: 14, background: T.white, outline: 'none', color: T.black, boxSizing: 'border-box', height: 40 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ visibility: 'hidden', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em' }}>&nbsp;</span>
                <button onClick={registrarCobroOs} disabled={!canRegistrarOs}
                  style={{ background: canRegistrarOs ? T.black : '#d0d0cc', color: T.white, border: 'none', borderRadius: 100, padding: '0 22px', height: 40, fontFamily: T.font, fontWeight: 700, fontSize: 14, cursor: canRegistrarOs ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                  {guardandoCobroOs ? 'Registrando…' : `Registrar cobro · ${selCount} consulta${selCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
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
    // Group movements by date (already sorted desc from backend); skip pending rows
    const movGroups = (() => {
      const groups = []
      let cur = null
      for (const m of movs.filter(m => m.tipo !== 'pendiente')) {
        if (!cur || cur.fecha !== m.fecha) {
          cur = { fecha: m.fecha, items: [] }
          groups.push(cur)
        }
        cur.items.push(m)
      }
      return groups
    })()

    const fmtGrupoFecha = (fechaStr) => {
      if (!fechaStr) return '—'
      const [, mo, d] = fechaStr.split('-')
      return `${parseInt(d, 10)} de ${MESES_LABEL[parseInt(mo, 10) - 1].toLowerCase()}`
    }

    const movIconStyle = (m) => {
      if (m.origen === 'egreso') return { bg: '#fde8e8', color: '#9a2020' }
      if (m.origen === 'consulta') return { bg: '#d4f0e0', color: '#1a6b3a' }
      return { bg: '#e8f0fe', color: '#1a56b0' }
    }
    const movIcon = (m) => m.origen === 'egreso' ? '↓' : '↑'

    const movBadge = (m) => {
      if (m.origen === 'consulta') return { label: 'Consulta',       bg: '#d4f0e0', color: '#1a6b3a' }
      if (m.origen === 'cobro_os') return { label: 'Cobro OS',       bg: '#e8f0fe', color: '#1a56b0' }
      if (m.origen === 'egreso')   return { label: 'Egreso',         bg: '#fde8e8', color: '#9a2020' }
      return                              { label: 'Ingreso manual',  bg: '#e8f0fe', color: '#1a56b0' }
    }

    const movTipoTexto = (m) => {
      if (m.origen === 'egreso' || m.origen === 'cobro_os') return null
      const base = m.obraSocialNombre ?? 'Particular'
      return m.medioPagoNombre ? `${base} · ${m.medioPagoNombre}` : base
    }

    const movAmountStyle = (m) => {
      if (m.tipo === 'egreso') return '#e05a4a'
      if (m.tipo === 'pendiente') return '#b45309'
      return '#1a7a40'
    }

    const movAmountText = (m) => {
      if (m.tipo === 'pendiente' && m.monto == null) return 'Cobro pend.'
      const signo = m.tipo === 'egreso' ? '−' : m.tipo === 'pendiente' ? '≈' : '+'
      return `${signo} ${fmtPesos(m.monto)}`
    }

    // Eliminables: egresos, ingresos manuales ("libre") y cobros de OS (que además revierten los
    // ingresos asociados a PENDIENTE). Las filas de origen "consulta" no se eliminan desde acá
    // — para eso hay que ir a la consulta.
    const esEliminable = (m) => m.id != null && m.origen !== 'consulta'

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
        <PageBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackBtn onClick={() => setSubVista('dash')} />
            <div>
              <span style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Movimientos</span>
              <span style={{ fontFamily: T.font, fontSize: 17, fontWeight: 300, color: T.gray4, letterSpacing: '-0.02em' }}> · {MESES_LABEL[mes - 1]} {año}</span>
            </div>
          </div>
        </PageBar>
        <div style={{ flex: 1, overflow: 'hidden', padding: isMobile ? '12px 16px 16px' : '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>

          {/* ── Toolbar (mobile: input arriba, filtros+count abajo) ── */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 10, marginBottom: 20, flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: isMobile ? 'none' : 1, maxWidth: isMobile ? 'none' : 400, width: '100%' }}>
              <span style={{ position: 'absolute', left: 12, color: '#bbb', fontSize: 15, lineHeight: 1, pointerEvents: 'none' }}>⌕</span>
              <input value={buscarMov} onChange={e => setBuscarMov(e.target.value)} placeholder="Buscar por paciente o descripción…"
                style={{ width: '100%', padding: '10px 14px 10px 36px', border: `1px solid ${T.gray1}`, borderRadius: 10, fontFamily: T.font, fontSize: 13, background: T.white, outline: 'none', color: T.black, letterSpacing: '0.02em', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isMobile ? 'space-between' : 'flex-start', flex: isMobile ? 'none' : 'initial' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: null,      label: 'Todos' },
                  { key: 'ingreso', label: 'Ingresos' },
                  { key: 'egreso',  label: 'Egresos' },
                ].map(({ key, label }) => {
                  const sel = filtroTipo === key
                  return (
                    <button key={key ?? 'todos'} onClick={() => setFiltroTipo(key)}
                      style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, background: sel ? T.black : T.white, color: sel ? T.white : T.gray4, border: `1.5px solid ${sel ? T.black : T.gray1}`, borderRadius: 100, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                      {label}
                    </button>
                  )
                })}
              </div>
              {metaMov && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gray4, letterSpacing: '0.06em', marginLeft: isMobile ? 0 : 'auto', whiteSpace: 'nowrap' }}>{metaMov.totalElements} movimientos</span>}
            </div>
          </div>

          {/* ── List ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cargandoMovs ? (
              <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
            ) : movGroups.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscarMov ? 'Sin resultados' : 'Sin movimientos'}</div>
            ) : (
              <div>
                {movGroups.map(group => (
                  <div key={group.fecha} style={{ marginBottom: 20 }}>
                    {/* Date label with extending line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtGrupoFecha(group.fecha)}</span>
                      <div style={{ flex: 1, height: 1, background: '#e8e8e4' }} />
                    </div>
                    {/* Rows */}
                    {group.items.map((m, idx) => {
                      const iconSt  = movIconStyle(m)
                      const badge   = movBadge(m)
                      const tipoTxt = movTipoTexto(m)
                      const eliminable = esEliminable(m)
                      const irAConsulta = m.tipo === 'pendiente' && m.origen === 'consulta' && m.consultaId != null && onIrAConsulta
                      return (
                        <div key={idx}
                          onClick={irAConsulta ? () => onIrAConsulta(m.consultaId, m.pacienteId) : undefined}
                          style={{ background: T.white, border: `1px solid #e0e0dc`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, cursor: irAConsulta ? 'pointer' : 'default' }}>
                          {/* Icon */}
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconSt.bg, color: iconSt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {movIcon(m)}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                              {m.descripcion}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: T.mono, fontSize: 9, padding: '2px 8px', borderRadius: 100, background: badge.bg, color: badge.color, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
                                {badge.label}
                              </span>
                              {tipoTxt && (
                                <span style={{ fontFamily: T.mono, fontSize: 10, color: '#aaa', letterSpacing: '0.06em' }}>{tipoTxt}</span>
                              )}
                              {m.consultorioNombre && (
                                <span style={{ fontFamily: T.mono, fontSize: 10, color: '#bbb', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.consultorioNombre}</span>
                              )}
                            </div>
                          </div>
                          {/* Amount */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: movAmountStyle(m), whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                              {movAmountText(m)}
                            </span>
                            {eliminable && (
                              <button onClick={e => { e.stopPropagation(); eliminarMovimiento(m) }}
                                title={`Eliminar ${m.origen === 'egreso' ? 'egreso' : m.origen === 'cobro_os' ? 'cobro' : 'ingreso'}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.gray3, display: 'flex', alignItems: 'center', opacity: 0.5 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#e05a4a'; e.currentTarget.style.opacity = 1 }}
                                onMouseLeave={e => { e.currentTarget.style.color = T.gray3; e.currentTarget.style.opacity = 0.5 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {!cargandoMovs && !metaMov?.last && movs.length > 0 && (
                  <div style={{ padding: '8px 0 16px', display: 'flex', justifyContent: 'center' }}>
                    <Btn variant="outline" onClick={() => cargarMovs(buscarMov, (metaMov?.number ?? 0) + 1)} disabled={cargandoMasMov}>
                      {cargandoMasMov ? 'Cargando…' : 'Cargar más'}
                    </Btn>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        {confirmDialog}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: T.gray2 }}>

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

      {/* ── HERO: Card negro grande con el balance del mes + CTAs + variación ── */}
      {(() => {
        const balance      = totalConfirmadosNum - totalEgresosNum
        const variacionPct = resumen?.variacionPct
        const mesAntNombre = MESES_LABEL[(mes - 2 + 12) % 12].toLowerCase()
        const positivo     = variacionPct != null && variacionPct >= 0
        return (
          <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 12px', flexShrink: 0 }}>
            <div style={{
              background: T.black, borderRadius: 16, padding: isMobile ? '22px 22px' : '30px 34px',
              display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start',
              gap: isMobile ? 20 : 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  Balance del mes · Ingreso − Egreso
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: T.font, fontSize: isMobile ? 36 : 56, fontWeight: 300, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.02em', lineHeight: 1 }}>$</span>
                  <span style={{ fontFamily: T.font, fontSize: isMobile ? 42 : 64, fontWeight: 800, color: T.white, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {cargando ? '—' : fmtPesos(balance).replace('$', '').trim()}
                  </span>
                </div>
                {variacionPct != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: positivo ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)',
                      color: positivo ? '#4ade80' : '#f87171',
                      padding: '5px 12px', borderRadius: 100,
                      fontFamily: T.font, fontSize: 12, fontWeight: 700,
                    }}>
                      {positivo ? '↑' : '↓'} {Math.abs(variacionPct).toFixed(0)}%
                    </span>
                    <span style={{ fontFamily: T.font, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      vs {mesAntNombre}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, minWidth: isMobile ? 'auto' : 130 }}>
                <button onClick={() => setModal(true)}
                  style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, background: T.white, color: T.black, border: 'none', borderRadius: 100, padding: '0 22px', height: 40, cursor: 'pointer', letterSpacing: '-0.005em', whiteSpace: 'nowrap' }}>
                  + Ingreso
                </button>
                <button onClick={() => setModalEgreso(true)}
                  style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, background: 'transparent', color: T.white, border: '1px solid rgba(255,255,255,0.35)', borderRadius: 100, padding: '0 22px', height: 40, cursor: 'pointer', letterSpacing: '-0.005em', whiteSpace: 'nowrap' }}>
                  + Egreso
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── 3 KPIs secundarios en cards blancos ── */}
      <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Ingreso cobrado',   value: totalConfirmadosNum, sub: 'cobrado del mes',   variacion: 'auto' },
            { label: 'Egreso',            value: totalEgresosNum,     sub: 'del mes',           color: totalEgresosNum > 0 ? '#dc2626' : T.black },
            { label: 'Consulta promedio', value: ticketPromedioNum,   sub: 'por consulta cobrada', color: T.black, allowNull: true },
          ].map(kpi => {
            const val = kpi.value
            const esNull = val == null
            const partes = esNull ? { entero: '—', dec: '' } : (() => {
              const s = fmtPesos(val).replace('$', '').trim()
              return { entero: s, dec: '' }
            })()
            const mostrarVarIngreso = kpi.variacion === 'auto' && resumen?.variacionPct != null && resumen.variacionPct >= 0
            return (
              <div key={kpi.label} style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray4 }}>{kpi.label}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: T.font, fontSize: 22, fontWeight: 400, color: T.gray4, letterSpacing: '-0.02em', lineHeight: 1 }}>$</span>
                  <span style={{ fontFamily: T.font, fontSize: 28, fontWeight: 800, color: kpi.color ?? T.black, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {cargando ? '—' : partes.entero}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4 }}>{kpi.sub}</span>
                  {mostrarVarIngreso && (
                    <span style={{ fontFamily: T.font, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>↑ vs {MESES_LABEL[(mes - 2 + 12) % 12].toLowerCase()}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Widget Cobros pendientes + CTA "Ver todos los movimientos" ──
             Grid 2fr / 1fr en desktop (card izq con la data + CTA negra a la derecha).
             En mobile stackea: card arriba, CTA abajo. ── */}
      <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)', gap: 12, alignItems: 'stretch' }}>
          {/* Card izquierda: Cobros pendientes */}
          {!cargando && pendientes.length === 0 ? (
            <div style={{ background: T.white, border: '1px solid #e0e0dc', borderLeft: '4px solid #e0e0dc', borderRadius: 16, padding: isMobile ? '18px 20px' : '22px 26px', display: 'flex', alignItems: 'flex-start', gap: '1.4rem', opacity: 0.6 }}>
              <span style={{ fontFamily: T.font, fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#ccc', flexShrink: 0, minWidth: 44 }}>0</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: '#aaa', marginBottom: '0.25rem' }}>Sin cobros pendientes</div>
                <div style={{ fontFamily: T.mono, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb' }}>Todo al día ✓</div>
              </div>
            </div>
          ) : (
            <button onClick={() => setSubVista('cobros')}
              onMouseEnter={e => { if (obrasSociales.length > 0) { e.currentTarget.style.boxShadow = '0 4px 20px rgba(17,17,17,.07)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              style={{ all: 'unset', width: '100%', boxSizing: 'border-box', cursor: obrasSociales.length === 0 ? 'default' : 'pointer', background: T.white, border: '1px solid #e0e0dc', borderLeft: '4px solid #d97742', borderRadius: 16, padding: isMobile ? '18px 20px' : '22px 26px', display: 'flex', alignItems: 'flex-start', gap: '1.4rem', transition: 'all .15s' }}>
              <span style={{ fontFamily: T.font, fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: cargando ? '#ccc' : T.black, flexShrink: 0, minWidth: 44 }}>
                {cargando ? '—' : pendientes.length}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, marginBottom: '0.35rem' }}>Cobros pendientes</div>
                <div style={{ fontFamily: T.mono, fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: !cargando && breakdownPendientes.length > 0 ? '0.85rem' : 0 }}>
                  {MESES_LABEL[mes - 1]} {año} · solo este mes
                </div>
                {!cargando && breakdownPendientes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {breakdownPendientes.map(([key, val], i) => {
                      const paleta = ['#4a90d9', '#5baee0', '#7ec2e8', '#2e7fd6', '#3b6ea8']
                      const color = key === 'Particular' ? '#111' : paleta[i % paleta.length]
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 3, background: color, flexShrink: 0 }} />
                          <span style={{ fontFamily: T.font, fontSize: '0.88rem', fontWeight: 700, color: '#111' }}>{val.cantidad}</span>
                          <span style={{ fontFamily: T.font, fontSize: '0.85rem', color: '#555' }}>{key}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <span style={{ color: '#ccc', fontSize: '1.3rem', marginTop: '0.2rem', flexShrink: 0 }}>→</span>
            </button>
          )}

          {/* Card derecha: CTA "Ver todos los movimientos" — negra, misma altura */}
          <button onClick={() => setSubVista('movimientos')}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.20)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)' }}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', background: T.black, color: T.white, borderRadius: 16, padding: isMobile ? '18px 20px' : '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.10)', transition: 'all .15s', minHeight: isMobile ? 'auto' : 140 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                Detalle del mes
              </div>
              <div style={{ fontFamily: T.font, fontSize: isMobile ? 18 : 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Ver todos los<br />movimientos
              </div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.5 }}>
                Ingresos, cobros y egresos, con búsqueda y filtros.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
              Abrir <span style={{ fontSize: 16 }}>→</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Breakdowns por origen y medio de pago (donuts con total arriba a la derecha) ── */}
      <div style={{ padding: isMobile ? '0 16px 12px' : '0 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          {[
            { titulo: 'Ingresos por origen',  items: breakdownOrigen },
            { titulo: 'Por medio de pago',    items: breakdownMp     },
          ].map(({ titulo, items }) => {
            const total = items.reduce((s, [, v]) => s + v.total, 0)
            return (
              <div key={titulo} style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 200 }}>
                <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>{titulo}</span>
                  <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.01em' }}>{cargando ? '—' : fmtPesos(total)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, width: '100%' }}>
                  {cargando && <div style={{ padding: '0 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                  {!cargando && items.length === 0 && <EmptyChart />}
                  {!cargando && items.length > 0 && <PieChart items={items} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Gráfico anual: siempre últimos 12 meses, independiente del selector de mes ── */}
      <div style={{ padding: isMobile ? '0 16px 20px' : '0 24px 20px', flexShrink: 0 }}>
        <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: isMobile ? '16px 18px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>Evolución anual · Ingresos</span>
            <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, letterSpacing: '-0.005em' }}>Últimos 12 meses · no depende del selector de mes</span>
          </div>
          {cargandoAnual ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : (
            <DashBarChart datos={estAnuales} isMobile={isMobile} titulo="" valorField="ingresosTotales" resumenTipo="suma" />
          )}
        </div>
      </div>

      {/* El CTA "Ver todos los movimientos" se movió arriba, al lado del widget de
          Cobros pendientes. En mobile, dejamos algo de padding al pie para respirar. */}
      {isMobile && <div style={{ height: 80, flexShrink: 0 }} />}

      {/* ── modal ingreso libre ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
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
              <MontoInput value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                     style={{ fontSize: 13, borderRadius: 8, padding: '8px 12px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Medio de pago *</label>
              <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))}
                      style={{ fontFamily: T.font, fontSize: 13, border: `1px solid ${T.gray1}`, borderRadius: 8, padding: '8px 12px', outline: 'none', color: T.black, background: T.white }}>
                <option value="">Seleccionar…</option>
                {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
              </select>
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
              <button onClick={guardarIngresoLibre} disabled={guardando || !form.descripcion.trim() || !form.monto || !form.medioPagoId || !form.consultorioId}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, background: T.black, color: T.white, border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', opacity: (guardando || !form.descripcion.trim() || !form.monto || !form.medioPagoId || !form.consultorioId) ? 0.5 : 1 }}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal egreso ── */}
      {modalEgreso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
             onClick={e => e.target === e.currentTarget && setModalEgreso(false)}>
          <div style={{ background: T.white, borderRadius: 16, width: 'min(400px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <span style={{ fontFamily: T.font, fontSize: 16, fontWeight: 700, color: T.black, letterSpacing: '-0.02em' }}>Nuevo egreso</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Fecha *</label>
                <FechaInput value={formEgreso.fecha} onChange={e => setFormEgreso(f => ({ ...f, fecha: e.target.value }))}
                       style={{ fontSize: 13, borderRadius: 8, padding: '8px 12px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>Monto *</label>
                <MontoInput value={formEgreso.monto} onChange={e => setFormEgreso(f => ({ ...f, monto: e.target.value }))}
                       style={{ fontSize: 13, borderRadius: 8, padding: '8px 12px' }} />
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
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

  const puedeGuardar = form.obraSocialId && form.consultorioId && form.fecha && form.montoRecibido && form.medioPagoId && seleccionados.size > 0 && !guardando

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
        medioPagoId:   Number(form.medioPagoId),
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
                  <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Obra social *</label>
                  <select value={form.obraSocialId} onChange={e => setForm(f => ({ ...f, obraSocialId: e.target.value }))}
                    style={{ width: '100%', marginTop: 7, fontFamily: T.font, fontSize: 15, border: '1px solid #e0e0dc', borderRadius: 10, padding: '13px 16px', outline: 'none', color: form.obraSocialId ? T.black : T.gray5, background: T.white, boxSizing: 'border-box', appearance: 'none' }}>
                    <option value="">Seleccionar…</option>
                    {obrasSociales.map(os => <option key={os.id} value={os.id}>{os.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Consultorio *</label>
                  <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))}
                    style={{ width: '100%', marginTop: 7, fontFamily: T.font, fontSize: 15, border: '1px solid #e0e0dc', borderRadius: 10, padding: '13px 16px', outline: 'none', color: form.consultorioId ? T.black : T.gray5, background: T.white, boxSizing: 'border-box', appearance: 'none' }}>
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
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Fecha *</label>
                    <FechaInput value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                      style={{ marginTop: 7, fontSize: 15, borderRadius: 10, padding: '13px 16px' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Monto *</label>
                    <MontoInput value={form.montoRecibido}
                      onChange={e => setForm(f => ({ ...f, montoRecibido: e.target.value }))}
                      style={{ marginTop: 7, fontSize: 15, borderRadius: 10, padding: '13px 16px' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Medio *</label>
                    <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))} required
                      style={{ width: '100%', marginTop: 7, fontFamily: T.font, fontSize: 15, border: '1px solid #e0e0dc', borderRadius: 10, padding: '13px 16px', outline: 'none', color: form.medioPagoId ? T.black : T.gray5, background: T.white, boxSizing: 'border-box', appearance: 'none' }}>
                      <option value="" disabled>Seleccionar…</option>
                      {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                    <label style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999' }}>Notas</label>
                    <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: comprobante 1234"
                      style={{ width: '100%', marginTop: 7, fontFamily: T.font, fontSize: 15, border: '1px solid #e0e0dc', borderRadius: 10, padding: '13px 16px', outline: 'none', color: T.black, boxSizing: 'border-box' }} />
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
