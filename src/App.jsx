import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, LayoutList, LayoutGrid, Users, ScanLine, ClipboardList, Building2 } from 'lucide-react'
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

const RADIOS_PUNTO = { 1: 2, 2: 4, 3: 7 }
const GROSOR_LINEA = 2
const COLOR_PUNTO  = '#ff3333'
const COLOR_LINEA  = '#2563eb'
const COLOR_ANGULO = '#ffffff'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

/* ─── design tokens (VendeConIA) ─────────────────────────────── */
const T = {
  font:    'Inter, sans-serif',
  serif:   "'Playfair Display', serif",
  black:   '#000',
  white:   '#fff',
  gray1:   '#e8e8e8',   // borders, inputs
  gray2:   '#f5f5f5',   // hover rows, secondary bg
  gray3:   '#999',      // muted text, inactive nav
  gray4:   '#555',      // secondary text
  gray5:   '#bbb',      // placeholder, very muted
  gray6:   '#ccc',      // disabled
  gray7:   '#f0f0f0',   // lightest dividers
  red:     '#cc0000',   // destructive
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
    const u = { nombre: data.nombre, apellido: data.apellido, email: data.email, perfilCompleto: data.perfilCompleto !== false, foto: data.foto || null }
    localStorage.setItem('so_token', data.token)
    localStorage.setItem('so_usuario', JSON.stringify(u))
    setToken(data.token); setUsuario(u)
  }

  function handleLogout() {
    localStorage.removeItem('so_token'); localStorage.removeItem('so_usuario')
    setToken(null); setUsuario(null)
  }

  if (!token) return <VistaLogin onLogin={handleLogin} />
  if (!usuario?.perfilCompleto) return <VistaCompletarPerfil token={token} onLogin={handleLogin} onLogout={handleLogout} />
  return <MainLayout token={token} usuario={usuario} onLogout={handleLogout} />
}

/* ─── MainLayout ─────────────────────────────────────────────── */

const NAV_ITEMS = [
  { key: 'dashboard',      label: 'Mis finanzas'      },
  { key: 'pacientes',      label: 'Mis pacientes'     },
  { key: 'analisis',       label: 'Análisis'          },
  { key: 'consultas',       label: 'Consultas'         },
  { key: 'obras-sociales', label: 'Mis obras sociales'},
  { key: 'consultorios',   label: 'Mis consultorios'  },
]

function MainLayout({ token, usuario, onLogout }) {
  const [vista, setVista] = useState('dashboard')

  const apiFetch = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}`, ...opts.headers },
    })
    if (res.status === 401) { onLogout(); return null }
    return res
  }, [token, onLogout])

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.white, overflow: 'hidden' }}>

      {/* ── global header ── */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${T.black}`, flexShrink: 0, background: T.white, zIndex: 10 }}>
        <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, letterSpacing: '0.15em', color: T.black, textTransform: 'uppercase' }}>
          SimpleOdonto
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usuario?.foto && <img src={usuario.foto} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
          <span style={{ fontFamily: T.font, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4 }}>
            {usuario?.nombre} {usuario?.apellido}
          </span>
        </div>
      </header>

      {/* ── body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* sidebar */}
        <aside style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.gray1}`, background: T.white }}>
          <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
            {NAV_ITEMS.map(({ key, label }) => (
              <NavItem key={key} label={label} active={vista === key} onClick={() => setVista(key)} />
            ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.gray7}` }}>
            <Btn variant="outline" size="sm" fullWidth onClick={onLogout}>Cerrar sesión</Btn>
          </div>
        </aside>

        {/* main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {vista === 'dashboard'      && <VistaDashboard usuario={usuario} />}
          {vista === 'pacientes'      && <VistaPacientes apiFetch={apiFetch} />}
          {vista === 'analisis'       && <VistaAnalisis apiFetch={apiFetch} />}
          {vista === 'consultas'      && <VistaConsultas apiFetch={apiFetch} />}
          {vista === 'obras-sociales' && <VistaObrasSociales apiFetch={apiFetch} />}
          {vista === 'consultorios'   && <VistaConsultorios apiFetch={apiFetch} />}
        </main>
      </div>
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
        display: 'block', width: '100%', textAlign: 'left',
        padding: '10px 20px',
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        fontFamily: T.font, fontWeight: active ? 500 : 400,
        border: 'none',
        borderLeft: active ? `1px solid ${T.black}` : '1px solid transparent',
        background: 'none',
        color: active ? T.black : hov ? T.black : T.gray3,
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
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
        fontSize: fs, fontFamily: T.font, fontWeight: 500,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        background: disabled ? T.gray2 : s.bg,
        color: disabled ? T.gray3 : s.color,
        border: `1px solid ${disabled ? T.gray1 : s.border}`,
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
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 10, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
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
        boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
        transition: 'border-color 0.15s',
        ...extraStyle,
      }}
    />
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 10, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4, display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{ margin: '0 0 16px', fontSize: 10, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray3, borderBottom: `1px solid ${T.gray1}`, paddingBottom: 8 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: 52, borderBottom: `1px solid ${T.black}`, flexShrink: 0, gap: 12 }}>
      {children}
    </div>
  )
}

function PageTitle({ children }) {
  return (
    <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, letterSpacing: '0.05em', color: T.black, flex: 1, textTransform: 'uppercase' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, flexShrink: 0 }}>
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
        width, zIndex: 50,
        background: T.white,
        borderLeft: `1px solid ${T.gray1}`,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : `translateX(${width}px)`,
        transition: 'transform 0.3s ease',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 500, color: T.black }}>{title}</span>
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

/* ─── table components ───────────────────────────────────────── */

function TableHead({ cols, extraCol = true }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${cols.map(c => c.w || '1fr').join(' ')}${extraCol ? ' 40px' : ''}`, padding: '0 24px', height: 40, alignItems: 'center', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
      {cols.map(c => (
        <span key={c.label} style={{ fontSize: 10, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3 }}>{c.label}</span>
      ))}
      {extraCol && <span />}
    </div>
  )
}

/* ─── VistaLogin ─────────────────────────────────────────────── */

const FEATURES = [
  { icon: Users,         label: 'Pacientes y odontogramas'              },
  { icon: ScanLine,      label: 'Análisis de imágenes radiográficas'    },
  { icon: ClipboardList, label: 'Historia clínica y consultas'          },
  { icon: Building2,     label: 'Obras sociales y consultorios'         },
]

function VistaLogin({ onLogin }) {
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  async function handleGoogleSuccess(credentialResponse) {
    setError(null); setCargando(true)
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      const res = await fetch(`${API_URL}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: credentialResponse.credential }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión con Google'); return }
      onLogin({ ...data, foto: payload.picture })
    } catch { setError('No se pudo conectar con el servidor') }
    finally { setCargando(false) }
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.white }}>
      <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, letterSpacing: '0.18em', color: T.black, textTransform: 'uppercase', marginBottom: 8 }}>
        SimpleOdonto
      </span>
      <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.gray5, marginBottom: 52 }}>
        Gestión odontológica profesional
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon size={15} color={T.gray4} strokeWidth={1.5} />
            <span style={{ fontSize: 12, letterSpacing: '0.06em', color: T.gray4, fontFamily: T.font }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {cargando
          ? <span style={{ fontSize: 12, color: T.gray5, fontFamily: T.font, letterSpacing: '0.08em' }}>Cargando…</span>
          : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Error al iniciar sesión con Google')} locale="es" text="signin_with" />
        }
        <ErrorMsg>{error}</ErrorMsg>
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
    fetch(`${API_URL}/especialidades`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setEspecialidades(data) : [])
      .catch(() => {})
  }, [])

  function handleChange(e) { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setCargando(true)
    try {
      const res = await fetch(`${API_URL}/auth/completar-perfil`, {
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

  const selectStyle = { height: 36, width: '100%', padding: '0 12px', border: '1px solid #e5e5e5', outline: 'none', background: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#111', boxSizing: 'border-box', cursor: 'pointer', appearance: 'none' }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, letterSpacing: '0.18em', color: '#111', textTransform: 'uppercase', marginBottom: 8 }}>
        SimpleOdonto
      </span>
      <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 48 }}>
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

function VistaDashboard({ usuario }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, letterSpacing: '0.06em', color: T.black, marginBottom: 8 }}>
        Bienvenido/a, {usuario?.nombre}
      </span>
      <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>
        Mis finanzas — en construcción
      </span>
    </div>
  )
}

/* ─── VistaPlaceholder ───────────────────────────────────────── */

function VistaPlaceholder({ titulo }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontFamily: T.serif, fontSize: 18, color: T.black }}>{titulo}</span>
      <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Próximamente</span>
    </div>
  )
}

/* ─── VistaConsultorios ──────────────────────────────────────── */

const COLS_CONSULT = [{ label: 'Nombre', w: '1fr' }, { label: 'Dirección', w: '1.5fr' }]

function VistaConsultorios({ apiFetch }) {
  const [items,     setItems]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [form,      setForm]      = useState({ nombre: '', direccion: '' })
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [vista,     setVista]     = useState(() => localStorage.getItem('consultorios-vista') ?? 'list')

  function toggleVista(v) { setVista(v); localStorage.setItem('consultorios-vista', v) }

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch('/consultorios')
    if (!res) return
    if (res.ok) setItems(await res.json())
    else setError('Error al cargar consultorios')
    setCargando(false)
  }, [apiFetch])

  useEffect(() => { cargar() }, [cargar])

  function cerrarPanel() { setPanelOpen(false); setForm({ nombre: '', direccion: '' }); setFormErr(null) }

  async function handleGuardar(e) {
    e.preventDefault(); setFormErr(null); setGuardando(true)
    const res = await apiFetch('/consultorios', { method: 'POST', body: JSON.stringify({ nombre: form.nombre, direccion: form.direccion || null }) })
    if (!res) return
    if (res.ok) { cerrarPanel(); cargar() }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este consultorio?')) return
    const res = await apiFetch(`/consultorios/${id}`, { method: 'DELETE' })
    if (res && res.ok) cargar()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <PageTitle>Mis consultorios</PageTitle>
        <Btn onClick={() => setPanelOpen(true)}>+ Agregar</Btn>
      </PageBar>

      <FilterBar>
        <ViewToggle vista={vista} onToggle={toggleVista} />
      </FilterBar>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {vista === 'list' ? (
          <>
            <TableHead cols={COLS_CONSULT} />
            <EmptyOrError cargando={cargando} error={error} empty={items.length === 0} msg="No hay consultorios registrados" />
            {items.map(item => (
              <FilaSimple key={item.id} cols={[item.nombre, item.direccion || '—']} gridCols="1fr 1.5fr" onEliminar={() => handleEliminar(item.id)} />
            ))}
          </>
        ) : (
          cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>No hay consultorios registrados</div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
              {items.map(item => (
                <ConsultorioCard key={item.id} item={item} onEliminar={() => handleEliminar(item.id)} />
              ))}
            </div>
          )
        )}
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title="Nuevo consultorio" width={420}
        footer={<>
          <Btn variant="outline" onClick={cerrarPanel} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
        </>}
      >
        <form onSubmit={handleGuardar} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><FieldLabel>Nombre *</FieldLabel><Input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} /></div>
          <div><FieldLabel>Dirección</FieldLabel><Input value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} /></div>
          <ErrorMsg>{formErr}</ErrorMsg>
        </form>
      </SidePanel>
    </div>
  )
}

function ConsultorioCard({ item, onEliminar }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: 200, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', transition: 'border-color 0.15s', minHeight: 80 }}
    >
      <button
        onClick={onEliminar}
        style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: T.gray5, lineHeight: 1, padding: 0, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = T.black}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >×</button>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.black, paddingRight: 16, lineHeight: 1.4, fontFamily: T.font }}>
        {item.nombre}
      </div>
      {item.direccion && (
        <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, lineHeight: 1.4 }}>{item.direccion}</div>
      )}
    </div>
  )
}

/* ─── VistaObrasSociales ─────────────────────────────────────── */

const COLS_OS = [{ label: 'Nombre', w: '1fr' }]

function VistaObrasSociales({ apiFetch }) {
  const [items,     setItems]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [nombre,    setNombre]    = useState('')
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [buscar,    setBuscar]    = useState('')
  const [vista,     setVista]     = useState(() => localStorage.getItem('obras-sociales-vista') ?? 'list')

  function toggleVista(v) { setVista(v); localStorage.setItem('obras-sociales-vista', v) }

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch('/obras-sociales')
    if (!res) return
    if (res.ok) setItems(await res.json())
    else setError('Error al cargar obras sociales')
    setCargando(false)
  }, [apiFetch])

  useEffect(() => { cargar() }, [cargar])

  function cerrarPanel() { setPanelOpen(false); setNombre(''); setFormErr(null) }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setFormErr('El nombre es requerido'); return }
    setFormErr(null); setGuardando(true)
    const res = await apiFetch('/obras-sociales', { method: 'POST', body: JSON.stringify({ nombre: nombre.trim() }) })
    if (!res) return
    if (res.ok) { cerrarPanel(); cargar() }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar esta obra social?')) return
    const res = await apiFetch(`/obras-sociales/${id}`, { method: 'DELETE' })
    if (res && res.ok) cargar()
  }

  const filtradas = buscar.trim()
    ? items.filter(i => i.nombre.toLowerCase().includes(buscar.toLowerCase()))
    : items

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <PageTitle>Mis obras sociales</PageTitle>
        <Btn onClick={() => setPanelOpen(true)}>+ Nueva obra social</Btn>
      </PageBar>

      <FilterBar>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, flex: 1, maxWidth: 320 }}>
          <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
          <input
            value={buscar} onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar obra social…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
          />
        </div>
        <ViewToggle vista={vista} onToggle={toggleVista} />
      </FilterBar>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {vista === 'list' ? (
          <>
            <TableHead cols={COLS_OS} />
            <EmptyOrError cargando={cargando} error={error} empty={filtradas.length === 0} msg={buscar ? 'Sin resultados' : 'No hay obras sociales registradas'} />
            {filtradas.map(item => (
              <FilaSimple key={item.id} cols={[item.nombre]} gridCols="1fr" onEliminar={() => handleEliminar(item.id)} />
            ))}
          </>
        ) : (
          cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscar ? 'Sin resultados' : 'No hay obras sociales registradas'}</div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
              {filtradas.map(item => (
                <ObraSocialCard key={item.id} item={item} onEliminar={() => handleEliminar(item.id)} />
              ))}
            </div>
          )
        )}
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title="Nueva obra social" width={380}
        footer={<>
          <Btn variant="outline" onClick={cerrarPanel} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
        </>}
      >
        <form onSubmit={handleGuardar} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel>Nombre *</FieldLabel>
            <Input required value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGuardar(e)} />
          </div>
          <ErrorMsg>{formErr}</ErrorMsg>
        </form>
      </SidePanel>
    </div>
  )
}

function ObraSocialCard({ item, onEliminar }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: 160, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', transition: 'border-color 0.15s', minHeight: 80 }}
    >
      <button
        onClick={onEliminar}
        style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: T.gray5, lineHeight: 1, padding: 0, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = T.black}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >×</button>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.black, paddingRight: 16, lineHeight: 1.4, fontFamily: T.font }}>
        {item.nombre}
      </div>
    </div>
  )
}

function FilaSimple({ cols, gridCols, onEliminar }) {
  const [hov, setHov] = useState(false)
  const [hovT, setHovT] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: `${gridCols} 40px`, padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, transition: 'background 0.1s' }}
    >
      {cols.map((val, i) => (
        <span key={i} style={{ fontFamily: T.font, fontSize: 13, fontWeight: i === 0 ? 500 : 400, color: i === 0 ? T.black : T.gray4, letterSpacing: '0.02em' }}>{val}</span>
      ))}
      <button onClick={onEliminar} onMouseEnter={() => setHovT(true)} onMouseLeave={() => setHovT(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovT ? T.red : T.gray6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>
        ✕
      </button>
    </div>
  )
}

/* ─── EmptyOrError ───────────────────────────────────────────── */

function EmptyOrError({ cargando, error, empty, msg }) {
  if (cargando) return <div style={{ padding: '3rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
  if (error)    return <div style={{ padding: '2rem 24px', fontSize: 13, color: T.red, fontFamily: T.font }}>{error}</div>
  if (empty)    return <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msg}</div>
  return null
}

/* ─── VistaPacientes ─────────────────────────────────────────── */

const VACÍO_FORM = { apellido: '', nombre: '', dni: '', fechaNac: '', telefono: '', email: '', direccion: '', obraSocial: '', nroAfiliado: '' }
const COLS_PAC = [{ label: 'Paciente', w: '2fr' }, { label: 'DNI', w: '1fr' }, { label: 'Teléfono', w: '1fr' }, { label: 'Obra social', w: '1.5fr' }, { label: 'Registrado', w: '1fr' }]

function VistaPacientes({ apiFetch }) {
  const [sub,              setSub]              = useState('lista')
  const [pacienteId,       setPacienteId]       = useState(null)
  const [analisisIdAbierto, setAnalisisIdAbierto] = useState(null)

  function abrirDetalle(id)          { setPacienteId(id); setSub('detalle') }
  function volver()                  { setSub('lista'); setPacienteId(null) }
  function volverADetalle()          { setSub('detalle') }
  function abrirNuevoAnalisis()      { setAnalisisIdAbierto(null); setSub('analisis') }
  function abrirAnalisisExistente(id){ setAnalisisIdAbierto(id);   setSub('analisis') }

  if (sub === 'lista')    return <ListaPacientes apiFetch={apiFetch} onDetalle={abrirDetalle} />
  if (sub === 'detalle')  return <DetallePaciente apiFetch={apiFetch} id={pacienteId} onVolver={volver} onNuevoAnalisis={abrirNuevoAnalisis} onAbrirAnalisis={abrirAnalisisExistente} />
  if (sub === 'analisis') return <VistaAnalisis apiFetch={apiFetch} pacienteIdInicial={pacienteId} analisisIdInicial={analisisIdAbierto} onVolver={volverADetalle} />
  return null
}

function ListaPacientes({ apiFetch, onDetalle }) {
  const [buscar,    setBuscar]    = useState('')
  const [pagina,    setPagina]    = useState(null)
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [form,      setForm]      = useState(VACÍO_FORM)
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [vista,     setVista]     = useState(() => localStorage.getItem('pacientes-vista') ?? 'list')

  function toggleVista(v) { setVista(v); localStorage.setItem('pacientes-vista', v) }

  const cargar = useCallback(async (q) => {
    setCargando(true); setError(null)
    const params = new URLSearchParams({ size: 50, sort: 'apellido,asc' })
    if (q) params.set('buscar', q)
    const res = await apiFetch(`/pacientes?${params}`)
    if (!res) return
    if (res.ok) setPagina(await res.json())
    else setError('Error al cargar pacientes')
    setCargando(false)
  }, [apiFetch])

  useEffect(() => {
    const t = setTimeout(() => cargar(buscar), buscar ? 350 : 0)
    return () => clearTimeout(t)
  }, [buscar, cargar])

  function cerrarPanel() { setPanelOpen(false); setForm(VACÍO_FORM); setFormErr(null) }

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.apellido.trim() || !form.nombre.trim()) { setFormErr('Apellido y nombre son requeridos'); return }
    setFormErr(null); setGuardando(true)
    const body = { nombre: form.nombre, apellido: form.apellido, dni: form.dni || null, fechaNac: form.fechaNac || null, telefono: form.telefono || null, email: form.email || null, direccion: form.direccion || null, obraSocial: form.obraSocial || null, nroAfiliado: form.nroAfiliado || null }
    const res = await apiFetch('/pacientes', { method: 'POST', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { const d = await res.json(); cerrarPanel(); onDetalle(d.id) }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al registrar'); setGuardando(false) }
  }

  const pacientes = pagina?.content ?? []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <PageTitle>Mis pacientes</PageTitle>
        <Btn onClick={() => setPanelOpen(true)}>+ Nuevo paciente</Btn>
      </PageBar>

      <FilterBar>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, flex: 1, maxWidth: 320 }}>
          <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
          <input
            value={buscar} onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o DNI…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
          />
        </div>
        <ViewToggle vista={vista} onToggle={toggleVista} />
      </FilterBar>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {vista === 'list' ? (
          <>
            <TableHead cols={COLS_PAC} />
            <EmptyOrError cargando={cargando && !pagina} error={error} empty={!cargando && !error && pacientes.length === 0} msg={buscar ? 'Sin resultados' : 'No hay pacientes registrados'} />
            {pacientes.map(p => <FilaPaciente key={p.id} paciente={p} onClick={() => onDetalle(p.id)} onEliminar={() => cargar(buscar)} apiFetch={apiFetch} />)}
          </>
        ) : (
          cargando && !pagina ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : !cargando && pacientes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscar ? 'Sin resultados' : 'No hay pacientes registrados'}</div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
              {pacientes.map(p => (
                <PacienteCard key={p.id} paciente={p} onClick={() => onDetalle(p.id)} onEliminar={() => cargar(buscar)} apiFetch={apiFetch} />
              ))}
            </div>
          )
        )}
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title="Nuevo paciente" width={560}
        footer={<>
          <Btn variant="outline" onClick={cerrarPanel} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleCrear} disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar paciente'}</Btn>
        </>}
      >
        <form onSubmit={handleCrear} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PacienteFormFields form={form} handleChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))} setField={(name, val) => setForm(p => ({ ...p, [name]: val }))} apiFetch={apiFetch} />
          <ErrorMsg>{formErr}</ErrorMsg>
        </form>
      </SidePanel>
    </div>
  )
}

function PacienteCard({ paciente: p, onClick, onEliminar, apiFetch }) {
  const [hov, setHov] = useState(false)

  async function handleEliminar(e) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar a ${p.apellido}, ${p.nombre}?`)) return
    const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
    if (res && res.ok) onEliminar()
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ width: 200, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', transition: 'border-color 0.15s', cursor: 'pointer', minHeight: 100 }}
    >
      <button
        onClick={handleEliminar}
        style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: T.gray5, lineHeight: 1, padding: 0, transition: 'color 0.15s', zIndex: 1 }}
        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = T.black }}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >×</button>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.black, paddingRight: 18, lineHeight: 1.4, fontFamily: T.font }}>
        {p.apellido}, {p.nombre}
      </div>
      {p.dni && <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font }}>DNI {p.dni}</div>}
      {p.telefono && <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font }}>{p.telefono}</div>}
      {p.obraSocial && <div style={{ fontSize: 10, color: T.gray3, fontFamily: T.font, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.obraSocial}</div>}
    </div>
  )
}

function FilaPaciente({ paciente: p, onClick, onEliminar, apiFetch }) {
  const [hov,  setHov]  = useState(false)
  const [hovT, setHovT] = useState(false)

  async function handleEliminar(e) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar a ${p.apellido}, ${p.nombre}?`)) return
    const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
    if (res && res.ok) onEliminar()
  }

  return (
    <div
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr 40px', padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, cursor: 'pointer', transition: 'background 0.1s' }}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{p.apellido}, {p.nombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.dni || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.telefono || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4 }}>{p.obraSocial || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{fmtFecha(p.dateCreated)}</span>
      <button onClick={handleEliminar} onMouseEnter={e => { e.stopPropagation(); setHovT(true) }} onMouseLeave={() => setHovT(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: hovT ? T.red : T.gray6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}>
        ✕
      </button>
    </div>
  )
}

/* ─── DetallePaciente ────────────────────────────────────────── */

const VACÍO_CO_DET = { consultorioId: '', motivoConsulta: '', practicaRealizada: '', monto: '', tipoPago: 'PARTICULAR' }

function DetallePaciente({ apiFetch, id, onVolver, onNuevoAnalisis, onAbrirAnalisis }) {
  const [paciente,        setPaciente]        = useState(null)
  const [cargando,        setCargando]        = useState(true)
  const [error,           setError]           = useState(null)
  const [panelEdit,       setPanelEdit]       = useState(false)
  const [formEdit,        setFormEdit]        = useState(VACÍO_FORM)
  const [guardando,       setGuardando]       = useState(false)
  const [editErr,         setEditErr]         = useState(null)
  const [consultas,       setConsultas]       = useState([])
  const [cargandoCO,      setCargandoCO]      = useState(true)
  const [panelNuevaCO,    setPanelNuevaCO]    = useState(false)
  const [formCO,          setFormCO]          = useState(VACÍO_CO_DET)
  const [guardandoCO,     setGuardandoCO]     = useState(false)
  const [errCO,           setErrCO]           = useState(null)
  const [consultorios,    setConsultorios]    = useState([])
  const [analisisList,    setAnalisisList]    = useState([])
  const [cargandoAnal,    setCargandoAnal]    = useState(true)
  const [tab,             setTab]             = useState('historia')

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

  const cargarAnalisisPaciente = useCallback(async () => {
    setCargandoAnal(true)
    const res = await apiFetch(`/analisis/paciente/${id}`)
    if (res?.ok) setAnalisisList(await res.json())
    setCargandoAnal(false)
  }, [apiFetch, id])

  async function handleEliminarAnalisis(analisisId) {
    if (!confirm('¿Eliminar este análisis?')) return
    await apiFetch(`/analisis/${analisisId}`, { method: 'DELETE' })
    cargarAnalisisPaciente()
  }

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { cargarConsultas() }, [cargarConsultas])
  useEffect(() => { cargarAnalisisPaciente() }, [cargarAnalisisPaciente])

  function abrirNuevaCO() {
    setFormCO(VACÍO_CO_DET); setErrCO(null)
    apiFetch('/consultorios').then(r => r?.ok && r.json().then(setConsultorios))
    setPanelNuevaCO(true)
  }

  async function handleGuardarCO(e) {
    e.preventDefault()
    if (!formCO.monto || isNaN(Number(formCO.monto))) { setErrCO('Ingresá un monto válido'); return }
    setErrCO(null); setGuardandoCO(true)
    const body = {
      pacienteId:        Number(id),
      consultorioId:     formCO.consultorioId ? Number(formCO.consultorioId) : null,
      motivoConsulta:    formCO.motivoConsulta   || null,
      practicaRealizada: formCO.practicaRealizada || null,
      monto:             Number(formCO.monto),
      tipoPago:          formCO.tipoPago,
    }
    const res = await apiFetch('/consultas', { method: 'POST', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { setPanelNuevaCO(false); setFormCO(VACÍO_CO_DET); cargarConsultas() }
    else { const err = await res.json().catch(() => null); setErrCO(err?.error || 'Error al guardar') }
    setGuardandoCO(false)
  }

  function abrirEdit() {
    if (!paciente) return
    setFormEdit({
      apellido: paciente.apellido ?? '', nombre: paciente.nombre ?? '', dni: paciente.dni ?? '',
      fechaNac: paciente.fechaNac ?? '', telefono: paciente.telefono ?? '', email: paciente.email ?? '',
      direccion: paciente.direccion ?? '', obraSocial: paciente.obraSocial ?? '',
      nroAfiliado: paciente.nroAfiliado ?? '',
    })
    setEditErr(null)
    setPanelEdit(true)
  }

  async function handleGuardarEdit(e) {
    e.preventDefault(); setEditErr(null); setGuardando(true)
    const body = { nombre: formEdit.nombre, apellido: formEdit.apellido, dni: formEdit.dni || null, fechaNac: formEdit.fechaNac || null, telefono: formEdit.telefono || null, email: formEdit.email || null, direccion: formEdit.direccion || null, obraSocial: formEdit.obraSocial || null, nroAfiliado: formEdit.nroAfiliado || null }
    const res = await apiFetch(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { setPanelEdit(false); cargar() }
    else { const err = await res.json().catch(() => null); setEditErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  if (cargando) return <Cargando />
  if (error)    return <ErrorScreen msg={error} onVolver={onVolver} />

  const p = paciente

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── header: nav + card pane ── */}
      <div style={{ flexShrink: 0, background: T.gray2, borderBottom: `1px solid ${T.gray1}` }}>

        {/* barra nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px' }}>
          <BackBtn onClick={onVolver} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="outline" onClick={onNuevoAnalisis}>+ Nuevo análisis</Btn>
            <Btn onClick={abrirNuevaCO}>+ Nueva consulta</Btn>
          </div>
        </div>

        {/* card pane */}
        <div style={{ margin: '0 24px 20px', background: T.white, border: `1px solid ${T.gray1}`, display: 'flex', overflow: 'hidden' }}>

          {/* avatar */}
          <div style={{ width: 88, flexShrink: 0, background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.serif, fontSize: 22, color: T.white, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {p.nombre?.[0]}{p.apellido?.[0]}
            </span>
          </div>

          {/* datos */}
          <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* nombre + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 400, color: T.black, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                {p.apellido}, {p.nombre}
              </span>
              <Badge variant="outline">Activo</Badge>
            </div>

            <div style={{ height: 1, background: T.gray1 }} />

            {/* campos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 36px' }}>
              {[
                { label: 'DNI',          value: p.dni },
                { label: 'Nacimiento',   value: p.fechaNac ? fmtFecha(p.fechaNac) : null },
                { label: 'Teléfono',     value: p.telefono },
                { label: 'Email',        value: p.email },
                { label: 'Dirección',    value: p.direccion },
                { label: 'Obra social',  value: p.obraSocial },
                { label: 'Nro afiliado', value: p.nroAfiliado },
              ].map(({ label, value }) => value ? (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 9, fontFamily: T.font, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5 }}>{label}</span>
                  <span style={{ fontSize: 12, fontFamily: T.font, color: T.black }}>{value}</span>
                </div>
              ) : null)}
            </div>

          </div>

          {/* fecha de registro + editar */}
          <div style={{ width: 120, flexShrink: 0, borderLeft: `1px solid ${T.gray1}`, background: T.gray2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 9, fontFamily: T.font, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5 }}>Registrado</span>
              <span style={{ fontSize: 11, fontFamily: T.font, color: T.black, textAlign: 'center', letterSpacing: '0.04em' }}>{fmtFecha(p.dateCreated)}</span>
            </div>
            <Btn variant="outline" size="sm" onClick={abrirEdit}>Editar</Btn>
          </div>

        </div>
      </div>

      {/* ── tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, padding: '0 32px' }}>
        {[
          { key: 'historia',    label: 'Historia clínica', count: !cargandoCO ? consultas.length : null },
          { key: 'odontograma', label: 'Odontograma',      count: null },
          { key: 'analisis',    label: 'Análisis',         count: !cargandoAnal ? analisisList.length : null },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '12px 0', marginRight: 32, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderBottom: tab === key ? `2px solid ${T.black}` : '2px solid transparent', background: 'none', color: tab === key ? T.black : T.gray5, cursor: 'pointer', fontFamily: T.font, fontWeight: tab === key ? 500 : 400, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            {count != null && <span style={{ fontSize: 10, color: tab === key ? T.gray4 : T.gray5 }}>({count})</span>}
          </button>
        ))}
      </div>

      {/* ── contenido del tab ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* tab: historia clínica */}
        {tab === 'historia' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
            <HistoriaClinica consultas={consultas} cargando={cargandoCO} />
          </div>
        )}

        {/* tab: odontograma */}
        {tab === 'odontograma' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <Odontograma apiFetch={apiFetch} pacienteId={id} />
          </div>
        )}

        {/* tab: análisis */}
        {tab === 'analisis' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 32px' }}>
            {cargandoAnal ? (
              <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font }}>Cargando…</span>
            ) : analisisList.length === 0 ? (
              <span style={{ fontSize: 11, color: T.gray5, fontFamily: T.font, letterSpacing: '0.04em' }}>Sin análisis registrados</span>
            ) : (
              analisisList.map(a => (
                <AnalisisFilaPaciente key={a.id} a={a} onAbrir={() => onAbrirAnalisis(a.id)} onEliminar={() => handleEliminarAnalisis(a.id)} />
              ))
            )}
          </div>
        )}

      </div>

      <SidePanel open={panelNuevaCO} onClose={() => setPanelNuevaCO(false)} title="Nueva consulta" width={860}
        footer={<>
          <Btn variant="outline" onClick={() => setPanelNuevaCO(false)} disabled={guardandoCO}>Cancelar</Btn>
          <Btn onClick={handleGuardarCO} disabled={guardandoCO}>{guardandoCO ? 'Guardando…' : 'Guardar'}</Btn>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* odontograma — parte superior */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: T.font, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4, marginBottom: 14 }}>Odontograma</div>
            {panelNuevaCO && <Odontograma apiFetch={apiFetch} pacienteId={id} />}
          </div>

          {/* formulario — parte inferior, scrollable */}
          <form onSubmit={handleGuardarCO} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel>Consultorio</FieldLabel>
                <select name="consultorioId" value={formCO.consultorioId} onChange={e => setFormCO(f => ({ ...f, consultorioId: e.target.value }))}
                  style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                  <option value="">Sin consultorio</option>
                  {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Tipo de pago *</FieldLabel>
                <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}` }}>
                  {['PARTICULAR', 'OBRA_SOCIAL'].map(op => (
                    <button key={op} type="button"
                      onClick={() => setFormCO(f => ({ ...f, tipoPago: op }))}
                      style={{ flex: 1, border: 'none', borderRight: op === 'PARTICULAR' ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: formCO.tipoPago === op ? T.black : T.white, color: formCO.tipoPago === op ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                      {op === 'PARTICULAR' ? 'Particular' : 'Obra social'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>Motivo de consulta</FieldLabel>
              <textarea value={formCO.motivoConsulta} onChange={e => setFormCO(f => ({ ...f, motivoConsulta: e.target.value }))} rows={2}
                style={{ width: '100%', border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '8px 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <FieldLabel>Práctica realizada</FieldLabel>
              <textarea value={formCO.practicaRealizada} onChange={e => setFormCO(f => ({ ...f, practicaRealizada: e.target.value }))} rows={3}
                style={{ width: '100%', border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '8px 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ maxWidth: 200 }}>
              <FieldLabel>Monto *</FieldLabel>
              <Input type="number" min="0" step="0.01" value={formCO.monto} onChange={e => setFormCO(f => ({ ...f, monto: e.target.value }))} />
            </div>
            <ErrorMsg>{errCO}</ErrorMsg>
          </form>
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

/* ─── HistoriaClinica ────────────────────────────────────────── */

function HistoriaClinica({ consultas, cargando }) {
  if (cargando) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
  )
  if (consultas.length === 0) return (
    <div style={{ padding: '20px 0', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin consultas registradas</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {consultas.map((a, i) => (
        <ConsultaHCItem key={a.id} a={a} last={i === consultas.length - 1} />
      ))}
    </div>
  )
}

function ConsultaHCItem({ a, last }) {
  const [hov, setHov] = useState(false)
  const fmtM = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${T.gray2}`, display: 'flex', gap: 20, background: hov ? T.gray2 : 'transparent', transition: 'background 0.1s', paddingLeft: hov ? 8 : 0 }}
    >
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ fontSize: 11, fontFamily: T.font, color: T.gray3, letterSpacing: '0.04em' }}>{fmtFecha(a.dateCreated)}</div>
        <div style={{ marginTop: 4, fontSize: 10, fontFamily: T.font, letterSpacing: '0.08em', textTransform: 'uppercase', color: a.tipoPago === 'OBRA_SOCIAL' ? T.gray4 : T.black, fontWeight: 500 }}>
          {a.tipoPago === 'OBRA_SOCIAL' ? 'Obra social' : 'Particular'}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {a.motivoConsulta && (
          <div style={{ fontSize: 11, fontFamily: T.font, color: T.gray4, letterSpacing: '0.02em' }}>
            <span style={{ fontWeight: 500, color: T.gray3, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.08em' }}>Motivo · </span>{a.motivoConsulta}
          </div>
        )}
        {a.practicaRealizada && (
          <div style={{ fontSize: 13, fontFamily: T.font, color: T.black, lineHeight: 1.4 }}>{a.practicaRealizada}</div>
        )}
        {a.consultorioNombre && (
          <div style={{ fontSize: 10, fontFamily: T.font, color: T.gray5, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{a.consultorioNombre}</div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontFamily: T.font, fontWeight: 500, color: T.black }}>{fmtM(a.monto)}</div>
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
      onChange({ target: { name: 'obraSocial', value: nueva.nombre } })
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
    boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <select name="obraSocial" value={value} onChange={onChange} style={selectStyle}>
          <option value="">Sin obra social</option>
          {obras.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
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
        <div style={{ border: `1px solid ${T.gray1}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: T.gray2 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Obra social / Prepaga</FieldLabel>
            <ObraSocialSelector apiFetch={apiFetch} value={form.obraSocial} onChange={handleChange} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Nro. de afiliado</FieldLabel><Input name="nroAfiliado" value={form.nroAfiliado} onChange={handleChange} /></div>
        </div>
      </div>
    </>
  )
}

/* ─── VistaConsultas ─────────────────────────────────────────── */

const VACÍO_CO = { pacienteId: '', consultorioId: '', motivoConsulta: '', practicaRealizada: '', monto: '', tipoPago: 'PARTICULAR' }
const COLS_CO = [
  { label: 'Paciente',    w: '2fr' },
  { label: 'Práctica',    w: '2fr' },
  { label: 'Monto',       w: '1fr' },
  { label: 'Tipo',        w: '1fr' },
  { label: 'Consultorio', w: '1fr' },
  { label: 'Fecha',       w: '1fr' },
]

function VistaConsultas({ apiFetch }) {
  const [items,      setItems]      = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [error,      setError]      = useState(null)
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [form,       setForm]       = useState(VACÍO_CO)
  const [guardando,  setGuardando]  = useState(false)
  const [formErr,    setFormErr]    = useState(null)
  const [buscar,     setBuscar]     = useState('')
  const [vista,      setVista]      = useState(() => localStorage.getItem('consultas-vista') ?? 'list')
  const [pacientes,  setPacientes]  = useState([])
  const [consultorios, setConsultorios] = useState([])

  function toggleVista(v) { setVista(v); localStorage.setItem('consultas-vista', v) }

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const res = await apiFetch('/consultas')
    if (!res) return
    if (res.ok) setItems(await res.json())
    else setError('Error al cargar consultas')
    setCargando(false)
  }, [apiFetch])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!panelOpen) return
    apiFetch('/pacientes?size=200').then(r => r?.ok && r.json().then(d => setPacientes(Array.isArray(d) ? d : (d.content ?? []))))
    apiFetch('/consultorios').then(r => r?.ok && r.json().then(d => setConsultorios(d)))
  }, [panelOpen, apiFetch])

  function cerrarPanel() { setPanelOpen(false); setForm(VACÍO_CO); setFormErr(null) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.pacienteId) { setFormErr('Seleccioná un paciente'); return }
    if (!form.monto || isNaN(Number(form.monto))) { setFormErr('Ingresá un monto válido'); return }
    setFormErr(null); setGuardando(true)
    const body = {
      pacienteId:       Number(form.pacienteId),
      consultorioId:    form.consultorioId ? Number(form.consultorioId) : null,
      motivoConsulta:   form.motivoConsulta   || null,
      practicaRealizada: form.practicaRealizada || null,
      monto:            Number(form.monto),
      tipoPago:         form.tipoPago,
    }
    const res = await apiFetch('/consultas', { method: 'POST', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { cerrarPanel(); cargar() }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al guardar') }
    setGuardando(false)
  }

  const filtradas = buscar.trim()
    ? items.filter(i =>
        `${i.pacienteApellido} ${i.pacienteNombre} ${i.practicaRealizada ?? ''}`.toLowerCase().includes(buscar.toLowerCase())
      )
    : items

  const fmtMonto = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const fmtTipo  = t => t === 'OBRA_SOCIAL' ? 'Obra social' : 'Particular'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <PageTitle>Consultas</PageTitle>
        <Btn onClick={() => setPanelOpen(true)}>+ Nueva consulta</Btn>
      </PageBar>

      <FilterBar>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, flex: 1, maxWidth: 360 }}>
          <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
          <input
            value={buscar} onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por paciente o práctica…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
          />
        </div>
        <ViewToggle vista={vista} onToggle={toggleVista} />
      </FilterBar>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {vista === 'list' ? (
          <>
            <TableHead cols={COLS_CO} />
            <EmptyOrError cargando={cargando} error={error} empty={filtradas.length === 0} msg={buscar ? 'Sin resultados' : 'No hay consultas registradas'} />
            {filtradas.map(a => (
              <ConsultaFila key={a.id} a={a} fmtMonto={fmtMonto} fmtTipo={fmtTipo} />
            ))}
          </>
        ) : (
          cargando ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{buscar ? 'Sin resultados' : 'No hay consultas registradas'}</div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
              {filtradas.map(a => (
                <ConsultaCard key={a.id} a={a} fmtMonto={fmtMonto} fmtTipo={fmtTipo} />
              ))}
            </div>
          )
        )}
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title="Nueva consulta" width={860}
        footer={<>
          <Btn variant="outline" onClick={cerrarPanel} disabled={guardando}>Cancelar</Btn>
          <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
        </>}
      >
        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* campos superiores */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel>Paciente *</FieldLabel>
                <select name="pacienteId" value={form.pacienteId} onChange={handleChange}
                  style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Consultorio</FieldLabel>
                <select name="consultorioId" value={form.consultorioId} onChange={handleChange}
                  style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                  <option value="">Sin consultorio</option>
                  {consultorios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Tipo de pago *</FieldLabel>
                <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}` }}>
                  {['PARTICULAR', 'OBRA_SOCIAL'].map(op => (
                    <button key={op} type="button"
                      onClick={() => setForm(f => ({ ...f, tipoPago: op }))}
                      style={{ flex: 1, border: 'none', borderRight: op === 'PARTICULAR' ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: form.tipoPago === op ? T.black : T.white, color: form.tipoPago === op ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                      {op === 'PARTICULAR' ? 'Particular' : 'Obra social'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* odontograma */}
          <div style={{ borderTop: `1px solid ${T.gray1}`, borderBottom: `1px solid ${T.gray1}`, padding: '16px 24px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: T.font, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4, marginBottom: 14 }}>Odontograma</div>
            {form.pacienteId ? (
              <Odontograma key={form.pacienteId} apiFetch={apiFetch} pacienteId={Number(form.pacienteId)} />
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 11, fontFamily: T.font, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5 }}>
                Seleccioná un paciente para ver el odontograma
              </div>
            )}
          </div>

          {/* campos inferiores — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel>Motivo de consulta</FieldLabel>
                <textarea name="motivoConsulta" value={form.motivoConsulta} onChange={handleChange} rows={2}
                  style={{ width: '100%', border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '8px 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <FieldLabel>Práctica realizada</FieldLabel>
                <textarea name="practicaRealizada" value={form.practicaRealizada} onChange={handleChange} rows={2}
                  style={{ width: '100%', border: `1px solid ${T.gray1}`, borderRadius: 0, padding: '8px 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ maxWidth: 180 }}>
              <FieldLabel>Monto *</FieldLabel>
              <Input type="number" min="0" step="0.01" name="monto" value={form.monto} onChange={handleChange} />
            </div>
            <ErrorMsg>{formErr}</ErrorMsg>
          </div>
        </form>
      </SidePanel>
    </div>
  )
}

function ConsultaFila({ a, fmtMonto, fmtTipo }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, transition: 'background 0.1s' }}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{a.pacienteApellido}, {a.pacienteNombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.practicaRealizada || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.black, letterSpacing: '0.02em' }}>{fmtMonto(a.monto)}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{fmtTipo(a.tipoPago)}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em' }}>{a.consultorioNombre || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{fmtFecha(a.dateCreated)}</span>
    </div>
  )
}

function ConsultaCard({ a, fmtMonto, fmtTipo }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 240, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s' }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: T.black, fontFamily: T.font, lineHeight: 1.3 }}>
        {a.pacienteApellido}, {a.pacienteNombre}
      </div>
      {a.practicaRealizada && (
        <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, lineHeight: 1.4, letterSpacing: '0.02em' }}>
          {a.practicaRealizada}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.black, fontFamily: T.font }}>{fmtMonto(a.monto)}</span>
        <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4, fontFamily: T.font }}>{fmtTipo(a.tipoPago)}</span>
      </div>
      {a.consultorioNombre && (
        <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{a.consultorioNombre}</div>
      )}
      <div style={{ fontSize: 10, color: T.gray5, fontFamily: T.font, letterSpacing: '0.04em', marginTop: 2 }}>{fmtFecha(a.dateCreated)}</div>
    </div>
  )
}

/* ─── VistaAnalisis ──────────────────────────────────────────── */

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

function VistaAnalisis({ apiFetch, pacienteIdInicial = null, analisisIdInicial = null, onVolver = null }) {
  const [sub,          setSub]          = useState(onVolver ? (analisisIdInicial ? 'cargando' : 'upload') : 'lista')
  const [lista,        setLista]        = useState([])
  const [cargandoLista,setCargandoLista]= useState(true)
  const [analisisId,   setAnalisisId]   = useState(null)
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
  const [calibrado,     setCalibrado]     = useState(false)
  const [mouse,         setMouse]         = useState(null)
  const [subiendo,      setSubiendo]      = useState(false)
  const [errSubida,     setErrSubida]     = useState(null)
  const [asignandoId,   setAsignandoId]   = useState(null)
  const [pacientesOpts, setPacientesOpts] = useState([])
  const [pacSelId,      setPacSelId]      = useState('')
  const [estadoGuardado, setEstadoGuardado] = useState(null)
  const [pendingFile,    setPendingFile]    = useState(null)
  const [nombrePendiente,setNombrePendiente]= useState('')
  const inputRef      = useRef(null), canvasRef = useRef(null), containerRef = useRef(null)
  const pendingNormRef = useRef(null)
  const skipSaveRef   = useRef(false)
  const debounceRef   = useRef(null)

  const cargarLista = useCallback(async () => {
    setCargandoLista(true)
    const res = await apiFetch('/analisis')
    if (res?.ok) setLista(await res.json())
    setCargandoLista(false)
  }, [apiFetch])

  async function abrirAsignacion(id) {
    setAsignandoId(id); setPacSelId('')
    const res = await apiFetch('/pacientes?size=200')
    if (res?.ok) { const d = await res.json(); setPacientesOpts(Array.isArray(d) ? d : (d.content ?? [])) }
  }

  async function confirmarAsignacion() {
    if (!pacSelId) return
    const det = await apiFetch(`/analisis/${asignandoId}`)
    if (!det?.ok) return
    const data = await det.json()
    await apiFetch(`/analisis/${asignandoId}`, {
      method: 'PUT',
      body: JSON.stringify({ pacienteId: Number(pacSelId), trazos: data.trazos ?? [], escala: data.escala ?? 1 })
    })
    setAsignandoId(null)
    cargarLista()
  }

  useEffect(() => { if (sub === 'lista') cargarLista() }, [sub, cargarLista])

  useEffect(() => {
    if (!analisisIdInicial) return
    apiFetch(`/analisis/${analisisIdInicial}`).then(async res => {
      if (!res?.ok) return
      const data = await res.json()
      setAnalisisId(data.id); setNombre(data.nombre); setEscala(data.escala ?? 1); setCalibrado((data.escala ?? 1) !== 1)
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
    setSubiendo(true); setErrSubida(null); setPendingFile(null)
    const fd = new FormData()
    fd.append('imagen', file)
    fd.append('nombre', nombreFinal || file.name)
    fd.append('escala', '1')
    if (pacienteIdInicial) fd.append('pacienteId', pacienteIdInicial)
    let res
    try { res = await apiFetch('/analisis', { method: 'POST', body: fd }) }
    catch (e) { setSubiendo(false); setErrSubida('No se pudo conectar con el servidor'); return }
    if (!res) { setSubiendo(false); setErrSubida('Tu sesión expiró. Iniciá sesión nuevamente.'); return }
    if (!res.ok) { setSubiendo(false); setErrSubida(`Error al subir la imagen (${res.status})`); return }
    const data = await res.json()
    setAnalisisId(data.id); setNombre(file.name)
    setImagen(URL.createObjectURL(file))
    setTrazos([]); resetInProgress(); setEscala(1); setCalibrado(false)
    setSubiendo(false); setSub('editor')
  }

  async function cargarAnalisis(id) {
    const res = await apiFetch(`/analisis/${id}`)
    if (!res?.ok) return
    const data = await res.json()
    setAnalisisId(data.id); setNombre(data.nombre); setEscala(data.escala ?? 1); setCalibrado((data.escala ?? 1) !== 1)
    setImagen(`data:${data.imagenTipo};base64,${data.imagenBase64}`)
    pendingNormRef.current = data.trazos ?? []
    setTrazos([]); resetInProgress(); setSub('editor')
  }

  async function handleGuardar() {
    if (!analisisId) return
    const canvas = canvasRef.current; if (!canvas) return
    setGuardando(true)
    await apiFetch(`/analisis/${analisisId}`, {
      method: 'PUT',
      body: JSON.stringify({ trazos: normalizarTrazos(trazos, canvas.width, canvas.height), escala, pacienteId: pacienteIdInicial ?? null })
    })
    setGuardando(false)
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este análisis?')) return
    await apiFetch(`/analisis/${id}`, { method: 'DELETE' })
    cargarLista()
  }

  async function handleEliminarDesdeEditor() {
    if (!analisisId) return
    if (!confirm('¿Eliminar este análisis? Esta acción no se puede deshacer.')) return
    await apiFetch(`/analisis/${analisisId}`, { method: 'DELETE' })
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
    a.download = `${nombre || 'analisis'}.png`
    a.click()
  }

  const redibujar = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height)
    let nLong = 0
    for (const [i, t] of trazos.entries()) {
      if (t.tipo === 'punto') {
        ctx.fillStyle = COLOR_PUNTO; ctx.beginPath(); ctx.arc(t.x, t.y, RADIOS_PUNTO[t.grosor ?? 1], 0, Math.PI * 2); ctx.fill()
      } else if (t.tipo === 'linea') {
        const mL = herramienta === 'angulo-lineas' || herramienta === 'longitud'
        const eS = herramienta === 'angulo-lineas' && lineasSel.some(s => s.idx === i)
        const eH = mL && lineaHover === i && !eS
        ctx.strokeStyle = (eS || eH) ? COLOR_ANGULO : COLOR_LINEA; ctx.fillStyle = (eS || eH) ? COLOR_ANGULO : COLOR_LINEA
        ctx.lineWidth = eS ? 3 : eH ? 2.5 : GROSOR_LINEA; ctx.globalAlpha = eH ? 0.65 : 1
        ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.x1, t.y1, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(t.x2, t.y2, 3, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1; ctx.lineWidth = GROSOR_LINEA
      } else if (t.tipo === 'angulo') {
        ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = GROSOR_LINEA
        ctx.beginPath(); ctx.moveTo(t.vx, t.vy); ctx.lineTo(t.ax1, t.ay1); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(t.vx, t.vy); ctx.lineTo(t.ax2, t.ay2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.vx, t.vy, 4, 0, Math.PI * 2); ctx.fill()
        const { midA, r } = dibujarArco(ctx, t.vx, t.vy, t.ax1, t.ay1, t.ax2, t.ay2)
        dibujarEtiqueta(ctx, `${t.grados.toFixed(1)}°`, t.vx + (r + 20) * Math.cos(midA) - 14, t.vy + (r + 20) * Math.sin(midA) + 5)
      } else if (t.tipo === 'angulo-lineas') {
        ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = GROSOR_LINEA
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
        drawTick(t.x1, t.y1); drawTick(t.x2, t.y2); ctx.lineWidth = GROSOR_LINEA
        const label = `L${nLong}: ${t.mm.toFixed(1)} mm`
        const mx = (t.x1 + t.x2) / 2 + nx * 22, my = (t.y1 + t.y2) / 2 + ny * 22
        dibujarEtiqueta(ctx, label, mx - label.length * 4, my + 5)
      } else if (t.tipo === 'circulo') {
        ctx.strokeStyle = COLOR_LINEA; ctx.fillStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA; ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(t.cx, t.cy, 3, 0, Math.PI * 2); ctx.fill()
      } else if (t.tipo === 'cuadrado') {
        ctx.strokeStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA; ctx.globalAlpha = 1
        ctx.strokeRect(t.x1, t.y1, t.x2 - t.x1, t.y2 - t.y1)
      }
    }
    if (herramienta === 'linea' && primerPunto) {
      ctx.strokeStyle = COLOR_LINEA; ctx.fillStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA
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
      ctx.strokeStyle = COLOR_LINEA; ctx.fillStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, r, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, 3, 0, Math.PI * 2); ctx.fill()
    }
    if (herramienta === 'cuadrado' && primerPunto && mouse) {
      ctx.strokeStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA
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
  }, [trazos, primerPunto, mouse, herramienta, lineasSel, lineaHover, borrarHover])

  useEffect(() => { redibujar() }, [redibujar])
  useEffect(() => {
    if (!imagen) return
    const container = containerRef.current; if (!container) return
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current; if (!canvas) return
      canvas.width = container.clientWidth; canvas.height = container.clientHeight
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
    if (!analisisId || !canvasRef.current) return
    if (skipSaveRef.current) { skipSaveRef.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setEstadoGuardado('guardando')
    const canvas = canvasRef.current
    debounceRef.current = setTimeout(async () => {
      await apiFetch(`/analisis/${analisisId}`, {
        method: 'PUT',
        body: JSON.stringify({ trazos: normalizarTrazos(trazos, canvas.width, canvas.height), escala, pacienteId: pacienteIdInicial ?? null })
      })
      setEstadoGuardado('guardado')
    }, 600)
  }, [trazos]) // eslint-disable-line react-hooks/exhaustive-deps

  function getCoordsFromEvent(e) { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  function lineaCercana(x, y, excluir = []) {
    let best = -1, bestDist = 10
    trazos.forEach((t, i) => { if (t.tipo !== 'linea' || excluir.some(s => (typeof s === 'object' ? s.idx : s) === i)) return; const d = distPuntoSegmento(x, y, t.x1, t.y1, t.x2, t.y2); if (d < bestDist) { bestDist = d; best = i } })
    return best
  }
  function handleCanvasClick(e) {
    const { x, y } = getCoordsFromEvent(e)
    if (herramienta === 'punto') { setTrazos(prev => [...prev, { tipo: 'punto', x, y, grosor }]) }
    else if (herramienta === 'linea') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'linea', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y }]); setPrimerPunto(null) }
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
      else { const r = Math.hypot(x-primerPunto.x, y-primerPunto.y); setTrazos(prev => [...prev, { tipo: 'circulo', cx: primerPunto.x, cy: primerPunto.y, rx: x, ry: y, r }]); setPrimerPunto(null) }
    } else if (herramienta === 'cuadrado') {
      if (!primerPunto) setPrimerPunto({ x, y })
      else { setTrazos(prev => [...prev, { tipo: 'cuadrado', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y }]); setPrimerPunto(null) }
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
  const canvasCursor = herramienta === 'borrar' ? ERASER_CURSOR : (herramienta === 'angulo-lineas' || herramienta === 'longitud') ? (lineaHover !== -1 ? 'pointer' : 'default') : 'crosshair'

  // ── CARGANDO análisis existente ──
  if (sub === 'cargando') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <BackBtn onClick={onVolver} />
        <PageTitle>Cargando análisis…</PageTitle>
      </PageBar>
      <Cargando />
    </div>
  )

  // ── UPLOAD (desde paciente) ──
  if (sub === 'upload') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <BackBtn onClick={onVolver} />
        <PageTitle>Nuevo análisis</PageTitle>
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
    </div>
  )

  // ── LISTA ──
  if (sub === 'lista') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <PageTitle>Análisis</PageTitle>
        <div>
          <Btn onClick={() => inputRef.current?.click()} disabled={subiendo}>
            {subiendo ? 'Subiendo…' : '+ Nuevo análisis'}
          </Btn>
          <input ref={inputRef} type="file" accept="image/*" onChange={e => seleccionarArchivo(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      </PageBar>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TableHead cols={COLS_ANALISIS} />
        <EmptyOrError cargando={cargandoLista} error={null} empty={lista.length === 0} msg="No hay análisis guardados" />
        {lista.map(a => (
          <AnalisisFila key={a.id} a={a} onClick={() => cargarAnalisis(a.id)} onEliminar={() => handleEliminar(a.id)} onAsignar={!a.pacienteApellido ? () => abrirAsignacion(a.id) : null} />
        ))}
      </div>

      {/* Modal nombre análisis */}
      {pendingFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setPendingFile(null) }}>
          <div style={{ background: T.white, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span style={{ fontSize: 13, fontFamily: T.font, fontWeight: 500, letterSpacing: '0.06em', color: T.black }}>Nombre del análisis</span>
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

      {/* Modal asignar paciente */}
      {asignandoId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setAsignandoId(null) }}>
          <div style={{ background: T.white, borderRadius: 4, padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black, letterSpacing: '0.02em' }}>Asignar paciente</span>
            <select value={pacSelId} onChange={e => setPacSelId(e.target.value)}
              style={{ height: 36, border: `1px solid ${T.gray1}`, padding: '0 10px', fontFamily: T.font, fontSize: 12, color: T.black, outline: 'none', borderRadius: 2 }}>
              <option value="">— Seleccioná un paciente —</option>
              {pacientesOpts.map(p => (
                <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="outline" size="sm" onClick={() => setAsignandoId(null)}>Cancelar</Btn>
              <Btn size="sm" onClick={confirmarAsignacion} disabled={!pacSelId}>Asignar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── EDITOR ──
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

      {/* Área principal: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar izquierdo */}
        <div style={{ width: 168, borderRight: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', flexShrink: 0, background: T.white, overflowY: 'auto' }}>
          <div style={{ padding: '14px 14px 6px', fontSize: 9, fontFamily: T.font, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5, fontWeight: 600 }}>Herramientas</div>

          {/* ── Grupo Dibujar ── */}
          <SideSection label="Dibujar" />
          {HERRAMIENTAS_DIBUJAR.map(({ key, label, Ico }) => (
            <SideToolGroup key={key}>
              <SideToolBtn active={herramienta === key} onClick={() => { resetInProgress(); setHerramienta(key) }}>
                <Ico />{label}
              </SideToolBtn>
              {key === 'punto' && herramienta === 'punto' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 14px 8px 36px' }}>
                  <span style={{ fontSize: 8, fontFamily: T.font, color: T.gray4, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 2 }}>Grosor</span>
                  {[1, 2, 3].map(g => (
                    <button key={g} onClick={() => setGrosor(g)}
                      style={{ width: 26, height: 20, fontSize: 9, fontFamily: T.font, fontWeight: 600, border: `1px solid ${grosor === g ? T.black : T.gray2}`, background: grosor === g ? T.black : T.white, color: grosor === g ? T.white : T.gray4, cursor: 'pointer', borderRadius: 2 }}>
                      {g}×
                    </button>
                  ))}
                </div>
              )}
            </SideToolGroup>
          ))}

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

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: T.black }}>
          <img src={imagen} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, cursor: canvasCursor }} onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseLeave={() => { setMouse(null); setLineaHover(-1); setBorrarHover(-1) }} />
          <RatioPanel trazos={trazos} />
          <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: T.font, pointerEvents: 'none' }}>{nombre}</span>
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

function AnalisisFila({ a, onClick, onEliminar, onAsignar }) {
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

function AnalisisFilaPaciente({ a, onAbrir, onEliminar }) {
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
  const [superficies, setSuperficies] = useState({})
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [menu,        setMenu]        = useState(null)

  useEffect(() => {
    apiFetch(`/pacientes/${pacienteId}/odontograma`)
      .then(async r => { if (r && r.ok) { const d = await r.json(); setSuperficies(d.superficies || {}) } })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [apiFetch, pacienteId])

  function handleClickSuperficie(numero, sup, e) {
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

  function dienteSups(n) {
    const r = {}
    ;['v', 'd', 'l', 'm', 'o'].forEach(s => { r[s] = superficies[`${n}_${s}`] || 'sano' })
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

  return (
    <div onClick={() => setMenu(null)} style={{ position: 'relative', userSelect: 'none' }}>
      {guardando && <span style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, color: T.gray5, fontFamily: T.font, letterSpacing: '0.08em' }}>Guardando…</span>}

      <div style={{ display: 'flex', gap: TG * 4, justifyContent: 'center', marginBottom: ML }}>
        {filaDientes(Q1, false)}
        <div style={{ width: 1, background: T.gray1, alignSelf: 'stretch', margin: `0 ${TG * 2}px` }} />
        {filaDientes(Q2, false)}
      </div>

      <div style={{ display: 'flex', gap: TG * 4, justifyContent: 'center' }}>
        {filaDientes(Q4, true)}
        <div style={{ width: 1, background: T.gray1, alignSelf: 'stretch', margin: `0 ${TG * 2}px` }} />
        {filaDientes(Q3, true)}
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
