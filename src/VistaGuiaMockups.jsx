import { T } from './App.jsx'

/**
 * Mockups SVG de las pantallas principales de la app. Son representaciones visuales
 * (no screenshots reales) — reproducen el layout, colores, tipografía y iconografía
 * del sistema. Sirven para que un lead que no está registrado se dé una idea de cómo
 * se ve la app sin necesidad de tener capturas reales.
 *
 * Cada mockup tiene viewBox 800x500 (16:10) y usa exactamente los tokens de color
 * de T (App.jsx), así que si cambian los colores del sistema, los mockups siguen.
 */

// Sidebar común a todas las pantallas del sistema. `active` = key del item activo.
function Sidebar({ active = 'dashboard' }) {
  const items = [
    { key: 'dashboard',  label: 'Inicio',      group: 'diario' },
    { key: 'pacientes',  label: 'Pacientes',   group: 'diario' },
    { key: 'turnos',     label: 'Turnos',      group: 'diario' },
    { key: 'estudios',   label: 'Estudios',    group: 'diario' },
    { key: 'finanzas',   label: 'Finanzas',    group: 'diario' },
    { key: 'ajustes',    label: 'Ajustes',     group: 'config' },
  ]
  const grupos = [
    { key: 'diario', label: 'USO DIARIO' },
    { key: 'config', label: 'CONFIGURACIÓN' },
  ]
  let y = 44
  const rows = []
  for (const g of grupos) {
    rows.push({ tipo: 'header', label: g.label, y })
    y += 18
    for (const it of items.filter(i => i.group === g.key)) {
      rows.push({ tipo: 'item', ...it, y })
      y += 22
    }
    y += 8
  }
  return (
    <g>
      {/* fondo sidebar */}
      <rect x="0" y="0" width="160" height="500" fill={T.white} />
      <rect x="160" y="0" width="1" height="500" fill={T.gray1} />
      {/* logo */}
      <rect x="14" y="16" width="16" height="16" rx="4" fill={T.black} />
      <text x="34" y="28" fontFamily={T.font} fontSize="10" fontWeight="600" fill={T.black}>holaDoc</text>
      {rows.map((r, i) => {
        if (r.tipo === 'header') return (
          <text key={i} x="16" y={r.y} fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray3}>{r.label}</text>
        )
        const active_ = r.key === active
        return (
          <g key={i}>
            {active_ && <rect x="10" y={r.y - 10} width="140" height="18" rx="9" fill={T.black} />}
            <text x="22" y={r.y + 2} fontFamily={T.font} fontSize="9" fontWeight={active_ ? 600 : 500} fill={active_ ? T.white : T.gray4}>{r.label}</text>
          </g>
        )
      })}
      {/* Cerrar sesión pill al pie */}
      <rect x="14" y="470" width="132" height="18" rx="9" fill="none" stroke={T.gray1} />
      <text x="80" y="482" textAnchor="middle" fontFamily={T.font} fontSize="8.5" fontWeight="500" fill={T.gray4}>Cerrar sesión</text>
    </g>
  )
}

// Frame común del mockup: viewBox 800×500, fondo T.gray2 en el área de main.
function Frame({ children }) {
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Fondo global */}
      <rect x="0" y="0" width="800" height="500" fill={T.gray2} />
      {children}
    </svg>
  )
}

export function MockupInicio() {
  return (
    <Frame>
      <Sidebar active="dashboard" />
      {/* Header: saludo + fecha */}
      <text x="184" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Buen día, Nicolás</text>
      <text x="184" y="58" fontFamily={T.font} fontSize="9" fill={T.gray4}>Esto es lo que tenés hoy.</text>
      <text x="790" y="46" textAnchor="end" fontFamily={T.mono} fontSize="7" letterSpacing="1.5" fill={T.gray4}>VIERNES 3 DE JULIO</text>

      {/* Card negro: Tu agenda de hoy */}
      <rect x="184" y="76" width="600" height="150" rx="12" fill={T.black} />
      <text x="200" y="94" fontFamily={T.mono} fontSize="7" letterSpacing="1.5" fill="rgba(255,255,255,0.45)">TU AGENDA DE HOY</text>
      <text x="768" y="94" textAnchor="end" fontFamily={T.mono} fontSize="7" letterSpacing="1" fill="rgba(255,255,255,0.55)">4 turnos · próximo 10:00</text>

      {/* Turno destacado (próximo) blanco */}
      <rect x="200" y="106" width="568" height="34" rx="7" fill={T.white} />
      <text x="216" y="127" fontFamily={T.font} fontSize="14" fontWeight="700" letterSpacing="-0.3" fill={T.black}>10:00</text>
      <text x="270" y="122" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>Gómez, Juan</text>
      <text x="270" y="133" fontFamily={T.font} fontSize="8" fill={T.gray4}>Consulta · Swiss Medical · Casa Central</text>
      <rect x="702" y="116" width="52" height="14" rx="7" fill={T.black} />
      <text x="728" y="126" textAnchor="middle" fontFamily={T.mono} fontSize="6.5" fontWeight="700" letterSpacing="0.8" fill={T.white}>PRÓXIMO</text>

      {/* Turno 2 oscuro */}
      <rect x="200" y="146" width="568" height="34" rx="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <text x="216" y="167" fontFamily={T.font} fontSize="14" fontWeight="700" fill={T.white}>11:30</text>
      <text x="270" y="162" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.white}>Pérez, Nicolás</text>
      <text x="270" y="173" fontFamily={T.font} fontSize="8" fill="rgba(255,255,255,0.55)">Control · Particular · Casa Central</text>
      <rect x="686" y="156" width="68" height="14" rx="7" fill="rgba(74,222,128,0.14)" stroke="rgba(74,222,128,0.35)" />
      <text x="720" y="166" textAnchor="middle" fontFamily={T.mono} fontSize="6.5" fontWeight="700" letterSpacing="0.8" fill="#4ade80">CONFIRMADO</text>

      {/* Turno 3 oscuro */}
      <rect x="200" y="186" width="568" height="34" rx="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <text x="216" y="207" fontFamily={T.font} fontSize="14" fontWeight="700" fill={T.white}>15:00</text>
      <text x="270" y="202" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.white}>López, María</text>
      <text x="270" y="213" fontFamily={T.font} fontSize="8" fill="rgba(255,255,255,0.55)">Endodoncia · OSDE · Villa Cabrera</text>
      <rect x="672" y="196" width="82" height="14" rx="7" fill="rgba(251,146,60,0.14)" stroke="rgba(251,146,60,0.35)" />
      <text x="713" y="206" textAnchor="middle" fontFamily={T.mono} fontSize="6.5" fontWeight="700" letterSpacing="0.8" fill="#fb923c">SIN CONFIRMAR</text>

      {/* Alerta 1 */}
      <rect x="184" y="240" width="292" height="60" rx="9" fill={T.white} />
      <rect x="184" y="240" width="4" height="60" fill="#f97316" />
      <text x="200" y="266" fontFamily={T.font} fontSize="24" fontWeight="700" letterSpacing="-0.7" fill={T.black}>3</text>
      <text x="220" y="262" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.black}>Turnos sin confirmar para mañana</text>
      <text x="220" y="274" fontFamily={T.font} fontSize="8" fill={T.gray4}>Enviale un recordatorio a tu paciente</text>
      <text x="462" y="278" fontFamily={T.font} fontSize="12" fill={T.gray4}>→</text>

      {/* Alerta 2 */}
      <rect x="492" y="240" width="292" height="60" rx="9" fill={T.white} />
      <rect x="492" y="240" width="4" height="60" fill="#f97316" />
      <text x="508" y="266" fontFamily={T.font} fontSize="24" fontWeight="700" letterSpacing="-0.7" fill={T.black}>2</text>
      <text x="528" y="262" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.black}>Cobros pendientes de obra social</text>
      <text x="528" y="274" fontFamily={T.font} fontSize="8" fill={T.gray4}>Swiss Medical · OSDE</text>
      <text x="770" y="278" fontFamily={T.font} fontSize="12" fill={T.gray4}>→</text>

      {/* Selector TU MES */}
      <text x="184" y="326" fontFamily={T.mono} fontSize="7" letterSpacing="1.5" fill={T.gray4}>TU MES</text>
      <rect x="220" y="316" width="82" height="18" rx="9" fill={T.white} stroke={T.gray1} />
      <text x="235" y="328" fontFamily={T.mono} fontSize="7" fill={T.gray4}>‹</text>
      <text x="261" y="328" textAnchor="middle" fontFamily={T.mono} fontSize="7" letterSpacing="1" fill={T.gray4}>JUL 2026</text>
      <text x="290" y="328" fontFamily={T.mono} fontSize="7" fill={T.gray4}>›</text>
      <line x1="312" y1="325" x2="784" y2="325" stroke={T.gray1} />

      {/* KPIs */}
      {[
        { x: 184, label: 'INGRESOS',      value: '25.000', tag: '↑ vs junio', pesos: true  },
        { x: 336, label: 'CONSULTAS',     value: '18',      tag: 'este mes' },
        { x: 488, label: 'PROMEDIO x DÍA', value: '3,2',    tag: 'consultas' },
        { x: 640, label: 'PACIENTES',     value: '2',       tag: 'activos' },
      ].map((k, i) => (
        <g key={i}>
          <rect x={k.x} y="346" width="144" height="80" rx="9" fill={T.white} stroke={T.gray1} />
          <text x={k.x + 16} y="366" fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray4}>{k.label}</text>
          {k.pesos && <text x={k.x + 16} y="392" fontFamily={T.font} fontSize="12" fill={T.gray4}>$</text>}
          <text x={k.x + (k.pesos ? 26 : 16)} y="392" fontFamily={T.font} fontSize="18" fontWeight="800" letterSpacing="-0.6" fill={T.black}>{k.value}</text>
          <text x={k.x + 16} y="410" fontFamily={T.font} fontSize="8" fontWeight={i === 0 ? 700 : 400} fill={i === 0 ? '#16a34a' : T.gray4}>{k.tag}</text>
        </g>
      ))}
    </Frame>
  )
}

export function MockupPacientes() {
  const pacientes = [
    { ini: 'GJ', ap: 'Gómez, Juan',      dni: '39.682.333', edad: '31 años', os: 'SWISS MEDICAL +1', ultima: 'Hace 3 días',  proximo: 'Próximo turno: 10/7' },
    { ini: 'PN', ap: 'Pérez, Nicolás',   dni: '38.984.356', edad: '32 años', os: 'SWISS MEDICAL',     ultima: 'Hace 2 meses', proximo: null },
    { ini: 'LM', ap: 'López, María',     dni: '35.121.487', edad: '38 años', os: 'OSDE',              ultima: 'Hace 1 semana', proximo: null },
  ]
  return (
    <Frame>
      <Sidebar active="pacientes" />
      {/* Header */}
      <text x="184" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Pacientes</text>
      <rect x="682" y="26" width="102" height="24" rx="12" fill={T.black} />
      <text x="733" y="42" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>+ Nuevo paciente</text>

      {/* Search */}
      <rect x="184" y="66" width="480" height="30" rx="8" fill={T.white} stroke={T.gray1} />
      <text x="196" y="85" fontFamily={T.font} fontSize="10" fill={T.gray3}>⌕  Buscar por nombre o DNI…</text>
      <text x="784" y="85" textAnchor="end" fontFamily={T.mono} fontSize="8" letterSpacing="1.2" fill={T.gray4}>3 pacientes</text>

      {/* Cards */}
      {pacientes.map((p, i) => (
        <g key={i}>
          <rect x="184" y={112 + i * 74} width="600" height="64" rx="10" fill={T.white} stroke={T.gray1} />
          <rect x="200" y={124 + i * 74} width="40" height="40" rx="9" fill={T.black} />
          <text x="220" y={149 + i * 74} textAnchor="middle" fontFamily={T.font} fontSize="12" fontWeight="700" fill={T.white}>{p.ini}</text>
          <text x="252" y={138 + i * 74} fontFamily={T.font} fontSize="12" fontWeight="700" letterSpacing="-0.2" fill={T.black}>{p.ap}</text>
          <text x="252" y={151 + i * 74} fontFamily={T.mono} fontSize="7" letterSpacing="0.8" fill={T.gray3}>DNI</text>
          <text x="268" y={151 + i * 74} fontFamily={T.mono} fontSize="8" fill={T.black}>{p.dni}</text>
          <text x="332" y={151 + i * 74} fontFamily={T.font} fontSize="8" fill={T.gray4}>{p.edad}</text>
          <rect x="252" y={158 + i * 74} width={p.os.length * 4.5 + 12} height="12" rx="4" fill={T.gray2} />
          <text x={258} y={167 + i * 74} fontFamily={T.mono} fontSize="6.5" letterSpacing="0.8" fill={T.gray4}>{p.os}</text>
          {/* right side */}
          <text x="754" y={132 + i * 74} textAnchor="end" fontFamily={T.mono} fontSize="6" letterSpacing="1.2" fill={T.gray4}>ÚLTIMA VISITA</text>
          <text x="754" y={148 + i * 74} textAnchor="end" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>{p.ultima}</text>
          {p.proximo && <text x="754" y={162 + i * 74} textAnchor="end" fontFamily={T.font} fontSize="8" fontWeight="600" fill="#16a34a">{p.proximo}</text>}
          <text x="774" y={148 + i * 74} fontFamily={T.font} fontSize="12" fill={T.gray3}>→</text>
        </g>
      ))}
    </Frame>
  )
}

export function MockupFichaPaciente() {
  // Layout: sidebar + header con back izq / [+NUEVO ESTUDIO] [INICIAR CONSULTA] der,
  // luego 2 columnas: patient card (izq, ancha) + tabs con timeline (der, más ancha).
  return (
    <Frame>
      <Sidebar active="pacientes" />

      {/* Header: back + acciones */}
      <rect x="184" y="18" width="26" height="26" rx="7" fill={T.white} stroke={T.gray1} />
      <text x="197" y="36" textAnchor="middle" fontFamily={T.font} fontSize="13" fill={T.gray4}>←</text>
      <rect x="588" y="16" width="112" height="28" rx="14" fill={T.white} stroke={T.gray1} strokeWidth="1.2" />
      <text x="644" y="34" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" letterSpacing="0.2" fill={T.black}>+ NUEVO ESTUDIO</text>
      <rect x="708" y="16" width="76" height="28" rx="14" fill={T.black} />
      <text x="746" y="34" textAnchor="middle" fontFamily={T.mono} fontSize="8" fontWeight="700" letterSpacing="0.6" fill={T.white}>INICIAR CONSULTA</text>

      {/* ============ COLUMNA IZQUIERDA — PATIENT CARD ============ */}
      <rect x="184" y="58" width="228" height="432" rx="10" fill={T.white} stroke={T.gray1} />

      {/* Header: avatar + nombre + edad */}
      <rect x="200" y="74" width="42" height="42" rx="8" fill={T.black} />
      <text x="221" y="101" textAnchor="middle" fontFamily={T.font} fontSize="13" fontWeight="700" fill={T.white}>GJ</text>
      <text x="252" y="94" fontFamily={T.font} fontSize="12" fontWeight="700" letterSpacing="-0.3" fill={T.black}>juan, gomez</text>
      <text x="252" y="108" fontFamily={T.font} fontSize="9" fill={T.gray4}>31 años</text>
      <line x1="196" y1="128" x2="400" y2="128" stroke={T.gray1} />

      {/* Chip Saldo pendiente */}
      <circle cx="208" cy="146" r="8" fill="#fef3c7" />
      <text x="208" y="149" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill="#92400e">$</text>
      <text x="224" y="145" fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray4}>SALDO PENDIENTE</text>
      <text x="224" y="157" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>$25.000 en 1 consulta</text>

      {/* Chip próximo turno */}
      <circle cx="208" cy="182" r="8" fill="#dcfce7" />
      <text x="208" y="185" textAnchor="middle" fontFamily={T.font} fontSize="10" fontWeight="700" fill="#16a34a">→</text>
      <text x="224" y="181" fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray4}>PRÓXIMO TURNO</text>
      <text x="224" y="193" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>Sin turnos agendados</text>
      <line x1="196" y1="210" x2="400" y2="210" stroke={T.gray1} />

      {/* Sección DATOS CLÍNICOS */}
      <text x="200" y="226" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray4}>DATOS CLÍNICOS</text>
      {[
        { l: 'GRUPO SANG.', v: '—', x: 200 },
        { l: 'PESO',        v: '—', x: 280 },
        { l: 'ALTURA',      v: '—', x: 340 },
      ].map((f, i) => (
        <g key={i}>
          <text x={f.x} y="244" fontFamily={T.mono} fontSize="5.5" letterSpacing="0.8" fill={T.gray3}>{f.l}</text>
          <text x={f.x} y="258" fontFamily={T.font} fontSize="9" fill={T.gray4}>{f.v}</text>
        </g>
      ))}
      {[
        { l: 'ALERGIAS',                 v: '—' },
        { l: 'MEDICACIONES',             v: '—' },
        { l: 'ANTECEDENTES PERSONALES',  v: '—' },
        { l: 'ANTECEDENTES FAMILIARES',  v: 'si' },
      ].map((f, i) => (
        <g key={i}>
          <text x="200" y={278 + i * 22} fontFamily={T.mono} fontSize="5.5" letterSpacing="0.8" fill={T.gray3}>{f.l}</text>
          <text x="200" y={290 + i * 22} fontFamily={T.font} fontSize="9" fill={f.v === '—' ? T.gray4 : T.black}>{f.v}</text>
        </g>
      ))}
      <line x1="196" y1="374" x2="400" y2="374" stroke={T.gray1} />

      {/* Sección COBERTURA */}
      <text x="200" y="388" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray4}>COBERTURA</text>
      <text x="200" y="404" fontFamily={T.mono} fontSize="5.5" letterSpacing="0.8" fill={T.gray3}>OBRA SOCIAL (PRINCIPAL · +1 MÁS)</text>
      <text x="200" y="416" fontFamily={T.font} fontSize="9" fontWeight="500" fill={T.black}>Swiss Medical</text>
      <text x="200" y="432" fontFamily={T.mono} fontSize="5.5" letterSpacing="0.8" fill={T.gray3}>NRO AFILIADO</text>
      <text x="200" y="444" fontFamily={T.font} fontSize="9" fill={T.black}>11111</text>
      <text x="290" y="432" fontFamily={T.mono} fontSize="5.5" letterSpacing="0.8" fill={T.gray3}>PLAN</text>
      <text x="290" y="444" fontFamily={T.font} fontSize="9" fill={T.black}>meli O2</text>
      <line x1="196" y1="456" x2="400" y2="456" stroke={T.gray1} />

      {/* Footer: registro + editar */}
      <text x="200" y="476" fontFamily={T.mono} fontSize="6" letterSpacing="1" fill={T.gray4}>REG. 22/05/2026</text>
      <rect x="316" y="466" width="80" height="18" rx="9" fill={T.white} stroke={T.gray1} />
      <text x="356" y="478" textAnchor="middle" fontFamily={T.mono} fontSize="6.5" fontWeight="700" letterSpacing="0.6" fill={T.black}>EDITAR PACIENTE</text>

      {/* ============ COLUMNA DERECHA — TABS + TIMELINE ============ */}
      <rect x="424" y="58" width="360" height="432" rx="10" fill={T.white} stroke={T.gray1} />

      {/* Tabs */}
      <text x="444" y="86" fontFamily={T.font} fontSize="12" fontWeight="700" letterSpacing="-0.2" fill={T.black}>Historia clínica</text>
      <text x="524" y="86" fontFamily={T.mono} fontSize="8" fontWeight="600" fill={T.gray4}>2</text>
      <rect x="440" y="94" width="94" height="2" fill={T.black} />
      <text x="548" y="86" fontFamily={T.font} fontSize="12" fontWeight="500" letterSpacing="-0.2" fill={T.gray4}>Odontograma</text>
      <text x="644" y="86" fontFamily={T.font} fontSize="12" fontWeight="500" letterSpacing="-0.2" fill={T.gray4}>Estudios</text>
      <text x="694" y="86" fontFamily={T.mono} fontSize="8" fontWeight="600" fill={T.gray4}>0</text>
      <line x1="424" y1="96" x2="784" y2="96" stroke={T.gray1} />

      {/* Ordenar por + toggle */}
      <text x="444" y="118" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray4}>ORDENAR POR</text>
      <rect x="670" y="108" width="60" height="18" rx="9" fill={T.black} />
      <text x="700" y="120" textAnchor="middle" fontFamily={T.font} fontSize="8" fontWeight="700" fill={T.white}>Más reciente</text>
      <rect x="730" y="108" width="52" height="18" rx="9" fill="none" />
      <text x="756" y="120" textAnchor="middle" fontFamily={T.font} fontSize="8" fontWeight="500" fill={T.gray4}>Más antiguo</text>

      {/* Grupo JULIO */}
      <text x="464" y="150" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray4}>JULIO DE 2026</text>
      {/* Línea del timeline */}
      <line x1="454" y1="164" x2="454" y2="332" stroke={T.gray1} strokeWidth="1" />

      {/* Evento 1: Extracción (pagada, dot negro) */}
      <circle cx="454" cy="188" r="5" fill={T.black} stroke={T.white} strokeWidth="2" />
      <rect x="472" y="170" width="298" height="52" rx="8" fill={T.white} stroke={T.gray1} />
      <text x="486" y="188" fontFamily={T.font} fontSize="11" fontWeight="700" letterSpacing="-0.2" fill={T.black}>Extraccion</text>
      <text x="750" y="188" textAnchor="end" fontFamily={T.font} fontSize="13" fontWeight="700" letterSpacing="-0.3" fill={T.black}>$10.000,00</text>
      <text x="758" y="188" fontFamily={T.font} fontSize="9" fill={T.gray4}>›</text>
      <text x="486" y="208" fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray4}>CASA CENTRAL</text>
      <text x="560" y="208" fontFamily={T.mono} fontSize="6.5" fill={T.gray4}>2026-07-10</text>
      <text x="622" y="208" fontFamily={T.font} fontSize="7.5" fill={T.gray4}>hace 16 días</text>
      <rect x="710" y="200" width="42" height="12" rx="6" fill="#ffedd5" />
      <text x="731" y="209" textAnchor="middle" fontFamily={T.mono} fontSize="6" fontWeight="700" letterSpacing="0.6" fill="#c2410c">OSDE</text>

      {/* Evento 2: Limpieza (pendiente, dot naranja) */}
      <circle cx="454" cy="272" r="5" fill="#f59e0b" stroke={T.white} strokeWidth="2" />
      <rect x="472" y="254" width="298" height="52" rx="8" fill={T.white} stroke={T.gray1} />
      <text x="486" y="272" fontFamily={T.font} fontSize="11" fontWeight="700" letterSpacing="-0.2" fill={T.black}>Limpieza</text>
      <text x="750" y="272" textAnchor="end" fontFamily={T.font} fontSize="13" fontWeight="700" letterSpacing="-0.3" fill={T.black}>$25.000,00</text>
      <text x="758" y="272" fontFamily={T.font} fontSize="9" fill={T.gray4}>›</text>
      <text x="486" y="292" fontFamily={T.mono} fontSize="6.5" letterSpacing="1" fill={T.gray4}>CASA CENTRAL</text>
      <text x="560" y="292" fontFamily={T.mono} fontSize="6.5" fill={T.gray4}>2026-07-05</text>
      <text x="622" y="292" fontFamily={T.font} fontSize="7.5" fill={T.gray4}>hace 21 días</text>
      <rect x="686" y="284" width="76" height="12" rx="6" fill="#fef3c7" />
      <text x="724" y="293" textAnchor="middle" fontFamily={T.mono} fontSize="5.5" fontWeight="700" letterSpacing="0.6" fill="#92400e">COBRO PENDIENTE</text>
    </Frame>
  )
}

export function MockupTurnos() {
  const dias = ['LUN 30', 'MAR 1', 'MIÉ 2', 'JUE 3', 'VIE 4', 'SÁB 5']
  const horas = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00']
  const turnos = [
    { dia: 0, h: 1, dur: 1, nombre: 'García, A.',   estado: 'ok' },
    { dia: 0, h: 4, dur: 1, nombre: 'Pérez, N.',    estado: 'ok' },
    { dia: 1, h: 0, dur: 2, nombre: 'López, M.',    estado: 'pend' },
    { dia: 2, h: 3, dur: 1, nombre: 'Torres, S.',   estado: 'ok' },
    { dia: 3, h: 1, dur: 1, nombre: 'Gómez, J.',    estado: 'ok' },
    { dia: 3, h: 5, dur: 1, nombre: 'Ruiz, C.',     estado: 'pend' },
    { dia: 4, h: 2, dur: 2, nombre: 'Núñez, F.',    estado: 'ok' },
    { dia: 5, h: 0, dur: 1, nombre: 'Vega, L.',     estado: 'cancel' },
  ]
  const colW = 88
  const rowH = 32
  const x0 = 244
  const y0 = 92
  return (
    <Frame>
      <Sidebar active="turnos" />
      <text x="184" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Turnos</text>
      <text x="184" y="58" fontFamily={T.mono} fontSize="7" letterSpacing="1.2" fill={T.gray4}>SEMANA · JUN 30 – JUL 5</text>
      <rect x="620" y="26" width="80" height="22" rx="11" fill={T.white} stroke={T.gray1} />
      <text x="660" y="41" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="600" fill={T.black}>‹ Semana</text>
      <rect x="704" y="26" width="80" height="22" rx="11" fill={T.black} />
      <text x="744" y="41" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>+ Turno</text>

      {/* Grid header — días */}
      {dias.map((d, i) => (
        <g key={i}>
          <text x={x0 + i * colW + colW / 2} y="82" textAnchor="middle" fontFamily={T.mono} fontSize="7" letterSpacing="1.2" fill={T.gray4}>{d}</text>
        </g>
      ))}

      {/* Grid horas y celdas */}
      {horas.map((h, hi) => (
        <g key={hi}>
          <text x="230" y={y0 + hi * rowH + rowH / 2 + 3} textAnchor="end" fontFamily={T.mono} fontSize="7" letterSpacing="0.8" fill={T.gray4}>{h}</text>
          <line x1="240" y1={y0 + hi * rowH} x2="780" y2={y0 + hi * rowH} stroke={T.gray1} />
          {dias.map((_, di) => (
            <rect key={di} x={x0 + di * colW} y={y0 + hi * rowH} width={colW - 2} height={rowH - 2} fill={T.white} />
          ))}
        </g>
      ))}
      <line x1="240" y1={y0 + horas.length * rowH} x2="780" y2={y0 + horas.length * rowH} stroke={T.gray1} />

      {/* Turnos */}
      {turnos.map((t, i) => {
        const fill = t.estado === 'ok' ? '#dcfce7' : t.estado === 'pend' ? '#fed7aa' : '#fecaca'
        const stroke = t.estado === 'ok' ? '#16a34a' : t.estado === 'pend' ? '#f97316' : '#dc2626'
        return (
          <g key={i}>
            <rect x={x0 + t.dia * colW + 2} y={y0 + t.h * rowH + 2} width={colW - 6} height={t.dur * rowH - 6} rx="4" fill={fill} stroke={stroke} strokeWidth="0.8" />
            <text x={x0 + t.dia * colW + 8} y={y0 + t.h * rowH + 15} fontFamily={T.font} fontSize="8" fontWeight="700" fill={T.black}>{t.nombre}</text>
          </g>
        )
      })}
    </Frame>
  )
}

export function MockupIniciarConsulta() {
  return (
    <Frame>
      <Sidebar active="pacientes" />
      <rect x="184" y="24" width="24" height="24" rx="6" fill={T.white} stroke={T.gray1} />
      <text x="196" y="41" textAnchor="middle" fontFamily={T.font} fontSize="12" fill={T.gray4}>←</text>
      <text x="220" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Nueva consulta · Gómez, Juan</text>

      {/* Form card */}
      <rect x="184" y="72" width="600" height="410" rx="12" fill={T.white} stroke={T.gray1} />

      {/* Fecha + consultorio */}
      <text x="204" y="98" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>FECHA</text>
      <rect x="204" y="106" width="180" height="28" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="216" y="124" fontFamily={T.font} fontSize="10" fill={T.black}>25/07/2026</text>

      <text x="404" y="98" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>CONSULTORIO</text>
      <rect x="404" y="106" width="360" height="28" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="416" y="124" fontFamily={T.font} fontSize="10" fill={T.black}>Casa Central</text>

      {/* Motivo */}
      <text x="204" y="156" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>MOTIVO</text>
      <rect x="204" y="164" width="560" height="28" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="216" y="182" fontFamily={T.font} fontSize="10" fill={T.black}>Endodoncia pieza 2.6</text>

      {/* Descripción */}
      <text x="204" y="214" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>DESCRIPCIÓN</text>
      <rect x="204" y="222" width="560" height="60" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="216" y="240" fontFamily={T.font} fontSize="9" fill={T.gray4}>Apertura cameral, instrumentación y</text>
      <text x="216" y="253" fontFamily={T.font} fontSize="9" fill={T.gray4}>obturación con gutapercha…</text>

      {/* Tipo pago + monto + medio */}
      <text x="204" y="304" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>TIPO DE PAGO</text>
      <rect x="204" y="312" width="90" height="24" rx="12" fill={T.white} stroke={T.gray1} />
      <text x="249" y="327" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="500" fill={T.gray4}>Particular</text>
      <rect x="300" y="312" width="120" height="24" rx="12" fill={T.black} />
      <text x="360" y="327" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>Obra social</text>

      <text x="440" y="304" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>OBRA SOCIAL</text>
      <rect x="440" y="312" width="164" height="24" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="452" y="327" fontFamily={T.font} fontSize="10" fill={T.black}>Swiss Medical</text>

      <text x="620" y="304" fontFamily={T.mono} fontSize="6.5" letterSpacing="1.2" fill={T.gray3}>COSEGURO ($)</text>
      <rect x="620" y="312" width="144" height="24" rx="6" fill={T.gray2} stroke={T.gray1} />
      <text x="632" y="327" fontFamily={T.font} fontSize="10" fill={T.black}>2.000</text>

      {/* Firma */}
      <rect x="204" y="358" width="560" height="70" rx="8" fill={T.gray2} stroke={T.gray1} strokeDasharray="4 3" />
      <text x="484" y="390" textAnchor="middle" fontFamily={T.font} fontSize="10" fill={T.gray4}>Firma del paciente (opcional)</text>
      <text x="484" y="405" textAnchor="middle" fontFamily={T.mono} fontSize="7" letterSpacing="1" fill={T.gray5}>DIBUJÁ ACÁ O SOLICITÁ FIRMA POR LINK</text>

      {/* Acciones */}
      <rect x="620" y="444" width="70" height="26" rx="13" fill={T.white} stroke={T.gray1} />
      <text x="655" y="460" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="600" fill={T.gray4}>Cancelar</text>
      <rect x="696" y="444" width="68" height="26" rx="13" fill={T.black} />
      <text x="730" y="460" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>Guardar</text>
    </Frame>
  )
}

export function MockupMovimientos() {
  return (
    <Frame>
      <Sidebar active="finanzas" />
      <rect x="184" y="24" width="24" height="24" rx="6" fill={T.white} stroke={T.gray1} />
      <text x="196" y="41" textAnchor="middle" fontFamily={T.font} fontSize="12" fill={T.gray4}>←</text>
      <text x="220" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Movimientos</text>
      <text x="308" y="42" fontFamily={T.font} fontSize="18" fontWeight="300" letterSpacing="-0.3" fill={T.gray4}>· Julio 2026</text>

      {/* Toolbar */}
      <rect x="184" y="66" width="300" height="30" rx="8" fill={T.white} stroke={T.gray1} />
      <text x="196" y="85" fontFamily={T.font} fontSize="10" fill={T.gray3}>⌕  Buscar por paciente o descripción…</text>
      <rect x="496" y="66" width="60" height="30" rx="15" fill={T.black} />
      <text x="526" y="85" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>Todos</text>
      <rect x="562" y="66" width="76" height="30" rx="15" fill={T.white} stroke={T.gray1} strokeWidth="1.5" />
      <text x="600" y="85" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="600" fill={T.gray4}>Ingresos</text>
      <rect x="644" y="66" width="70" height="30" rx="15" fill={T.white} stroke={T.gray1} strokeWidth="1.5" />
      <text x="679" y="85" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="600" fill={T.gray4}>Egresos</text>
      <text x="784" y="85" textAnchor="end" fontFamily={T.mono} fontSize="8" letterSpacing="1" fill={T.gray4}>7 movimientos</text>

      {/* Grupo fecha */}
      <text x="184" y="122" fontFamily={T.mono} fontSize="7" letterSpacing="1.2" fill={T.gray3}>11 DE JULIO</text>
      <line x1="256" y1="120" x2="784" y2="120" stroke="#e8e8e4" />

      {/* Movimiento 1 */}
      <rect x="184" y="130" width="600" height="46" rx="9" fill={T.white} stroke={T.gray1} />
      <rect x="196" y="142" width="22" height="22" rx="5" fill="#dbeafe" />
      <text x="207" y="158" textAnchor="middle" fontFamily={T.font} fontSize="12" fontWeight="700" fill="#2563eb">↑</text>
      <text x="230" y="152" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>Cobro · OSDE</text>
      <rect x="230" y="158" width="52" height="12" rx="4" fill="#e0e7ff" />
      <text x="256" y="167" textAnchor="middle" fontFamily={T.mono} fontSize="6" letterSpacing="0.8" fill="#4338ca">COBRO OS</text>
      <text x="290" y="167" fontFamily={T.mono} fontSize="7" letterSpacing="0.8" fill={T.gray3}>CASA CENTRAL</text>
      <text x="770" y="160" textAnchor="end" fontFamily={T.font} fontSize="14" fontWeight="700" fill="#16a34a">+ $ 50.000</text>

      <text x="184" y="204" fontFamily={T.mono} fontSize="7" letterSpacing="1.2" fill={T.gray3}>10 DE JULIO</text>
      <line x1="256" y1="202" x2="784" y2="202" stroke="#e8e8e4" />

      {/* Movimiento 2 */}
      <rect x="184" y="212" width="600" height="46" rx="9" fill={T.white} stroke={T.gray1} />
      <rect x="196" y="224" width="22" height="22" rx="5" fill="#dcfce7" />
      <text x="207" y="240" textAnchor="middle" fontFamily={T.font} fontSize="12" fontWeight="700" fill="#16a34a">↑</text>
      <text x="230" y="234" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>Consulta · Pérez, Nicolás</text>
      <rect x="230" y="240" width="60" height="12" rx="4" fill="#dcfce7" />
      <text x="260" y="249" textAnchor="middle" fontFamily={T.mono} fontSize="6" letterSpacing="0.8" fill="#166534">CONSULTA</text>
      <text x="298" y="249" fontFamily={T.font} fontSize="8" fill={T.gray4}>Particular · Transferencia</text>
      <text x="770" y="242" textAnchor="end" fontFamily={T.font} fontSize="14" fontWeight="700" fill="#16a34a">+ $ 50.000</text>

      {/* Movimiento 3 */}
      <rect x="184" y="266" width="600" height="46" rx="9" fill={T.white} stroke={T.gray1} />
      <rect x="196" y="278" width="22" height="22" rx="5" fill="#dbeafe" />
      <text x="207" y="294" textAnchor="middle" fontFamily={T.font} fontSize="12" fontWeight="700" fill="#2563eb">↑</text>
      <text x="230" y="288" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>regalo</text>
      <rect x="230" y="294" width="76" height="12" rx="4" fill="#e0e7ff" />
      <text x="268" y="303" textAnchor="middle" fontFamily={T.mono} fontSize="6" letterSpacing="0.8" fill="#4338ca">INGRESO MANUAL</text>
      <text x="314" y="303" fontFamily={T.font} fontSize="8" fill={T.gray4}>Particular · Efectivo</text>
      <text x="770" y="296" textAnchor="end" fontFamily={T.font} fontSize="14" fontWeight="700" fill="#16a34a">+ $ 10.000</text>

      <text x="184" y="340" fontFamily={T.mono} fontSize="7" letterSpacing="1.2" fill={T.gray3}>08 DE JULIO</text>
      <line x1="256" y1="338" x2="784" y2="338" stroke="#e8e8e4" />

      {/* Movimiento 4 (egreso) */}
      <rect x="184" y="348" width="600" height="46" rx="9" fill={T.white} stroke={T.gray1} />
      <rect x="196" y="360" width="22" height="22" rx="5" fill="#fee2e2" />
      <text x="207" y="376" textAnchor="middle" fontFamily={T.font} fontSize="12" fontWeight="700" fill="#dc2626">↓</text>
      <text x="230" y="370" fontFamily={T.font} fontSize="10" fontWeight="700" fill={T.black}>Alquiler consultorio</text>
      <rect x="230" y="376" width="46" height="12" rx="4" fill="#fee2e2" />
      <text x="253" y="385" textAnchor="middle" fontFamily={T.mono} fontSize="6" letterSpacing="0.8" fill="#991b1b">EGRESO</text>
      <text x="286" y="385" fontFamily={T.font} fontSize="8" fill={T.gray4}>Transferencia · Villa Cabrera</text>
      <text x="770" y="378" textAnchor="end" fontFamily={T.font} fontSize="14" fontWeight="700" fill="#dc2626">− $ 35.000</text>
    </Frame>
  )
}

export function MockupAjustes() {
  const rows = [
    { nombre: 'Efectivo',      sistema: true  },
    { nombre: 'Transferencia', sistema: true  },
    { nombre: 'Mercado Pago',  sistema: false },
    { nombre: 'Crédito',       sistema: false },
  ]
  return (
    <Frame>
      <Sidebar active="ajustes" />
      <text x="184" y="42" fontFamily={T.font} fontSize="18" fontWeight="700" letterSpacing="-0.3" fill={T.black}>Configuración</text>
      <text x="184" y="58" fontFamily={T.font} fontSize="9" fill={T.gray4}>Los catálogos que usás para registrar consultas, cobros y turnos.</text>

      {/* Tabs */}
      <g>
        <text x="184" y="98" fontFamily={T.font} fontSize="11" fontWeight="700" letterSpacing="-0.2" fill={T.black}>Medios de pago</text>
        <rect x="270" y="88" width="16" height="14" rx="7" fill={T.black} />
        <text x="278" y="98" textAnchor="middle" fontFamily={T.font} fontSize="8" fontWeight="700" fill={T.white}>4</text>
        <rect x="184" y="106" width="106" height="2" fill={T.black} />
      </g>
      <g>
        <text x="310" y="98" fontFamily={T.font} fontSize="11" fontWeight="500" letterSpacing="-0.2" fill={T.gray4}>Obras sociales</text>
        <rect x="396" y="88" width="16" height="14" rx="7" fill={T.gray1} />
        <text x="404" y="98" textAnchor="middle" fontFamily={T.font} fontSize="8" fontWeight="700" fill={T.gray4}>6</text>
      </g>
      <g>
        <text x="432" y="98" fontFamily={T.font} fontSize="11" fontWeight="500" letterSpacing="-0.2" fill={T.gray4}>Consultorios</text>
        <rect x="510" y="88" width="16" height="14" rx="7" fill={T.gray1} />
        <text x="518" y="98" textAnchor="middle" fontFamily={T.font} fontSize="8" fontWeight="700" fill={T.gray4}>3</text>
      </g>
      <line x1="184" y1="108" x2="784" y2="108" stroke={T.gray1} />

      {/* Search + button */}
      <rect x="184" y="132" width="440" height="32" rx="8" fill={T.white} stroke={T.gray1} />
      <text x="196" y="152" fontFamily={T.font} fontSize="10" fill={T.gray3}>⌕  Buscar medio de pago…</text>
      <rect x="632" y="132" width="152" height="32" rx="16" fill={T.black} />
      <text x="708" y="152" textAnchor="middle" fontFamily={T.font} fontSize="9" fontWeight="700" fill={T.white}>+ Agregar medio de pago</text>

      {/* Card con filas */}
      <rect x="184" y="180" width="600" height={rows.length * 44} rx="12" fill={T.white} stroke={T.gray1} />
      {rows.map((r, i) => (
        <g key={i}>
          <text x="204" y={208 + i * 44} fontFamily={T.font} fontSize="12" fontWeight="700" letterSpacing="-0.2" fill={T.black}>{r.nombre}</text>
          {r.sistema && (
            <g transform={`translate(${204 + r.nombre.length * 7} ${200 + i * 44})`}>
              <rect x="0" y="0" width="10" height="8" rx="1.5" fill="none" stroke={T.gray3} strokeWidth="0.9" />
              <path d="M 2 0 A 3 3 0 0 1 8 0 L 8 3" fill="none" stroke={T.gray3} strokeWidth="0.9" />
            </g>
          )}
          {i < rows.length - 1 && <line x1="204" y1={222 + i * 44} x2="764" y2={222 + i * 44} stroke={T.gray1} />}
        </g>
      ))}
    </Frame>
  )
}
