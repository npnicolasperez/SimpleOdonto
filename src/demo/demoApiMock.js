/**
 * Mock del apiFetch para el modo demo. Vive 100% en memoria del browser.
 * Cada request se parsea, se busca en el store, se modifica si aplica y se devuelve
 * una respuesta con la misma forma que un `fetch` real (para que los componentes de
 * la app no noten la diferencia).
 *
 * Todo se resetea al refrescar / cerrar la tab.
 */

import { crearSeed } from './demoSeedData.js'

let store = crearSeed()
let nextId = 10000

// ── Límites del demo ─────────────────────────────────────────────
// Para que la demo no sea "sandbox infinito", cada usuario solo puede crear 1 de cada
// cosa. Tampoco puede editar pacientes existentes ni agregar catálogos en Ajustes.
const LIMITES = { turnos: 1, pacientes: 1, ingresos: 1, egresos: 1 }
const LIMITE_POR_PAC = { consultas: 1, estudios: 1 }
let creadosEnDemo = { turnos: 0, pacientes: 0, ingresos: 0, egresos: 0 }
let creadosPorPaciente = { consultas: {}, estudios: {} } // { [pacienteId]: cantidad }

// Dispara un evento global para que DemoApp muestre un modal al usuario con el mensaje.
// Sin esto, los formularios rechazados devuelven 403 en silencio y el usuario piensa
// que "el botón no anda".
function notificarLimite(mensaje) {
  try { window.dispatchEvent(new CustomEvent('demo-limit', { detail: { mensaje } })) } catch {}
}
function limiteRes(que) {
  const n = LIMITES[que]
  const msg = `En modo demo solo podés agregar ${n} ${que.slice(0, -1)}${n > 1 ? 's' : ''} nuevo${n > 1 ? 's' : ''}. Para usar el sistema sin límites, solicitá tu cuenta desde el login.`
  notificarLimite(msg)
  return jsonRes({ error: msg }, 403)
}
function bloqueadoRes(mensaje) {
  notificarLimite(mensaje)
  return jsonRes({ error: mensaje }, 403)
}
function limitePorPacRes(que) {
  const n = LIMITE_POR_PAC[que]
  const singular = que.slice(0, -1)
  const msg = `En modo demo solo podés agregar ${n} ${singular}${n > 1 ? 's' : ''} nuevo${n > 1 ? 's' : ''} por paciente. Para usar el sistema sin límites, solicitá tu cuenta desde el login.`
  notificarLimite(msg)
  return jsonRes({ error: msg }, 403)
}

function jsonRes(data, status = 200) {
  return {
    ok:     status >= 200 && status < 300,
    status,
    json:   async () => data,
    text:   async () => JSON.stringify(data),
    headers: new Headers(),
  }
}
function emptyRes(status = 204) {
  return { ok: status >= 200 && status < 300, status, json: async () => null, text: async () => '', headers: new Headers() }
}

// Cache del base64 del estudio para no fetchearlo cada vez que se abre
let estudioImagenBase64Cache = null
async function cargarImagenEstudio(path) {
  if (estudioImagenBase64Cache) return estudioImagenBase64Cache
  try {
    const res = await fetch(path)
    const blob = await res.blob()
    const dataUrl = await new Promise(resolve => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.readAsDataURL(blob)
    })
    // dataUrl viene como "data:image/jpeg;base64,XXXXX" — extraigo solo el base64.
    const base64 = dataUrl.split(',')[1]
    estudioImagenBase64Cache = base64
    return base64
  } catch {
    return null
  }
}

/**
 * `path` es lo que va después de `/api` (ej: '/pacientes?size=50&page=0').
 * Devuelvo una promesa con una respuesta "fetch-like".
 */
export async function demoApiFetch(path, opts = {}) {
  const method = (opts?.method || 'GET').toUpperCase()
  const body   = opts?.body ? (typeof opts.body === 'string' ? safeJson(opts.body) : opts.body) : null
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)

  // ── DASHBOARD (Inicio) ───────────────────────────────────────────
  if (method === 'GET' && pathname === '/dashboard') {
    const mesParam = params.get('mes') // "YYYY-MM"
    const consultasMes = store.consultas.filter(c => (c.fecha || '').startsWith(mesParam ?? ''))
    const ingresosMes  = store.ingresos.filter(i => (i.fecha || '').startsWith(mesParam ?? ''))
    const cobrado = ingresosMes.filter(i => i.estado === 'CONFIRMADO').reduce((s, i) => s + (Number(i.monto) || 0), 0)
    const pendiente = ingresosMes.filter(i => i.estado === 'PENDIENTE').reduce((s, i) => s + (Number(i.monto) || 0), 0)
    const cobrosPendientesCantidad = ingresosMes.filter(i => i.estado === 'PENDIENTE').length
    const hoyISO = new Date().toISOString().slice(0, 10)
    const mananaISO = new Date(Date.now() + 86400e3).toISOString().slice(0, 10)
    const turnosPendientesHoy    = store.turnos.filter(t => (t.fechaHora || '').startsWith(hoyISO) && t.estado === 'PENDIENTE').length
    const turnosPendientesManana = store.turnos.filter(t => (t.fechaHora || '').startsWith(mananaISO) && t.estado === 'PENDIENTE').length
    const proximoTurno = store.turnos
      .filter(t => new Date(t.fechaHora).getTime() >= Date.now())
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))[0]

    return jsonRes({
      pacientesTotal: store.pacientes.length,
      pacientesNuevosEsteMes: 2,
      pacientesNoVolvieron90Dias: 0,
      turnosPendientesHoy,
      turnosPendientesManana,
      proximoTurno: proximoTurno ? {
        fechaHora: proximoTurno.fechaHora,
        pacienteNombre: proximoTurno.pacienteNombre,
        pacienteApellido: proximoTurno.pacienteApellido,
      } : null,
      facturadoMes: cobrado + pendiente,
      cobradoMes: cobrado,
      pendienteMes: pendiente,
      cobrosPendientesCantidad,
      diaMasConsultas: null,
      obraSocialMasPacientes: null,
      promedioConsultasPorDia: consultasMes.length > 0 ? consultasMes.length / new Set(consultasMes.map(c => c.fecha)).size : 0,
      consultasMes: consultasMes.length,
    })
  }

  // ── TURNOS ───────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/turnos') {
    const desde = params.get('desde'), hasta = params.get('hasta')
    const list = store.turnos.filter(t => (!desde || t.fechaHora >= desde) && (!hasta || t.fechaHora < hasta))
    return jsonRes(list)
  }
  if (method === 'POST' && pathname === '/turnos') {
    if (creadosEnDemo.turnos >= LIMITES.turnos) return limiteRes('turnos')
    const nuevo = { id: nextId++, profesionalId: 1, estado: 'PENDIENTE', ...body }
    // Denormalizamos nombre/apellido del paciente por comodidad
    if (nuevo.pacienteId) {
      const p = store.pacientes.find(x => x.id === nuevo.pacienteId)
      if (p) { nuevo.pacienteNombre = p.nombre; nuevo.pacienteApellido = p.apellido }
    }
    store.turnos.push(nuevo)
    creadosEnDemo.turnos++
    return jsonRes(nuevo, 201)
  }
  if (method === 'PUT' && /^\/turnos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const t = store.turnos.find(x => x.id === id)
    if (t) Object.assign(t, body)
    return jsonRes(t ?? {})
  }
  if (method === 'DELETE' && /^\/turnos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    store.turnos = store.turnos.filter(t => t.id !== id)
    return emptyRes()
  }

  // ── GOOGLE CALENDAR (deshabilitado en demo) ──────────────────────
  if (method === 'GET' && pathname === '/calendar/status')      return jsonRes({ connected: false })
  if (method === 'GET' && pathname === '/calendar/auth-url')    return jsonRes({ error: 'No disponible en demo' }, 501)
  if (method === 'POST' && pathname === '/calendar/desconectar') return emptyRes()

  // ── FINANZAS ─────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/finanzas/ingresos') {
    const mes = params.get('mes')
    return jsonRes(mes ? store.ingresos.filter(i => (i.fecha || '').startsWith(mes)) : store.ingresos)
  }
  if (method === 'GET' && pathname === '/finanzas/egresos') {
    const mes = params.get('mes')
    return jsonRes(mes ? store.egresos.filter(e => (e.fecha || '').startsWith(mes)) : store.egresos)
  }
  if (method === 'GET' && pathname === '/finanzas/resumen') {
    // Muy simple — solo devolvemos variacionPct hardcodeada positiva para dar sensación de crecimiento
    return jsonRes({ variacionPct: 12.5 })
  }
  if (method === 'GET' && pathname === '/finanzas/estadisticas-anuales') {
    // 12 meses de data — usamos los ingresos + agregamos algunos meses sintéticos
    const out = []
    const hoy = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mes = d.toISOString().slice(0, 7)
      const ings = store.ingresos.filter(x => (x.fecha || '').startsWith(mes) && x.estado === 'CONFIRMADO').reduce((s, i) => s + (Number(i.monto) || 0), 0)
      // Si el mes es pasado y no tiene data real, ponemos números sintéticos suaves
      const sintetico = i > 1 && ings === 0 ? 40000 + Math.round(Math.random() * 40000) : 0
      out.push({ mes, año: d.getFullYear(), mesNumero: d.getMonth() + 1, ingresosTotales: ings + sintetico, consultas: 0 })
    }
    return jsonRes(out)
  }
  if (method === 'GET' && pathname === '/finanzas/movimientos') {
    // Concatenamos ingresos + egresos + cobros como una sola lista de movimientos
    const mov = []
    for (const i of store.ingresos) {
      mov.push({ id: i.id, origen: i.consultaId ? 'consulta' : 'libre', tipo: i.estado === 'CONFIRMADO' ? 'ingreso' : 'pendiente',
        fecha: i.fecha, descripcion: i.descripcion || (i.consultaId ? 'Consulta' : 'Ingreso libre'),
        monto: i.monto, estado: i.estado, consultaId: i.consultaId, pacienteId: i.pacienteId,
        obraSocialId: i.obraSocialId, obraSocialNombre: i.obraSocialNombre,
        consultorioNombre: i.consultorioNombre, medioPagoNombre: i.medioPagoNombre })
    }
    for (const c of (store.cobrosOs || [])) {
      mov.push({ id: c.id, origen: 'cobro_os', tipo: 'ingreso', fecha: c.fecha,
        descripcion: `Cobro · ${c.obraSocialNombre || 'Obra social'}`, monto: c.montoRecibido, estado: 'CONFIRMADO',
        obraSocialId: c.obraSocialId, obraSocialNombre: c.obraSocialNombre,
        cobroObraSocialId: c.id, cobroObraSocialFecha: c.fecha,
        consultorioNombre: c.consultorioNombre, medioPagoNombre: c.medioPagoNombre })
    }
    for (const e of store.egresos) {
      mov.push({ id: e.id, origen: 'egreso', tipo: 'egreso', fecha: e.fecha,
        descripcion: e.descripcion || 'Egreso', monto: e.monto, estado: 'CONFIRMADO',
        consultorioNombre: e.consultorioNombre, medioPagoNombre: e.medioPagoNombre })
    }
    mov.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
    return jsonRes({ content: mov, last: true, number: 0, totalElements: mov.length })
  }
  if (method === 'GET' && pathname === '/finanzas/ingresos/pendientes-os') {
    return jsonRes(store.ingresos.filter(i => i.estado === 'PENDIENTE' && i.tipoPago === 'OBRA_SOCIAL').map(i => {
      const c = store.consultas.find(x => x.id === i.consultaId)
      const p = store.pacientes.find(x => x.id === i.pacienteId)
      return {
        ingresoId: i.id, consultaId: i.consultaId, pacienteId: i.pacienteId,
        pacienteApellido: p?.apellido, pacienteNombre: p?.nombre,
        obraSocialId: i.obraSocialId, obraSocialNombre: i.obraSocialNombre,
        consultorioId: i.consultorioId, consultorioNombre: i.consultorioNombre,
        fecha: i.fecha, descripcion: c?.motivo, monto: i.monto,
      }
    }))
  }
  if (method === 'GET' && pathname === '/finanzas/ingresos/pendientes-particulares') {
    return jsonRes(store.ingresos.filter(i => i.estado === 'PENDIENTE' && i.tipoPago === 'PARTICULAR').map(i => {
      const c = store.consultas.find(x => x.id === i.consultaId)
      const p = store.pacientes.find(x => x.id === i.pacienteId)
      return {
        ingresoId: i.id, consultaId: i.consultaId, pacienteId: i.pacienteId,
        pacienteApellido: p?.apellido, pacienteNombre: p?.nombre,
        consultorioId: i.consultorioId, consultorioNombre: i.consultorioNombre,
        fecha: i.fecha, descripcion: c?.motivo, monto: i.monto,
      }
    }))
  }
  if (method === 'GET' && pathname === '/finanzas/ingresos/pendientes-por-os') {
    const osId  = Number(params.get('obraSocialId'))
    const consId = Number(params.get('consultorioId'))
    return jsonRes(store.ingresos.filter(i => i.estado === 'PENDIENTE' && i.tipoPago === 'OBRA_SOCIAL' && i.obraSocialId === osId && i.consultorioId === consId).map(i => {
      const c = store.consultas.find(x => x.id === i.consultaId)
      const p = store.pacientes.find(x => x.id === i.pacienteId)
      return {
        ingresoId: i.id, consultaId: i.consultaId, pacienteId: i.pacienteId,
        pacienteApellido: p?.apellido, pacienteNombre: p?.nombre,
        fecha: i.fecha, descripcion: c?.motivo, monto: i.monto,
      }
    }))
  }
  if (method === 'POST' && pathname === '/finanzas/ingresos') {
    if (creadosEnDemo.ingresos >= LIMITES.ingresos) return limiteRes('ingresos')
    const nuevo = { id: nextId++, profesionalId: 1, estado: 'CONFIRMADO', tipoPago: 'OTRO', ...body }
    if (nuevo.medioPagoId) { const mp = store.mediosPago.find(m => m.id === nuevo.medioPagoId); if (mp) nuevo.medioPagoNombre = mp.nombre }
    if (nuevo.consultorioId) { const co = store.consultorios.find(c => c.id === nuevo.consultorioId); if (co) nuevo.consultorioNombre = co.nombre }
    store.ingresos.push(nuevo)
    creadosEnDemo.ingresos++
    return jsonRes(nuevo, 201)
  }
  if (method === 'POST' && pathname === '/finanzas/egresos') {
    if (creadosEnDemo.egresos >= LIMITES.egresos) return limiteRes('egresos')
    const nuevo = { id: nextId++, profesionalId: 1, ...body }
    if (nuevo.medioPagoId) { const mp = store.mediosPago.find(m => m.id === nuevo.medioPagoId); if (mp) nuevo.medioPagoNombre = mp.nombre }
    if (nuevo.consultorioId) { const co = store.consultorios.find(c => c.id === nuevo.consultorioId); if (co) nuevo.consultorioNombre = co.nombre }
    store.egresos.push(nuevo)
    creadosEnDemo.egresos++
    return jsonRes(nuevo, 201)
  }
  if (method === 'DELETE' && /^\/finanzas\/ingresos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[3])
    store.ingresos = store.ingresos.filter(i => i.id !== id)
    return emptyRes()
  }
  if (method === 'DELETE' && /^\/finanzas\/egresos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[3])
    store.egresos = store.egresos.filter(e => e.id !== id)
    return emptyRes()
  }
  if (method === 'PATCH' && /^\/finanzas\/ingresos\/\d+\/confirmar-particular$/.test(pathname)) {
    const id = Number(pathname.split('/')[3])
    const i = store.ingresos.find(x => x.id === id)
    if (i) {
      i.estado = 'CONFIRMADO'
      if (body?.fecha) i.fecha = body.fecha
      if (body?.monto != null) i.monto = body.monto
      if (body?.medioPagoId) { const mp = store.mediosPago.find(m => m.id === body.medioPagoId); if (mp) { i.medioPagoId = mp.id; i.medioPagoNombre = mp.nombre } }
    }
    return jsonRes(i ?? {})
  }

  // ── COBROS OS ────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/cobros-os') {
    const mes = params.get('mes')
    return jsonRes(mes ? (store.cobrosOs || []).filter(c => (c.fecha || '').startsWith(mes)) : (store.cobrosOs || []))
  }
  if (method === 'POST' && pathname === '/cobros-os') {
    if (!store.cobrosOs) store.cobrosOs = []
    const os = store.obrasSociales.find(o => o.id === body.obraSocialId)
    const co = store.consultorios.find(c => c.id === body.consultorioId)
    const mp = store.mediosPago.find(m => m.id === body.medioPagoId)
    const nuevo = { id: nextId++, profesionalId: 1,
      obraSocialId: body.obraSocialId, obraSocialNombre: os?.nombre,
      consultorioId: body.consultorioId, consultorioNombre: co?.nombre,
      medioPagoId: body.medioPagoId, medioPagoNombre: mp?.nombre,
      montoRecibido: body.montoRecibido, fecha: body.fecha, descripcion: body.descripcion,
      dateCreated: new Date().toISOString(),
    }
    store.cobrosOs.push(nuevo)
    // Marcamos los ingresos incluidos como CONFIRMADO
    for (const ingId of (body.ingresoIds || [])) {
      const i = store.ingresos.find(x => x.id === ingId)
      if (i) { i.estado = 'CONFIRMADO'; i.cobroObraSocial = nuevo.id }
    }
    return jsonRes(nuevo, 201)
  }
  if (method === 'DELETE' && /^\/cobros-os\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    // Revertimos: los ingresos que estaban asociados vuelven a PENDIENTE
    store.ingresos.filter(i => i.cobroObraSocial === id).forEach(i => { i.estado = 'PENDIENTE'; i.cobroObraSocial = null })
    store.cobrosOs = (store.cobrosOs || []).filter(c => c.id !== id)
    return emptyRes()
  }
  if (method === 'GET' && /^\/cobros-os\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const c = (store.cobrosOs || []).find(x => x.id === id)
    return c ? jsonRes(c) : jsonRes({ error: 'No encontrado' }, 404)
  }

  // ── CATÁLOGOS (CRUD) — medios de pago, obras sociales, consultorios ──
  // En demo: POST bloqueado siempre. DELETE bloqueado para obras sociales y consultorios
  // (para medios de pago sí se puede eliminar los custom — los sistema están protegidos).
  const crudCatalogo = (colName, opts = {}) => {
    const { bloquearDelete = false, singular = 'catálogo' } = opts
    if (method === 'POST' && pathname === `/${colName}`) {
      return bloqueadoRes('En modo demo no se pueden agregar catálogos nuevos. Para configurar los tuyos, solicitá tu cuenta desde el login.')
    }
    if (method === 'PUT' && new RegExp(`^/${colName}/\\d+$`).test(pathname)) {
      const id = Number(pathname.split('/')[2])
      const it = store[camelKey(colName)].find(x => x.id === id)
      if (!it) return jsonRes({ error: 'No encontrado' }, 404)
      if (it.sistema) return jsonRes({ error: 'No se puede modificar un medio del sistema' }, 400)
      if (body.nombre) it.nombre = body.nombre
      return jsonRes(it)
    }
    if (method === 'DELETE' && new RegExp(`^/${colName}/\\d+$`).test(pathname)) {
      if (bloquearDelete) {
        return bloqueadoRes(`En modo demo no se pueden eliminar ${singular}. Para gestionar tus propios ${singular}, solicitá tu cuenta desde el login.`)
      }
      const id = Number(pathname.split('/')[2])
      const list = store[camelKey(colName)]
      const it = list.find(x => x.id === id)
      if (it?.sistema) return jsonRes({ error: 'No se puede eliminar un medio del sistema' }, 400)
      store[camelKey(colName)] = list.filter(x => x.id !== id)
      return emptyRes()
    }
    return null
  }
  const catMp   = crudCatalogo('medios-pago');                                                    if (catMp)   return catMp
  const catOs   = crudCatalogo('obras-sociales', { bloquearDelete: true, singular: 'obras sociales' });  if (catOs)   return catOs
  const catCons = crudCatalogo('consultorios',   { bloquearDelete: true, singular: 'consultorios' });    if (catCons) return catCons

  // ── PACIENTES ─────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/pacientes') {
    const buscar = (params.get('buscar') || '').toLowerCase()
    const filtrados = buscar
      ? store.pacientes.filter(p =>
          p.nombre?.toLowerCase().includes(buscar) ||
          p.apellido?.toLowerCase().includes(buscar) ||
          p.dni?.toLowerCase().includes(buscar))
      : store.pacientes
    return jsonRes({ content: filtrados, last: true, number: 0, totalElements: filtrados.length })
  }
  // ODONTOGRAMAS del paciente (importante: matchear antes del GET /pacientes/{id} genérico)
  if (method === 'GET' && /^\/pacientes\/\d+\/odontogramas$/.test(pathname)) {
    const pacId = Number(pathname.split('/')[2])
    return jsonRes((store.odontogramas || []).filter(o => o.pacienteId === pacId))
  }
  if (method === 'POST' && /^\/pacientes\/\d+\/odontograma$/.test(pathname)) {
    // Guarda las superficies del odontograma "actual" (upsert)
    const pacId = Number(pathname.split('/')[2])
    if (!store.odontogramas) store.odontogramas = []
    let actual = store.odontogramas.find(o => o.pacienteId === pacId && !o.archivado)
    if (!actual) {
      actual = { id: nextId++, pacienteId: pacId, archivado: false, superficies: {}, dateCreated: new Date().toISOString() }
      store.odontogramas.unshift(actual)
    }
    actual.superficies = body?.superficies || {}
    actual.lastUpdated = new Date().toISOString()
    return jsonRes(actual)
  }
  if (method === 'POST' && /^\/pacientes\/\d+\/odontogramas$/.test(pathname)) {
    // "+ Nuevo odontograma" — archiva el actual, crea uno vacío nuevo
    const pacId = Number(pathname.split('/')[2])
    if (!store.odontogramas) store.odontogramas = []
    store.odontogramas.filter(o => o.pacienteId === pacId).forEach(o => { o.archivado = true })
    const nuevo = { id: nextId++, pacienteId: pacId, archivado: false, superficies: {}, dateCreated: new Date().toISOString() }
    store.odontogramas.unshift(nuevo)
    return jsonRes(nuevo, 201)
  }

  // GET /pacientes/{id} exacto (no /pacientes/{id}/algo)
  if (method === 'GET' && /^\/pacientes\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const p = store.pacientes.find(x => x.id === id)
    return p ? jsonRes(p) : jsonRes({ error: 'No encontrado' }, 404)
  }
  if (method === 'POST' && pathname === '/pacientes') {
    if (creadosEnDemo.pacientes >= LIMITES.pacientes) return limiteRes('pacientes')
    const nuevo = { id: nextId++, ...body, obrasSociales: body.obrasSociales || [], dateCreated: new Date().toISOString(), lastUpdated: new Date().toISOString(), ultimaVisita: null, proximoTurno: null }
    store.pacientes.push(nuevo)
    creadosEnDemo.pacientes++
    return jsonRes(nuevo, 201)
  }
  if (method === 'PUT' && /^\/pacientes\/\d+$/.test(pathname)) {
    return bloqueadoRes('En modo demo no se pueden editar los pacientes. Para probar la edición, solicitá tu cuenta desde el login.')
  }
  if (method === 'DELETE' && /^\/pacientes\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    store.pacientes = store.pacientes.filter(x => x.id !== id)
    return emptyRes()
  }

  // ── CONSULTAS ────────────────────────────────────────────────────
  if (method === 'GET' && pathname.startsWith('/consultas/paciente/')) {
    const pacId = Number(pathname.split('/')[3])
    return jsonRes(store.consultas.filter(c => c.pacienteId === pacId).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')))
  }
  if (method === 'GET' && /^\/consultas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const c = store.consultas.find(x => x.id === id)
    return c ? jsonRes(c) : jsonRes({ error: 'No encontrada' }, 404)
  }
  if (method === 'POST' && pathname === '/consultas') {
    const pacId = body?.pacienteId
    const yaCreadas = creadosPorPaciente.consultas[pacId] || 0
    if (yaCreadas >= LIMITE_POR_PAC.consultas) return limitePorPacRes('consultas')
    const nueva = { id: nextId++, profesionalId: 1, estadoIngreso: 'CONFIRMADO', dateCreated: new Date().toISOString(), ...body }
    store.consultas.push(nueva)
    creadosPorPaciente.consultas[pacId] = yaCreadas + 1
    return jsonRes(nueva, 201)
  }
  if (method === 'PUT' && /^\/consultas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const c = store.consultas.find(x => x.id === id)
    if (c) Object.assign(c, body)
    return jsonRes(c ?? {})
  }
  if (method === 'DELETE' && /^\/consultas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    store.consultas = store.consultas.filter(c => c.id !== id)
    return emptyRes()
  }

  // ── ESTUDIOS ─────────────────────────────────────────────────────
  if (method === 'GET' && pathname.startsWith('/estudios/paciente/')) {
    const pacId = Number(pathname.split('/')[3])
    // Devolvemos la meta (sin imagen — el listado no necesita el base64)
    return jsonRes(store.estudios.filter(e => e.pacienteId === pacId).map(e => ({
      id: e.id, nombre: e.nombre, dateCreated: e.dateCreated, pacienteId: e.pacienteId,
    })))
  }
  if (method === 'GET' && /^\/estudios\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const e = store.estudios.find(x => x.id === id)
    if (!e) return jsonRes({ error: 'No encontrado' }, 404)
    // Resolvemos la imagen a base64 si tiene path (primera vez, después va cacheada)
    let imagenBase64 = e.imagenBase64
    if (!imagenBase64 && e.imagenPath) {
      imagenBase64 = await cargarImagenEstudio(e.imagenPath)
    }
    return jsonRes({
      id: e.id, nombre: e.nombre, pacienteId: e.pacienteId,
      trazos: e.trazos || [], escala: e.escala || 1,
      descripcion: e.descripcion || '',
      imagenTipo: e.imagenTipo || 'image/jpeg',
      imagenBase64,
    })
  }
  if (method === 'PUT' && /^\/estudios\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    const e = store.estudios.find(x => x.id === id)
    if (e) {
      if (body.trazos !== undefined)      e.trazos = body.trazos
      if (body.escala !== undefined)      e.escala = body.escala
      if (body.descripcion !== undefined) e.descripcion = body.descripcion
      e.lastUpdated = new Date().toISOString()
    }
    return jsonRes(e ?? {})
  }
  if (method === 'DELETE' && /^\/estudios\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/')[2])
    store.estudios = store.estudios.filter(e => e.id !== id)
    return emptyRes()
  }
  // POST /estudios (multipart FormData) — en demo ignoramos el archivo real y creamos un
  // estudio con la imagen preloaded. El front igual usa URL.createObjectURL en el momento,
  // pero al volver a abrir (GET /estudios/{id}) va a servir la radiografía cefalométrica.
  if (method === 'POST' && pathname === '/estudios' && opts?.body instanceof FormData) {
    const fd = opts.body
    const nombre    = fd.get('nombre')     || 'Estudio demo'
    const pacId     = Number(fd.get('pacienteId'))
    const escalaStr = fd.get('escala')     || '1'
    const yaCreados = creadosPorPaciente.estudios[pacId] || 0
    if (yaCreados >= LIMITE_POR_PAC.estudios) return limitePorPacRes('estudios')
    const nuevo = {
      id: nextId++, pacienteId: pacId, profesionalId: 1,
      nombre, descripcion: '',
      imagenPath: '/demo/estudio.jpg',
      imagenTipo: 'image/jpeg',
      trazos: [], escala: parseFloat(escalaStr) || 1,
      dateCreated: new Date().toISOString(), lastUpdated: new Date().toISOString(),
    }
    store.estudios.push(nuevo)
    creadosPorPaciente.estudios[pacId] = yaCreados + 1
    return jsonRes({ id: nuevo.id, nombre: nuevo.nombre, pacienteId: nuevo.pacienteId }, 201)
  }

  // ── FIRMAS (el overlay polea esto cada vez que la app gana foco) ──
  // Devolvemos 204 (No Content) que es lo que espera el componente cuando no hay firma pendiente.
  if (method === 'GET' && pathname === '/firmas/pendiente') return emptyRes(204)

  // ── CATÁLOGOS ───────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/consultorios')   return jsonRes(store.consultorios)
  if (method === 'GET' && pathname === '/obras-sociales') return jsonRes(store.obrasSociales)
  if (method === 'GET' && pathname === '/medios-pago')    return jsonRes(store.mediosPago)

  // ── DEFAULT: request no mockeada → respondemos vacío para no romper la UI ──
  console.warn(`[demoApiFetch] request sin mock: ${method} ${path}`)
  return jsonRes([])
}

function safeJson(s) { try { return JSON.parse(s) } catch { return s } }
function camelKey(kebab) { return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) }

/** Reset del store (para el botón "Reiniciar datos" del banner). */
export function resetDemo() {
  store = crearSeed()
  estudioImagenBase64Cache = null
  nextId = 10000
  creadosEnDemo = { turnos: 0, pacientes: 0, ingresos: 0, egresos: 0 }
  creadosPorPaciente = { consultas: {}, estudios: {} }
}
