import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { CatalogApplicationService } from "../application/catalog-service";
import type { CatalogCurrency, CatalogDraft, CatalogItem, CatalogItemKind } from "../domain/catalog";

export function CatalogPage({ service, currency, formatMoney, onUseInCalculator }: {
  service: CatalogApplicationService;
  currency: CatalogCurrency;
  formatMoney: (value: number, currency: CatalogCurrency) => string;
  onUseInCalculator: (item: CatalogItem) => void;
}) {
  const [catalogLoadState] = useState(() => service.loadState());
  const [items, setItems] = useState<CatalogItem[]>(catalogLoadState.items);
  const [needsRecovery, setNeedsRecovery] = useState(catalogLoadState.needsRecovery);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CatalogItemKind>("product");
  const [unit, setUnit] = useState("pieza");
  const [sku, setSku] = useState("");
  const [referenceCost, setReferenceCost] = useState(0);
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editingId) setDraftCurrency(currency);
  }, [currency, editingId]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setKind("product");
    setUnit("pieza");
    setSku("");
    setReferenceCost(0);
    setDraftCurrency(currency);
  }

  function startEditing(item: CatalogItem) {
    setEditingId(item.id);
    setName(item.name);
    setKind(item.kind);
    setUnit(item.unit);
    setSku(item.sku);
    setReferenceCost(item.referenceCost);
    setDraftCurrency(item.currency);
    setMessage("Editando elemento. Guarda los cambios o cancela para salir.");
  }

  function toggleActive(item: CatalogItem) {
    if (needsRecovery) return;
    try {
      const next = service.setActive(item.id, !item.active, items);
      setItems(next);
      setMessage(item.active ? "Elemento archivado." : "Elemento reactivado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible actualizar el catálogo.");
    }
  }


  function startNewCatalog() {
    try {
      service.reset();
      setItems([]);
      setNeedsRecovery(false);
      setMessage("Se inició un catálogo nuevo en este navegador.");
    } catch {
      setMessage("No fue posible reiniciar el catálogo. Los datos anteriores no se modificaron.");
    }
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsRecovery) {
      setMessage("Revisa o reinicia el catálogo antes de modificarlo.");
      return;
    }
    const draft: CatalogDraft = { name, kind, unit, sku, currency: draftCurrency, referenceCost };
    try {
      if (editingId) {
        const next = service.update(editingId, draft, items);
        setItems(next);
        setMessage("Cambios guardados en el catálogo.");
      } else {
        const next = service.create(draft, items);
        setItems(next);
        setMessage("Elemento añadido al catálogo.");
      }
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir el elemento.");
    }
  }

  return (
    <div className="secondary-page catalog-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 06</p>
      <h1>Tu catálogo de productos y servicios.</h1>
      <p className="page-lead">Mantén una lista sencilla de lo que vendes o prestas. El coste de referencia es informativo; cada cálculo guardado conservará sus propios valores.</p>
      {needsRecovery && (
        <div className="guide-callout" role="alert">
          <strong>El catálogo contiene datos que no se pueden leer.</strong>
          <p>Fixora conserva el almacenamiento original y no lo reemplazará automáticamente. Puedes seguir consultando los elementos legibles o iniciar un catálogo nuevo; esta acción sustituirá el contenido local actual.</p>
          <button className="outline-button" onClick={startNewCatalog}>Iniciar un catálogo nuevo</button>
        </div>
      )}
      <section className="surface-card catalog-form-card">
        <div className="section-heading"><div className="section-number">01</div><div><h2>{editingId ? "Editar elemento" : "Añadir al catálogo"}</h2><p>Usa unidades claras y conserva la moneda correcta de cada registro.</p></div></div>
        <form className="catalog-form" onSubmit={saveItem}>
          <label className="field"><span>Nombre</span><input value={name} maxLength={100} required placeholder="Ej. Jabón artesanal" onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value as CatalogItemKind)}><option value="product">Producto</option><option value="service">Servicio</option></select></label>
          <label className="field"><span>Unidad</span><input value={unit} maxLength={40} required placeholder="pieza, sesión, paquete..." onChange={(event) => setUnit(event.target.value)} /></label>
          <label className="field"><span>SKU / código (opcional)</span><input value={sku} maxLength={40} placeholder="Código interno" onChange={(event) => setSku(event.target.value)} /></label>
          <label className="field"><span>Moneda</span><select value={draftCurrency} onChange={(event) => setDraftCurrency(event.target.value as CatalogCurrency)}><option value="MXN">MXN</option><option value="USD">USD</option></select></label>
          <label className="field"><span>Coste de referencia ({draftCurrency})</span><input type="number" min="0" step="0.01" value={referenceCost} onChange={(event) => setReferenceCost(Math.max(0, Number(event.target.value) || 0))} /></label>
          <div className="catalog-form-actions"><button className="primary-button compact" type="submit" disabled={needsRecovery}>{editingId ? "Guardar cambios" : "Añadir al catálogo"} <span>↗</span></button>{editingId && <button className="outline-button" type="button" onClick={resetForm}>Cancelar</button>}</div>
        </form>
        <p className="save-message" role="status">{message}</p>
      </section>
      <section className="catalog-list-section">
        <div className="essentials-section-title"><div><p className="eyebrow">TUS REGISTROS</p><h2>Elementos guardados</h2></div><span className="profile-chip">{items.length} / 500</span></div>
        {items.length === 0 ? (
          <div className="empty-state"><span>◇</span><h2>Tu catálogo está listo para empezar</h2><p>Añade tu primer producto o servicio. Después podrás reutilizarlo en tus cálculos.</p></div>
        ) : (
          <div className="catalog-list">
            {items.map((item) => (
              <article className={item.active ? "catalog-row" : "catalog-row catalog-row-archived"} key={item.id}>
                <div className="catalog-kind">{item.kind === "product" ? "PRODUCTO" : "SERVICIO"}{!item.active && <span className="catalog-archived-label"> · ARCHIVADO</span>}</div>
                <div className="catalog-main"><strong>{item.name}</strong><span>{item.sku ? `SKU ${item.sku} · ` : ""}Por {item.unit}</span></div>
                <div className="catalog-cost"><span>COSTE REFERENCIA</span><strong>{formatMoney(item.referenceCost, item.currency)}</strong></div>
                <button className="outline-button catalog-use-button" onClick={() => onUseInCalculator(item)} disabled={!item.active}>Costear</button>
                <div className="catalog-row-actions"><button className="outline-button" onClick={() => startEditing(item)} disabled={needsRecovery}>Editar</button><button className="text-button" onClick={() => toggleActive(item)} disabled={needsRecovery}>{item.active ? "Archivar" : "Reactivar"}</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="local-storage-note">Este catálogo se guarda únicamente en este navegador. Todavía no se comparte entre dispositivos ni se sincroniza con la nube.</p>
    </div>
  );
}
