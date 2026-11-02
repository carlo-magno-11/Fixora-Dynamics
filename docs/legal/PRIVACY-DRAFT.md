# Aviso de privacidad integral — borrador para revisión

**Versión:** 0.1 — borrador interno  
**Estado:** NO VIGENTE. No publicar ni recabar datos bajo este texto hasta completar la identidad del responsable y la revisión jurídica.

## 1. Responsable

- Responsable del tratamiento: [RAZÓN SOCIAL / NOMBRE LEGAL PENDIENTE]
- Nombre comercial: Fixora Dynamics
- Domicilio: [PENDIENTE]
- Correo de privacidad y derechos ARCO: [PENDIENTE]
- Sitio oficial: [PENDIENTE]

## 2. Datos que el producto prevé tratar

La lista debe verificarse contra la implementación real antes de publicar. El diseño contempla:

- Cuenta: correo electrónico, identificador interno, estado de verificación y datos de perfil que el usuario decida proporcionar.
- Negocio: nombre, actividad, moneda y preferencias.
- Operación: productos, servicios, gastos, costes, cálculos, snapshots e historial que el usuario introduzca.
- Licencia: identificador de licencia, estado, fechas de activación y vencimiento, entitlements y número de dispositivos.
- Compra: plataforma, referencia externa del pedido, SKU y estado de pago/reembolso estrictamente necesarios para verificar el derecho de acceso. Evitar almacenar datos de tarjeta.
- Seguridad: identificador aleatorio de instalación, sesiones, eventos de activación, revocación y registros técnicos necesarios para proteger el servicio.
- Soporte: contenido que la persona envíe voluntariamente para resolver una consulta.

No recolectar contraseñas de marketplaces, datos bancarios completos, información sensible no necesaria ni fingerprint invasivo de hardware.

## 3. Finalidades previstas

- Crear y administrar cuentas.
- Autenticar usuarios y proteger sesiones.
- Crear espacios de negocio y guardar los datos solicitados.
- Calcular y conservar resultados.
- Verificar compras, emitir y administrar licencias.
- Aplicar límites de dispositivos y prevenir fraude.
- Atender solicitudes de soporte y aclaraciones.
- Cumplir obligaciones legales y atender derechos de las personas.
- Diagnosticar errores y proteger la disponibilidad y seguridad.

Cualquier analítica, marketing, perfilamiento o finalidad secundaria requiere evaluación y, cuando corresponda, consentimiento separado.

## 4. Datos de compra y terceros

Para verificar una compra se podrá consultar o recibir información de Etsy, Gumroad, Hotmart u otro canal, según el producto y la integración efectivamente habilitados. La verificación de compra de Fixora es distinta de una conexión opcional a la tienda del usuario para importar sus ventas.

No solicitar contraseñas de esos servicios. Las conexiones futuras deben usar OAuth o mecanismos oficiales, limitarse a los permisos autorizados y permitir revocación.

## 5. Encargados y transferencias

El diseño técnico contempla Supabase como proveedor de infraestructura de autenticación y base de datos. El proyecto reservado para Fixora está ubicado en la región us-east-2 (Estados Unidos). Antes del lanzamiento se deben confirmar contrato, subencargados, ubicación efectiva, medidas, transferencias, retención y obligaciones aplicables.

Los canales de venta y proveedores de correo, pagos, soporte, alojamiento, analítica o notificaciones solo se incorporarán a este aviso cuando se seleccionen realmente y se documenten sus funciones.

## 6. Conservación

Los datos se conservarán durante la vigencia de la cuenta/licencia y por los plazos adicionales que resulten necesarios para seguridad, aclaraciones, obligaciones legales y defensa de derechos. Los periodos exactos por categoría deben definirse antes de publicar.

El vencimiento de una licencia no debe provocar por sí solo la eliminación automática del historial del usuario. Debe existir un proceso para exportación, cierre de cuenta y eliminación sujeto a obligaciones legales y retenciones justificadas.

## 7. Derechos y mecanismos de privacidad

El usuario podrá solicitar acceso, rectificación, cancelación u oposición (derechos ARCO), así como revocar consentimiento o limitar uso/divulgación cuando proceda. Completar el procedimiento, identidad requerida, plazos y canal de atención conforme a la ley vigente.

No exigir más datos de identificación de los necesarios para validar una solicitud. Mantener evidencia de la atención y proteger los datos durante el proceso.

## 8. Seguridad

Se diseñan controles de autenticación, RLS por negocio, privilegios mínimos, MFA administrativo, registro de eventos, identificadores de instalación revocables y protección de secretos en servidor. Estas medidas son objetivos de implementación; no deben describirse como controles activos hasta que estén construidos y probados.

No exponer claves secretas en el frontend. No usar metadatos editables por el usuario como fuente de autorización.

## 9. Cookies y almacenamiento local

La versión actual del prototipo utiliza localStorage para algunos datos de perfil, catálogo, gastos e historial. Estos datos permanecen en el navegador y no se sincronizan con la nube. Antes del lanzamiento se debe inventariar cada clave, finalidad, duración y mecanismo de eliminación.

Si se incorporan cookies no esenciales, analítica o publicidad, actualizar este aviso y definir el mecanismo de consentimiento aplicable.

## 10. Menores de edad

Definir edad mínima y procedimiento de consentimiento/autorización antes del lanzamiento. No orientar la oferta comercial a menores sin evaluación legal específica.

## 11. Cambios al aviso

Los cambios se publicarán con número de versión, fecha y resumen. Los cambios que requieran consentimiento se someterán al mecanismo legal correspondiente.

## 12. Contacto

- Correo de privacidad: [PENDIENTE]
- Domicilio: [PENDIENTE]
- Fecha de última actualización: [PENDIENTE]

## Fuentes normativas para revisión

- Ley Federal de Protección de Datos Personales en Posesión de los Particulares, texto vigente y reformas publicadas en el DOF: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- Ley Federal de Protección al Consumidor, texto vigente: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf
- Información de PROFECO sobre información de proveedores y comercio electrónico: https://distintivodigital.profeco.gob.mx/info-codigo-de-etica.php

Este borrador no sustituye un dictamen jurídico. La normativa, reglas secundarias y criterios administrativos deben verificarse al momento de publicar.
