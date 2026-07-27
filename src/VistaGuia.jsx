import { T, useIsMobile, Logo } from './App.jsx'
import {
  MockupInicio, MockupPacientes, MockupFichaPaciente, MockupTurnos,
  MockupIniciarConsulta, MockupAjustes,
} from './VistaGuiaMockups.jsx'

/**
 * Frame para un mockup/screenshot "real" (SVG o <img>). Borde solid + sombra suave —
 * a diferencia de GuiaFigure, no tiene el estilo dashed de placeholder.
 */
function GuiaScreenshot({ children, caption }) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{
        background: T.white,
        border: `1px solid ${T.gray1}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        {children}
      </div>
      {caption && (
        <figcaption style={{ marginTop: 8, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Placeholder de imagen para la guía — mostrá un rectángulo 16:10 con borde punteado
 * y el label descriptivo adentro. Reemplazalo por <img src="..." /> cuando tengas el
 * screenshot real.
 */
function GuiaFigure({ label, caption }) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{
        background: T.white,
        border: `1px dashed ${T.gray3}`,
        borderRadius: 12,
        aspectRatio: '16/10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.gray4, fontFamily: T.mono, fontSize: 11,
        letterSpacing: '0.06em', textAlign: 'center', padding: 20,
      }}>
        <span>{label}</span>
      </div>
      {caption && (
        <figcaption style={{ marginTop: 8, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.gray5 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * VistaGuia (pública, sin login, sin API calls)
 * Documentación de uso del sistema. Se carga vía React.lazy() desde App.jsx, así que
 * su código NO va en el bundle principal — solo se descarga cuando alguien entra a
 * /bienvenida/{token}.
 *
 * Cada sección tiene un placeholder de imagen para que le agregues los screenshots
 * reales editando el `src` del <img>. El link a esta página lo mandás manualmente por
 * mail a los leads que llenan el form "Solicitar guía".
 */
export default function VistaGuia() {
  const isMobile = useIsMobile()

  const SECCIONES = [
    {
      id: 'inicio',
      titulo: 'Inicio',
      descripcion: 'Al abrir la app vas al Inicio — un panel diseñado para que en 5 segundos sepas qué pasa hoy y cómo viene el mes. Todo lo que ves acá se calcula solo a partir de los turnos, consultas y cobros que fuiste cargando.',
      mockup: <MockupInicio />,
      bloques: [
        {
          subtitulo: 'Tu agenda del día',
          texto: 'La tarjeta negra grande lista los turnos de hoy en orden cronológico. El próximo turno queda destacado en blanco arriba de todo — así siempre sabés cuánto falta para el siguiente paciente. Los demás aparecen en oscuro con un badge de estado (Confirmado en verde, Sin confirmar en naranja).',
        },
        {
          subtitulo: 'Alertas de atención',
          texto: 'Debajo de la agenda ves dos tarjetas con borde naranja que sirven de recordatorio activo: cuántos turnos sin confirmar tenés para mañana (para mandar un WhatsApp) y cuántos cobros de obra social están pendientes (para reclamar el pago o registrar el cobro cuando llegue). Ambas son clickeables y te llevan directo a la pantalla que necesitás.',
        },
        {
          subtitulo: 'KPIs del mes',
          texto: 'Los 4 números grandes de abajo resumen el mes elegido: Ingresos (plata efectivamente cobrada, incluidos coseguros), Consultas realizadas, Promedio por día atendido y Pacientes activos. Podés cambiar el mes con las flechas ‹ › del selector "TU MES" para comparar con meses anteriores.',
        },
      ],
    },
    {
      id: 'pacientes',
      titulo: 'Pacientes',
      descripcion: 'Es el registro completo de todos los pacientes que atendés. Cada uno tiene su ficha propia con historia clínica, consultas realizadas, estudios asociados y odontograma. Todo en un solo lugar, sin papeles.',
      mockup: <MockupPacientes />,
      bloques: [
        {
          subtitulo: 'Lo que ves en la lista',
          texto: 'Cada paciente aparece como una tarjeta con avatar (iniciales), nombre y apellido, DNI, edad calculada, obras sociales asociadas, y a la derecha "Última visita" (calculada desde la fecha de la última consulta) y "Próximo turno" en verde si tiene uno agendado. Todo esto es información que no cargás manualmente — se deriva sola de los otros datos.',
        },
        {
          subtitulo: 'Buscar y abrir',
          texto: 'La barra de búsqueda filtra por nombre o DNI en tiempo real. Al clickear una tarjeta se abre la ficha completa. Podés crear un paciente nuevo con el botón negro de arriba a la derecha.',
        },
      ],
    },
    {
      id: 'ficha-paciente',
      titulo: 'Ficha del paciente',
      descripcion: 'La ficha es el hub de todo lo relacionado a un paciente y se abre en dos columnas: a la izquierda los datos personales editables (DNI, edad, teléfono, email, obra social, etc.) junto con el saldo pendiente y el próximo turno; a la derecha, una pestaña por tipo de contenido — Historia clínica, Odontograma y Estudios. Arriba del todo, los accesos rápidos para iniciar una consulta o subir un estudio nuevo.',
      mockup: <MockupFichaPaciente />,
      bloques: [
        {
          subtitulo: 'Historia clínica en timeline',
          texto: 'La pestaña principal muestra todo lo que le fue pasando al paciente en orden cronológico inverso (lo más nuevo arriba). Cada evento — una consulta, un estudio subido, un ingreso registrado — aparece como una fila con fecha, tipo, descripción corta y monto si corresponde. Es la vista clínica completa: entrás y ves toda la historia del paciente sin tener que abrir cada evento individualmente.',
        },
        {
          subtitulo: 'Acciones rápidas',
          texto: 'Desde la ficha tenés dos accesos directos arriba a la derecha: "Iniciar consulta" y "+ Nuevo estudio". Sirven para arrancar el flujo sin volver a la lista a buscar el paciente.',
        },
        {
          subtitulo: 'Odontograma',
          texto: 'En la pestaña "Odontograma" tenés el diagrama dental interactivo para marcar caries, tratamientos hechos, tratamientos planificados, ausencias, etc. Los cambios se guardan solos.',
        },
      ],
    },
    {
      id: 'turnos',
      titulo: 'Turnos',
      descripcion: 'La agenda del profesional. Muestra una grilla semanal con los turnos por consultorio, horario y paciente. Diseñada para trabajar rápido: reservar, confirmar o cancelar toma dos clicks.',
      mockup: <MockupTurnos />,
      bloques: [
        {
          subtitulo: 'Estados y colores',
          texto: 'Cada turno tiene un estado que se refleja en el color del bloque: Confirmado (verde), Sin confirmar / Pendiente (naranja), Cancelado (rojo). Al clickear un turno se abre un popup con el paciente, el consultorio, el motivo, y botones para confirmar, cancelar o abrir la ficha del paciente.',
        },
        {
          subtitulo: 'Sincronización con Google Calendar',
          texto: 'Podés conectar tu Google Calendar y todos los turnos que cargues acá se replican automáticamente en tu calendario personal — con recordatorios y notificaciones.',
        },
        {
          subtitulo: 'Contexto en el Inicio',
          texto: 'Los turnos de hoy aparecen también en el card negro "Tu agenda de hoy" del Inicio, y los sin confirmar de mañana disparan la alerta naranja. No tenés que estar en la pantalla de Turnos para saber qué se viene.',
        },
      ],
    },
    {
      id: 'consultas',
      titulo: 'Iniciar consulta',
      descripcion: 'La consulta es la unidad central de la app: cuando registrás una, el sistema no solo guarda la historia clínica del paciente sino que también crea el ingreso financiero asociado. Todo lo que hacés acá alimenta directamente Finanzas — sin doble carga.',
      mockup: <MockupIniciarConsulta />,
      bloques: [
        {
          subtitulo: 'Datos clínicos',
          texto: 'Cargás fecha, consultorio donde se atendió, motivo (ej. "Endodoncia pieza 2.6") y descripción detallada del tratamiento. Estos datos van a la historia clínica del paciente para que el próximo día que vuelva tengas todo el contexto.',
        },
        {
          subtitulo: 'Particular vs Obra social — la decisión clave',
          texto: 'Elegís el tipo de pago con dos botones. Esta decisión define cómo se contabiliza la plata:',
          bullets: [
            'Particular — el paciente te paga a vos directamente. Cargás el monto total, elegís el medio de pago (Efectivo, Transferencia, etc.) y listo. La plata cuenta como ingreso confirmado el mismo día.',
            'Obra social — la OS te va a pagar por lote (semana / quincena / mes, según el convenio). Elegís la OS, y opcionalmente cargás un "coseguro" — la parte que el paciente te paga en el momento aparte del arancel de la OS.',
          ],
        },
        {
          subtitulo: 'Cobrar ahora o dejar pendiente — vos decidís',
          texto: 'Debajo del selector de tipo de pago aparece un segundo toggle: "Cobrar ahora" o "Dejar pendiente". Este es el corazón de cómo el sistema entiende tu flujo de plata — no es implícito ni automático, vos elegís explícitamente en cada consulta.',
        },
        {
          subtitulo: 'Consulta Particular',
          texto: 'Cuando el tipo de pago es Particular, el toggle define qué pasa con la plata:',
          bullets: [
            'Cobrar ahora — el paciente te está pagando en el momento. Cargás el monto y elegís el medio de pago (Efectivo, Transferencia, etc.). Al guardar, el ingreso queda CONFIRMADO y suma directo a tus ingresos del mes.',
            'Dejar pendiente — el paciente te dijo que te paga después, o querés registrar la consulta ahora y cobrarla más adelante. El monto queda anotado pero el ingreso queda en estado PENDIENTE. NO suma a tus ingresos hasta que lo cobres.',
            'Cómo confirmar el cobro después: entrás a Finanzas → Movimientos, clickeás la fila del ingreso pendiente y elegís el medio de pago con el que finalmente cobraste. En ese momento pasa a CONFIRMADO y suma al mes en que efectivamente se cobró.',
          ],
        },
        {
          subtitulo: 'Consulta por Obra social',
          texto: 'Cuando es por OS, la plata te llega en 2 momentos distintos — el sistema los maneja por separado:',
          bullets: [
            'Coseguro (el toggle "Cobrar ahora") — es la plata que le cobrás al paciente en el momento (aparte del arancel de la OS). Cargás el monto del coseguro y el medio de pago con el que te lo pagó. Esa plata cuenta como CONFIRMADA el día de la consulta.',
            'Sin coseguro (el toggle "Dejar pendiente") — el paciente no te paga nada en el momento; toda la plata la va a poner la OS.',
            'Independiente de lo anterior, la parte que la OS te debe (arancel) SIEMPRE queda pendiente hasta que registres el cobro batch de esa OS (ver sección Cobros de obra social). Por eso una consulta OS con coseguro genera 2 líneas en Movimientos: 1 confirmada por el coseguro, 1 pendiente por el arancel de la OS.',
          ],
        },
        {
          subtitulo: 'La regla mental',
          texto: 'Pensalo así: "Cobrar ahora" = plata en tu bolsillo hoy, cuenta al mes. "Dejar pendiente" = pagaré, no cuenta hasta que lo cobres. Y todo lo de obra social queda pendiente por definición del lado de la OS — el toggle solo decide si además hubo coseguro en el momento.',
        },
      ],
    },
    {
      id: 'estudios',
      titulo: 'Estudios y radiografías',
      descripcion: 'Un ejemplo concreto para odontólogos: podés hacer un análisis cefalométrico completo sobre una telerradiografía lateral desde acá mismo — sin salir del sistema, sin exportar la imagen a otro programa. Más allá de ese caso puntual, podés subir cualquier radiografía (periapicales, ortopantomografías, telerradiografías, etc.) desde la ficha del paciente y trabajar sobre ella con herramientas de trazado y medición milimétrica. Todo lo que dibujás y medís queda guardado con la imagen — al abrirla de nuevo, ves lo mismo que dejaste.',
      // Sin `screenshot` ni `mockup` a nivel sección — la primera imagen aparece en el
      // primer bloque ("Subir un estudio") ya como screenshot real del editor.
      bloques: [
        {
          subtitulo: 'Subir un estudio',
          texto: 'Desde la ficha del paciente → tab "Estudios" → "Nuevo estudio". Arrastrás la imagen (o la seleccionás), le ponés un nombre y la fecha. La app soporta cualquier formato de imagen común (JPG, PNG). Una vez cargada, entrás al editor:',
          imagenSrc: '/guia/estudios-editor.png',
          imagenAlt: 'Editor de estudios con radiografía cargada y panel de herramientas a la izquierda',
          nota: 'Notá la cruz roja ✕ al lado de "Calibrar" en el panel izquierdo — indica que el estudio todavía no está calibrado y por lo tanto no podés realizar mediciones precisas. Cuando calibres, el ícono cambia a un tilde verde.',
        },
        {
          subtitulo: 'Calibrar la imagen (3 pasos)',
          texto: 'Antes de poder medir en milímetros reales, tenés que calibrar la imagen contra un reglero visible en la radiografía. El estado se ve al lado del botón "Calibrar" en el panel izquierdo: cruz roja ✕ = no calibrado (mediciones bloqueadas), tilde verde ✓ = calibrado (ya podés medir). Es un paso guiado: la app te muestra un banner con el paso actual (1/3, 2/3, 3/3) y no te deja avanzar hasta que cada paso esté listo.',
          bullets: [
            {
              texto: 'Paso 1/3 — Hacé zoom sobre el reglero hasta llegar a por lo menos 150%. La app no te deja avanzar con menos zoom: si el reglero está chico, marcar las marcas con precisión pixel es imposible.',
              imagenSrc: '/guia/CalibrarPaso1.png',
              imagenAlt: 'Banner del paso 1/3 pidiendo hacer zoom sobre el reglero',
            },
            {
              texto: 'Paso 2/3 — Hacé click sobre una marca larga del reglero (aparece una mini ilustración amarilla que te indica exactamente qué marca clickear).',
              imagenSrc: '/guia/CalibrarPaso2.png',
              imagenAlt: 'Banner del paso 2/3 con la mini ilustración amarilla apuntando a la primera marca',
            },
            {
              texto: 'Paso 3/3 — Hacé click sobre la siguiente marca larga (separada 10 mm). Con esos dos puntos la app calcula la relación "píxeles → milímetros" y guarda esa calibración con el estudio.',
              imagenSrc: '/guia/CalibrarPaso3.png',
              imagenAlt: 'Banner del paso 3/3 pidiendo la segunda marca del reglero',
            },
          ],
        },
        {
          subtitulo: 'Herramientas de dibujo',
          texto: 'Sirven para marcar puntos anatómicos, trazar líneas de referencia y delimitar áreas. Se seleccionan desde la barra izquierda; el cursor cambia a un lapicito blanco con contorno negro para que se vea bien tanto sobre zonas claras como oscuras. Podés cambiar el grosor del trazo (1×, 2×, 3×) y elegir entre una paleta de colores.',
          bullets: [
            'Punto — un click marca un punto sobre la imagen (útil para señalar landmarks anatómicos: ápices, puntos de referencia, etc.).',
            'Línea — dos clicks: primero fijás el punto de inicio, después el punto de fin.',
            'Círculo — click para el centro, click para el radio.',
            'Cuadrado — click para una esquina, click para la esquina opuesta.',
            'Borrar — click sobre cualquier trazo existente para eliminarlo. El cursor cambia a una goma para dejarlo claro.',
          ],
          imagenSrc: '/guia/herramientas.png',
          imagenAlt: 'Panel izquierdo del editor mostrando las herramientas de dibujo, grosor y paleta de colores',
          imagenMaxWidth: 260,
        },
        {
          subtitulo: 'Medir longitudes',
          texto: 'Una vez que trazaste una línea (con la herramienta Línea), la seleccionás con la herramienta "Medir longitud" y la app te muestra la distancia en milímetros al lado del trazo. La medición depende de la calibración: si no calibraste antes, no vas a ver mm reales.',
          bullets: [
            'Trazá primero la línea con la herramienta Línea.',
            'Pasá a "Medir longitud" y hacé click sobre esa línea.',
            'La longitud queda anclada al trazo (si movés el zoom, la etiqueta sigue en su lugar porque los trazos se guardan en coordenadas relativas, no absolutas).',
          ],
          imagenSrc: '/guia/medirLongitud.png',
          imagenAlt: 'Ejemplo de una línea sobre una radiografía con su etiqueta de longitud en milímetros',
        },
        {
          subtitulo: 'Medir ángulos',
          texto: 'Necesitás dos líneas trazadas para medir un ángulo entre ellas. Es el modo estándar de análisis cefalométrico.',
          bullets: [
            'Trazá las dos líneas que forman el ángulo con la herramienta Línea.',
            'Seleccioná "Medir ángulo" y hacé click sobre la primera línea (banner: paso 1/2).',
            'Click sobre la segunda línea (paso 2/2). La app calcula el ángulo entre ambas y lo muestra en grados en el vértice de intersección.',
          ],
          imagenSrc: '/guia/medirAngulo.png',
          imagenAlt: 'Ejemplo de dos líneas cruzadas sobre una radiografía con la etiqueta de grados en el vértice',
        },
        {
          subtitulo: 'Descripción / Análisis',
          texto: 'A la derecha del canvas hay un panel de texto libre donde podés escribir tus notas, hallazgos, diagnóstico o cualquier observación sobre el estudio. Todo lo que escribas se autoguarda a medida que tipeás y queda vinculado al estudio para siempre — al reabrirlo lo ves tal cual lo dejaste. Sirve como bitácora del análisis: qué mediciones sacaste, qué encontraste, qué próximo paso tenés que hacer, etc.',
          imagenSrc: '/guia/descripcion.png',
          imagenAlt: 'Panel de descripción / análisis a la derecha del canvas con el placeholder "Escribí tus notas, hallazgos o diagnóstico sobre este estudio…"',
          imagenMaxWidth: 340,
        },
        {
          subtitulo: 'Ejemplo real: análisis cefalométrico',
          texto: 'Combinando las herramientas anteriores (calibración + líneas + medir ángulos + medir longitudes + notas) podés hacer un análisis cefalométrico completo sobre una telerradiografía lateral: trazás los planos anatómicos de referencia, marcás los ángulos entre ellos y anotás los valores obtenidos junto con la interpretación clínica en el panel de descripción. Todo en la misma pantalla, sin salir del estudio.',
          imagenSrc: '/guia/ejemplo.png',
          imagenAlt: 'Ejemplo real de análisis cefalométrico realizado sobre una telerradiografía lateral, con planos anatómicos trazados y sus ángulos correspondientes',
        },
        {
          subtitulo: 'Guardado automático y reapertura',
          texto: 'Cada cambio (trazo nuevo, medición, borrado) se autoguarda contra el servidor. Al volver a abrir el estudio, ves exactamente lo que dejaste — incluyendo la calibración, todos los trazos y las mediciones. Podés dejar un estudio a medio analizar y retomarlo en otra sesión sin perder nada.',
        },
      ],
    },
    {
      id: 'finanzas',
      titulo: 'Finanzas',
      descripcion: 'Este es el corazón financiero del sistema. Todo lo que pasa en el consultorio — una consulta particular, un coseguro cobrado, un cobro batch de una obra social, un egreso — impacta acá automáticamente. No hay doble carga: la consulta que registrás en la ficha del paciente ya es un ingreso en Finanzas.',
      screenshotSrc: '/guia/finanzas.png',
      screenshotAlt: 'Dashboard de Finanzas con hero card negro de balance, KPIs, cobros pendientes y gráficos',
      bloques: [
        {
          subtitulo: 'La lógica: cuándo la plata "cuenta"',
          texto: 'Antes de entrar a las pantallas, entendé la regla base — el sistema distingue entre plata que YA cobraste (confirmado) y plata que TE DEBEN (pendiente). Los ingresos del mes que ves en los KPIs son solo los confirmados. Los pendientes se muestran aparte, para que sepas exactamente qué te falta cobrar.',
          bullets: [
            'Confirmado = plata que ya está en tu bolsillo/cuenta. Cuenta como ingreso del mes.',
            'Pendiente = plata que te van a pagar pero todavía no. NO cuenta como ingreso hasta que se cobre.',
            'El coseguro de una consulta OS cuenta como confirmado desde el día de la consulta — porque el paciente te lo pagó en el momento, aunque la OS todavía te deba su parte.',
          ],
        },
        {
          subtitulo: 'Dashboard financiero — hero card',
          texto: 'La primera tarjeta grande (negra) es el balance del mes elegido. Muestra el balance neto (ingresos confirmados − egresos), un indicador de variación contra el mes anterior en verde/rojo, y dos botones para cargar rápido un ingreso manual (regalo, préstamo, etc.) o un egreso (alquiler, insumos, honorarios).',
          imagenSrc: '/guia/balance.png',
          imagenAlt: 'Hero card negro de Finanzas mostrando el balance del mes con variación contra el mes anterior',
        },
        {
          subtitulo: 'KPIs del mes',
          texto: 'Debajo del hero tenés 3 tarjetas blancas: Ingreso cobrado (todo lo confirmado en el mes), Egreso (gastos cargados) y Consulta promedio (monto medio por consulta atendida). Sirven para leer el mes de un vistazo — sin abrir la lista de movimientos.',
        },
        {
          subtitulo: 'Cobros pendientes particulares y de obra social',
          texto: 'Uno de los widgets más útiles: agrupa todas las consultas pendientes de cobro, tanto particulares (pacientes que te quedaron debiendo) como de obra social (aranceles que la OS todavía no pagó). Te muestra cuánto te deben en total y agrupado por origen — ej. "Particular: $45.000 · 3 pacientes · Swiss Medical: $180.000 · 12 consultas · OSDE: $95.000 · 7 consultas". Podés clickear cada grupo para ver el detalle y registrar el cobro cuando llegue.',
          imagenSrc: '/guia/cobrosPendientes.png',
          imagenAlt: 'Widget de cobros pendientes agrupados por particulares y por obra social con los totales de cada uno',
        },
        {
          subtitulo: 'Ingresos por origen',
          texto: 'El gráfico muestra de dónde viene tu plata en el mes. Distingue: consultas particulares, coseguros de OS, cobros batch de OS, e ingresos manuales. Esto te ayuda a entender qué porcentaje de tu facturación viene de particulares vs. obras sociales.',
          imagenSrc: '/guia/ingresoOrigen.png',
          imagenAlt: 'Gráfico de ingresos por origen del mes distinguiendo consultas particulares, coseguros, cobros de OS e ingresos manuales',
        },
        {
          subtitulo: 'Filtros y vista anual',
          texto: 'Podés cambiar el mes que estás mirando, filtrar por consultorio (si tenés más de uno, ves la performance de cada uno por separado) y también hay una vista anual con un gráfico de barras mensuales para detectar tendencias — meses fuertes, caídas estacionales, crecimiento año contra año.',
        },
        {
          subtitulo: 'Cómo esto organiza tu economía',
          texto: 'La ventaja concreta: dejás de necesitar planilla aparte. En un solo lugar sabés cuánto facturaste, cuánto cobraste efectivamente, cuánto te deben las OS (con nombre y apellido de cuál te debe cuánto), qué consultorio rinde más, si el mes viene mejor o peor que el anterior, y de dónde viene tu ingreso. Todo actualizado en tiempo real cada vez que registrás una consulta o un cobro.',
        },
      ],
    },
    {
      id: 'cobros-os',
      titulo: 'Cobros de obra social',
      descripcion: 'Las obras sociales no te pagan consulta por consulta — te pagan por lote, típicamente una vez por mes (o quincena, según el convenio). Este flujo es para registrar ese cobro cuando llega y hacer que todas las consultas pendientes de esa OS se marquen como cobradas de una.',
      screenshotSrc: '/guia/cobrosPendientes2.png',
      screenshotAlt: 'Pantalla de cobros pendientes de obra social con las consultas seleccionables y la barra inferior para registrar el cobro',
      bloques: [
        {
          subtitulo: 'Cuándo lo usás',
          texto: 'Cuando la obra social te transfiere el pago del período (por ejemplo Swiss Medical te deposita $180.000 correspondientes a las 12 consultas que le hiciste en junio). En ese momento entrás acá.',
        },
        {
          subtitulo: 'Paso a paso',
          bullets: [
            'Elegís la obra social y el consultorio (las OS pagan por consultorio: cada consultorio tiene su convenio y su cuenta).',
            'La app te muestra la lista de consultas PENDIENTES de esa OS en ese consultorio, con paciente, fecha y monto arancelado. Cada consulta empieza tildada.',
            'Destildás las que NO están en este lote (ej. la OS te dice que rechazó 2 consultas por documentación) y quedás solo con las que efectivamente cobraste.',
            'Cargás el monto real recibido (suele ser distinto del "esperado" por descuentos, retenciones, valores actualizados de la OS). Elegís el medio de pago (transferencia habitualmente).',
            'Guardás. Todas las consultas seleccionadas se marcan como CONFIRMADAS y el pendiente de esa OS baja en el dashboard.',
          ],
        },
        {
          subtitulo: 'Diferencia con el coseguro',
          texto: 'El coseguro que cobraste al paciente el día de la consulta ya estaba confirmado desde ese día — no se toca en este flujo. Este cobro batch es la parte de la OS, que es independiente. Los dos ingresos coexisten y en Movimientos vas a ver ambos por separado.',
        },
      ],
    },
    {
      id: 'movimientos',
      titulo: 'Movimientos',
      descripcion: 'La vista más detallada de Finanzas — cada línea es una transacción real de plata (o pendiente). Sirve para auditar, buscar algo puntual, o corregir un error de carga.',
      screenshotSrc: '/guia/movimientos.png',
      screenshotAlt: 'Pantalla de Movimientos con búsqueda, filtros Todos/Ingresos/Egresos y las transacciones agrupadas por fecha',
      bloques: [
        {
          subtitulo: 'Qué ves en la lista',
          texto: 'Todos los movimientos del mes agrupados por fecha. Cada fila muestra un ícono con dirección (↑ verde = ingreso, ↓ rojo = egreso), la descripción con el paciente si aplica, un chip con el origen (CONSULTA, COBRO OS, INGRESO MANUAL, EGRESO), el medio de pago, el consultorio y el monto en grande a la derecha.',
        },
        {
          subtitulo: 'Filtros y búsqueda',
          texto: 'Podés filtrar por tipo (Todos / Ingresos / Egresos) con los chips de arriba, y buscar por paciente o descripción con la barra de búsqueda. Útil para encontrar rápido un pago puntual o revisar todos los egresos del mes.',
        },
        {
          subtitulo: 'Editar o eliminar',
          texto: 'Clickeando sobre un movimiento se abre el detalle. Los ingresos manuales y egresos podés editarlos o eliminarlos libremente. Los que vienen de una consulta (origen CONSULTA) te llevan directo al formulario de esa consulta para editarla — así siempre mantenés consistencia entre la historia clínica y las finanzas.',
        },
      ],
    },
    {
      id: 'ajustes',
      titulo: 'Ajustes (catálogos)',
      descripcion: 'Acá configurás los "catálogos" — las opciones que aparecen como selectores cuando cargás una consulta, un ingreso o un turno. Se dividen en 3 tabs.',
      mockup: <MockupAjustes />,
      bloques: [
        {
          subtitulo: 'Medios de pago',
          texto: 'Los medios que aceptás cobrar. "Efectivo" y "Transferencia" vienen por defecto (con un candado, no se pueden editar ni eliminar). Podés agregar otros como Mercado Pago, Crédito, Débito, etc.',
        },
        {
          subtitulo: 'Obras sociales',
          texto: 'Las obras sociales con las que trabajás. Se usan en el formulario de consultas (cuando elegís tipo de pago = OS) y también en la ficha del paciente (obras sociales asociadas al paciente).',
        },
        {
          subtitulo: 'Consultorios',
          texto: 'Los lugares donde atendés. Si tenés más de un consultorio, esto te permite ver la performance financiera de cada uno por separado en Finanzas — cuánto factura Casa Central vs Villa Cabrera.',
        },
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.gray2, fontFamily: T.font, color: T.black }}>
      {/* Header sticky con backdrop-blur */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.gray1}`,
        padding: isMobile ? '14px 20px' : '18px 40px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={16} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray4 }}>
            <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: T.black }} />
            Guía de uso
          </span>
        </div>
      </header>

      {/* Hero — con dot pattern sutil de fondo (marca visual del brand) */}
      <section style={{ position: 'relative', padding: isMobile ? '48px 20px 32px' : '80px 40px 56px', overflow: 'hidden' }}>
        {/* Dot pattern de fondo */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #d4d4d0 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.55, pointerEvents: 'none' }} />
        {/* Ícono grande decorativo hD */}
        <div aria-hidden style={{ position: 'absolute', top: isMobile ? -30 : -50, right: isMobile ? -30 : -60, width: isMobile ? 180 : 260, height: isMobile ? 180 : 260, background: T.black, borderRadius: isMobile ? 52 : 78, opacity: 0.05, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          {/* Chip decorativo con el ícono negro */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 100, padding: '5px 12px 5px 6px', marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: T.black, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.white, letterSpacing: '-0.03em', lineHeight: 1 }}>D</span>
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gray4 }}>Documentación</span>
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 34 : 48, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Cómo funciona{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              HolaDoc
              <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: -2, height: 8, background: T.black, opacity: 0.08, borderRadius: 4, zIndex: -1 }} />
            </span>
          </h1>
          <p style={{ margin: '18px 0 0', fontSize: 16, color: T.gray4, lineHeight: 1.65, maxWidth: 560 }}>
            Recorrido visual por las principales funcionalidades del sistema. No hace falta que te
            registres; podés compartir este link libremente.
          </p>
        </div>
      </section>

      {/* ¿Qué es HolaDoc? */}
      <section style={{ padding: isMobile ? '8px 20px 24px' : '8px 40px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gray4, marginBottom: 12 }}>
            ¿Qué es HolaDoc?
          </div>
          <p style={{ margin: 0, fontSize: 15.5, color: T.gray4, lineHeight: 1.75 }}>
            HolaDoc es un <strong style={{ color: T.black, fontWeight: 700 }}>sistema de gestión para
            consultorios de profesionales de la salud</strong> — pensado para profesionales que
            trabajan de manera independiente o con un equipo chico. Reemplaza la agenda de papel,
            las planillas de Excel y los sistemas fragmentados por{' '}
            <strong style={{ color: T.black, fontWeight: 700 }}>una sola herramienta donde vive todo
            el consultorio</strong>: pacientes, turnos, historia clínica, estudios y finanzas.
            Algunas especialidades — como odontología — tienen funcionalidades extras específicas
            (por ejemplo, el odontograma interactivo).
          </p>
          <p style={{ margin: '14px 0 0', fontSize: 15.5, color: T.gray4, lineHeight: 1.75 }}>
            La filosofía es simple: cargás una vez y el sistema arma solo el resto. Registrás una
            consulta y automáticamente aparece en la historia clínica del paciente, se marca el
            turno como completado y se genera el ingreso financiero con el estado correcto. Al final
            del mes tenés balance, ingresos por origen y cobros pendientes agrupados por obra social
            — sin planilla aparte, sin doble carga.
          </p>

          {/* 4 puntos clave */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {[
              { titulo: 'Historia clínica y estudios', texto: 'Ficha completa de cada paciente con timeline de consultas, radiografías con mediciones milimétricas y odontograma interactivo.' },
              { titulo: 'Turnos + Google Calendar',    texto: 'Agenda semanal con estados (pendiente / confirmado / cancelado). Sincronizada automáticamente con tu Google Calendar personal.' },
              { titulo: 'Finanzas en tiempo real',     texto: 'Distinción clara entre pagos particulares y por obra social, con coseguros, cobros pendientes y batch de OS.' },
              { titulo: 'Multi-consultorio',           texto: 'Si atendés en más de un lugar, HolaDoc separa la performance financiera de cada consultorio automáticamente.' },
            ].map((c, i) => (
              <div key={i} style={{ background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontFamily: T.font, fontSize: 13.5, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', marginBottom: 6 }}>
                  {c.titulo}
                </div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.gray4, lineHeight: 1.6 }}>
                  {c.texto}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of contents — grid de cards con número negro + chevron + hover */}
      <section style={{ padding: isMobile ? '0 20px 32px' : '0 40px 48px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.black }} />
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.black, fontWeight: 700 }}>
              Contenido · {SECCIONES.length} secciones
            </span>
            <div style={{ flex: 1, height: 1, background: T.gray1 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {SECCIONES.map((s, idx) => {
              const numBloques = s.bloques?.length ?? 0
              return (
                <a key={s.id} href={`#${s.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 12,
                    padding: '12px 14px 12px 12px',
                    textDecoration: 'none', color: T.black,
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.black
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.gray1
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
                  }}>
                  {/* Badge con número */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: T.black, color: T.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
                    flexShrink: 0,
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  {/* Título + subtitulo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.titulo}
                    </div>
                    {numBloques > 0 && (
                      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gray4, marginTop: 3 }}>
                        {numBloques} {numBloques === 1 ? 'subsección' : 'subsecciones'}
                      </div>
                    )}
                  </div>
                  {/* Chevron */}
                  <span style={{ fontFamily: T.font, fontSize: 16, color: T.gray4, flexShrink: 0 }}>→</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Secciones */}
      <main style={{ padding: isMobile ? '16px 20px 60px' : '24px 40px 96px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 40 : 56 }}>
          {SECCIONES.map((s, i) => (
            <article key={s.id} id={s.id} style={{
              scrollMarginTop: 24,
              paddingTop: i === 0 ? 0 : (isMobile ? 32 : 48),
              borderTop: i === 0 ? 'none' : `1px solid ${T.gray1}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: T.black, color: T.white,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ height: 1, flex: 1, background: T.gray1 }} />
              </div>
              <h2 style={{ margin: 0, fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                {s.titulo}
              </h2>
              <p style={{ margin: '12px 0 20px', fontSize: 15, lineHeight: 1.7, color: T.gray4 }}>
                {s.descripcion}
              </p>
              {/* Ilustración principal opcional — SVG mockup, screenshot real, o placeholder.
                  Si la sección no tiene ninguna, arranca directo con los bloques. */}
              {s.mockup ? (
                <GuiaScreenshot caption={`Figura ${i + 1} · ${s.titulo}`}>{s.mockup}</GuiaScreenshot>
              ) : s.screenshotSrc ? (
                <GuiaScreenshot caption={`Figura ${i + 1} · ${s.titulo}`}>
                  <img src={s.screenshotSrc} alt={s.screenshotAlt || s.titulo} style={{ display: 'block', width: '100%', height: 'auto' }} />
                </GuiaScreenshot>
              ) : s.screenshot ? (
                <GuiaFigure label={s.screenshot} caption={`Figura ${i + 1} · ${s.titulo}`} />
              ) : null}

              {/* Bloques anidados (subsecciones con subtítulo + texto + bullets + imagen opcional) */}
              {s.bloques && s.bloques.length > 0 && (
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {s.bloques.map((b, bi) => (
                    <div key={bi}>
                      {b.subtitulo && (
                        <h3 style={{ margin: 0, fontSize: isMobile ? 17 : 19, fontWeight: 700, color: T.black, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                          {b.subtitulo}
                        </h3>
                      )}
                      {b.texto && (
                        <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.7, color: T.gray4 }}>
                          {b.texto}
                        </p>
                      )}
                      {b.bullets && b.bullets.length > 0 && (
                        <ul style={{ margin: '12px 0 0', padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {b.bullets.map((bullet, k) => {
                            const esObj = typeof bullet === 'object' && bullet !== null
                            const texto  = esObj ? bullet.texto     : bullet
                            const imgSrc = esObj ? bullet.imagenSrc : null
                            const imgAlt = esObj ? bullet.imagenAlt : null
                            return (
                              <li key={k} style={{ fontSize: 14, lineHeight: 1.65, color: T.gray4 }}>
                                {texto}
                                {imgSrc && (
                                  <div style={{ marginTop: 10, maxWidth: 460, background: T.white, border: `1px solid ${T.gray1}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                    <img src={imgSrc} alt={imgAlt || texto} style={{ display: 'block', width: '100%', height: 'auto' }} />
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {b.imagenSrc ? (
                        <div style={{ marginTop: 16, maxWidth: b.imagenMaxWidth || 'none' }}>
                          <GuiaScreenshot caption={`Figura ${i + 1}.${bi + 1} · ${b.subtitulo || s.titulo}`}>
                            <img src={b.imagenSrc} alt={b.imagenAlt || b.subtitulo || s.titulo} style={{ display: 'block', width: '100%', height: 'auto' }} />
                          </GuiaScreenshot>
                        </div>
                      ) : b.imagen ? (
                        <div style={{ marginTop: 16 }}>
                          <GuiaFigure label={b.imagen} caption={`Figura ${i + 1}.${bi + 1} · ${b.subtitulo || s.titulo}`} />
                        </div>
                      ) : null}
                      {b.nota && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontFamily: T.font, fontSize: 12.5, lineHeight: 1.55, color: '#78350f' }}>
                          {b.nota}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}

          {/* CTA final */}
          <div style={{ background: T.black, color: T.white, borderRadius: 14, padding: isMobile ? '28px 22px' : '36px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              ¿Querés probarlo con tu consultorio?
            </div>
            <p style={{ margin: '10px auto 20px', maxWidth: 420, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Solicitá acceso desde el login. Es rápido y te contactamos por mail.
            </p>
            <a href="/" style={{ display: 'inline-block', background: T.white, color: T.black, padding: '11px 22px', borderRadius: 100, textDecoration: 'none', fontWeight: 700, fontSize: 13.5 }}>
              Ir al login →
            </a>
          </div>
        </div>
      </main>

      <footer style={{ padding: '24px 20px', textAlign: 'center', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', color: T.gray6, borderTop: `1px solid ${T.gray1}` }}>
        holadocapp.com · para profesionales de la salud
      </footer>
    </div>
  )
}
