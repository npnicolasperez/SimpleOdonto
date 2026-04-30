import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload } from 'lucide-react'

const HERRAMIENTAS = [
  { key: 'punto',         label: 'Punto'          },
  { key: 'linea',         label: 'Línea'          },
  { key: 'angulo',        label: 'Ángulo'         },
  { key: 'angulo-lineas', label: 'Medir Ángulo'   },
  { key: 'longitud',      label: 'Medir Longitud' },
]

const RADIO_PUNTO  = 5
const GROSOR_LINEA = 2
const COLOR_PUNTO  = '#ff3333'
const COLOR_LINEA  = '#2563eb'
const COLOR_ANGULO = '#ffffff'

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

function dibujarEtiqueta(ctx, texto, x, y) {
  ctx.font = 'bold 15px Inter, sans-serif'
  ctx.lineWidth = 4
  ctx.strokeStyle = '#000000'
  ctx.strokeText(texto, x, y)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(texto, x, y)
}

function anguloHaciaLinea(ix, iy, a, midx, midy) {
  const d1 = Math.hypot(midx - (ix + 50 * Math.cos(a)),          midy - (iy + 50 * Math.sin(a)))
  const d2 = Math.hypot(midx - (ix + 50 * Math.cos(a + Math.PI)), midy - (iy + 50 * Math.sin(a + Math.PI)))
  return d1 <= d2 ? a : a + Math.PI
}

export default function App() {
  const [imagen,       setImagen]       = useState(null)
  const [nombre,       setNombre]       = useState('')
  const [fileDragging, setFileDragging] = useState(false)
  const [herramienta,  setHerramienta]  = useState('punto')
  const [trazos,       setTrazos]       = useState([])

  const [primerPunto,   setPrimerPunto]   = useState(null)
  const [anguloStep,    setAnguloStep]    = useState(0)
  const [anguloVertice, setAnguloVertice] = useState(null)
  const [anguloBrazo1,  setAnguloBrazo1]  = useState(null)
  const [lineasSel,     setLineasSel]     = useState([])
  const [lineaHover,    setLineaHover]    = useState(-1)
  const [escala,        setEscala]        = useState(1)
  const [mouse,         setMouse]         = useState(null)

  const inputRef     = useRef(null)
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)

  const redibujar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let nLong = 0
    for (const [i, t] of trazos.entries()) {

      if (t.tipo === 'punto') {
        ctx.fillStyle = COLOR_PUNTO
        ctx.beginPath(); ctx.arc(t.x, t.y, RADIO_PUNTO, 0, Math.PI * 2); ctx.fill()

      } else if (t.tipo === 'linea') {
        const modoLinea = herramienta === 'angulo-lineas' || herramienta === 'longitud'
        const esSel   = herramienta === 'angulo-lineas' && lineasSel.includes(i)
        const esHover = modoLinea && lineaHover === i && !esSel
        ctx.strokeStyle = (esSel || esHover) ? COLOR_ANGULO : COLOR_LINEA
        ctx.fillStyle   = (esSel || esHover) ? COLOR_ANGULO : COLOR_LINEA
        ctx.lineWidth   = esSel ? 3 : esHover ? 2.5 : GROSOR_LINEA
        ctx.globalAlpha = esHover ? 0.65 : 1
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
        const dx = t.x2 - t.x1, dy = t.y2 - t.y1
        const len = Math.hypot(dx, dy)
        if (len === 0) continue
        const nx = -dy / len, ny = dx / len
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        const drawTick = (x, y) => {
          ctx.beginPath()
          ctx.moveTo(x + nx * 7, y + ny * 7); ctx.lineTo(x - nx * 7, y - ny * 7)
          ctx.stroke()
        }
        drawTick(t.x1, t.y1); drawTick(t.x2, t.y2)
        ctx.lineWidth = GROSOR_LINEA
        const label = `L${nLong}: ${t.mm.toFixed(1)} mm`
        const mx = (t.x1 + t.x2) / 2 + nx * 22, my = (t.y1 + t.y2) / 2 + ny * 22
        dibujarEtiqueta(ctx, label, mx - label.length * 4, my + 5)
      }
    }

    if (herramienta === 'linea' && primerPunto) {
      ctx.strokeStyle = COLOR_LINEA; ctx.fillStyle = COLOR_LINEA; ctx.lineWidth = GROSOR_LINEA
      ctx.beginPath(); ctx.arc(primerPunto.x, primerPunto.y, RADIO_PUNTO, 0, Math.PI * 2); ctx.fill()
      if (mouse) {
        ctx.beginPath(); ctx.moveTo(primerPunto.x, primerPunto.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill()
      }
    }

    if (herramienta === 'angulo' && anguloStep === 1 && anguloVertice) {
      ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = GROSOR_LINEA
      ctx.beginPath(); ctx.arc(anguloVertice.x, anguloVertice.y, 4, 0, Math.PI * 2); ctx.fill()
      if (mouse) {
        ctx.beginPath(); ctx.moveTo(anguloVertice.x, anguloVertice.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
      }
    }

    if (herramienta === 'angulo' && anguloStep === 2 && anguloVertice && anguloBrazo1) {
      ctx.strokeStyle = COLOR_ANGULO; ctx.fillStyle = COLOR_ANGULO; ctx.lineWidth = GROSOR_LINEA
      ctx.beginPath(); ctx.arc(anguloVertice.x, anguloVertice.y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.moveTo(anguloVertice.x, anguloVertice.y); ctx.lineTo(anguloBrazo1.x, anguloBrazo1.y); ctx.stroke()
      ctx.beginPath(); ctx.arc(anguloBrazo1.x, anguloBrazo1.y, 3, 0, Math.PI * 2); ctx.fill()
      if (mouse) {
        ctx.beginPath(); ctx.moveTo(anguloVertice.x, anguloVertice.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke()
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill()
        const { midA, r } = dibujarArco(ctx, anguloVertice.x, anguloVertice.y, anguloBrazo1.x, anguloBrazo1.y, mouse.x, mouse.y)
        const grados = calcularAngulo(anguloVertice.x, anguloVertice.y, anguloBrazo1.x, anguloBrazo1.y, mouse.x, mouse.y)
        ctx.globalAlpha = 0.8
        dibujarEtiqueta(ctx, `${grados.toFixed(1)}°`, anguloVertice.x + (r + 20) * Math.cos(midA) - 14, anguloVertice.y + (r + 20) * Math.sin(midA) + 5)
        ctx.globalAlpha = 1
      }
    }
  }, [trazos, primerPunto, anguloStep, anguloVertice, anguloBrazo1, mouse, herramienta, lineasSel, lineaHover])

  useEffect(() => { redibujar() }, [redibujar])

  useEffect(() => {
    if (!imagen) return
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
      redibujar()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [imagen, redibujar])

  function getCoordsFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function lineaCercana(x, y, excluir = []) {
    let best = -1, bestDist = 10
    trazos.forEach((t, i) => {
      if (t.tipo !== 'linea' || excluir.includes(i)) return
      const d = distPuntoSegmento(x, y, t.x1, t.y1, t.x2, t.y2)
      if (d < bestDist) { bestDist = d; best = i }
    })
    return best
  }

  function handleCanvasClick(e) {
    const { x, y } = getCoordsFromEvent(e)

    if (herramienta === 'punto') {
      setTrazos(prev => [...prev, { tipo: 'punto', x, y }])

    } else if (herramienta === 'linea') {
      if (!primerPunto) {
        setPrimerPunto({ x, y })
      } else {
        setTrazos(prev => [...prev, { tipo: 'linea', x1: primerPunto.x, y1: primerPunto.y, x2: x, y2: y }])
        setPrimerPunto(null)
      }

    } else if (herramienta === 'angulo') {
      if (anguloStep === 0) {
        setAnguloVertice({ x, y }); setAnguloStep(1)
      } else if (anguloStep === 1) {
        setAnguloBrazo1({ x, y }); setAnguloStep(2)
      } else if (anguloStep === 2) {
        const grados = calcularAngulo(anguloVertice.x, anguloVertice.y, anguloBrazo1.x, anguloBrazo1.y, x, y)
        setTrazos(prev => [...prev, {
          tipo: 'angulo',
          vx: anguloVertice.x, vy: anguloVertice.y,
          ax1: anguloBrazo1.x, ay1: anguloBrazo1.y,
          ax2: x, ay2: y, grados,
        }])
        setAnguloStep(0); setAnguloVertice(null); setAnguloBrazo1(null)
      }

    } else if (herramienta === 'longitud') {
      const idx = lineaCercana(x, y)
      if (idx === -1) return
      const t = trazos[idx]
      const px = Math.hypot(t.x2 - t.x1, t.y2 - t.y1)
      setTrazos(prev => [...prev, { tipo: 'longitud', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, px, mm: px / escala }])

    } else if (herramienta === 'angulo-lineas') {
      const idx = lineaCercana(x, y, lineasSel)
      if (idx === -1) return
      const nuevasSel = [...lineasSel, idx]
      if (nuevasSel.length === 2) {
        const t1 = trazos[nuevasSel[0]], t2 = trazos[nuevasSel[1]]
        const inter = interseccionLineas(t1, t2)
        if (!inter) { setLineasSel([]); return }
        const a1 = Math.atan2(t1.y2 - t1.y1, t1.x2 - t1.x1)
        const a2 = Math.atan2(t2.y2 - t2.y1, t2.x2 - t2.x1)
        let diff = Math.abs(a2 - a1) * 180 / Math.PI
        if (diff > 180) diff = 360 - diff
        if (diff > 90)  diff = 180 - diff
        setTrazos(prev => [...prev, {
          tipo: 'angulo-lineas',
          ix: inter.ix, iy: inter.iy, a1, a2,
          mid1x: (t1.x1 + t1.x2) / 2, mid1y: (t1.y1 + t1.y2) / 2,
          mid2x: (t2.x1 + t2.x2) / 2, mid2y: (t2.y1 + t2.y2) / 2,
          grados: diff,
        }])
        setLineasSel([])
      } else {
        setLineasSel(nuevasSel)
      }
    }
  }

  function handleMouseMove(e) {
    const pos = getCoordsFromEvent(e)
    setMouse(pos)
    if (herramienta === 'angulo-lineas')    setLineaHover(lineaCercana(pos.x, pos.y, lineasSel))
    else if (herramienta === 'longitud')    setLineaHover(lineaCercana(pos.x, pos.y))
    else                                    setLineaHover(-1)
  }

  function handleMouseLeave() { setMouse(null); setLineaHover(-1) }

  function handleDeshacer() {
    if (herramienta === 'angulo') {
      if (anguloStep === 2) { setAnguloBrazo1(null); setAnguloStep(1); return }
      if (anguloStep === 1) { setAnguloVertice(null); setAnguloStep(0); return }
    }
    if (herramienta === 'angulo-lineas' && lineasSel.length > 0) { setLineasSel([]); return }
    if (primerPunto) { setPrimerPunto(null); return }
    setTrazos(prev => prev.slice(0, -1))
  }

  function resetInProgress() {
    setPrimerPunto(null)
    setAnguloStep(0); setAnguloVertice(null); setAnguloBrazo1(null)
    setLineasSel([]); setLineaHover(-1)
  }

  function handleLimpiarTrazos() { setTrazos([]); resetInProgress() }
  function handleCambiarHerramienta(h) { resetInProgress(); setHerramienta(h) }

  function procesarArchivo(file) {
    if (!file || !file.type.startsWith('image/')) return
    setNombre(file.name); setImagen(URL.createObjectURL(file))
    setTrazos([]); resetInProgress()
  }

  function handleInputChange(e) { procesarArchivo(e.target.files[0]) }
  function handleFileDrop(e) {
    e.preventDefault(); setFileDragging(false)
    procesarArchivo(e.dataTransfer.files[0])
  }
  function handleLimpiarTodo() {
    setImagen(null); setNombre(''); setTrazos([]); resetInProgress()
    if (inputRef.current) inputRef.current.value = ''
  }

  const sinAcciones = trazos.length === 0 && !primerPunto && anguloStep === 0 && lineasSel.length === 0

  const statusMsg =
    herramienta === 'linea'           && primerPunto            ? 'Hacé click para fijar el segundo punto'
    : herramienta === 'angulo'        && anguloStep === 1       ? 'Hacé click para el primer brazo'
    : herramienta === 'angulo'        && anguloStep === 2       ? 'Hacé click para el segundo brazo'
    : herramienta === 'angulo-lineas' && lineasSel.length === 0 ? 'Hacé click en la primera línea'
    : herramienta === 'angulo-lineas' && lineasSel.length === 1 ? 'Primera línea seleccionada — hacé click en la segunda'
    : herramienta === 'longitud'                                ? 'Hacé click sobre una línea para medirla'
    : null

  const canvasCursor = (herramienta === 'angulo-lineas' || herramienta === 'longitud')
    ? (lineaHover !== -1 ? 'pointer' : 'default')
    : 'crosshair'

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 52, borderBottom: '1px solid #000', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 400, letterSpacing: '0.15em', color: '#000', textTransform: 'uppercase' }}>
          SimpleOdonto
        </span>
        {imagen && <TopBtn onClick={handleLimpiarTodo}>Limpiar imagen</TopBtn>}
      </div>

      {/* toolbar */}
      {imagen && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem', height: 44, borderBottom: '1px solid #e8e8e8', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', border: '1px solid #e8e8e8' }}>
            {HERRAMIENTAS.map(({ key, label }, i) => (
              <button
                key={key}
                onClick={() => handleCambiarHerramienta(key)}
                style={{
                  padding: '5px 16px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: 'none', borderLeft: i > 0 ? '1px solid #e8e8e8' : 'none',
                  background: herramienta === key ? '#000' : '#fff',
                  color: herramienta === key ? '#fff' : '#999',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {herramienta === 'longitud' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid #e8e8e8', paddingLeft: 16 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>Escala</span>
              <input
                type="number" min="0.01" step="0.1" value={escala}
                onChange={e => setEscala(Math.max(0.01, parseFloat(e.target.value) || 1))}
                style={{ width: 64, border: '1px solid #e8e8e8', padding: '3px 8px', fontSize: 11, fontFamily: 'Inter, sans-serif', outline: 'none', color: '#000', textAlign: 'right' }}
                onFocus={e => e.currentTarget.style.borderColor = '#000'}
                onBlur={e => e.currentTarget.style.borderColor = '#e8e8e8'}
              />
              <span style={{ fontSize: 10, color: '#999', letterSpacing: '0.08em' }}>px / mm</span>
            </div>
          )}

          {statusMsg && (
            <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>
              {statusMsg}
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <TopBtn onClick={handleDeshacer} disabled={sinAcciones}>↩ Deshacer</TopBtn>
            <TopBtn onClick={handleLimpiarTrazos} disabled={sinAcciones}>Limpiar trazos</TopBtn>
          </div>
        </div>
      )}

      {/* content */}
      {!imagen ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setFileDragging(true) }}
            onDragLeave={() => setFileDragging(false)}
            onDrop={handleFileDrop}
            style={{
              width: '100%', maxWidth: 480,
              border: fileDragging ? '1px solid #000' : '1px dashed #ccc',
              padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer', background: fileDragging ? '#f5f5f5' : '#fff', transition: 'all 0.15s',
            }}
          >
            <Upload size={20} color={fileDragging ? '#000' : '#ccc'} />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: fileDragging ? '#000' : '#999' }}>
              Arrastrá o hacé click para subir
            </span>
            <span style={{ fontSize: 10, color: '#ccc', letterSpacing: '0.06em' }}>PNG, JPG, GIF, WEBP</span>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
        </div>
      ) : (
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          <img
            src={imagen} alt={nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, cursor: canvasCursor }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          <RatioPanel trazos={trazos} />
          <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', pointerEvents: 'none' }}>
            {nombre}
          </span>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  )
}

function RatioPanel({ trazos }) {
  const ls = trazos.filter(t => t.tipo === 'longitud')
  if (ls.length < 2) return null
  const l1 = ls[0], l2 = ls[1]
  const ratio = l1.mm / l2.mm
  return (
    <div style={{
      position: 'absolute', top: 16, right: 16,
      background: 'rgba(255,255,255,0.96)', border: '1px solid #000',
      padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 5,
      fontFamily: 'Inter, sans-serif', pointerEvents: 'none', minWidth: 140,
    }}>
      <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999' }}>Índice</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid #e8e8e8', paddingBottom: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#555' }}>L1 = {l1.mm.toFixed(2)} mm</span>
        <span style={{ fontSize: 11, color: '#555' }}>L2 = {l2.mm.toFixed(2)} mm</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}>L1 / L2</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#000', letterSpacing: '-0.02em' }}>{ratio.toFixed(3)}</span>
      </div>
    </div>
  )
}

function TopBtn({ onClick, disabled = false, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
        background: hov ? '#000' : '#fff',
        border: `1px solid ${disabled ? '#e8e8e8' : hov ? '#000' : '#e8e8e8'}`,
        padding: '5px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#ccc' : hov ? '#fff' : '#999',
        fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
