import { getMessages, type SupportedLocale } from "../i18n/messages";

type PageProps = { locale?: SupportedLocale };

export function AboutPage({ locale }: PageProps) {
  const copy = getMessages(locale).brand;
  return (
    <div className="secondary-page brand-page">
      <p className="eyebrow">LA EMPRESA <span> / </span> FIXORA DYNAMICS</p>
      <section className="brand-hero">
        <div className="brand-hero-copy">
          <span className="welcome-kicker">{copy.welcome}</span>
          <h1>{copy.aboutTitle}</h1>
          <p className="page-lead">{copy.aboutBody}</p>
        </div>
        <div className="brand-hero-mark" aria-hidden="true"><span>F</span><small>· D</small></div>
      </section>
      <section className="brand-product-card">
        <span className="eyebrow">NUESTRO PRIMER PRODUCTO</span>
        <h2>{copy.product}</h2>
        <p>{copy.essentialsBody}</p>
        <span className="brand-product-signature">Un producto de <strong>{copy.company}</strong></span>
      </section>
      <section className="values-section">
        <p className="eyebrow">{copy.valuesTitle}</p>
        <div className="values-grid">
          {copy.values.map((value, index) => (
            <article className="value-card" key={value}>
              <span>0{index + 1}</span>
              <h3>{value}</h3>
            </article>
          ))}
        </div>
      </section>
      <p className="trust-note brand-disclaimer">{copy.disclaimer}</p>
    </div>
  );
}

export function AccountPage({ locale, onOpenGuide }: PageProps & { onOpenGuide: () => void }) {
  const copy = getMessages(locale).account;
  const sections = [
    { icon: "◉", title: copy.profile, detail: "Nombre visible, correo verificado y preferencias." },
    { icon: "◇", title: copy.business, detail: "Nombre comercial, actividad y moneda preferida." },
    { icon: "✳", title: copy.license, detail: "Plan, activación, vencimiento y derechos de uso." },
    { icon: "▦", title: copy.devices, detail: "Equipos activos, última actividad y revocación." },
    { icon: "▤", title: copy.purchases, detail: "Canal de compra y estado de validación." },
    { icon: "⌑", title: copy.privacy, detail: "Exportación, conservación y solicitudes de privacidad." }
  ];
  return (
    <div className="secondary-page account-page">
      <p className="eyebrow">TU ESPACIO PERSONAL <span> / </span> CUENTA</p>
      <h1>{copy.title}</h1>
      <p className="page-lead">{copy.lead}</p>
      <section className="account-security-banner">
        <span className="account-security-icon">⌑</span>
        <div><strong>{copy.authTitle}</strong><p>{copy.authBody}</p></div>
        <span className="planned-pill">{copy.pending}</span>
      </section>
      <div className="account-summary-grid">
        {sections.map((section) => (
          <article className="account-section-card" key={section.title}>
            <span className="account-section-icon">{section.icon}</span>
            <div><h2>{section.title}</h2><p>{section.detail}</p><span className="account-card-status">{copy.pending}</span></div>
          </article>
        ))}
      </div>
      <section className="account-preferences">
        <div><span className="eyebrow">{copy.language}</span><strong>{copy.languageValue}</strong></div>
        <button className="outline-button" onClick={onOpenGuide}>Abrir guía y ayuda</button>
      </section>
      <p className="local-storage-note">{copy.storageNotice}</p>
    </div>
  );
}

export function GuidePage({ locale }: PageProps) {
  const copy = getMessages(locale).guide;
  return (
    <div className="secondary-page guide-page expanded-guide">
      <p className="eyebrow">CENTRO DE APRENDIZAJE <span> / </span> FIXORA ESSENTIALS</p>
      <h1>{copy.title}</h1>
      <p className="page-lead">{copy.lead}</p>
      <div className="guide-index">
        {copy.sections.map((section) => <a href={`#guide-${section.id}`} key={section.id}>{section.title}</a>)}
        <a href="#guide-faq">{copy.faqTitle}</a>
        <a href="#guide-glossary">{copy.glossaryTitle}</a>
      </div>
      {copy.sections.map((section) => (
        <section className="manual-section" id={`guide-${section.id}`} key={section.id}>
          <div className="manual-section-heading"><span>{section.id === "start" ? "01" : section.id === "calculator" ? "02" : section.id === "expenses" ? "03" : section.id === "catalog" ? "04" : section.id === "break-even" ? "05" : section.id === "history" ? "06" : "07"}</span><div><h2>{section.title}</h2><p>{section.purpose}</p></div></div>
          <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="manual-example"><strong>Ejemplo práctico</strong><p>{section.example}</p></div>
        </section>
      ))}
      <section className="manual-section" id="guide-limitations">
        <div className="manual-section-heading"><span>08</span><div><h2>{copy.limitationsTitle}</h2><p>Transparencia sobre las funciones disponibles y los límites del producto actual.</p></div></div>
        <ul>{copy.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="manual-section" id="guide-faq">
        <div className="manual-section-heading"><span>09</span><div><h2>{copy.faqTitle}</h2><p>Respuestas sencillas a dudas frecuentes.</p></div></div>
        <div className="faq-list">{copy.faqs.map((faq) => <details key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div>
      </section>
      <section className="manual-section" id="guide-glossary">
        <div className="manual-section-heading"><span>10</span><div><h2>{copy.glossaryTitle}</h2><p>Palabras que encontrarás en tus herramientas.</p></div></div>
        <dl className="glossary-list">{copy.glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
      </section>
      <div className="guide-callout"><strong>¿Necesitas orientación?</strong><p>Empieza por la sección relacionada con tu tarea y utiliza datos ficticios para practicar antes de registrar información real.</p></div>
    </div>
  );
}
