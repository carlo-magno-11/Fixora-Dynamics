# Plan maestro de producto e implementación — Fixora

Fecha de revisión: 30 de octubre de 2026  
Rama objetivo del documento: `foundation/bootstrap-20261029`  
Estado: plan de trabajo; no implica que las funciones descritas estén implementadas ni que Supabase haya sido modificado.

## 1. Marca, empresa y producto

### Arquitectura de marca propuesta

- **Fixora Dynamics**: empresa y marca paraguas. Puede desarrollar varios productos digitales y proyectos; no debe confundirse con una sola aplicación.
- **Fixora Essentials**: primer producto/aplicación comercial. Es el espacio de trabajo general para calcular costes, definir precios y comprender la rentabilidad de pequeños negocios.
- **Kits Fixora**: módulos especializados dentro del mismo producto (comercio y reventa, servicios y belleza, alimentos y repostería, taller/manufactura ligera, productos digitales y creativos). No son aplicaciones ni cuentas independientes.

La interfaz, el login y la documentación deben presentar claramente “Fixora Essentials, de Fixora Dynamics”. No cambiar todavía el nombre legal/comercial ni registrar nuevos dominios. Antes del lanzamiento se validará disponibilidad de marca, dominio y redes; los nombres de futuros productos se decidirán cuando exista su alcance.

### Relato de marca y bienvenida

La pantalla de bienvenida debe explicar, sin prometer resultados financieros:

- Quiénes somos: Fixora Dynamics crea herramientas digitales prácticas para ayudar a personas emprendedoras y pequeños negocios a organizar su trabajo y tomar decisiones con información más clara.
- Qué representamos: claridad, autonomía, orden, aprendizaje, transparencia y crecimiento responsable.
- Qué es Fixora Essentials: el primer espacio de la familia Fixora para entender costes, precios y rentabilidad.
- Mensaje de bienvenida: “Bienvenido/a a la familia Fixora. Aquí puedes empezar paso a paso, a tu ritmo y sin necesitar experiencia contable”.

Debe existir una página “Acerca de Fixora” accesible desde el inicio, el menú de usuario y el sitio público. Evitar afirmar que somos una comunidad consolidada, una institución financiera o una firma contable.

## 2. Objetivo del primer lanzamiento

Entregar Fixora Essentials como una aplicación multiusuario segura, útil y comercializable, no solo como una calculadora. El primer lanzamiento debe incluir:

1. Sitio público de producto, bienvenida y explicación de la empresa/producto.
2. Registro, verificación de correo, inicio/cierre de sesión y recuperación de contraseña.
3. Perfil de usuario y perfil de negocio, preferencias e idioma.
4. Calculadora general, gastos, catálogo, punto de equilibrio, historial y reportes básicos.
5. Base de datos cloud y aislamiento estricto entre usuarios/negocios.
6. Licencia anual, activación de compra, límite de tres dispositivos activos, revocación y administración.
7. Verificación de compra por canal, con proceso manual seguro donde no exista integración aprobada.
8. Términos, privacidad, cookies/tecnologías equivalentes cuando proceda, reembolsos, soporte y avisos claros.
9. Guía integral, tutorial de primera entrada, ayuda contextual y preguntas frecuentes.
10. Diseño visual más distintivo, accesible y responsive.
11. Pruebas automatizadas, E2E, seguridad, recuperación y validación en navegadores/dispositivos.
12. Preparación de arquitectura para Expo y despliegue web/iOS/Android sin duplicar el motor de negocio.

No declarar el producto listo para venta hasta cumplir los criterios de salida de la sección 12.

## 3. Marca, navegación y diseño de experiencia

### Navegación de producto propuesta

- Inicio / Mi espacio
- Costear y calcular precio
- Gastos
- Catálogo
- Punto de equilibrio
- Historial
- Reportes (cuando se implemente)
- Kits
- Guía y ayuda
- Mi cuenta

En móvil usar navegación inferior o menú compacto; en escritorio, navegación lateral clara. No esconder la Guía ni depender de desplazamiento horizontal para descubrir secciones esenciales.

### Identidad visual

Conservar la paleta aprobada (azul petróleo, marfil, champagne y verde salvia), pero elevar la composición:

- Portada de bienvenida con jerarquía editorial, ilustración o recursos gráficos originales y una explicación corta del valor del producto.
- Tipografía con jerarquía consistente, mejor contraste, espaciado y ritmo visual.
- Tarjetas con propósito, iconografía coherente, estados y acciones primarias visibles.
- Panel de resumen que explique qué significa cada indicador, no solo cifras.
- Estados vacíos con instrucciones y ejemplos, no paneles vacíos.
- Microinteracciones discretas, feedback de guardado/error y confirmaciones destructivas.
- Modo responsive real, accesibilidad por teclado, foco visible, etiquetas y contraste.
- Evitar recargar con adornos: la estética debe seguir siendo profesional y legible.

### Área “Mi cuenta”

Debe incluir:

- Datos de perfil: nombre visible, correo verificado, avatar opcional, idioma y zona horaria.
- Datos del negocio: nombre, actividad, moneda preferida y preferencias.
- Seguridad: cambiar contraseña, sesiones/dispositivos, cerrar otras sesiones y MFA para administradores; evaluar MFA opcional para clientes.
- Licencia: producto/plan, canal de compra, fecha de activación, vencimiento, estado, renovación y condiciones.
- Dispositivos: hasta tres activos, plataforma/alias/última actividad, revocar uno y recuperar acceso siguiendo un procedimiento seguro.
- Compras y activaciones: estado de verificación y referencia parcial/no sensible.
- Privacidad: exportar datos, solicitar corrección/eliminación y consultar políticas.
- Ayuda: contacto y acceso a guía.

No mostrar claves de licencia completas, tokens, secretos, direcciones de webhook ni información sensible de pedidos.

## 4. Registro, acceso y seguridad

### Flujo de usuario

1. La persona llega a la página pública y conoce Fixora Essentials.
2. Puede registrarse con correo y contraseña o un método adicional que se decida después.
3. Debe verificar su correo antes de activar una licencia.
4. Puede iniciar sesión, cerrar sesión, recuperar contraseña y administrar sesiones.
5. Si todavía no tiene licencia, ve un estado claro y el flujo “Tengo un código / Ya compré”.
6. El servidor valida la compra/licencia y crea la activación de forma transaccional.
7. La app muestra el estado y las funciones incluidas en el plan.

Supabase Auth será el proveedor de identidad. La autenticación identifica a la persona; RLS y las reglas de servidor autorizan sus datos y funciones. No confiar en rutas ocultas, flags de React, localStorage, metadatos editables ni comprobaciones solo del cliente.

### Controles obligatorios

- Confirmación de correo y recuperación segura.
- Contraseñas gestionadas por Supabase Auth; nunca almacenar contraseñas propias.
- RLS en toda tabla multiusuario y pruebas de aislamiento.
- Roles administrativos separados de los perfiles de cliente.
- MFA obligatorio para cuentas administrativas.
- Rate limits y protección contra intentos repetidos en activación, login y recuperación.
- Tokens de activación aleatorios, de un solo uso, almacenados como hash cuando corresponda.
- Webhooks autenticados, verificados, idempotentes y registrados.
- Auditoría de activaciones, revocaciones, cambios administrativos y accesos relevantes.
- Gestión de sesiones y hasta tres dispositivos activos por licencia.
- Secretos de proveedores solo en Edge Functions/servidor; nunca en frontend.
- No recolectar fingerprint invasivo de hardware. Usar identificador de instalación aleatorio revocable.

## 5. Compra, QR y verificación de licencias

### Regla esencial del QR

El QR no demuestra que alguien compró. El QR solo abre una página HTTPS oficial de activación. La prueba de compra es un código individual o un registro de pedido validado en el backend. Un QR impreso idéntico en todos los libros puede compartirse; por eso debe combinarse con un código único por unidad/pedido o un mecanismo de entrega individual.

### Flujo de activación propuesto

1. QR abre `/activar` en el dominio oficial.
2. El comprador crea/inicia sesión y verifica el correo.
3. Introduce un código de licencia de un solo uso o elige verificar una compra asociada a su canal.
4. Backend valida canal, producto, pedido, estado pagado/aprobado, ausencia de reembolso/contracargo y que el código no haya sido consumido.
5. El usuario acepta los términos vigentes y activa.
6. En una sola transacción se asocia la licencia al usuario, se registra la fecha inicial y se crea el dispositivo inicial.
7. El vencimiento se calcula a un año desde la primera activación, según la decisión comercial existente.
8. Se notifica la activación y se ofrece administrar dispositivos.

Una compra no puede activar dos cuentas distintas salvo proceso de soporte y evidencia revisada. No pedir contraseña de Etsy, Gumroad ni Hotmart al comprador.

### Canales de venta: no confundir dos integraciones

Hay dos problemas distintos:

- **A. Verificar que compraron Fixora** en nuestra tienda/canal. Es una operación del vendedor Fixora.
- **B. Conectar la tienda Etsy/Gumroad/Hotmart del cliente para importar sus propias ventas y hacer seguimiento comercial.** Es una función futura distinta, con consentimiento OAuth y permisos propios.

No mezclar credenciales, permisos ni datos de A y B.

### Etsy

La documentación oficial diferencia Seller App, Personal App y Commercial Access. Seller App solo permite acceder a la tienda del propio vendedor y no sirve para construir una integración general para múltiples tiendas de clientes. Para un producto que conecte tiendas de usuarios se requiere Personal App y aprobación de Commercial Access para operar a escala; Etsy revisa manualmente la solicitud. El acceso a datos privados requiere OAuth y scopes; el acceso a buyer_email requiere aprobación adicional en los casos indicados por Etsy. No usar scraping ni automatizaciones que evadan la API.

Para validar pedidos de nuestra propia tienda Etsy, evaluar una Seller App limitada a nuestra tienda y confirmar los scopes/endpoints aplicables. Etsy dispone de eventos webhook como `order.paid`; la notificación contiene un recurso que se consulta con autorización. Validar autenticidad/firma, reintentos e idempotencia antes de emitir licencia. Mantener una alternativa manual con revisión del recibo y código individual hasta aprobar y probar la integración.

### Gumroad

Gumroad ofrece License Keys y un endpoint de verificación. La verificación devuelve datos del pedido y estados como reembolsado/disputado; el control de acceso sigue siendo responsabilidad del creador. No incrementar usos por cada inicio de sesión: verificar en backend con la estrategia correcta y mantener nuestro propio registro de activaciones/dispositivos. No exponer product_id/secretos innecesarios ni confiar en una respuesta enviada por el navegador.

### Hotmart

Hotmart permite notificaciones webhook para eventos de compra, aprobación, cancelación, reembolso y chargeback, entre otros. La documentación recomienda validar el encabezado `X-HOTMART-HOTTOK`; además, procesar el identificador de evento de forma idempotente y actualizar el estado de licencia ante reembolso/contracargo.

### Etsy y otros canales en la primera versión

- Lanzamiento inicial: Etsy como canal prioritario; código individual y conciliación manual desde panel de administración hasta que la integración esté aprobada y probada.
- Preparar un adaptador de canal común: `provider`, `external_order_id`, `product_sku`, `payment_status`, `refund_status`, `event_id`, `verified_at`.
- Añadir Gumroad/Hotmart cuando existan cuentas de vendedor, producto configurado, credenciales y pruebas reales.
- Nunca conceder acceso por una captura de pantalla aislada, nombre de comprador o QR público.
- No prometer integración automática de Etsy para tiendas de usuarios hasta obtener Commercial Access.

## 6. Licencias, planes y reglas comerciales

Decisiones ya establecidas para el primer modelo:

- Licencia de un año desde la primera activación.
- Máximo de tres dispositivos activos por licencia.
- El historial y los datos del usuario no se borran al vencer.
- La expiración puede restringir funciones premium, pero debe permitir consultar el estado de cuenta y las opciones de renovación/exportación previstas en los términos.
- El perfil de actividad del negocio no concede acceso a kits pagados.
- La compra de Essentials y los derechos de cada kit se representan como entitlements separados.

Antes de activar ventas se deben cerrar por escrito:

- Si Essentials es una licencia anual única o habrá renovación automática (no asumir renovación automática).
- Si se permiten renovaciones anticipadas y cómo se calcula la nueva fecha.
- Qué ocurre con reembolsos, fraude, chargebacks y cancelaciones.
- Transferencia de licencia, regalos, corrección de correo y recuperación por pérdida de dispositivo.
- Qué pasa al superar tres dispositivos y cuántas recuperaciones se permiten.
- Funciones disponibles durante gracia, vencimiento y disputa.
- Política de soporte y tiempos de respuesta.
- Política de descuentos, bundles y kits adicionales.

No desarrollar suscripciones recurrentes hasta decidir el modelo comercial y la política de renovación.

## 7. Seguimiento de ventas del usuario en marketplaces

Esto no debe bloquear el lanzamiento de Essentials, pero debe quedar contemplado en la arquitectura. Más adelante, un módulo “Canales de venta” permitirá conectar tiendas propias y ver pedidos/ingresos por canal.

- Conexión explícita por OAuth y consentimiento revocable.
- Separar datos importados de registros manuales.
- Mostrar fecha de última sincronización, errores y alcance del permiso.
- Evitar duplicados mediante identificadores externos e idempotencia.
- Respetar scopes, límites, retención y términos de cada plataforma.
- Etsy multi-tienda solo tras Commercial Access aprobado.
- No scrapear páginas ni pedir contraseñas de marketplaces.
- No contabilizar reembolsos como ventas activas; distinguir venta, cancelación, devolución y contracargo.

## 8. Base de datos y modelo de datos

La base será el proyecto Supabase ya reservado exclusivamente para Fixora: `dclaebknyalimmtgppeg`. No usar el proyecto de EYESITE, no crear otro proyecto/bucket/servicio sin autorización y no aplicar SQL directo en remoto.

### Dominios y tablas a diseñar por etapas

- Identidad: `fixora_profiles`.
- Tenant: `fixora_businesses`, `fixora_business_memberships`.
- Operación: `fixora_catalog_items`, `fixora_materials`, `fixora_product_materials`, `fixora_labor_rates`, `fixora_expenses`.
- Cálculos: `fixora_calculation_snapshots` y versiones.
- Licencias/órdenes: `fixora_private.fixora_purchase_orders`, `fixora_private.fixora_licenses`, `fixora_private.fixora_license_entitlements`, `fixora_private.fixora_license_devices`, `fixora_private.fixora_activation_code_hashes`.
- Canales: `fixora_private.fixora_provider_events` y referencias mínimas de pedido; credenciales fuera del cliente.
- Administración: `fixora_private.fixora_admin_memberships`, `fixora_private.fixora_audit_events`, `fixora_private.fixora_support_tickets`.
- Documentación legal: versiones y aceptación de términos/privacidad con fecha y versión.

Cada tabla de negocio debe tener tenant `business_id`, restricciones e índices adecuados. Secretos, hashes y tokens internos deben permanecer en un esquema no expuesto. No guardar datos de tarjeta ni credenciales de plataformas en tablas públicas.

### Migraciones y aislamiento heredado

Seguir `docs/DATABASE-BOOTSTRAP-PLAN.md` y `docs/FIXORA-FOUNDATION-SPEC.md`: desarrollar únicamente contra el stack Supabase local aislado, usar tablas públicas con prefijo `fixora_`, RLS y grants mínimos. No recuperar, copiar, reproducir, reparar, mover ni borrar objetos o migraciones históricas de EYESITE. La transición del trigger Auth remoto es un despliegue separado y bloquea el signup remoto hasta contar con respaldo, migración revisada, plan de reversión y aprobación explícita.

Crear archivos solo con `supabase migration new <nombre>`. La migración local se versiona y prueba desde cero. No aplicar SQL remoto en esta fase.

## 9. Guía, manual y centro de ayuda

La guía no será un texto corto genérico. Debe servir a una persona sin experiencia en hojas de cálculo, contabilidad o aplicaciones de gestión.

### Estructura obligatoria

1. Bienvenida a la familia Fixora: qué es la empresa, qué es Essentials y qué no hace.
2. Primeros 10 minutos: crear cuenta, verificar correo, activar licencia, crear negocio y configurar moneda.
3. Recorrido de pantalla: navegación, botones, campos, estados y ayuda.
4. Mi cuenta: perfil, negocio, seguridad, dispositivos y licencia.
5. Calculadora: cada campo, unidad, ejemplo guiado, interpretación del precio, coste, ganancia, margen, recargo, comisión, descuento y merma.
6. Gastos: fijo vs. variable, periodo, moneda, asignación por unidad y prevención del doble conteo.
7. Catálogo: crear/editar/archivar productos, unidades, SKU, coste de referencia y uso en costeo.
8. Punto de equilibrio: costes fijos, variable unitario, contribución, unidades mínimas y límites de interpretación.
9. Historial: guardar, duplicar, comparar versiones, entender snapshots y exportar.
10. Reportes: filtros, fechas, moneda y límites de los datos.
11. Kits: qué incluye cada uno, cómo activarlo y qué no está disponible.
12. Compras y licencia: QR, código, validación, vencimiento, dispositivos, renovación, reembolso y recuperación.
13. Canales de venta: conectar/desconectar, permisos, sincronización y resolución de errores cuando se implemente.
14. Privacidad y seguridad: datos almacenados, exportación, cierre de cuenta y buenas prácticas.
15. Glosario sencillo.
16. Preguntas frecuentes y solución de problemas.
17. Contacto y soporte.

### Formato pedagógico

Cada apartado incluirá: para qué sirve, cuándo usarlo, qué necesitas antes, pasos numerados, ejemplo con datos ficticios, explicación del resultado, errores frecuentes, cómo corregirlos y preguntas frecuentes. La ayuda contextual enlazará al apartado exacto. Incluir un negocio de demostración opcional sin mezclar sus datos con los reales.

La guía debe actualizarse junto con cada función; no documentar botones o integraciones que aún no existan. Idioma inicial español claro (México); preparar estructura de traducción centralizada y publicar inglés después de revisar la versión española.

## 10. Términos, privacidad y cumplimiento

Antes de vender, preparar y revisar profesionalmente:

- Términos de servicio/licencia de software.
- Aviso de privacidad integral y, cuando corresponda, simplificado.
- Política de cookies/tecnologías de medición si se usan.
- Política de reembolsos/cancelaciones compatible con el canal de venta y la legislación aplicable.
- Descripción de tratamiento de datos, finalidades, proveedores, transferencias, conservación y derechos ARCO/procedimientos aplicables.
- Consentimiento y registro de versión/fecha de términos.
- Avisos de que las estimaciones no son contabilidad, asesoría fiscal ni garantía de utilidad.
- Reglas de soporte, disponibilidad, cambios de producto y cierre de cuenta.

La investigación identificó la LFPDPPP mexicana con última reforma publicada el 14 de noviembre de 2025 y la LFPC con última reforma publicada el 12 de diciembre de 2025. Los textos legales deben revisarse en su versión vigente por asesoría jurídica mexicana antes de publicar; este plan no sustituye asesoría legal. Revisar también las obligaciones del país donde se comercialice.

## 11. Internacionalización y plataforma

- Centralizar todos los textos UI en catálogos de traducción; no dejar textos visibles dispersos en componentes.
- Español México como idioma inicial; inglés como segundo idioma planificado.
- Guardar preferencia de idioma en perfil y respetar configuración del usuario.
- Mantener identificadores técnicos en inglés y contenido traducible separado.
- Mantener motor de precios, break-even, validación, snapshots y reglas como TypeScript puro compartido.
- No reescribir cálculos al migrar interfaz.
- Evolución prevista: extraer el núcleo compartido; migrar progresivamente la interfaz a Expo Router/React Native con soporte web; verificar paridad antes de retirar Vite.
- Mantener el producto web funcional durante la transición.
- Expo no se considera instalado ni completado por estar en el roadmap: verificar dependencias, rutas, builds y pruebas reales cuando comience esa fase.

## 12. Fases, dependencias y puertas de salida

### Fase 0 — Cierre de alcance y diseño (ahora)

- Aprobar este plan como mapa de trabajo.
- Resolver especificaciones comerciales que afectan licencias y términos.
- Diseñar navegación, marca, pantallas y flujo de activación.
- Mantener PR #1 draft y sin merge.

Salida: alcance y reglas comerciales documentados; backlog priorizado y criterios de aceptación.

### Fase 1 — Completar Fixora Essentials (frontend y dominio)

- Mejorar identidad visual, bienvenida, acerca de y navegación.
- Completar Mi cuenta como interfaz conectada al modelo previsto.
- Corregir flujos de moneda, catálogo/costeo, errores y persistencia local transitoria.
- Completar CRUD del catálogo y experiencia de gastos/historial.
- Construir guía completa y ayuda contextual.
- Centralizar i18n.
- Preparar formularios de login/registro visualmente, sin simular seguridad ni almacenar credenciales localmente.

Salida: flujos de producto completos con datos ficticios; textos centralizados; typecheck/tests/build verdes.

### Fase 2 — Supabase local y seguridad de datos

- Inicializar CLI y Docker local.
- Reconstruir la base local desde cero con la migración Fixora versionada.
- Completar perfiles, negocios, membresías, RLS, grants, trigger y RPC con pruebas pgTAP A/B.
- Añadir las migraciones operativas de catálogo, gastos e historial cuando su modelo y casos de uso estén cerrados.
- Integrar Auth primero en entorno local aprobado; no habilitar signup remoto mientras exista el trigger heredado.
- Sustituir localStorage por persistencia cloud con migración/importación controlada y pruebas de no pérdida de datos.

Salida: reconstrucción local reproducible, pruebas A/B, anon, roles, tenant y triggers aprobadas; transición remota documentada y aprobada por separado. No mover ni reconstruir objetos históricos EYESITE.

### Fase 3 — Licencias, QR, compras y administración

- Modelo de pedidos, licencias, entitlements, códigos y dispositivos.
- Panel admin con MFA, búsqueda de pedidos, conciliación, emisión/revocación y auditoría.
- Activación QR/código transaccional.
- Límite de tres dispositivos y recuperación segura.
- Etsy manual al inicio; preparar/verificar Seller App para nuestra tienda propia.
- Adaptadores Gumroad/Hotmart cuando existan credenciales y compras de prueba.
- Gestión de reembolso/chargeback y renovación.

Salida: matriz de pruebas de compra válida, duplicada, código usado, cuenta distinta, reembolso, chargeback, evento repetido, límite de dispositivos, revocación y vencimiento.

### Fase 4 — Lanzamiento Essentials y soporte

- Sitio público, términos, privacidad, política comercial y soporte.
- Guía final y centro de ayuda.
- Reportes/exportación comprometidos para MVP.
- Pruebas E2E, accesibilidad, seguridad, recuperación y carga.
- Staging y dominio HTTPS; pruebas Windows, Mac, Android y iOS.
- Lanzamiento controlado y métricas de uso/errores.

Salida: checklist de lanzamiento firmada; sin vulnerabilidades críticas/altas abiertas; soporte y recuperación operativos.

### Fase 5 — Expo y expansión de plataforma

- Extraer núcleo compartido y adaptar UI a Expo Router.
- Mantener web e introducir iOS/Android mediante builds firmados.
- Deep links, callback de Auth, almacenamiento seguro de sesión y pruebas físicas.
- Retirar Vite solo tras paridad y validación de producción.

Salida: flujos críticos idénticos en web/iOS/Android y builds verificadas en dispositivos.

### Fase 6 — Kits y conexiones de marketplace para clientes

Orden inicial: comercio/reventa, servicios/belleza, alimentos/repostería, taller/manufactura ligera, productos digitales/creativos. Cada kit debe tener pruebas, guía y validación de usuarios.

Seguimiento de ventas de tiendas conectadas será un módulo posterior, sujeto a permisos/API aprobados. No retrasar el lanzamiento inicial por una integración Etsy multi-tienda que todavía no tenga Commercial Access.

## 13. Matriz mínima de pruebas de aceptación

- Auth: registro, correo no verificado, correo verificado, login, logout, recuperación, sesión expirada y MFA admin.
- Multiusuario: A no puede leer/escribir datos de B ni por UUID conocido.
- Licencia: código válido, inválido, expirado, duplicado, revocado, reembolsado y chargeback.
- Dispositivos: 1, 2, 3 y cuarto dispositivo; revocación y recuperación.
- Marketplace: webhook falso, firma/token inválido, evento duplicado, evento retrasado y cambio de estado.
- Datos: migración local, fallo de red, reintento, importación/exportación y borrado conforme a política.
- Finanzas: monedas distintas, periodos, redondeo, valores extremos y no doble conteo.
- UX: teclado, lector de pantalla, contraste, móvil, escritorio, estados vacíos y errores.
- Documentación: cada pantalla y acción explicada; los enlaces de ayuda llevan al apartado correcto.

## 14. Estado real al redactar este plan

Implementado en el código actual: base React + TypeScript + Vite, motor financiero Decimal.js, calculadora general, punto de equilibrio, gastos locales, catálogo local, snapshots e historial local, guía breve, selector de perfil local, pruebas unitarias y CI.

Comprobado en Codespaces el 30 de octubre de 2026: instalación congelada, typecheck, 35 pruebas unitarias y build web aprobados en el HEAD comunicado por el usuario. El servidor de desarrollo devolvió HTTP 200 para HTML, `main.tsx`, `App.tsx` y `global.css`. Esto no demuestra todavía ejecución visual completa ni pruebas manuales de flujos.

No implementado/verificado todavía: Auth, registro/login, base de datos Fixora desplegada, persistencia cloud, Mi cuenta conectada, licencias, QR, panel admin, integración real de marketplaces, términos/privacidad publicados, guía completa, reportes/exportación final, i18n centralizado, Expo, pruebas E2E y pruebas físicas.

Supabase: existe un proyecto dedicado a Fixora, pero conserva objetos heredados de EYESITE que requieren aislamiento. No se ha aplicado ninguna migración Fixora remota. Seguir el plan de bootstrap existente y no ejecutar cambios remotos a ciegas.

## 15. Reglas de trabajo y protección del proyecto

- Repositorio: `carlo-magno-11/Fixora-Dynamics`.
- Rama de trabajo: `foundation/bootstrap-20261029`; PR #1 sigue draft y sin merge.
- Trabajar en Codespaces bajo `/workspaces/Fixora-Dynamics`.
- No mezclar Fixora con EYESITE.
- No usar `git reset --hard`, `git clean -fd` ni `git checkout .`.
- Inspeccionar estado/diff antes de editar; preservar cambios locales.
- No aplicar SQL directamente en Supabase remoto; migraciones versionadas y revisadas.
- No crear proyectos, buckets, servicios, ramas o gastos adicionales sin autorización.
- No declarar una función terminada hasta probarla en backend, UI y escenarios de seguridad correspondientes.
- Mantener separado: código local, GitHub/CI, migraciones remotas, staging y pruebas físicas.
- Actualizar este plan y la hoja de ruta cuando cambie el estado real.


## Anexo de implementación — arquitectura y panel de administración

La arquitectura de código y las fronteras de módulos se definen en `docs/ARCHITECTURE.md`. Se utilizará un monolito modular por dominios con capas de presentación, aplicación, dominio e infraestructura. El motor financiero debe permanecer independiente de React y Supabase para reutilizarlo en Expo.

El panel de administración es parte obligatoria del primer producto comercial. Su alcance, roles, permisos, modelo de auditoría, operaciones server-side y criterios de aceptación están definidos en `docs/ADMIN-CONSOLE-ARCHITECTURE.md`.

El primer módulo TypeScript de política de acceso y sus pruebas solo sirven para presentación/UX. No conceden acceso real. La producción exige roles internos no editables por usuarios, sesión autenticada, AAL2, estado administrativo activo, autorización por permiso en cada operación, RLS/funciones server-side y auditoría transaccional. No habilitar el panel ni mostrar datos ficticios hasta conectar esos controles.

Estado real: el shell de la aplicación todavía concentra parte de la navegación y persistencia local; gastos, catálogo e historial no son todavía multiusuario. El refactor será incremental y respaldado por pruebas. El diseño del panel no se considera implementado por la sola existencia de la matriz de permisos.


### Avance adicional — licencias y consola administrativa

El módulo `src/modules/licensing/domain/license-policy.ts` establece reglas puras de vigencia anual, conservación de historial/exportación, acceso premium, límite lógico de tres dispositivos y requisitos de canje. Las pruebas cubren vencimiento exacto, año bisiesto, fechas inválidas, suspensión/revocación y códigos ya consumidos.

La consola administrativa tiene ahora un shell de presentación en `src/modules/admin/ui/AdminConsolePage.tsx`, contratos de datos tipados y navegación filtrada por permiso. Solo renderiza métricas cuando recibe un snapshot del servidor; no contiene datos de demostración. Aún no está integrada en la navegación ni conectada a backend, porque hacerlo sin Auth/RLS/roles reales sería inseguro.
