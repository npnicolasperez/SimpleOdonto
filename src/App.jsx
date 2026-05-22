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

const RADIOS_PUNTO    = { 1: 2, 2: 4, 3: 7 }
const GROSORES_LINEA  = { 1: 1.5, 2: 3, 3: 5 }
const COLOR_PUNTO    = '#ff3333'
const COLOR_LINEA    = '#2563eb'
const COLOR_ANGULO   = '#ffffff'
const COLORES_PRESET = ['#ff3333', '#2563eb', '#22c55e', '#f59e0b', '#ffffff', '#a855f7', '#f97316']

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

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
    const u = { nombre: data.nombre, apellido: data.apellido, email: data.email, perfilCompleto: data.perfilCompleto !== false, foto: data.foto || null, especialidadNombre: data.especialidadNombre || null }
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
  { key: 'dashboard',      label: 'Dashboard'         },
  { key: 'pacientes',      label: 'Pacientes'          },
  { key: 'turnos',         label: 'Turnos'            },
  { key: 'estudios',       label: 'Estudios'          },
  { key: 'consultas',      label: 'Consultas'         },
  { key: 'finanzas',       label: 'Finanzas'          },
  { key: 'obras-sociales', label: 'Obras sociales'    },
  { key: 'consultorios',   label: 'Consultorios'      },
  { key: 'medios-pago',    label: 'Medios de pago'    },
]

function MainLayout({ token, usuario, onLogout }) {
  const [vista, setVista] = useState('dashboard')
  const [consultasFiltroInicial, setConsultasFiltroInicial] = useState(false)

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
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, background: T.white, zIndex: 10 }}>
        <Logo size={16} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usuario?.foto && <img src={usuario.foto} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
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
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
          {vista === 'dashboard'      && <VistaDashboard apiFetch={apiFetch} usuario={usuario} />}
          {vista === 'pacientes'      && <VistaPacientes apiFetch={apiFetch} onIrAConsultorios={() => setVista('consultorios')} usuario={usuario} />}
          {vista === 'turnos'         && <VistaTurnos apiFetch={apiFetch} />}
          {vista === 'estudios'       && <VistaEstudios apiFetch={apiFetch} />}
          {vista === 'consultas'      && <VistaConsultas apiFetch={apiFetch} onIrAConsultorios={() => setVista('consultorios')} usuario={usuario} filtroPendienteInicial={consultasFiltroInicial} />}
          {vista === 'finanzas'       && <VistaFinanzas apiFetch={apiFetch} onIrAConsultas={() => { setConsultasFiltroInicial(true); setVista('consultas') }} />}
          {vista === 'obras-sociales' && <VistaObrasSociales apiFetch={apiFetch} />}
          {vista === 'consultorios'   && <VistaConsultorios apiFetch={apiFetch} />}
          {vista === 'medios-pago'    && <VistaMediosPago apiFetch={apiFetch} />}
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

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Eliminar' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}>
      <div style={{ background: T.white, border: `1px solid ${T.gray1}`, padding: '28px 32px', maxWidth: 380, width: '90%', display: 'flex', flexDirection: 'column', gap: 20, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <span style={{ fontFamily: T.font, fontSize: 14, color: T.black, lineHeight: 1.5 }}>{message}</span>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="destructive" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [cfg, setCfg] = useState(null)
  const resolveRef = useRef(null)

  function openConfirm(message) {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setCfg({ message })
    })
  }

  function handleConfirm() { resolveRef.current?.(true);  setCfg(null) }
  function handleCancel()  { resolveRef.current?.(false); setCfg(null) }

  const dialog = cfg
    ? <ConfirmDialog message={cfg.message} onConfirm={handleConfirm} onCancel={handleCancel} />
    : null

  return { openConfirm, dialog }
}

/* ─── table components ───────────────────────────────────────── */

function TableHead({ cols, extraCol = true }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${cols.map(c => c.w || '1fr').join(' ')}${extraCol ? ' 40px' : ''}`, padding: '0 24px', height: 40, alignItems: 'center', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
      {cols.map(c => (
        <span key={c.label} style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray3 }}>{c.label}</span>
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
      <div style={{ marginBottom: 10 }}><Logo size={28} /></div>
      <span style={{ fontSize: 11, fontFamily: T.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3, marginBottom: 52 }}>
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

function VistaDashboard({ apiFetch, usuario }) {
  const [stats, setStats] = useState({ total: null, nuevos: null, conTurno: null })

  useEffect(() => {
    apiFetch('/pacientes/stats').then(async res => {
      if (!res?.ok) return
      const s = await res.json()
      setStats({ total: s.total, nuevos: s.nuevosEsteMes, conTurno: s.conTurnoProximo })
    })
  }, [apiFetch])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <div style={{ padding: '20px 24px 16px', flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>
          Bienvenido/a, {usuario?.nombre}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, padding: '0 24px 24px', flexShrink: 0 }}>
        <StatCard inverted label="Total pacientes" value={stats.total} />
        <StatCard label="Nuevos" value={stats.nuevos} sub="este mes" />
        <StatCard label="Con turno" value={stats.conTurno} />
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

/* ─── VistaABMSimple (consultorios, obras sociales, medios de pago) ── */

function NombreCard({ item, onEliminar }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 180, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s', minHeight: 64, borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em', color: T.black, lineHeight: 1.4, fontFamily: T.font }}>
        {item.nombre}
      </div>
      <button onClick={onEliminar}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: T.gray5, lineHeight: 1, padding: 0, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = T.black}
        onMouseLeave={e => e.currentTarget.style.color = T.gray5}
      >×</button>
    </div>
  )
}

function VistaABMSimple({ apiFetch, endpoint, titulo, panelTitulo, addLabel, msgVacio, msgConfirmar, storageKey, placeholder }) {
  const [items,     setItems]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [nombre,    setNombre]    = useState('')
  const [guardando, setGuardando] = useState(false)
  const [formErr,   setFormErr]   = useState(null)
  const [buscar,    setBuscar]    = useState('')
  const { openConfirm, dialog }   = useConfirm()
  const [vistaMode, setVistaMode] = useState(() => localStorage.getItem(storageKey) ?? 'list')

  function toggleVista(v) { setVistaMode(v); localStorage.setItem(storageKey, v) }

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
    if (res && (res.ok || res.status === 204)) cargar()
  }

  const filtrados = buscar.trim()
    ? items.filter(i => i.nombre.toLowerCase().includes(buscar.toLowerCase()))
    : items

  const msgEmpty = buscar.trim() ? 'Sin resultados' : msgVacio

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>{titulo}</PageTitle>
        <Btn onClick={() => setPanelOpen(true)}>{addLabel}</Btn>
      </PageBar>

      <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.white, borderRadius: 8, border: `1px solid ${T.gray1}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, flex: 1, maxWidth: 320, borderRadius: 6, background: T.gray2 }}>
              <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder={`Buscar…`}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }} />
            </div>
            <ViewToggle vista={vistaMode} onToggle={toggleVista} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {vistaMode === 'list' ? (
              <>
                <TableHead cols={[{ label: 'Nombre', w: '1fr' }]} />
                <EmptyOrError cargando={cargando} error={error} empty={filtrados.length === 0} msg={msgEmpty} />
                {filtrados.map(item => (
                  <FilaSimple key={item.id} cols={[item.nombre]} gridCols="1fr" onEliminar={() => handleEliminar(item.id)} />
                ))}
              </>
            ) : (
              cargando
                ? <div style={{ padding: '4rem', textAlign: 'center', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
                : filtrados.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{msgEmpty}</div>
                  : <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
                      {filtrados.map(item => <NombreCard key={item.id} item={item} onEliminar={() => handleEliminar(item.id)} />)}
                    </div>
            )}
          </div>

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
    </div>
  )
}

function VistaConsultorios({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/consultorios" titulo="Consultorios" panelTitulo="Nuevo consultorio" addLabel="+ Agregar" msgVacio="No hay consultorios registrados" msgConfirmar="¿Eliminar este consultorio?" storageKey="consultorios-vista" placeholder="Ej: Casa Central, Sucursal Norte…" />
}

function VistaObrasSociales({ apiFetch }) {
  return <VistaABMSimple apiFetch={apiFetch} endpoint="/obras-sociales" titulo="Obras sociales" panelTitulo="Nueva obra social" addLabel="+ Nueva obra social" msgVacio="No hay obras sociales registradas" msgConfirmar="¿Eliminar esta obra social?" storageKey="obras-sociales-vista" placeholder="Ej: OSDE, Swiss Medical, IOMA…" />
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

const VACÍO_FORM = { apellido: '', nombre: '', dni: '', fechaNac: '', telefono: '', email: '', direccion: '', obraSocial: '', nroAfiliado: '', planObraSocial: '', titularObraSocial: '', ocupacion: '', grupoSanguineo: '', alergias: '', medicaciones: '', antecedentes: '', antecedentesFamiliares: '', peso: '', altura: '' }
const COLS_PAC = [{ label: 'Paciente', w: '2fr' }, { label: 'DNI', w: '1fr' }, { label: 'Teléfono', w: '1fr' }, { label: 'Obra social', w: '1.5fr' }, { label: 'Registrado', w: '1fr' }]

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

  if (sub === 'lista')           return <ListaPacientes apiFetch={apiFetch} onDetalle={abrirDetalle} />
  if (sub === 'detalle')         return <DetallePaciente apiFetch={apiFetch} id={pacienteId} onVolver={volver} onNuevoEstudio={abrirNuevoEstudio} onAbrirEstudio={abrirEstudioExistente} onIrAConsultorios={onIrAConsultorios} onIniciarConsulta={abrirNuevaConsulta} onEditarConsulta={abrirEditarConsulta} usuario={usuario} />
  if (sub === 'estudios')        return <VistaEstudios apiFetch={apiFetch} pacienteIdInicial={pacienteId} estudioIdInicial={estudioIdAbierto} onVolver={volverADetalle} />
  if (sub === 'nueva-consulta')  return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteId} onVolver={volverADetalle} usuario={usuario} consulta={consultaActual} />
  return null
}

function StatCard({ label, value, sub, inverted = false, pct = null, bottomRight = null, pendienteInfo = null }) {
  return (
    <div style={{
      background: inverted ? T.black : T.white,
      border: `1px solid ${inverted ? T.black : T.gray1}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {sub
          ? <span style={{ fontFamily: T.mono, fontSize: 9, color: inverted ? 'rgba(255,255,255,0.35)' : T.gray3, letterSpacing: '0.08em' }}>{sub}</span>
          : <span />
        }
        {bottomRight && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray3 }}>balance</span>
            <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>{bottomRight}</span>
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
    </div>
  )
}

const PIE_COLORS = ['#18181b', '#3b82f6', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#c2410c']

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
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 16 }}>
      <svg width={160} height={160} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
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
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontFamily: T.font, fontSize: 14, color: T.black, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.black, flexShrink: 0 }}>{fmtPesos(s.data.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
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
    const body = { nombre: form.nombre, apellido: form.apellido, dni: form.dni || null, fechaNac: form.fechaNac || null, telefono: form.telefono || null, email: form.email || null, direccion: form.direccion || null, obraSocial: form.obraSocial || null, nroAfiliado: form.nroAfiliado || null, planObraSocial: form.planObraSocial || null, titularObraSocial: form.titularObraSocial || null, ocupacion: form.ocupacion || null, grupoSanguineo: form.grupoSanguineo || null, alergias: form.alergias || null, medicaciones: form.medicaciones || null, antecedentes: form.antecedentes || null, antecedentesFamiliares: form.antecedentesFamiliares || null, peso: form.peso ? Number(form.peso) : null, altura: form.altura ? Number(form.altura) : null }
    const res = await apiFetch('/pacientes', { method: 'POST', body: JSON.stringify(body) })
    if (!res) return
    if (res.ok) { const d = await res.json(); cerrarPanel(); onDetalle(d.id) }
    else { const err = await res.json().catch(() => null); setFormErr(err?.error || 'Error al registrar'); setGuardando(false) }
  }

  const pacientes = pagina?.content ?? []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
        <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>
          Pacientes
        </span>
        <Btn onClick={() => setPanelOpen(true)}>+ Nuevo paciente</Btn>
      </div>

      {/* ── white list card ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          {/* card header */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.black, flex: 1, letterSpacing: '-0.01em' }}>
              Lista de pacientes
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, width: 260, borderRadius: 6, background: T.gray2 }}>
              <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
              <input
                value={buscar} onChange={e => setBuscar(e.target.value)}
                placeholder="Buscar por nombre o DNI…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.02em', width: '100%' }}
              />
            </div>
            <ViewToggle vista={vista} onToggle={toggleVista} />
          </div>

          {/* list / grid */}
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
                <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
                  {pacientes.map(p => (
                    <PacienteCard key={p.id} paciente={p} onClick={() => onDetalle(p.id)} onEliminar={() => cargar(buscar)} apiFetch={apiFetch} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
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
      style={{ width: 200, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, background: T.white, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'pointer', minHeight: 100, borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)' }}
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
    {dialog}
    </>
  )
}

function FilaPaciente({ paciente: p, onClick, onEliminar, apiFetch }) {
  const [hov,  setHov]  = useState(false)
  const [hovT, setHovT] = useState(false)
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
    {dialog}
    </>
  )
}

/* ─── DetallePaciente ────────────────────────────────────────── */

const hoyISO = () => new Date().toISOString().slice(0, 10)
const VACÍO_CO_DET = { consultorioId: '', fecha: hoyISO(), descripcion: '', monto: '', tipoPago: 'PARTICULAR' }

function DetallePaciente({ apiFetch, id, onVolver, onNuevoEstudio, onAbrirEstudio, onIrAConsultorios, onIniciarConsulta, onEditarConsulta, usuario }) {
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
      direccion: paciente.direccion ?? '', obraSocial: paciente.obraSocial ?? '',
      nroAfiliado: paciente.nroAfiliado ?? '', planObraSocial: paciente.planObraSocial ?? '', titularObraSocial: paciente.titularObraSocial ?? '', ocupacion: paciente.ocupacion ?? '',
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
    const body = { nombre: formEdit.nombre, apellido: formEdit.apellido, dni: formEdit.dni || null, fechaNac: formEdit.fechaNac || null, telefono: formEdit.telefono || null, email: formEdit.email || null, direccion: formEdit.direccion || null, obraSocial: formEdit.obraSocial || null, nroAfiliado: formEdit.nroAfiliado || null, planObraSocial: formEdit.planObraSocial || null, titularObraSocial: formEdit.titularObraSocial || null, ocupacion: formEdit.ocupacion || null, grupoSanguineo: formEdit.grupoSanguineo || null, alergias: formEdit.alergias || null, medicaciones: formEdit.medicaciones || null, antecedentes: formEdit.antecedentes || null, antecedentesFamiliares: formEdit.antecedentesFamiliares || null, peso: formEdit.peso ? Number(formEdit.peso) : null, altura: formEdit.altura ? Number(formEdit.altura) : null }
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
              <DatoClinico label="Obra social"  value={p.obraSocial} truncate />
              <DatoClinico label="Nro afiliado" value={p.nroAfiliado} />
              <DatoClinico label="Plan"         value={p.planObraSocial} truncate />
              <DatoClinico label="Titular"      value={p.titularObraSocial} truncate />
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
                    estudiosList.map(a => (
                      <EstudioFilaPaciente key={a.id} a={a} onAbrir={() => onAbrirEstudio(a.id)} onEliminar={() => handleEliminarEstudio(a.id)} />
                    ))
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
  const modoEdicion = !!consulta
  const [paciente,       setPaciente]       = useState(null)
  const [consultorios,   setConsultorios]   = useState([])
  const [mediosPago,     setMediosPago]     = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [form,           setForm]           = useState(modoEdicion ? {
    consultorioId: consulta.consultorioId ? String(consulta.consultorioId) : '',
    fecha:         consulta.fecha || hoyISO(),
    descripcion:   consulta.descripcion   || '',
    monto:         consulta.monto != null ? String(consulta.monto) : '',
    tipoPago:      consulta.tipoPago || 'PARTICULAR',
    medioPagoId:   consulta.medioPagoId ? String(consulta.medioPagoId) : '',
  } : { consultorioId: '', fecha: hoyISO(), descripcion: '', monto: '', tipoPago: 'PARTICULAR', medioPagoId: '' })
  const [archivosExist,  setArchivosExist]  = useState(modoEdicion ? (consulta.archivos || []) : [])
  const [archivos,       setArchivos]       = useState([])
  const { openConfirm, dialog }             = useConfirm()
  const [guardando,      setGuardando]      = useState(false)
  const [err,            setErr]            = useState(null)
  const [cobrarDespues,  setCobrarDespues]  = useState(modoEdicion ? consulta.monto == null : false)

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

  async function handleGuardar(e) {
    e.preventDefault()
    setErr(null); setGuardando(true)

    if (modoEdicion) {
      const body = {
        consultorioId: form.consultorioId ? Number(form.consultorioId) : null,
        fecha:         form.fecha || null,
        descripcion:   form.descripcion   || null,
        monto:         form.monto ? Number(form.monto) : null,
        tipoPago:      form.monto ? form.tipoPago : null,
        medioPagoId:   form.medioPagoId ? Number(form.medioPagoId) : null,
      }
      const res = await apiFetch(`/consultas/${consulta.id}`, { method: 'PUT', body: JSON.stringify(body) })
      if (!res) { setGuardando(false); return }
      if (res.ok) {
        for (const f of archivos) {
          const fd = new FormData(); fd.append('archivo', f)
          await apiFetch(`/consultas/${consulta.id}/archivos`, { method: 'POST', body: fd })
        }
        onVolver()
      } else {
        const e = await res.json().catch(() => null)
        setErr(e?.error || 'Error al guardar')
        setGuardando(false)
      }
    } else {
      const body = {
        pacienteId:    Number(pacienteId),
        consultorioId: form.consultorioId ? Number(form.consultorioId) : null,
        fecha:         form.fecha || null,
        descripcion:   form.descripcion   || null,
        monto:         form.monto ? Number(form.monto) : null,
        tipoPago:      form.monto ? form.tipoPago : null,
        medioPagoId:   form.medioPagoId ? Number(form.medioPagoId) : null,
      }
      const res = await apiFetch('/consultas', { method: 'POST', body: JSON.stringify(body) })
      if (!res) { setGuardando(false); return }
      if (res.ok) {
        const data = await res.json()
        for (const f of archivos) {
          const fd = new FormData(); fd.append('archivo', f)
          await apiFetch(`/consultas/${data.id}/archivos`, { method: 'POST', body: fd })
        }
        onVolver()
      } else {
        const e = await res.json().catch(() => null)
        setErr(e?.error || 'Error al guardar')
        setGuardando(false)
      }
    }
  }

  if (cargando) return <Cargando />

  const p = paciente
  const esOdontologo = usuario?.especialidadNombre?.toLowerCase().includes('odontolog')
  const edad = p?.fechaNac ? (() => {
    const today = new Date(), nac = new Date(p.fechaNac)
    let e = today.getFullYear() - nac.getFullYear()
    if (today.getMonth() < nac.getMonth() || (today.getMonth() === nac.getMonth() && today.getDate() < nac.getDate())) e--
    return e
  })() : null

  const cardStyle = { background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px 24px', flexShrink: 0 }
  const secLabel  = { fontSize: 9, fontFamily: T.mono, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5, fontWeight: 600, marginBottom: 16 }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: `1px solid ${T.gray1}`, background: T.white }}>
        <BackBtn onClick={onVolver} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black, letterSpacing: '-0.01em' }}>{modoEdicion ? 'Editar consulta' : 'Nueva consulta'}</span>
          {p && <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray5 }}>{p.apellido}, {p.nombre}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {modoEdicion && (
            <button type="button" onClick={handleEliminar} disabled={guardando} style={{ height: 34, padding: '0 14px', border: `1px solid #f5c6cb`, borderRadius: 6, background: T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 11, color: '#c00', letterSpacing: '0.04em' }}>Eliminar</button>
          )}
          <Btn onClick={handleGuardar} disabled={guardando}>{guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Guardar consulta'}</Btn>
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── left: todos los datos del paciente (igual a DetallePaciente) ── */}
        <div style={{ width: 420, flexShrink: 0, overflow: 'hidden', background: T.gray2, padding: '20px 16px 20px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', height: '100%' }}>

            {/* avatar + nombre */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.white, textTransform: 'uppercase' }}>
                  {p?.nombre?.[0]}{p?.apellido?.[0]}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.black, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p?.apellido}, {p?.nombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  {edad != null && <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5 }}>{edad} años</span>}
                  {edad != null && p?.ocupacion && <span style={{ color: T.gray3, fontSize: 10 }}>·</span>}
                  {p?.ocupacion && <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray5, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ocupacion}</span>}
                </div>
              </div>
            </div>

            {/* datos personales — 2 columnas */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 10 }}>Datos personales</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <DatoClinico label="DNI"          value={p?.dni} />
                <DatoClinico label="Nacimiento"   value={p?.fechaNac ? fmtFecha(p.fechaNac) : null} />
                <DatoClinico label="Teléfono"     value={p?.telefono} />
                <DatoClinico label="Email"        value={p?.email} truncate />
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Dirección" value={p?.direccion} truncate /></div>
                <DatoClinico label="Obra social"  value={p?.obraSocial} truncate />
                <DatoClinico label="Nro afiliado" value={p?.nroAfiliado} />
                <DatoClinico label="Plan"         value={p?.planObraSocial} truncate />
                <DatoClinico label="Titular"      value={p?.titularObraSocial} truncate />
              </div>
            </div>

            {/* datos clínicos — 2 columnas */}
            <div style={{ padding: '14px 20px', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.gray5, display: 'block', marginBottom: 10 }}>Datos clínicos</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                <DatoClinico label="Grupo sanguíneo" value={p?.grupoSanguineo} />
                <div style={{ display: 'flex', gap: 20 }}>
                  <DatoClinico label="Peso"   value={p?.peso   != null ? `${p.peso} kg`   : null} />
                  <DatoClinico label="Altura" value={p?.altura != null ? `${p.altura} cm` : null} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Alergias"               value={p?.alergias}              truncate warning /></div>
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Medicaciones"            value={p?.medicaciones}           truncate /></div>
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Antecedentes personales" value={p?.antecedentes}           truncate /></div>
                <div style={{ gridColumn: '1 / -1' }}><DatoClinico label="Antecedentes familiares" value={p?.antecedentesFamiliares} truncate /></div>
              </div>
            </div>

            {/* footer — sin botón editar */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.gray1}`, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.gray5 }}>
                Reg. {fmtFecha(p?.dateCreated)}
              </span>
            </div>

          </div>
        </div>

        {/* ── right: formulario en cards ── */}
        <form onSubmit={handleGuardar} style={{ flex: 1, overflow: 'hidden', background: T.gray2, padding: '20px 20px 20px 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Card: Clínica — consultorio arriba, campos en el medio, archivo abajo */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={secLabel}>Clínica</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: '0 0 160px' }}>
                  <FieldLabel>Fecha de la consulta</FieldLabel>
                  <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Consultorio</FieldLabel>
                  <select value={form.consultorioId} onChange={e => setForm(f => ({ ...f, consultorioId: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                    <option value="">Sin consultorio</option>
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
                {archivosExist.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {archivosExist.map(arch => (
                      <span key={arch.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid ${T.gray1}`, borderRadius: 4, fontSize: 10, fontFamily: T.font, color: T.gray4, background: T.white }}>
                        📎 {arch.nombre}
                        <button type="button" onClick={() => handleEliminarArchivoExist(arch.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: '#c00', lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* adjuntar nuevos */}
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 12px', border: `1px solid ${T.gray1}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, color: T.gray4, background: T.white, userSelect: 'none' }}>
                      + Adjuntar archivo
                    </span>
                    <span style={{ fontSize: 10, fontFamily: T.font, color: T.gray5 }}>imagen o PDF</span>
                    <input type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])} />
                  </label>
                  {archivos.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {archivos.map((f, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', border: `1px solid #d4edda`, borderRadius: 4, fontSize: 10, fontFamily: T.font, color: T.gray4, background: '#f8fff8' }}>
                          📎 {f.name}
                          <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: T.gray4, lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Odontograma — solo para odontólogos */}
            {esOdontologo && (
              <div style={cardStyle}>
                <div style={secLabel}>Odontograma</div>
                <Odontograma apiFetch={apiFetch} pacienteId={pacienteId} />
              </div>
            )}

            {/* Card: Pago */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={secLabel}>Pago</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ fontFamily: T.font, fontSize: 12, color: cobrarDespues ? T.black : T.gray4, fontWeight: cobrarDespues ? 600 : 400 }}>
                    Registrar cobro después
                  </span>
                  <div onClick={() => setCobrarDespues(v => !v)} style={{ width: 36, height: 20, borderRadius: 10, background: cobrarDespues ? T.black : T.gray1, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: cobrarDespues ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: T.white, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </label>
              </div>
              {!cobrarDespues && <>
                <div>
                  <FieldLabel>Tipo de pago *</FieldLabel>
                  <div style={{ display: 'flex', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, overflow: 'hidden', maxWidth: 300 }}>
                    {Object.entries(TIPO_PAGO).map(([op, label], idx, arr) => (
                      <button key={op} type="button" onClick={() => setForm(f => ({ ...f, tipoPago: op }))}
                        style={{ flex: 1, border: 'none', borderRight: idx < arr.length - 1 ? `1px solid ${T.gray1}` : 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: form.tipoPago === op ? T.black : T.white, color: form.tipoPago === op ? T.white : T.black, transition: 'background 0.15s, color 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ maxWidth: 180 }}>
                    <FieldLabel>Monto</FieldLabel>
                    <Input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="Sin cobro" />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <FieldLabel>Medio de pago</FieldLabel>
                    <select value={form.medioPagoId} onChange={e => setForm(f => ({ ...f, medioPagoId: e.target.value }))}
                      style={{ width: '100%', height: 36, border: `1px solid ${T.gray1}`, borderRadius: 6, padding: '0 10px', fontFamily: T.font, fontSize: 13, color: T.black, background: T.white, outline: 'none' }}>
                      <option value="">Sin especificar</option>
                      {mediosPago.map(mp => <option key={mp.id} value={mp.id}>{mp.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </>}
              {cobrarDespues && (
                <div style={{ fontSize: 11, fontFamily: T.font, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px' }}>
                  El ingreso quedará como <strong>pendiente</strong> hasta que se registre el cobro.
                </div>
              )}
            </div>

            <ErrorMsg>{err}</ErrorMsg>
          </div>
        </form>
      </div>
      {dialog}
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {consultas.map((a, i) => (
        <ConsultaHCItem key={a.id} a={a} last={i === consultas.length - 1} apiFetch={apiFetch} onEditar={() => onEditarConsulta?.(a)} />
      ))}
    </div>
  )
}

function ConsultaHCItem({ a, last, apiFetch, onEditar }) {
  const [hov, setHov] = useState(false)
  const fmtM = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null

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
      style={{ padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${T.gray2}`, display: 'flex', gap: 20, background: hov ? T.gray2 : 'transparent', transition: 'background 0.1s', cursor: 'pointer' }}
    >
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ fontSize: 11, fontFamily: T.font, color: T.black, letterSpacing: '0.04em' }}>{a.fecha || fmtFecha(a.dateCreated)}</div>
        {a.consultorioNombre && (
          <div style={{ marginTop: 4, fontSize: 10, fontFamily: T.font, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray5, fontWeight: 500 }}>
            {a.consultorioNombre}
          </div>
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
        {a.monto != null
          ? <div style={{ fontSize: 15, fontFamily: T.font, fontWeight: 500, color: T.black }}>{fmtM(a.monto)}</div>
          : <div style={{ fontSize: 9, fontFamily: T.mono, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4, borderLeft: '2px solid #f59e0b', paddingLeft: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>Cobro pendiente</div>
        }
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
    borderRadius: 6, boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
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
          <div><FieldLabel>Plan de obra social</FieldLabel><Input name="planObraSocial" value={form.planObraSocial} onChange={handleChange} /></div>
          <div><FieldLabel>Titular de obra social</FieldLabel><Input name="titularObraSocial" value={form.titularObraSocial} onChange={handleChange} /></div>
        </div>
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

function VistaConsultas({ apiFetch, onIrAConsultorios, usuario, filtroPendienteInicial = false }) {
  const [items,          setItems]          = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [error,          setError]          = useState(null)
  const [buscar,         setBuscar]         = useState('')
  const [soloPendientes, setSoloPendientes] = useState(filtroPendienteInicial)
  const [vistaMode,      setVistaMode]      = useState(() => localStorage.getItem('consultas-vista') ?? 'list')
  const [sub,            setSub]            = useState('lista')
  const [pacienteSelecId, setPacienteSelecId] = useState(null)
  const [modalPac,       setModalPac]       = useState(false)
  const [pacientes,      setPacientes]      = useState([])
  const [pacSelecTemp,   setPacSelecTemp]   = useState('')
  const [sinConsultorios, setSinConsultorios] = useState(false)

  function toggleVista(v) { setVistaMode(v); localStorage.setItem('consultas-vista', v) }

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

  function volverALista() {
    setSub('lista')
    setPacienteSelecId(null)
    cargar()
  }

  if (sub === 'nueva-consulta') {
    return <VistaNuevaConsulta apiFetch={apiFetch} pacienteId={pacienteSelecId} onVolver={volverALista} usuario={usuario} />
  }

  const pendientesCount = items.filter(i => i.monto == null).length
  const filtradas = items
    .filter(i => !soloPendientes || i.monto == null)
    .filter(i => !buscar.trim() || `${i.pacienteApellido} ${i.pacienteNombre} ${i.descripcion ?? ''}`.toLowerCase().includes(buscar.toLowerCase()))

  const fmtMonto = m => m != null ? `$${Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const fmtTipo  = t => TIPO_PAGO[t] ?? t

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>Consultas</PageTitle>
        <Btn onClick={abrirNuevaConsulta}>Iniciar consulta</Btn>
      </PageBar>

      <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.white, borderRadius: 8, border: `1px solid ${T.gray1}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: `1px solid ${T.gray1}`, height: 32, paddingLeft: 10, flex: 1, maxWidth: 360, borderRadius: 6, background: T.gray2 }}>
              <span style={{ fontSize: 14, color: T.gray3, marginRight: 6, lineHeight: 1 }}>⌕</span>
              <input
                value={buscar} onChange={e => setBuscar(e.target.value)}
                placeholder="Buscar por paciente o práctica…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: T.font, color: T.black, letterSpacing: '0.04em', width: '100%' }}
              />
            </div>
            {pendientesCount > 0 && (
              <button onClick={() => setSoloPendientes(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 6, border: soloPendientes ? '1px solid #f59e0b' : `1px solid ${T.gray1}`, background: soloPendientes ? '#fffbeb' : T.white, cursor: 'pointer', fontFamily: T.font, fontSize: 12, fontWeight: soloPendientes ? 600 : 400, color: soloPendientes ? '#92400e' : T.gray4, transition: 'all 0.15s' }}>
                Cobros pendientes
                <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '1px 6px' }}>{pendientesCount}</span>
              </button>
            )}
            <ViewToggle vista={vistaMode} onToggle={toggleVista} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {vistaMode === 'list' ? (
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => setModalPac(false)}>Cancelar</Btn>
              <Btn onClick={confirmarPaciente} disabled={!pacSelecTemp}>Continuar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConsultaFila({ a, fmtMonto, fmtTipo }) {
  const [hov, setHov] = useState(false)
  const pendiente = a.monto == null
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '0 24px', minHeight: 50, alignItems: 'center', borderBottom: `1px solid ${T.gray2}`, background: hov ? T.gray2 : T.white, borderLeft: pendiente ? '3px solid #f59e0b' : 'none', transition: 'background 0.1s' }}
    >
      <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, letterSpacing: '0.02em' }}>{a.pacienteApellido}, {a.pacienteNombre}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em', paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.descripcion || '—'}</span>
      {pendiente
        ? <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cobro pendiente</span>
        : <span style={{ fontFamily: T.font, fontSize: 12, color: T.black, letterSpacing: '0.02em' }}>{fmtMonto(a.monto)}</span>
      }
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{fmtTipo(a.tipoPago)}</span>
      <span style={{ fontFamily: T.font, fontSize: 12, color: T.gray4, letterSpacing: '0.02em' }}>{a.consultorioNombre || '—'}</span>
      <span style={{ fontFamily: T.font, fontSize: 11, color: T.gray3, letterSpacing: '0.04em' }}>{a.fecha || fmtFecha(a.dateCreated)}</span>
    </div>
  )
}

function ConsultaCard({ a, fmtMonto, fmtTipo }) {
  const [hov, setHov] = useState(false)
  const pendiente = a.monto == null
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 240, border: hov ? `1px solid ${T.black}` : `1px solid ${T.gray1}`, borderLeft: pendiente ? '3px solid #f59e0b' : hov ? `3px solid ${T.black}` : `3px solid ${T.gray1}`, background: T.white, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s, box-shadow 0.15s', borderRadius: 8, boxShadow: hov ? '0 2px 12px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: T.black, fontFamily: T.font, lineHeight: 1.3 }}>
        {a.pacienteApellido}, {a.pacienteNombre}
      </div>
      {a.descripcion && (
        <div style={{ fontSize: 11, color: T.gray4, fontFamily: T.font, lineHeight: 1.4, letterSpacing: '0.02em' }}>
          {a.descripcion}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        {pendiente
          ? <span style={{ fontFamily: T.mono, fontSize: 9, color: T.gray4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cobro pendiente</span>
          : <>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.black, fontFamily: T.font }}>{fmtMonto(a.monto)}</span>
              <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.gray4, fontFamily: T.font }}>{fmtTipo(a.tipoPago)}</span>
            </>
        }
      </div>
      {a.consultorioNombre && (
        <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>{a.consultorioNombre}</div>
      )}
      <div style={{ fontSize: 10, color: T.gray5, fontFamily: T.font, letterSpacing: '0.04em', marginTop: 2 }}>{a.fecha || fmtFecha(a.dateCreated)}</div>
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
  const [sub,          setSub]          = useState(onVolver ? (estudioIdInicial ? 'cargando' : 'upload') : 'lista')
  const [lista,        setLista]        = useState([])
  const [cargandoLista,setCargandoLista]= useState(true)
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
  const { openConfirm, dialog: confirmDialog } = useConfirm()

  const cargarLista = useCallback(async () => {
    setCargandoLista(true)
    const res = await apiFetch('/estudios')
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
    const det = await apiFetch(`/estudios/${asignandoId}`)
    if (!det?.ok) return
    const data = await det.json()
    await apiFetch(`/estudios/${asignandoId}`, {
      method: 'PUT',
      body: JSON.stringify({ pacienteId: Number(pacSelId), trazos: data.trazos ?? [], escala: data.escala ?? 1 })
    })
    setAsignandoId(null)
    cargarLista()
  }

  useEffect(() => { if (sub === 'lista') cargarLista() }, [sub, cargarLista])

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
    setSubiendo(true); setErrSubida(null); setPendingFile(null)
    const fd = new FormData()
    fd.append('imagen', file)
    fd.append('nombre', nombreFinal || file.name)
    fd.append('escala', '1')
    if (pacienteIdInicial) fd.append('pacienteId', pacienteIdInicial)
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
    cargarLista()
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

  function getCoordsFromEvent(e) { const r = canvasRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
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
  const canvasCursor = herramienta === 'borrar' ? ERASER_CURSOR : (herramienta === 'angulo-lineas' || herramienta === 'longitud') ? (lineaHover !== -1 ? 'pointer' : 'default') : 'crosshair'

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

  // ── UPLOAD (desde paciente) ──
  if (sub === 'upload') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageBar>
        <BackBtn onClick={onVolver} />
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

  // ── LISTA ──
  if (sub === 'lista') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>
      <PageBar>
        <PageTitle>Estudios</PageTitle>
        <div>
          <Btn onClick={() => inputRef.current?.click()} disabled={subiendo}>
            {subiendo ? 'Subiendo…' : '+ Nuevo estudio'}
          </Btn>
          <input ref={inputRef} type="file" accept="image/*" onChange={e => seleccionarArchivo(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      </PageBar>
      <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.white, borderRadius: 8, border: `1px solid ${T.gray1}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TableHead cols={COLS_ANALISIS} />
            <EmptyOrError cargando={cargandoLista} error={null} empty={lista.length === 0} msg="No hay estudios guardados" />
            {lista.map(a => (
              <EstudioFila key={a.id} a={a} onClick={() => cargarEstudio(a.id)} onEliminar={() => handleEliminar(a.id)} onAsignar={!a.pacienteApellido ? () => abrirAsignacion(a.id) : null} />
            ))}
          </div>
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
      {confirmDialog}
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

        {/* Card imagen / canvas */}
        <div
          ref={containerRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: T.black, borderRadius: 12 }}
        >
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={imagen} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, cursor: canvasCursor }} onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseLeave={() => { setMouse(null); setLineaHover(-1); setBorrarHover(-1) }} />
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
    if (!await openConfirm('Se creará un odontograma nuevo en blanco. El actual quedará guardado en el historial. ¿Continuar?')) return
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

function VistaTurnos({ apiFetch }) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [semanaInicio,    setSemanaInicio]    = useState(() => startOfWeek(new Date()))
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

  const semanaFin = addDays(semanaInicio, 6)

  const cargarTurnos = useCallback(async () => {
    setCargando(true)
    const desde = toLocalISOString(semanaInicio)
    const hasta = toLocalISOString(addDays(semanaFin, 1))
    const res = await apiFetch(`/turnos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`)
    if (res?.ok) setTurnos(await res.json())
    setCargando(false)
  }, [apiFetch, semanaInicio])

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

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i))
  const DIAS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

  function turnosDelDia(dia) {
    return turnos.filter(t => {
      const td = new Date(t.fechaHora)
      return td.getFullYear() === dia.getFullYear() &&
             td.getMonth()    === dia.getMonth()    &&
             td.getDate()     === dia.getDate()
    }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
  }

  function nombrePaciente(t) {
    if (t.pacienteNombre) return `${t.pacienteApellido ?? ''} ${t.pacienteNombre}`.trim()
    return t.nombrePacienteLibre || 'Sin nombre'
  }

  function formatHora(fechaHora) {
    const d = new Date(fechaHora)
    if (isNaN(d)) return ''
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const fmtRangoSemana = () => {
    const d1 = diasSemana[0], d7 = diasSemana[6]
    if (d1.getMonth() === d7.getMonth())
      return `${d1.getDate()} – ${d7.getDate()} ${MESES[d1.getMonth()]} ${d1.getFullYear()}`
    return `${d1.getDate()} ${MESES[d1.getMonth()]} – ${d7.getDate()} ${MESES[d7.getMonth()]} ${d7.getFullYear()}`
  }

  const selectStyle = {
    height: 36, width: '100%', padding: '0 10px',
    border: `1px solid ${T.gray1}`, borderRadius: 0,
    fontFamily: T.font, fontSize: 13, color: T.black,
    background: T.white, outline: 'none', appearance: 'none',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* top bar */}
      <PageBar>
        <PageTitle>Turnos</PageTitle>
        <Btn onClick={() => abrirNuevo(new Date())}>+ Nuevo turno</Btn>
      </PageBar>

      {/* calendar connect banner */}
      {calConectado === false && (
        <div style={{ background: '#fef9c3', borderBottom: `1px solid #ca8a04`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontFamily: T.font, color: '#713f12', flex: 1 }}>
            Conectá tu Google Calendar para sincronizar turnos automáticamente.
          </span>
          <Btn size="sm" onClick={conectarCalendar}>Conectar Google Calendar</Btn>
        </div>
      )}
      {calConectado === true && (
        <div style={{ background: '#f0fdf4', borderBottom: `1px solid #86efac`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontFamily: T.font, color: '#166534', flex: 1 }}>
            Google Calendar conectado. Los turnos se sincronizan automáticamente.
          </span>
          <Btn size="sm" variant="ghost" onClick={desconectarCalendar}>Desconectar</Btn>
        </div>
      )}

      {/* body: today panel + calendar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── panel Hoy ── */}
        <div style={{ width: 260, flexShrink: 0, padding: '16px 16px 16px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0 }}>
              <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.black, letterSpacing: '-0.02em', display: 'block' }}>
                Turnos de hoy
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4 }}>
                {DIAS_LABELS[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1]} {hoy.getDate()} {MESES[hoy.getMonth()]}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {turnosDelDia(hoy).length === 0 ? (
                <div style={{ padding: '28px 18px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>
                  Sin turnos hoy
                </div>
              ) : (
                turnosDelDia(hoy).map(t => {
                  const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                  return (
                    <div key={t.id} onClick={() => abrirEditar(t)}
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
        </div>

        {/* ── calendario ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* week navigation */}
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${T.gray1}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => setSemanaInicio(s => addDays(s, -7))}
          style={{ background: 'none', border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gray4 }}>
          ‹
        </button>
        <button onClick={() => setSemanaInicio(startOfWeek(new Date()))}
          style={{ background: 'none', border: `1px solid ${T.gray1}`, cursor: 'pointer', height: 30, padding: '0 12px', fontFamily: T.font, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4 }}>
          Hoy
        </button>
        <button onClick={() => setSemanaInicio(s => addDays(s, 7))}
          style={{ background: 'none', border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gray4 }}>
          ›
        </button>
        <span style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, letterSpacing: '0.04em' }}>{fmtRangoSemana()}</span>
      </div>

      {/* calendar grid */}
      {(() => {
        const HORA_INICIO = 7, HORA_FIN = 21, ALTO_HORA = 80
        const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
        return (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* sticky day headers */}
            <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${T.gray1}`, background: T.white }}>
              <div style={{ width: 52, flexShrink: 0 }} />
              {diasSemana.map((dia, i) => {
                const esHoy = dia.getFullYear() === hoy.getFullYear() && dia.getMonth() === hoy.getMonth() && dia.getDate() === hoy.getDate()
                return (
                  <div key={i} style={{ flex: 1, padding: '8px 10px', borderLeft: `1px solid ${T.gray1}`, background: esHoy ? T.black : T.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: T.font, letterSpacing: '0.1em', textTransform: 'uppercase', color: esHoy ? T.white : T.gray3 }}>{DIAS_LABELS[i]}</span>
                    <span style={{ fontSize: 13, fontFamily: T.font, fontWeight: 500, color: esHoy ? T.white : T.black }}>{dia.getDate()}</span>
                  </div>
                )
              })}
            </div>

            {/* scrollable time grid */}
            {cargando ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Cargando…</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
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
                  {diasSemana.map((dia, di) => (
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
                      {/* appointments */}
                      {turnosDelDia(dia).map(t => {
                        const d = new Date(t.fechaHora)
                        const top = (d.getHours() - HORA_INICIO + d.getMinutes() / 60) * ALTO_HORA
                        const height = Math.max((t.duracionMinutos / 60) * ALTO_HORA, 22)
                        const col = ESTADO_TURNO_COLORS[t.estado] ?? ESTADO_TURNO_COLORS.PENDIENTE
                        return (
                          <div key={t.id}
                            onClick={e => { e.stopPropagation(); abrirEditar(t) }}
                            style={{ position: 'absolute', top, left: 4, right: 4, height, background: col.bg, border: `1px solid ${col.border}`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer', overflow: 'hidden', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1, boxSizing: 'border-box' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: col.text, fontFamily: T.font }}>{formatHora(t.fechaHora)}</span>
                            <span style={{ fontSize: 11, color: col.text, fontFamily: T.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePaciente(t)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}

                </div>
              </div>
            )}
          </div>
        )
      })()}
        </div> {/* fin wrapper calendario */}
      </div>   {/* fin body (panel + calendario) */}

      {/* create / edit modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={cerrarModal}>
          <div style={{ background: T.white, border: `1px solid ${T.gray1}`, width: 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <FieldLabel>Fecha *</FieldLabel>
                  <Input type="date" value={(form.fechaHora || '').split('T')[0]} onChange={e => setForm(f => ({ ...f, fechaHora: e.target.value + 'T' + ((f.fechaHora || '').split('T')[1] || '09:00') }))} />
                </div>
                <div>
                  <FieldLabel>Hora *</FieldLabel>
                  <Input type="time" value={(form.fechaHora || '').split('T')[1] || ''} onChange={e => setForm(f => ({ ...f, fechaHora: ((f.fechaHora || '').split('T')[0] || '') + 'T' + e.target.value }))} />
                </div>
                <div>
                  <FieldLabel>Duración (minutos)</FieldLabel>
                  <select name="duracionMinutos" value={form.duracionMinutos} onChange={handleChange} style={selectStyle}>
                    {[15, 20, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <FieldLabel>Consultorio</FieldLabel>
                  <select name="consultorioId" value={form.consultorioId} onChange={handleChange} style={selectStyle}>
                    <option value="">Sin especificar</option>
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
                  <Btn type="submit" disabled={guardando}>{guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear turno'}</Btn>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
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

function VistaFinanzas({ apiFetch, onIrAConsultas }) {
  const hoy = new Date()
  const [año,      setAño]      = useState(hoy.getFullYear())
  const [mes,      setMes]      = useState(hoy.getMonth() + 1)
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
  const [buscarMov,    setBuscarMov]    = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const q = `mes=${mesStr(año, mes)}`
    const [resRes, ingRes, egrRes] = await Promise.all([
      apiFetch(`/finanzas/resumen?${q}`),
      apiFetch(`/finanzas/ingresos?${q}`),
      apiFetch(`/finanzas/egresos?${q}`),
    ])
    if (resRes?.ok) setResumen(await resRes.json())
    if (ingRes?.ok) setIngresos(await ingRes.json())
    if (egrRes?.ok) setEgresos(await egrRes.json())
    setCargando(false)
  }, [apiFetch, año, mes])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    apiFetch('/medios-pago').then(r => r?.ok && r.json().then(setMediosPago))
    apiFetch('/consultorios').then(r => r?.ok && r.json().then(setConsultorios))
  }, [apiFetch])

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

  const confirmados        = ingresosFiltrados.filter(i => i.estado === 'CONFIRMADO')
  const pendientes         = ingresosFiltrados.filter(i => i.estado === 'PENDIENTE')
  const totalConfirmadosNum = confirmados.reduce((s, i) => s + Number(i.monto ?? 0), 0)
  const totalGlobalNum     = ingresos.filter(i => i.estado === 'CONFIRMADO').reduce((s, i) => s + Number(i.monto ?? 0), 0)
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

  const breakdownMp   = agrupar(confirmados, i => i.medioPagoNombre)
  const breakdownTipo = agrupar(confirmados, i => TIPO_PAGO[i.tipoPago] ?? i.tipoPago)

  const egresosFiltrados  = egresos.filter(e => !filtroCons || e.consultorioNombre === filtroCons)
  const totalEgresosNum   = egresosFiltrados.reduce((s, e) => s + Number(e.monto ?? 0), 0)
  const saldoNum          = totalConfirmadosNum - totalEgresosNum

  const resumenPorConsultorio = consultorios.map(c => {
    const ingC = ingresos.filter(i => i.consultorioNombre === c.nombre && i.estado === 'CONFIRMADO')
    const egrC = egresos.filter(e => e.consultorioNombre === c.nombre)
    const totalIng = ingC.reduce((s, i) => s + Number(i.monto ?? 0), 0)
    const totalEgr = egrC.reduce((s, e) => s + Number(e.monto ?? 0), 0)
    return { id: c.id, nombre: c.nombre, totalIng, totalEgr, balance: totalIng - totalEgr }
  })

  const movimientos = [
    ...ingresosFiltrados.map(i => ({
      tipo: 'ingreso',
      fecha: i.fecha ?? i.dateCreated?.slice(0, 10) ?? '',
      descripcion: i.consultaId
        ? `Consulta · ${[i.pacienteApellido, i.pacienteNombre].filter(Boolean).join(', ')}`
        : (i.descripcion || 'Ingreso libre'),
      monto: Number(i.monto ?? 0),
      estado: i.estado,
    })),
    ...egresosFiltrados.map(e => ({
      tipo: 'egreso',
      fecha: e.fecha ?? '',
      descripcion: e.descripcion || 'Sin descripción',
      monto: Number(e.monto ?? 0),
      estado: null,
    })),
  ].sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0))

  const navBtnStyle = { background: 'none', border: `1px solid ${T.gray1}`, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gray4, borderRadius: 6 }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray2 }}>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: T.black }}>Finanzas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button style={navBtnStyle} onClick={() => navMes(-1)}>‹</button>
            <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.black, minWidth: 110, textAlign: 'center' }}>
              {MESES_LABEL[mes - 1]} {año}
            </span>
            <button style={navBtnStyle} onClick={() => navMes(1)}>›</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={() => setModalEgreso(true)}>+ Egreso</Btn>
          <Btn onClick={() => setModal(true)}>+ Ingreso</Btn>
        </div>
      </div>

      {/* ── botones consultorio ── */}
      <div style={{ padding: '0 24px 12px', display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        {[{ id: '', nombre: 'Total' }, ...consultorios].map(c => {
          const sel = filtroCons === (c.id === '' ? '' : c.nombre)
          return (
            <button key={c.id === '' ? '__total' : c.id}
              onClick={() => setFiltroCons(c.id === '' ? '' : c.nombre)}
              style={{ background: sel ? T.black : T.white, color: sel ? T.white : T.black, border: `1px solid ${sel ? T.black : T.gray1}`, borderRadius: 20, padding: '0 14px', height: 30, fontFamily: T.font, fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              {c.nombre}
            </button>
          )
        })}
      </div>

      {/* ── stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 24px 16px', flexShrink: 0 }}>
        <StatCard inverted label="Ingresos" value={totalCobros} sub="confirmados" pendienteInfo={{ count: pendienteCount, onVer: onIrAConsultas }} />
        <StatCard label="Egresos" value={cargando ? null : fmtPesos(totalEgresosNum)} bottomRight={cargando ? null : fmtPesos(saldoNum)} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '0 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, height: '100%' }}>

          {/* ── breakdowns ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>Por medio de pago</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {cargando && <div style={{ padding: '0 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                {!cargando && breakdownMp.length === 0 && (
                  <div style={{ padding: '0 20px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin cobros</div>
                )}
                {!cargando && breakdownMp.length > 0 && <PieChart items={breakdownMp} />}
              </div>
            </div>

            <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.gray3 }}>Por tipo de pago</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {cargando && <div style={{ padding: '0 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                {!cargando && breakdownTipo.length === 0 && (
                  <div style={{ padding: '0 20px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin cobros</div>
                )}
                {!cargando && breakdownTipo.length > 0 && <PieChart items={breakdownTipo} />}
              </div>
            </div>

          </div>

          {/* ── tabla movimientos ── */}
          {(() => {
            const movsFiltrados = buscarMov
              ? movimientos.filter(m => m.descripcion.toLowerCase().includes(buscarMov.toLowerCase()))
              : movimientos
            return (
              <div style={{ background: T.white, borderRadius: 12, border: `1px solid ${T.gray1}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.gray1}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.black, letterSpacing: '-0.01em' }}>Movimientos</span>
                  <input
                    value={buscarMov}
                    onChange={e => setBuscarMov(e.target.value)}
                    placeholder="Buscar por descripción…"
                    style={{ fontFamily: T.font, fontSize: 12, border: `1px solid ${T.gray1}`, borderRadius: 20, padding: '5px 14px', outline: 'none', color: T.black, width: 200, background: T.gray2 }}
                  />
                </div>
                {cargando && <div style={{ padding: '2rem 20px', fontSize: 11, color: T.gray4, fontFamily: T.font }}>Cargando…</div>}
                {!cargando && movsFiltrados.length === 0 && (
                  <div style={{ padding: '2rem 20px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray5, fontFamily: T.font }}>Sin movimientos</div>
                )}
                {!cargando && movsFiltrados.length > 0 && (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 100px', columnGap: 16, padding: '8px 20px', borderBottom: `1px solid ${T.gray1}`, position: 'sticky', top: 0, background: T.white }}>
                      {['Tipo', 'Descripción', 'Fecha', 'Monto'].map(h => (
                        <span key={h} style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.gray4 }}>{h}</span>
                      ))}
                    </div>
                    {movsFiltrados.map((m, idx) => {
                      const esIngreso = m.tipo === 'ingreso'
                      const pendiente = m.estado === 'PENDIENTE'
                      const [y, mo, d] = (m.fecha || '').split('-')
                      const fechaFmt = m.fecha ? `${d}/${mo}/${y}` : '—'
                      const borderLeft = pendiente ? '3px solid #f59e0b' : esIngreso ? 'none' : '3px solid #9b1c1c'
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 100px', columnGap: 16, padding: '11px 20px', borderBottom: `1px solid ${T.gray1}`, alignItems: 'center', borderLeft }}>
                          <span style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', background: T.gray2, color: T.gray4, padding: '3px 8px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                            {pendiente ? 'Pendiente' : esIngreso ? 'Ingreso' : 'Egreso'}
                          </span>
                          <span style={{ fontFamily: T.font, fontSize: 12, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.descripcion}
                          </span>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gray4 }}>{fechaFmt}</span>
                          <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.black, textAlign: 'right' }}>
                            {esIngreso ? '' : '−'}{fmtPesos(m.monto)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

        </div>
      </div>

      {/* ── modal ingreso libre ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
             onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: T.white, borderRadius: 16, width: 420, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
             onClick={e => e.target === e.currentTarget && setModalEgreso(false)}>
          <div style={{ background: T.white, borderRadius: 16, width: 400, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
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
    </div>
  )
}
