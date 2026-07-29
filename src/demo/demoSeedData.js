/**
 * Data fake inicial del demo. Simula el estado de un consultorio en pleno uso,
 * unas semanas de historia. Todo vive en memoria y se resetea al refrescar.
 *
 * IDs bajos y predecibles para debug. Fechas relativas a "hoy" para que el demo
 * siempre se sienta actual (turnos de hoy, consultas de la semana pasada, etc).
 */

const hoy = new Date()
const iso = (d) => d.toISOString().slice(0, 10) // YYYY-MM-DD
const isoDT = (d) => d.toISOString().slice(0, 19) // YYYY-MM-DDTHH:MM:SS
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const setTime = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x }

export const USUARIO_DEMO = {
  nombre:              'María',
  apellido:            'García',
  email:               'demo@holadocapp.com',
  perfilCompleto:      true,
  especialidadNombre:  'Odontología', // ← nombre del campo real (esOdontologo mira esto)
  esAdmin:             false,
  foto:                null,
}

export function crearSeed() {
  return {
    consultorios: [
      { id: 1, nombre: 'Casa Central' },
    ],
    obrasSociales: [
      { id: 1, nombre: 'OSDE' },
      { id: 2, nombre: 'Swiss Medical' },
      { id: 3, nombre: 'IOMA' },
    ],
    mediosPago: [
      { id: 1, nombre: 'Efectivo',      sistema: true,  dateCreated: isoDT(addDays(hoy, -60)) },
      { id: 2, nombre: 'Transferencia', sistema: true,  dateCreated: isoDT(addDays(hoy, -60)) },
      { id: 3, nombre: 'Mercado Pago',  sistema: false, dateCreated: isoDT(addDays(hoy, -40)) },
    ],
    pacientes: [
      {
        id: 1, nombre: 'Juan', apellido: 'López', dni: '30.888.111', fechaNac: '1985-03-12',
        telefono: '+54 351 555 1122', email: 'juan.lopez@mail.com', direccion: 'Rivadavia 250',
        obrasSociales: [{ obraSocialId: 1, obraSocialNombre: 'OSDE', nroAfiliado: '12345', plan: '210', titular: 'Juan López' }],
        antecedentes: 'HTA controlada.', alergias: null, medicaciones: 'Losartán 50mg',
        dateCreated: isoDT(addDays(hoy, -90)), lastUpdated: isoDT(addDays(hoy, -14)),
        ultimaVisita: iso(addDays(hoy, -14)), proximoTurno: iso(addDays(hoy, 3)),
      },
      {
        id: 4, nombre: 'Lucía', apellido: 'Fernández', dni: '38.111.999', fechaNac: '1995-01-19',
        telefono: '+54 351 555 7788', email: 'lucia.f@mail.com', direccion: null,
        obrasSociales: [{ obraSocialId: 3, obraSocialNombre: 'IOMA', nroAfiliado: '55432', plan: 'A', titular: 'Lucía Fernández' }],
        antecedentes: null, alergias: null,
        dateCreated: isoDT(addDays(hoy, -40)), lastUpdated: isoDT(addDays(hoy, -3)),
        ultimaVisita: iso(addDays(hoy, -3)), proximoTurno: iso(hoy),
      },
      {
        id: 5, nombre: 'Roberto', apellido: 'Núñez', dni: '31.444.555', fechaNac: '1988-05-10',
        telefono: '+54 351 555 9911', email: 'rn@mail.com', direccion: null,
        obrasSociales: [{ obraSocialId: 2, obraSocialNombre: 'Swiss Medical', nroAfiliado: '77766', plan: 'SB10', titular: 'Roberto Núñez' }],
        antecedentes: null, alergias: null,
        dateCreated: isoDT(addDays(hoy, -30)), lastUpdated: isoDT(addDays(hoy, -1)),
        ultimaVisita: iso(addDays(hoy, -1)), proximoTurno: iso(addDays(hoy, 5)),
      },
    ],
    consultas: [
      { id: 101, pacienteId: 1, pacienteNombre: 'Juan',    pacienteApellido: 'López',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  fecha: iso(addDays(hoy, -14)), motivo: 'Endodoncia 2.6',            descripcion: 'Apertura cameral, instrumentación con Reciproc, obturación con gutapercha.', monto: 25000, tipoPago: 'OBRA_SOCIAL', obraSocialId: 1, obraSocialNombre: 'OSDE',           estadoIngreso: 'CONFIRMADO', dateCreated: isoDT(addDays(hoy, -14)) },
      { id: 107, pacienteId: 1, pacienteNombre: 'Juan',    pacienteApellido: 'López',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  fecha: iso(addDays(hoy, -45)), motivo: 'Limpieza + control',        descripcion: 'Tartrectomía supragingival. Refuerzo de higiene.',                            monto: 10000, tipoPago: 'OBRA_SOCIAL', obraSocialId: 1, obraSocialNombre: 'OSDE',           estadoIngreso: 'CONFIRMADO', dateCreated: isoDT(addDays(hoy, -45)) },
      { id: 104, pacienteId: 4, pacienteNombre: 'Lucía',   pacienteApellido: 'Fernández', profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  fecha: iso(addDays(hoy, -3)),  motivo: 'Blanqueamiento sesión 1',   descripcion: 'Aplicación de peróxido. Se indica continuidad en casa.',                       monto: 15000, tipoPago: 'PARTICULAR',                                                            estadoIngreso: 'CONFIRMADO', dateCreated: isoDT(addDays(hoy, -3))  },
      { id: 105, pacienteId: 5, pacienteNombre: 'Roberto', pacienteApellido: 'Núñez',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  fecha: iso(addDays(hoy, -1)),  motivo: 'Consulta cefalométrica',   descripcion: 'Análisis ortodóntico previo a tratamiento.',                                    monto: 12000, tipoPago: 'OBRA_SOCIAL', obraSocialId: 2, obraSocialNombre: 'Swiss Medical', estadoIngreso: 'PENDIENTE',  dateCreated: isoDT(addDays(hoy, -1))  },
    ],
    turnos: [
      { id: 203, pacienteId: 4, pacienteNombre: 'Lucía',   pacienteApellido: 'Fernández', profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  motivo: 'Blanqueamiento s.2',  tipoPago: 'PARTICULAR',                                            fechaHora: isoDT(setTime(hoy, 15, 0)),              duracionMinutos: 60, estado: 'PENDIENTE' },
      { id: 204, pacienteId: 1, pacienteNombre: 'Juan',    pacienteApellido: 'López',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  motivo: 'Control post-endo',   tipoPago: 'OBRA_SOCIAL', obraSocialNombre: 'OSDE',                 fechaHora: isoDT(setTime(hoy, 16, 30)),             duracionMinutos: 20, estado: 'PENDIENTE' },
      { id: 206, pacienteId: 1, pacienteNombre: 'Juan',    pacienteApellido: 'López',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  motivo: 'Sesión 2 endo',       tipoPago: 'OBRA_SOCIAL', obraSocialNombre: 'OSDE',                 fechaHora: isoDT(setTime(addDays(hoy, 3), 10, 0)),  duracionMinutos: 45, estado: 'PENDIENTE' },
      { id: 209, pacienteId: 5, pacienteNombre: 'Roberto', pacienteApellido: 'Núñez',     profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central',  motivo: 'Control ortodoncia',  tipoPago: 'OBRA_SOCIAL', obraSocialNombre: 'Swiss Medical',        fechaHora: isoDT(setTime(addDays(hoy, 5), 11, 0)),  duracionMinutos: 30, estado: 'PENDIENTE' },
    ],
    ingresos: [
      { id: 301, consultaId: 101, pacienteId: 1, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -14)), monto: 5000,  tipoPago: 'OBRA_SOCIAL', obraSocialId: 1, obraSocialNombre: 'OSDE',           medioPagoId: 1, medioPagoNombre: 'Efectivo',      estado: 'CONFIRMADO', descripcion: 'Coseguro endodoncia' },
      { id: 306, consultaId: 107, pacienteId: 1, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -45)), monto: 2000,  tipoPago: 'OBRA_SOCIAL', obraSocialId: 1, obraSocialNombre: 'OSDE',           medioPagoId: 1, medioPagoNombre: 'Efectivo',      estado: 'CONFIRMADO', descripcion: 'Coseguro limpieza' },
      { id: 304, consultaId: 104, pacienteId: 4, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -3)),  monto: 15000, tipoPago: 'PARTICULAR',                                                     medioPagoId: 1, medioPagoNombre: 'Efectivo',      estado: 'CONFIRMADO', descripcion: null },
      { id: 307, consultaId: 105, pacienteId: 5, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -1)),  monto: null,  tipoPago: 'OBRA_SOCIAL', obraSocialId: 2, obraSocialNombre: 'Swiss Medical', medioPagoId: null, medioPagoNombre: null,          estado: 'PENDIENTE',  descripcion: null },
    ],
    egresos: [
      { id: 401, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -10)), monto: 35000, medioPagoId: 2, medioPagoNombre: 'Transferencia', descripcion: 'Alquiler consultorio' },
      { id: 402, profesionalId: 1, consultorioId: 1, consultorioNombre: 'Casa Central', fecha: iso(addDays(hoy, -5)),  monto: 8500,  medioPagoId: 1, medioPagoNombre: 'Efectivo',      descripcion: 'Insumos varios (guantes, gasas)' },
    ],
    cobrosOs: [],
    // Estudios — el editor abre uno de estos. La imagen se sirve desde /demo/estudio.jpg
    // (el mock convierte esa URL a base64 al momento de responder GET /estudios/{id}).
    estudios: [
      {
        id: 501, pacienteId: 5, profesionalId: 1,
        nombre: 'Telerradiografía lateral · análisis cefalométrico',
        descripcion: '',
        imagenPath: '/demo/estudio.jpg', // se resuelve a base64 en el mock
        imagenTipo: 'image/jpeg',
        trazos: [],
        escala: 1,
        dateCreated: isoDT(addDays(hoy, -1)),
        lastUpdated: isoDT(addDays(hoy, -1)),
      },
    ],
  }
}
