export const messages = {
  "es-MX": {
    brand: {
      company: "Fixora Dynamics",
      product: "Fixora Essentials",
      welcome: "Bienvenido a la familia Fixora",
      promise: "Herramientas claras para construir negocios con mejores decisiones.",
      aboutTitle: "Tecnología práctica, progreso con propósito.",
      aboutBody: "En Fixora Dynamics creamos herramientas digitales que ayudan a emprendedores y pequeños negocios a organizar su trabajo, comprender sus números y tomar decisiones con mayor claridad.",
      valuesTitle: "Lo que nos representa",
      values: ["Claridad antes que complejidad", "Autonomía para aprender y decidir", "Transparencia sobre lo que cada herramienta hace", "Crecimiento responsable y sostenible"],
      essentialsTitle: "Nuestro primer espacio: Fixora Essentials",
      essentialsBody: "Un espacio de trabajo para calcular costes, definir precios, organizar gastos y comprender la rentabilidad. Es el primer producto de una familia de herramientas Fixora.",
      disclaimer: "Fixora Essentials ofrece cálculos orientativos con los datos que introduces. No sustituye asesoría contable, fiscal, legal ni garantiza resultados comerciales."
    },
    account: {
      title: "Mi cuenta",
      lead: "Tu perfil, tu negocio y el acceso a tus herramientas, reunidos en un solo lugar.",
      authTitle: "Acceso seguro en preparación",
      authBody: "El registro, inicio de sesión y recuperación de contraseña se conectarán a Supabase Auth en una fase posterior. Esta versión todavía no crea cuentas ni solicita contraseñas.",
      profile: "Perfil personal",
      business: "Mi negocio",
      license: "Mi licencia",
      devices: "Dispositivos",
      purchases: "Compras y activaciones",
      privacy: "Privacidad y datos",
      support: "Ayuda y soporte",
      pending: "Disponible cuando conectemos autenticación y base de datos",
      language: "Idioma",
      languageValue: "Español (México)",
      storageNotice: "Por ahora, algunos datos de la aplicación se guardan solo en este navegador. No son una cuenta sincronizada ni una copia de seguridad."
    },
    guide: {
      title: "Guía práctica de Fixora Essentials",
      lead: "Aprende a utilizar cada herramienta paso a paso. Los ejemplos son ficticios y sirven para practicar.",
      current: "Disponible en esta versión",
      planned: "En preparación",
      sections: [
        { id: "start", title: "1. Antes de comenzar", purpose: "Conoce el alcance actual y prepara los datos que vas a registrar.", steps: ["Abre Fixora Essentials desde el espacio de trabajo.", "Elige un perfil de actividad si ya sabes a qué se dedica tu negocio. Si aún no lo sabes, conserva el perfil general.", "Ten a mano los costes reales de materiales, tiempo de trabajo, gastos y comisiones.", "Utiliza una moneda coherente en cada cálculo. MXN y USD son etiquetas monetarias distintas; cambiar la moneda no convierte los importes."], example: "Ejemplo: si compras material por $850 MXN para producir 10 unidades, registra el coste correspondiente a la unidad que estás calculando, no el total del lote sin dividirlo." },
        { id: "calculator", title: "2. Calculadora de costes y precios", purpose: "Estimar cuánto cuesta producir o prestar una unidad y qué precio puede alcanzar el margen que buscas.", steps: ["Escribe un nombre reconocible para el cálculo.", "Introduce materiales y consumibles utilizados en una unidad.", "Añade otros costes directos que correspondan a esa unidad.", "Registra los minutos de trabajo y cuánto cuesta una hora de trabajo.", "Indica la merma como porcentaje de los materiales. Por ejemplo, 5 significa cinco por ciento.", "Añade la asignación de gastos fijos por unidad, si ya calculaste esa asignación.", "Introduce las comisiones, descuentos y margen objetivo como porcentajes.", "Revisa el precio sugerido, coste total, ganancia estimada, margen efectivo y recargo.", "Guarda el cálculo para conservar una instantánea de los datos y del resultado."], example: "Si tardas 30 minutos y valoras tu hora en $120, el coste de mano de obra por unidad es $60. No registres 30 como si fueran horas." },
        { id: "expenses", title: "3. Control de gastos", purpose: "Separar gastos fijos del periodo y costes variables por unidad.", steps: ["Registra cada gasto fijo con un nombre y un importe del periodo elegido.", "Registra los costes variables como importe por unidad.", "Indica cuántas unidades esperas producir o vender en ese periodo.", "Confirma que todos los importes usan la misma moneda y periodo.", "Consulta la asignación fija por unidad y el coste variable unitario.", "Si cambias el periodo, vuelve a introducir importes correspondientes a ese periodo: la aplicación no convierte semanas, meses, trimestres o años automáticamente."], example: "Renta de $8,000 y servicio de internet de $600 suman $8,600 de gastos fijos mensuales. Con 100 unidades estimadas, la asignación fija es $86 por unidad." },
        { id: "catalog", title: "4. Catálogo", purpose: "Mantener una lista local de productos y servicios para reutilizar su referencia al costear.", steps: ["Crea un producto o servicio con un nombre claro.", "Selecciona la unidad de venta o prestación, por ejemplo pieza, hora, sesión o paquete.", "Añade un SKU si utilizas un código interno; debe ser único dentro del catálogo.", "Selecciona la moneda e introduce el coste de referencia.", "Guarda y revisa el elemento en el listado.", "Usa la acción de costeo para abrir la calculadora con el nombre y la referencia del catálogo."], example: "Un servicio puede registrarse con unidad 'sesión'. La referencia del catálogo identifica el servicio, pero su coste no se copia automáticamente a las partidas de la calculadora: debes revisarlas." },
        { id: "break-even", title: "5. Punto de equilibrio", purpose: "Calcular cuántas unidades completas necesitas vender para cubrir los gastos fijos del periodo.", steps: ["Introduce los gastos fijos totales del periodo.", "Introduce el precio de venta por unidad.", "Introduce el coste variable por unidad.", "Comprueba que el precio sea mayor que el coste variable.", "Lee las unidades completas mínimas, la contribución por unidad, la tasa de contribución y la venta mínima estimada.", "Usa el mismo periodo para los gastos fijos y no incluyas esos mismos gastos otra vez en el coste variable."], example: "Con gastos fijos de $12,000, precio de $200 y coste variable de $80, la contribución es $120 por unidad y el punto de equilibrio es 100 unidades." },
        { id: "history", title: "6. Historial de cálculos", purpose: "Volver a consultar un análisis guardado y abrir una copia para modificarla.", steps: ["Guarda un cálculo desde la calculadora.", "Abre 'Mis cálculos' para consultar nombre, fecha y precio sugerido.", "Selecciona 'Abrir' para recuperar una copia de sus entradas.", "Modifica los datos y guarda un nuevo cálculo si quieres conservar otra versión.", "Elimina solo los registros que ya no necesites."], example: "Puedes guardar un cálculo para el precio actual y otro para comparar qué sucede si aumenta el coste de materiales." },
        { id: "profiles", title: "7. Perfil de actividad y kits", purpose: "Indicar qué tipo de negocio tienes para orientar futuras herramientas especializadas.", steps: ["Abre 'Kits por negocio'.", "Selecciona el perfil que mejor describa tu actividad.", "Si no encaja ninguno, utiliza el perfil general.", "Recuerda que elegir un perfil no compra ni desbloquea un kit de pago."], example: "Seleccionar 'Servicios y belleza' solo guarda tu preferencia local en esta versión. No activa funciones comerciales adicionales." }
      ],
      limitationsTitle: "Qué debes saber sobre esta versión",
      limitations: ["Los perfiles, gastos, catálogo e historial se guardan en este navegador; todavía no se sincronizan con una cuenta en la nube.", "No existe todavía registro, inicio de sesión ni activación de licencia en esta versión.", "No se realiza conversión de moneda ni de periodos.", "Los resultados dependen de que los datos introducidos sean completos y correctos.", "No se incluyen automáticamente impuestos, envíos, financiación ni obligaciones fiscales."],
      faqTitle: "Preguntas frecuentes",
      faqs: [
        { q: "¿Cambiar MXN por USD convierte mis cantidades?", a: "No. Solo cambia la moneda mostrada. Antes de cambiarla, revisa y ajusta manualmente los importes." },
        { q: "¿Por qué el coste de referencia del catálogo no aparece en la calculadora?", a: "El catálogo conserva una referencia descriptiva. Debes revisar y capturar cada partida de coste para evitar duplicaciones o supuestos incorrectos." },
        { q: "¿El margen es lo mismo que el recargo?", a: "No. El margen compara la ganancia con el ingreso; el recargo compara la ganancia con el coste." },
        { q: "¿Mis datos están disponibles en otro equipo?", a: "Todavía no. Esta versión guarda información en el navegador donde trabajas. No limpies los datos del sitio si necesitas conservarla." },
        { q: "¿Fixora garantiza que venderé o ganaré esa cantidad?", a: "No. Son estimaciones matemáticas basadas en los datos introducidos, no pronósticos ni garantías de venta." },
        { q: "¿Puedo usar Fixora como asesoría contable o fiscal?", a: "No. Fixora ayuda a organizar y estimar costes y precios; consulta a un profesional para decisiones contables, fiscales o legales." }
      ],
      glossaryTitle: "Glosario sencillo",
      glossary: [
        { term: "Coste fijo", meaning: "Gasto que no cambia directamente con cada unidad producida durante el periodo, como una renta." },
        { term: "Coste variable", meaning: "Coste que aumenta o disminuye con cada unidad, como un material consumido." },
        { term: "Merma", meaning: "Material que se pierde o no puede aprovecharse durante el proceso." },
        { term: "Margen", meaning: "Porcentaje de ganancia en relación con el ingreso." },
        { term: "Recargo", meaning: "Porcentaje de ganancia en relación con el coste." },
        { term: "Punto de equilibrio", meaning: "Nivel de ventas donde la contribución cubre los gastos fijos considerados." },
        { term: "SKU", meaning: "Código interno para identificar un producto o variante." }
      ]
    }
  }
} as const;

export type SupportedLocale = keyof typeof messages;
export type MessageCatalog = typeof messages["es-MX"];
export const defaultLocale: SupportedLocale = "es-MX";

export function getMessages(locale: SupportedLocale = defaultLocale): MessageCatalog {
  return messages[locale] as MessageCatalog;
}
