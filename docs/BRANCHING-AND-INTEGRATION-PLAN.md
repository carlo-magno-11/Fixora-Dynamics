# Plan de rama única e integración de Fixora

Fecha: 3 de noviembre de 2026  
Rama de trabajo vigente: `integration/fixora-mainline-20261103`  
Estado: integración en curso; no es una declaración de release ni de producción.

## 1. Regla operativa desde ahora

Toda modificación nueva de producto, código, pruebas y documentación se realizará en `integration/fixora-mainline-20261103`. Las ramas de funcionalidad anteriores se conservan como evidencia y fuentes de cambios, pero no se usarán para iniciar nuevas líneas de trabajo ni se actualizarán en paralelo.

La rama se creó desde el commit `1e51c55a6ce2ed6548b7f159eda963d5ec568b94`, que ya contiene la cadena de trabajo de Essentials, identidad web, edición numérica, rediseño visual, paleta, especificación comercial, guías y soporte de duración exacta por días. Incluye también la corrección del test de aislamiento de licencias descrita en el PR #13.

## 2. Mapa de trabajo existente

| Área | Referencia existente | Tratamiento |
|---|---|---|
| Fundación y producto general | PR #1 | Base funcional heredada |
| Identidad web y cloud | PR #2 | Base funcional heredada |
| Bandeja de soporte | PR #3–#6; variante R4 en PR #8 como base | Integrar tras revisión de conflictos |
| Edición de importes | PR #7 | Incluida en la cadena actual |
| Identidad visual | PR #9 | Incluida en la cadena actual |
| Paleta configurable | PR #10 | Incluida en la cadena actual |
| Modelo comercial y entitlements | PR #11 | Documentación incluida |
| Guías generales y especializadas | PR #12 | Documentación incluida; kits específicos siguen siendo borradores |
| Duración exacta por días | PR #13 | Código y migración incluidos; DB CI debe confirmar el último arreglo |
| Seguridad OWASP y rate limits | PR #8 | Pendiente de integración controlada |

Los PR anteriores permanecen abiertos mientras se valida la consolidación. No se deben fusionar en masa ni cerrar como completados solo porque sus commits aparezcan como ancestros de esta rama.

## 3. Seguridad: dependencia que no se debe forzar

PR #8 parte de `feat/admin-support-inbox-20261103-r4`, mientras que la cadena principal actual deriva de la rama de gastos y de las mejoras visuales. Al probar PR #8 contra esta rama de integración, GitHub informó que no era mergeable. El cambio de base se revirtió y PR #8 conserva su base original.

Por tanto:
- No hacer merge, rebase, reset ni cherry-pick ciego de PR #8.
- Mantener identificada la variante R4 de soporte como la base de esa línea de seguridad.
- Resolver los conflictos en un checkout local limpio, inspeccionando primero cada diff y conservando ambos comportamientos cuando sean compatibles.
- Integrar después la migración de rate limits `20261103030100` antes de la migración de duración `20261103050000`.
- Ejecutar CI completo y pgTAP desde la rama consolidada antes de considerar la seguridad integrada.

## 4. Flujo de cambios

1. Leer estado remoto de la rama antes de modificar.
2. Trabajar únicamente sobre esta rama.
3. Hacer cambios pequeños y coherentes por área; no reescribir módulos completos para incorporar una mejora localizada.
4. Añadir pruebas de dominio, integración y seguridad con cada cambio.
5. Ejecutar validación TypeScript, Vitest, build, Deno y reconstrucción local de Supabase.
6. Revisar diff, migraciones, permisos, RLS, funciones SECURITY DEFINER y orden temporal.
7. Registrar qué está en GitHub, qué pasó CI, qué está aplicado en Supabase y qué se probó realmente en navegador/dispositivo.
8. No desplegar ni aplicar migraciones remotas por el hecho de que el archivo exista en GitHub.

## 5. Criterios para aceptar una integración

- No perder cambios de ninguna rama de trabajo activa.
- No duplicar tablas, RPC, motores de cálculo ni centros de ayuda.
- No introducir regresiones en cálculos, Auth, RLS, licencias o administración.
- No aceptar una prueba que pase por debilitar una regla de seguridad.
- Mantener el máximo confirmado de tres dispositivos activos por licencia.
- No presentar borradores de kits como funciones ya implementadas.
- Conservar los datos del comprador cuando vence una licencia.
- Registrar cualquier decisión comercial pendiente antes de cambiar esquema o permisos.

## 6. Estado de entorno

- Rama de integración: creada en GitHub.
- CI de validación del commit anterior: correcto.
- La última suite de base de datos falló por una expectativa incorrecta en el test: el usuario B tenía una licencia propia de 30 días y el test esperaba cero licencias. Se corrigió para comprobar que B puede ver su licencia y no la de A.
- El commit de la corrección necesita una ejecución nueva de CI; no se declara pgTAP aprobado todavía.
- No se aplicó la migración de duración a Supabase remoto ni se desplegaron Edge Functions.
- La base de pruebas, staging y producción deben mantenerse como destinos distintos y verificables.

## 7. Política de ramas

A partir de este punto, la rama única de trabajo es `integration/fixora-mainline-20261103`. Si otra IA necesita continuar, debe trabajar sobre esta misma rama o entregar sus cambios como diff/PR para revisión; no crear una segunda línea de integración paralela. Los PR antiguos se consideran fuentes históricas hasta que se integren y validen explícitamente.
