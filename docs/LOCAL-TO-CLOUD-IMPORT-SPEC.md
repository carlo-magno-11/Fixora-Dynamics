# Especificación — importación local a Fixora Cloud

Estado: implementación inicial en la rama central; no habilitada en Supabase remoto ni aprobada para staging.
Fecha de revisión: 3 de noviembre de 2026.
Rama: integration/fixora-mainline-20261103.

## 1. Objetivo y límites

Permitir que una persona transfiera registros heredados del navegador a un negocio cloud mediante una operación explícita, unidireccional, con revisión, selección y confirmación. No es sincronización offline.

La importación no debe mezclar negocios, sobrescribir silenciosamente información cloud, borrar el origen local ni confiar en la vista previa del navegador como control de autorización.

## 2. Fuentes y alcance

El adaptador browser lee únicamente las claves legacy definidas por el núcleo:
- catálogo: `fixora.catalog.v1`;
- gastos: `fixora.expenses.v1`;
- historial: `fixora.calculations.v1`.

No recorre ni copia claves namespaced de otros usuarios o negocios. El borrador del calculador conserva su flujo privado independiente y no forma parte de este lote.

Límites: 500 elementos de catálogo, 100 gastos fijos y 100 variables, 100 snapshots y 1 MiB de payload agregado. No se admiten adjuntos, imágenes, credenciales, tokens ni códigos de activación.

## 3. Implementación presente en la rama

- Dominio puro: `src/modules/data-import/domain/local-import.ts`.
- Servicio de aplicación: `src/modules/data-import/application/local-import-service.ts`.
- Adaptador de lectura legacy: `src/modules/data-import/infrastructure/browser-local-import-source.ts`.
- Adaptador Supabase: `src/modules/data-import/infrastructure/supabase-local-import-repository.ts`.
- Interfaz: `src/modules/data-import/ui/LocalDataImportPage.tsx`.
- Composición: `src/app/create-app-services.ts`.
- Migración propuesta: `supabase/migrations/20261104010000_fixora_local_data_import.sql`.
- Pruebas SQL: `supabase/tests/fixora_local_data_import.test.sql`.

La validación local rechaza JSON dañado, formas incompatibles, unidades fraccionarias, duplicados, snapshots inválidos, monedas no soportadas y payloads excesivos. No corrige datos ni modifica localStorage. Una categoría inválida puede excluirse; no se debe tratar un error de lectura como una colección vacía.

La vista previa compara SKU y estado de gastos cloud. El destino y la moneda se muestran antes de confirmar. Los gastos cloud existentes y los SKU conflictivos se bloquean; no hay conversión de moneda implícita.

## 4. Contrato de servidor implementado en código, pendiente de CI

La migración crea:
- `fixora_private.fixora_import_batches`: ledger privado con usuario, negocio, clave idempotente, hash SHA-256, estado y resumen;
- `fixora_private.fixora_import_source_records`: mapeo privado de IDs locales a registros cloud para deduplicar catálogo e historial incluso con otra clave de importación;
- helper `fixora_private.import_local_bundle`;
- RPC `public.fixora_import_local_bundle`.

El helper comprueba `auth.uid()`, membresía activa con rol owner/admin/editor, negocio destino, estructura, límites, tipos, cantidades, moneda, SKU, fórmulas y snapshots. El hash se calcula en servidor. La misma clave con el mismo payload devuelve el resultado previo; la misma clave con contenido distinto se rechaza. Una importación completa ocurre en una transacción PostgreSQL: cualquier error revierte todas las categorías seleccionadas.

La RPC pública está declarada SECURITY DEFINER con `search_path = ''` para invocar el helper privado cuyo EXECUTE está revocado a roles cliente. El helper también es SECURITY DEFINER con `search_path = ''`; sus permisos de ejecución están revocados a PUBLIC/anon/authenticated/service_role. La RPC pública concede EXECUTE únicamente a authenticated y revoca PUBLIC/anon. La autorización de negocio se vuelve a comprobar dentro del helper. Esta elevación debe conservar revisión explícita y pruebas negativas; no sustituirla por confianza en la UI.

Las tablas del ledger y del mapeo tienen RLS + FORCE RLS, políticas de denegación para clientes y ningún acceso directo concedido a roles cliente ni service_role.

## 5. Política de conflictos y conservación

- SKU existente: el servidor rechaza la transacción; la UI informa del conflicto y no reemplaza.
- Gastos cloud configurados o con versión modificada: no se sobrescriben.
- Moneda de gastos distinta a la del negocio: se rechaza; no hay conversión automática.
- ID local de catálogo/historial ya importado con el mismo hash: se omite.
- ID local ya importado con contenido distinto: se rechaza para evitar reemplazos encubiertos.
- Usuario sin membresía de escritura, viewer o negocio ajeno: el servidor rechaza.
- Los snapshots conservan fecha, moneda, versión de fórmula, entradas, resultados y snapshot de catálogo.
- Los datos originales locales permanecen en el navegador después del éxito. No se limpia localStorage ni se ofrece rollback destructivo de registros cloud.

## 6. Pruebas presentes y estado real

La suite `fixora_local_data_import.test.sql` declara 33 aserciones pgTAP y cubre estructura/permisos, importación de catálogo/gastos/historial, reintento idempotente, payload distinto con misma clave, IDs de origen repetidos, SKU existente, moneda, unidades fraccionarias, rollback total, límites, tamaño y aislamiento de owner/editor/viewer/no miembro.

Estado consultado para HEAD `003b9fedf0c49af56c2b75e8ced002309c84b14c`:
- CI #1638: SUCCESS.
- Database tests #1192: CANCELLED.
- CodeQL #298: CANCELLED.
- Security #450: CANCELLED.

Por tanto, la compilación y pruebas de aplicación pasaron en ese HEAD, pero la reconstrucción de base, pgTAP, CodeQL y Security no están aprobados en ese mismo HEAD. No afirmar que la migración está validada.

## 7. Pendientes antes de activar

1. Reejecutar Database tests desde una reconstrucción limpia y corregir cualquier fallo de migración/pgTAP.
2. Reejecutar CodeQL y Security sobre el mismo HEAD.
3. Revisar carrera entre importaciones simultáneas, incluidos dos import_keys diferentes con el mismo ID de origen; verificar que la restricción única hace rollback completo y que el reintento es recuperable.
4. Añadir E2E con dos usuarios, dos negocios y al menos dos dispositivos; probar cambio de negocio durante una operación, doble clic, timeout, desconexión y reintento.
5. Comprobar que el resultado de una importación ya completada se puede recuperar después de recargar o perder la respuesta; documentar el uso de la misma clave idempotente.
6. Revisar el caso de navegador compartido: los datos legacy globales no tienen propietario verificable; la UI debe advertir que la persona confirme que reconoce esos datos antes de copiarlos a su cuenta.
7. Verificar conteos y muestras de catálogo/gastos/historial después de importar.
8. Probar exportación y restauración de los originales locales.
9. Sólo después de CI/pgTAP aprobar, preparar revisión de migración remota Fixora; no aplicarla automáticamente.

## 8. Separación de entornos

La migración `20261104010000_fixora_local_data_import` está en GitHub, pero no aparece en el historial remoto de Supabase consultado. No se ha aplicado a `dclaebknyalimmtgppeg`. No hay staging E2E validado. El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` queda fuera de alcance.
