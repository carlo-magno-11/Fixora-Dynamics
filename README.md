# Fixora Dynamics

**Fixora Dynamics** es la marca paraguas. **Fixora Essentials** es el primer producto: una aplicación web para que profesionales independientes y pequeños negocios entiendan sus costes, definan precios y organicen su operación básica.

## Qué incluye la aplicación web

- Calculadora general de costes y precios con motor matemático Decimal.js.
- Mano de obra, materiales, merma, costes directos y fijos por unidad, comisiones, descuentos y margen objetivo.
- Punto de equilibrio con unidades completas y margen de contribución.
- Control de gastos fijos y variables, periodo de registro y asignación analítica.
- Catálogo de productos y servicios con SKU opcional, moneda, coste de referencia, edición y archivo.
- Historial de cálculos versionados, recuperación de snapshots y exportación CSV.
- Borrador automático y restauración local de la calculadora, aislado por usuario/negocio y claramente separado de la sincronización cloud.
- Guía práctica, perfiles de actividad, información de marca y cuenta.
- Registro/inicio de sesión, confirmación de correo, recuperación de contraseña y MFA TOTP.
- Negocios separados por usuario mediante RLS; catálogo, gastos e historial cloud.
- Centro de soporte para tickets y mensajes.
- Licencia anual y activación preparadas para el modelo comercial; máximo tres dispositivos activos.
- Consola administrativa con autorización AAL2 en servidor y operaciones de compra, licencias, dispositivos, invitaciones y soporte.

La interfaz móvil utiliza una navegación inferior compacta con un menú de secciones adicionales. En escritorio conserva la navegación lateral.

## Arquitectura y tecnología

- React 19, TypeScript estricto y Vite.
- Motor financiero independiente de React y Supabase; Decimal.js es la fuente única de cálculo.
- Supabase Auth, PostgreSQL, RLS, RPC y Edge Functions.
- Monolito modular por dominios; no microservicios en el MVP.
- Persistencia local en modo de desarrollo y persistencia cloud por negocio cuando Auth está configurado.
- Español de México primero; inglés después.
- Web primero; arquitectura preparada para reutilizar lógica en Expo más adelante.

## Entorno Supabase

Destino de pruebas reservado para Fixora: **`eyesite-security-test`**, ref **`dclaebknyalimmtgppeg`**.

El proyecto oficial EYESITE **`xhvpvpvtkdgnnxdwdrkn`** es independiente y no debe modificarse desde este proyecto.

Configura el entorno a partir de `.env.example`. En modo cloud se necesita:

- `VITE_FIXORA_AUTH_MODE=cloud`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Se admite `VITE_SUPABASE_ANON_KEY` como fallback temporal. Nunca incluyas `service_role`, secret keys ni credenciales de administración en variables `VITE_*`, el navegador o el repositorio.

En desarrollo, si no se especifica el modo, la aplicación usa local. En producción, el modo predeterminado es cloud y falla de forma segura si falta la configuración.

## Estado real de entrega — 2 de noviembre de 2026

La rama de integración web/Auth es `feat/web-auth-cloud-20261102`, PR [#2](https://github.com/carlo-magno-11/Fixora-Dynamics/pull/2), actualmente en borrador. La fundación de producto/dominio se mantiene en `foundation/bootstrap-20261029`, PR #1, también en borrador.

Validación más reciente registrada para PR #2, commit `52c36cb9c827da849ab03fcbba40379841b90354`:

- CI #1114: SUCCESS (instalación congelada, TypeScript, Vitest, build, comprobaciones Deno y utilidades de Edge Functions).
- Database tests #648: SUCCESS (reconstrucción desde migraciones, pgTAP, cuatro mutaciones RLS negativas y límite concurrente de dispositivos).
- RPC de guardado de gastos: pgTAP remoto 14/14.
- RPC de resumen administrativo: pgTAP remoto 7/7.
- Security Advisor del proyecto de pruebas: sin hallazgos en la última revisión registrada.
- Las ocho Edge Functions administrativas/de activación enumeradas en `docs/WEB-AUTH-SETUP.md` están desplegadas en el proyecto de pruebas con JWT obligatorio.

**Esto no significa que Fixora esté lista para venderse o desplegarse públicamente.** Siguen pendientes configuración de Auth/SMTP/redirects, secretos HMAC, primer propietario administrativo verificado, E2E con identidad real, importación de datos locales, pruebas de accesibilidad y dispositivos, DAST/SCA, backups/restauración y staging HTTPS. Algunas funciones administrativas fallan de forma segura hasta configurar sus secretos.

## Decisiones de producto que deben conservarse

- Primer lanzamiento limitado a Fixora Essentials general.
- Kits de ropa y repostería quedan para fases posteriores.
- Licencia anual desde la primera activación; máximo tres dispositivos activos.
- Etsy como canal inicial; revisión manual de compra hasta que una integración oficial esté aprobada y probada.
- El vencimiento no borra la cuenta ni el historial.
- No prometer rendimientos ni sustituir asesoría contable, fiscal o legal.
- No crear un ERP, contabilidad fiscal, nómina, sincronización bancaria ni microservicios en el MVP.

## Desarrollo

Requisitos: Node.js 24 y pnpm 9.15.9.

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## Documentación principal

- `docs/MASTER-IMPLEMENTATION-PLAN.md`: alcance, arquitectura y puertas de salida.
- `docs/ARCHITECTURE.md`: límites entre módulos y capas.
- `docs/DESIGN-SYSTEM.md`: identidad visual, paleta y accesibilidad.
- `docs/WEB-AUTH-SETUP.md`: Auth, negocios, persistencia y configuración cloud.
- `docs/ADMIN-CONSOLE-ARCHITECTURE.md`: roles, permisos y operaciones administrativas.
- `docs/CALCULATIONS.md`: fórmulas y convenciones.
- `docs/DATABASE.md`, `docs/DATA-MODEL.md` y `docs/DATABASE-LOCAL-SETUP.md`: datos y migraciones.
- `docs/SECURITY.md` y `docs/LICENSES.md`: seguridad y licenciamiento.
- `docs/ROADMAP.md` y `docs/PROGRESS-LOG.md`: estado y secuencia de entrega.
- `docs/WEB-UX-IMPROVEMENT-PLAN.md`: hallazgos de experiencia web y mejoras priorizadas.

Las páginas legales actuales son borradores y requieren revisión profesional antes de publicarse.