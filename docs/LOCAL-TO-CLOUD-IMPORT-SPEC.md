# Especificación — importación local a Fixora Cloud

Estado: contrato y validación local inicial implementados; RPC, interfaz de revisión y pruebas E2E pendientes.
Fecha: 3 de noviembre de 2026.
Rama: integration/fixora-mainline-20261103.

## 1. Objetivo y límites

Permitir que una persona que ya usaba Fixora en un navegador transfiera sus registros locales a un negocio cloud sin mezclar cuentas, sobrescribir información cloud ni borrar el origen local.

La importación no es sincronización offline. Es una operación explícita, de una sola dirección, con vista previa y confirmación.

## 2. Fuentes locales existentes

La versión web actual conserva estas claves heredadas en localStorage:

| Clave | Contenido | Límite vigente |
|---|---|---:|
| fixora.catalog.v1 | Catálogo de productos y servicios | 500 elementos |
| fixora.expenses.v1 | Gastos fijos/variables, unidades, periodo y moneda | 100 líneas por tipo |
| fixora.calculations.v1 | Snapshots del historial local | 100 registros |
| Borrador del calculador | Último cálculo y punto de equilibrio | Se importa por su flujo privado separado |

En modo cloud, el almacenamiento de trabajo está namespaced por usuario y negocio. La importación debe leer exclusivamente las claves heredadas globales, no copiar claves namespaced de otra cuenta/negocio.

## 3. Validación local ya implementada

Módulo: src/modules/data-import/domain/local-import.ts.

- Valida la estructura completa de catálogo, gastos e historial.
- Rechaza unidades fraccionarias; no redondea ni corrige datos silenciosamente.
- Rechaza SKU e identificadores duplicados dentro del catálogo/historial.
- Valida cada snapshot mediante el validador del dominio de historial.
- Limita el payload agregado a 1 MiB, catálogo a 500, gastos a 100 por tipo e historial a 100.
- Bloquea la importación completa si detecta registros inválidos; no presenta una colección dañada como vacía.
- Detecta incompatibilidad de moneda de gastos y nunca realiza conversión implícita.
- No escribe ni elimina claves locales.

Las pruebas unitarias cubren datos válidos, ausencia de datos, JSON dañado, JSON con forma incorrecta, unidades fraccionarias, SKU duplicados, snapshots inválidos, tamaño máximo y moneda incompatible.

## 4. Experiencia requerida

1. En Mi cuenta → Datos y privacidad, mostrar si existen datos locales heredados.
2. Seleccionar el negocio cloud destino y mostrar claramente su moneda.
3. Vista previa separada por categoría: válidos, inválidos, duplicados y conflictos.
4. Permitir excluir una categoría completa antes de continuar; no permitir editar el contenido silenciosamente durante la importación.
5. Catálogo: comparar SKU normalizado con el catálogo cloud. No reemplazar automáticamente una fila existente. La persona podrá excluir los conflictos y reintentar.
6. Gastos: importar únicamente si el negocio cloud aún no tiene gastos configurados/cambiados. Si ya existen datos cloud, mantenerlos y pedir una decisión explícita en una fase posterior; no sobrescribirlos por defecto.
7. Historial: agregar snapshots inmutables; conservar fechas, moneda, fórmula y entradas/resultados históricos.
8. Confirmación final con resumen exacto de lo que se enviará.
9. Mostrar el resultado del servidor y un identificador de importación para soporte.
10. Conservar los datos locales originales después de una importación exitosa. La limpieza local será una acción separada, nunca parte automática del import.

## 5. Contrato servidor propuesto

Migración futura (no creada aún): fixora_local_data_import.

- Tabla privada fixora_private.fixora_import_batches: usuario, negocio, clave idempotente, hash del payload, estado, resumen y fecha.
- Tabla privada fixora_private.fixora_import_source_records: relación entre IDs locales y IDs cloud para evitar importar el mismo registro dos veces con una clave nueva.
- RPC pública invoker fixora_import_local_bundle, que delega a una función privada SECURITY DEFINER.
- La función privada tendrá search_path = '', validará auth.uid(), membresía activa con permisos de escritura y tamaño/cantidad/tipos de cada elemento.
- El servidor calculará el hash del payload; no confiará en un hash enviado por el navegador.
- Clave idempotente por usuario + negocio + importación. Misma clave y mismo payload devuelven el resultado anterior; misma clave con payload diferente se rechaza.
- El servidor volverá a comprobar SKU duplicados y existencia de gastos dentro de la misma transacción. La vista previa del cliente no es autoridad.
- IDs cloud generados en servidor; los IDs locales se conservan como claves de origen privadas.
- Inserción de catálogo, gastos e historial y registro del lote ocurren en una sola transacción. Si cualquier categoría falla, todo el lote seleccionado hace rollback.
- Grants mínimos: RPC para authenticated; helper privado no ejecutable directamente por anon/authenticated; tablas privadas sin acceso directo cliente.
- El payload se limita a 1 MiB; no se admiten imágenes, adjuntos, credenciales, códigos de activación ni tokens.

## 6. Política de conflictos

- SKU existente: no reemplazar; excluir del lote o resolver manualmente en una etapa posterior.
- Gastos cloud ya configurados: no sobrescribir en MVP. La importación de gastos se deshabilita hasta que exista una elección explícita de reemplazo/conciliación.
- Moneda de gastos distinta de la moneda del negocio: no importar gastos y no convertir.
- Snapshot ya importado: reconocerlo por ID local de origen y omitirlo.
- Registro local inválido: excluir la importación completa hasta que se corrija o la persona decida excluir esa categoría.
- Negocio destino no autorizado: el servidor rechaza toda la operación.

## 7. Rollback y recuperación

- La transacción garantiza rollback total cuando falla cualquier validación o escritura.
- Los originales locales se conservan como respaldo incluso después de un éxito.
- No se ofrecerá un botón de “deshacer importación” que borre filas cloud hasta diseñar y probar un procedimiento que preserve ediciones posteriores y referencias. El rollback transaccional y la copia local son las garantías iniciales.
- No borrar ni resetear localStorage como efecto secundario.

## 8. Pruebas de aceptación pendientes

- pgTAP: autorización, payload inválido/grande, claves repetidas, hash distinto, SKU duplicado, moneda, unidades fraccionarias, límites de tamaño, aislamiento entre negocios, rollback y mapeo de IDs.
- Concurrencia: dos solicitudes simultáneas con la misma clave; debe existir un solo lote.
- E2E: usuario A importa a negocio A; usuario B no puede ver ni importar a negocio A; cambio de negocio no altera el destino de una importación en curso.
- E2E: desconexión antes/durante/después de confirmar; reintento con la misma clave no duplica datos.
- E2E: comparar conteos y muestras de origen/destino, volver a entrar y verificar historial.
- Recuperación: exportar originales locales y confirmar que siguen disponibles después del import.

## 9. Orden de implementación

1. Validación pura local — implementada y con CI de aplicación SUCCESS en el commit 077c3d9.
2. Adaptador browser para leer las claves legacy sin mutarlas.
3. Migración RPC transaccional + pgTAP; reconstrucción local antes de cualquier aplicación remota.
4. Adaptador Supabase y servicio de aplicación.
5. Panel de vista previa/confirmación en Mi cuenta.
6. E2E multiusuario/multinegocio y recuperación.
7. Activar en staging; no anunciar sincronización offline.
