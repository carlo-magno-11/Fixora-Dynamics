# Fixora Essentials — matriz de realidad y brechas del producto

**Corte de revisión:** 4 de noviembre de 2026  
**HEAD revisado:** `3ceab3fb9495081bda7711b02f4e8cd2e6cbb50d`  
**Rama:** `integration/fixora-mainline-20261103`  
**PR:** #14, abierto y en borrador.  
**Propósito:** evitar confundir código de dominio, interfaz, persistencia, autorización, CI, staging y disponibilidad comercial.

## 1. Cómo leer esta matriz

- **Código/UI:** hay una pantalla o componente real.
- **Dominio:** hay reglas/cálculos puros.
- **Cloud:** existe servicio/repositorio/RPC/migración para el flujo.
- **Seguridad:** existe RLS/autorización server-side y pruebas; no equivale por sí solo a staging.
- **CI:** una suite automatizada terminó satisfactoriamente en el HEAD citado.
- **Staging/físico:** validación externa y dispositivos reales; sigue siendo una puerta distinta.

No marcar una función “terminada” por tener solo una de estas capas.

## 2. Fixora Essentials — núcleo común

| Área | Código/UI observado | Cloud y seguridad | Brecha principal |
|---|---|---|---|
| Inicio / Essentials | Home real en `src/app/App.tsx`, presentación del producto y accesos a calculadora, perfil y herramientas | Depende de AuthGate para sesión cloud | Falta onboarding guiado por tarea y resumen útil que no invente datos |
| Calculadora general | UI en App; dominio `src/modules/pricing/domain/pricing.ts` | Borrador local/cloud y snapshots; guardado cloud con servicio dedicado | Pruebas de conflicto multi-dispositivo, recuperación y paridad real |
| Punto de equilibrio | UI en App; dominio `src/modules/break-even/domain/break-even.ts` | Utiliza entradas configuradas por el usuario | Mejorar explicación de supuestos y comparar escenarios con resultados reales |
| Gastos | UI local y cloud (`ExpensesPage`, `CloudExpensesPage`) | Servicios y RPC batch; migraciones y RLS | Pruebas E2E de desconexión, reintento y edición concurrente |
| Catálogo | UI local y cloud (`CatalogPage`, `CloudCatalogPage`) | Repositorios y servicios cloud con RLS | Integración consistente con kits e historial; evitar duplicar coste de referencia y coste real |
| Historial | UI local/cloud; snapshots inmutables y exportación CSV | Repositorio cloud, paginación por cursor | Backup/restauración y pruebas de exportación completa/alcance |
| Borradores | UI de elección local/cloud en App | Borrador privado por usuario y negocio; migración/RPC | Validar pérdida de red, conflicto entre dos dispositivos y recuperación tras respuesta perdida |
| Importación de datos locales | Pantalla `LocalDataImportPage` y servicio de importación | RPC/repositorio de importación con idempotencia | E2E con datos reales de staging, duplicados, reintentos y rollback |
| Auth y negocios | `AuthGate`: sesión, registro/login/recuperación y selección de negocio | Supabase Auth y tablas Fixora; aislamiento probado en Browser E2E | MFA real y flujos de cuenta en staging; recovery y cambios de negocio con dos dispositivos |
| Mi cuenta / apariencia | `AccountPage`, configuración de negocio/perfil, paleta local personalizable | Perfil y negocio cloud según callbacks | Verificar persistencia de preferencias por usuario/dispositivo y experiencia completa |
| Licencias | UI de activación y lectura de entitlements en cuenta | Esquema, políticas y funciones parciales | Activación sigue controlada por feature flag; pagos, reembolsos, chargebacks y kits no están listos para venta |
| Soporte | `SupportPage`: tickets y mensajes mediante RPC | RPCs y tablas de soporte | Confirmar despliegue de `admin-support-inbox`, SLA y pruebas de abuso/privacidad |
| Administración | `AdminConsoleContainer` y paneles para compras, licencias, dispositivos, soporte e invitaciones | Edge Functions y controles de rol/permisos | MFA/AAL2, bootstrap de platform_owner y autorización completa deben verificarse en staging |
| Guía / ayuda | `GuidePage` existente | Contenido de la app | Completar manual por flujo, ejemplos, errores frecuentes y enlaces contextuales; no afirmar que ya es manual exhaustivo |
| Legal | Páginas de términos y privacidad presentes | No demuestra revisión jurídica ni aceptación/versionado final | Revisión legal mexicana, versiones, consentimiento y publicación |
| Internacionalización | Catálogo central `src/i18n/messages.ts` | Preferencia de locale en perfil según esquema | Cobertura total y revisión profesional del segundo idioma |

## 3. Kits especializados

### Comercio y reventa

**Código de dominio presente:**
- Costeo de adquisición/lote: `retail-costing.ts`.
- Inventario por movimientos: `retail-inventory.ts`.
- Sugerencia de precio: `retail-pricing.ts`.
- Rentabilidad por pedido: `retail-order-profit.ts`.
- Reposición determinista a partir de demanda/stock proporcionados: `retail-restock.ts`.

**No está terminado como kit comercial:**
- UI especializada integrada a navegación.
- Persistencia transaccional de lotes y movimientos.
- RLS y autorización de operaciones específicas del kit.
- Entitlement ejecutable y verificado para `kit.retail`.
- Flujo completo compra → recepción → inventario → venta → devolución → rentabilidad real.
- Guía específica y pruebas E2E de concurrencia.

**Regla:** las recomendaciones de reposición no pronostican demanda, no crean órdenes de compra y no modifican inventario.

### Otros kits

Alimentos/repostería, servicios/belleza, taller/manufactura y productos digitales/creativos aparecen en la selección de tipo de negocio y en documentos de diseño. La selección de perfil no es el kit ni concede acceso a funciones especializadas. No declarar esos módulos implementados.

## 4. Descubrimiento y retorno

| Propuesta | Estado actual | Decisión |
|---|---|---|
| “Explora” (biblioteca breve de ideas, herramientas y novedades) | No existe sección funcional identificada en App | Prototipo y validación antes de construir |
| “Mi semana en Fixora” (señales personales explicables) | No existe resumen personalizado verificado | Diseñar reglas y datos mínimos; posponer hasta tener datos fiables |
| Recordatorios optativos | No se encontró sistema de notificaciones implementado | No añadir hasta validar utilidad y consentimiento |
| Comunidad / mentoría | No implementada | Fuera del MVP por moderación, fraude y masa crítica |
| Noticias / temporadas | No implementadas | Solo fuentes verificadas, segmentación útil y mantenimiento editorial |

Documentación: `docs/PRODUCT-DISCOVERY-RETENTION-EXPERIMENTS.md`.

## 5. Puertas de validación del HEAD

Al momento de esta revisión:
- CI #1863: SUCCESS en el HEAD `3ceab3f` (typecheck, Vitest, build web, comprobación Deno y utilidades Deno).
- Security #675: en ejecución.
- Browser E2E #124: en ejecución.
- Database tests #1417: en ejecución.
- CodeQL #523: en ejecución.

No declarar aprobados los cuatro últimos hasta que terminen en el mismo HEAD. El Browser E2E existente es una primera prueba de aislamiento entre dos cuentas/negocios; no cubre el recorrido completo de Essentials, licencias, MFA, importación, backup/restauración ni staging físico.

## 6. Orden de ejecución recomendado

1. Cerrar las suites CI/Security/Database/Browser E2E/CodeQL en el HEAD central.
2. Completar pruebas E2E de Essentials: Auth → negocio → catálogo → cálculo → gastos → historial → exportación → importación/recuperación.
3. Resolver y probar en staging MFA, bootstrap administrativo, licencias, entitlements, compra y revocación.
4. Completar la primera experiencia guiada y manual de Essentials; revisar legal, accesibilidad y responsive.
5. Construir Comercio y reventa end-to-end, no solo añadir más cálculos de dominio.
6. Validar con usuarios la biblioteca “Explora”; prototipar antes de crear tablas o notificaciones.
7. Solo si hay evidencia de uso, desarrollar “Mi semana en Fixora” con señales auditables.
8. Avanzar a staging HTTPS, pruebas físicas y puerta de lanzamiento.

## 7. Límites

- No ejecutar migraciones remotas, SQL de escritura ni despliegues por esta matriz.
- No modificar el proyecto oficial EYESITE.
- No crear nuevos esquemas o tablas para “Explora” antes de validar el contenido y sus casos de uso.
- No convertir un perfil de negocio en permiso de kit.
- No publicar estadísticas, recomendaciones ni métricas si el dato no existe o no tiene fuente.
- No marcar listo para producción hasta cerrar `docs/LAUNCH-GATES.md`.
