# Especificación de duración de licencias

Estado: diseño previo a migración. No se ha creado ni aplicado SQL. Fecha: 2026-11-03.

## Objetivo

Añadir Fixora Inicio de 30 días sin alterar licencias anuales existentes ni convertir “30 días” en “un mes calendario”.

## Contrato temporal

- El plazo comienza en la primera activación válida, no al comprar ni al emitir el código.
- Duración de 30 días = exactamente 30 × 24 horas desde activated_at (720 horas).
- Duración anual = 12 meses calendario desde activated_at, conservando la hora UTC y ajustando al último día válido del mes destino.
- La expiración es exclusiva: el acceso está activo si now < expires_at y vencido cuando now >= expires_at.
- El backend calcula y persiste expires_at; el cliente nunca puede enviar ni cambiarlo.
- Reintentos de activación idempotentes no reinician activated_at ni extienden expires_at.
- El código de activación tiene vencimiento independiente de 30 días desde emisión; no confundir ese plazo con la vigencia de la licencia.

## Modelo recomendado

Mantener compatibilidad con los productos existentes:
- term_months nullable, conservando su valor actual para productos mensuales/anuales.
- nueva columna term_days nullable.
- CHECK exige exactamente una de las dos columnas, con rango explícito (term_days 1–3650; term_months 1–60).
- Producto anual actual permanece term_months=12.
- SKU de acceso inicial: FIXORA-ESSENTIALS-30D-TRIAL con term_days=30, General únicamente.
- La tabla y la API de catálogo deben exponer la duración como objeto discriminado (days o months), no como un entero ambiguo.

No modificar registros de licencias ya emitidas ni recalcular expires_at históricos.

## Cálculo TypeScript de referencia

Para días, usar suma UTC exacta en milisegundos: activationInstant + days × 86,400,000. Rechazar fechas inválidas y desbordamiento.

Para meses, conservar el algoritmo anual existente que clampa el día al último día válido del mes destino. No usar una suma fija de 365 días.

La función de política debe recibir el plazo del producto desde una fuente confiable; no deducirlo del SKU o de una variable del cliente.

## SQL transaccional

En la activación:
1. Bloquear la licencia y el pedido.
2. Comprobar compra aprobada, sin reembolso/disputa y producto activo.
3. Si la licencia está pending, leer duración del producto y calcular expires_at en PostgreSQL.
4. Persistir activated_at y expires_at una sola vez.
5. Activar entitlements con starts_at=activated_at y ends_at=expires_at salvo retención.
6. Registrar evento de activación.
7. En reintentos, devolver las fechas persistidas sin recalcularlas.

La expresión para term_days debe representar 24 horas exactas por día (segundos), no el intervalo de un mes. Para term_months conservar la semántica de mes calendario.

## Pruebas obligatorias

- 30 días exactos: 2026-11-03T12:00:00Z -> 2026-12-03T12:00:00Z.
- Justo antes de expiración: activo.
- Exactamente en expiración: vencido.
- Reintento de la misma activación: mismas fechas.
- Activación repetida con código consumido desde otro usuario/dispositivo: rechazada.
- Fecha inválida, plazo 0, negativos, null doble y ambos campos informados: rechazados.
- Año bisiesto: 2024-02-29T08:15:00Z + 12 meses -> 2025-02-28T08:15:00Z.
- Activación en fin de mes y UTC.
- Pruebas de SQL y TypeScript deben coincidir para todos los casos.
- El código de activación de 30 días sigue teniendo su propio reloj; expirar el código no cancela la licencia ya activada.

## SKU y derechos

- FIXORA-ESSENTIALS-30D-TRIAL: account.read, history.read, data.export, premium.tools y General Essentials que estén dentro del alcance comercial aprobado. No incluir ningún kit.
- El SKU no debe incluir un entitlement genérico que autorice todos los kits.
- La promoción de crédito $150 para upgrade debe residir en backend, estar ligada a una orden pagada y una ventana de 7 días, con una única redención.
- No permitir recomprar el pase para reiniciar el plazo; validar historial de compras por usuario y política de reembolso/chargeback.

## Orden de implementación

1. Aprobar ADR-004 sobre alcance de licencia y dispositivos.
2. Crear migration mediante Supabase CLI en un checkout local verificado; no editar migraciones históricas.
3. Actualizar generación de tipos y políticas TypeScript.
4. Actualizar RPC de activación y verificación de compra.
5. Añadir SKU y pruebas pgTAP/Vitest/concurrencia.
6. Reconstruir DB local desde cero y correr todos los tests.
7. Revisión de seguridad y advisors.
8. PR draft, CI y revisión manual.
9. Solo después de autorización, aplicar a proyecto de pruebas identificado y verificar migraciones/advisors.
10. Producción requiere autorización separada.

No aplicar este diseño a ningún proyecto Supabase mientras no exista un proyecto de Fixora identificado y aprobado expresamente.
