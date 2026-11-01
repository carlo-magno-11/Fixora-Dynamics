type LegalKind = "terms" | "privacy";

export function LegalPage({ kind }: { kind: LegalKind }) {
  const isTerms = kind === "terms";
  return (
    <div className="secondary-page legal-page">
      <p className="eyebrow">INFORMACIÓN LEGAL <span> / </span> FIXORA DYNAMICS</p>
      <span className="draft-banner">BORRADOR INTERNO · NO VIGENTE</span>
      <h1>{isTerms ? "Términos y condiciones" : "Aviso de privacidad"}</h1>
      <p className="page-lead">
        {isTerms
          ? "Estamos preparando las condiciones de uso y licencia de Fixora Essentials. Este resumen no es un contrato vigente ni debe utilizarse para aceptar una compra."
          : "Estamos preparando la información completa sobre el tratamiento de datos personales. Este resumen no es un aviso de privacidad vigente ni autoriza por sí mismo la recolección de datos."}
      </p>
      {isTerms ? (
        <>
          <section className="legal-draft-card"><h2>Qué producto estás utilizando</h2><p>Fixora Dynamics es la empresa y marca principal. Fixora Essentials es el primer producto. Los kits especializados serán módulos adicionales del mismo espacio de trabajo.</p></section>
          <section className="legal-draft-card"><h2>Licencia prevista</h2><p>El diseño comercial contempla una licencia anual desde la primera activación verificada y hasta tres dispositivos activos. El QR solo abre la activación; no demuestra una compra. El historial no se eliminará automáticamente cuando venza la licencia.</p></section>
          <section className="legal-draft-card"><h2>Uso de las herramientas</h2><p>Los cálculos son estimaciones basadas en los datos introducidos. No son asesoría contable, fiscal, financiera o legal y no garantizan ventas ni utilidades.</p></section>
          <section className="legal-draft-card"><h2>Compras y devoluciones</h2><p>Se publicarán reglas específicas por canal, incluyendo verificación, reembolsos, cancelaciones, contracargos y soporte. No se limitarán derechos irrenunciables de las personas consumidoras.</p></section>
          <section className="legal-draft-card"><h2>Datos pendientes para publicar</h2><p>Falta completar la identidad legal del proveedor, domicilio, RFC cuando corresponda, precio, impuestos, correo de soporte, renovación, transferencia y procedimiento de aclaraciones.</p></section>
        </>
      ) : (
        <>
          <section className="legal-draft-card"><h2>Datos que se prevé utilizar</h2><p>Cuenta y correo, perfil y datos del negocio, productos, gastos, cálculos, historial, licencia, referencias de compra, identificador aleatorio de instalación y datos que se envíen voluntariamente a soporte.</p></section>
          <section className="legal-draft-card"><h2>Para qué se utilizarían</h2><p>Crear y proteger cuentas, guardar información solicitada, calcular resultados, verificar compras, administrar licencias y dispositivos, prevenir fraude, atender soporte y cumplir obligaciones legales.</p></section>
          <section className="legal-draft-card"><h2>Infraestructura prevista</h2><p>El proyecto técnico reservado para Fixora utiliza Supabase en la región us-east-2 de Estados Unidos. Las transferencias, proveedores, contratos y medidas reales deberán describirse y revisarse antes del lanzamiento.</p></section>
          <section className="legal-draft-card"><h2>Tus derechos</h2><p>El aviso definitivo explicará cómo solicitar acceso, rectificación, cancelación u oposición (derechos ARCO), revocar consentimiento y contactar al responsable.</p></section>
          <section className="legal-draft-card"><h2>Datos que no solicitaremos</h2><p>No pediremos contraseñas de Etsy, Gumroad o Hotmart ni datos bancarios completos. Las conexiones futuras a tiendas deberán usar autorizaciones oficiales y revocables.</p></section>
        </>
      )}
      <div className="legal-review-note"><strong>Antes de publicar</strong><p>Estos textos deben completarse con los datos legales del proveedor y revisarse con asesoría jurídica mexicana. No se habilitará una casilla de aceptación hasta que exista una versión final, fechada y aprobada.</p></div>
      <p className="local-storage-note">Borradores de trabajo: <code>docs/legal/TERMS-DRAFT.md</code>, <code>docs/legal/PRIVACY-DRAFT.md</code> y <code>docs/legal/LICENSE-POLICY-DRAFT.md</code>.</p>
    </div>
  );
}
