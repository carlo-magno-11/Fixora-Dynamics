# Licencias

Licencia anual desde primera activación; hasta tres dispositivos activos simultáneos; el usuario puede revocar una instalación y registrar otra. Vencimiento calculado en servidor. Estados pending, active, suspended, revoked, expired. No bloquear por IP/viaje. Al vencer conservar cuenta e historial y permitir exportación/renovación.

Etsy será el canal inicial. Primer flujo asistido: verificar pedido, registrar orden, emitir código de alta entropía, guardar hash, verificar identidad y activar transaccionalmente. Automatización sujeta a integración oficial autorizada. El límite de tres instalaciones se garantiza en PostgreSQL bajo concurrencia. Definir reembolsos, contracargos, pérdida de dispositivo y recuperación.

## Dependencias open source evaluadas

La evaluación inicial de bibliotecas, estrellas y licencias está en `docs/OPEN-SOURCE-RESEARCH.md`. Candidatos MIT: React Hook Form, Zod, Recharts, TanStack Form, InvenTree y pdfme. No se incorporan todos automáticamente; revisar avisos, versión y subdependencias antes de instalar. Evitar incorporar código AGPL al producto propietario sin revisión jurídica. Las estrellas no sustituyen auditoría de mantenimiento ni seguridad.
