import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createCatalogItem } from "../domain/catalog";
import type { CatalogCurrency, CatalogDraft, CatalogItem, CatalogItemKind } from "../domain/catalog";

const STORAGE_KEY = "fixora.catalog.v1";

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.name === "string" && item.name.trim().length > 0 &&
    (item.kind === "product" || item.kind === "service") &&
    typeof item.unit === "string" && item.unit.trim().length > 0 &&
    typeof item.sku === "string" &&
    (item.currency === "MXN" || item.currency === "USD") &&
    typeof item.referenceCost === "number" && Number.isFinite(item.referenceCost) && item.referenceCost >= 0 &&
    typeof item.active === "boolean";
}

function readCatalog(): CatalogItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCatalogItem).slice(0, 500) : [];
  } catch {
    return [];
  }
}

export function CatalogPage({ currency, formatMoney, onUseInCalculator }: {
  currency: CatalogCurrency;
  formatMoney: (value: number, currency: CatalogCurrency) => string;
  onUseInCalculator: (item: CatalogItem) => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>(readCatalog);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CatalogItemKind>("product");
  const [unit, setUnit] = useState("pieza");
  const [sku, setSku] = useState("");
  const [referenceCost, setReferenceCost] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setMessage("Catálogo guardado en este navegador.");
    } catch {
      setMessage("No fue posible guardar el catálogo en este navegador.");
    }
  }, [items]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: CatalogDraft = { name, kind, unit, sku, currency, referenceCost };
    try {
      const item = createCatalogItem(draft, items);
      setItems((current) => [item, ...current].slice(0, 500));
      setName("");
      setSku("");
      setReferenceCost(0);
      setMessage("Elemento añadido al catálogo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir el elemento.");
    }
  }

  return (
    <div className="secondary-page catalog-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 06</p>
      <h1>Tu catálogo de productos y servicios.</h1>
      <p className="page-lead">Mantén una lista sencilla de lo que vendes o prestas. El coste de referencia es informativo; cada cálculo guardado conservará sus propios valores.</p>
      <section className="surface-card catalog-form-card">
        <div className="section-heading"><div className="section-number">01</div><div><h2>Añadir al catálogo</h2><p>Usa unidades claras y una sola moneda por registro.</p></div></div>
        <form className="catalog-form" onSubmit={addItem}>
          <label className="field"><span>Nombre</span><input value={name} maxLength={100} required placeholder="Ej. Jabón artesanal" onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value as CatalogItemKind)}><option value="product">Producto</option><option value="service">Servicio</option></select></label>
          <label className="field"><span>Unidad</span><input value={unit} maxLength={40} required placeholder="pieza, sesión, paquete..." onChange={(event) => setUnit(event.target.value)} /></label>
          <label className="field"><span>SKU / código (opcional)</span><input value={sku} maxLength={40} placeholder="Código interno" onChange={(event) => setSku(event.target.value)} /></label>
          <label className="field"><span>Coste de referencia ({currency})</span><input type="number" min="0" step="0.01" value={referenceCost} onChange={(event) => setReferenceCost(Math.max(0, Number(event.target.value) || 0))} /></label>
          <button className="primary-button compact" type="submit">Añadir al catálogo <span>↗</span></button>
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
              <article className="catalog-row" key={item.id}>
                <div className="catalog-kind">{item.kind === "product" ? "PRODUCTO" : "SERVICIO"}</div>
                <div className="catalog-main"><strong>{item.name}</strong><span>{item.sku ? `SKU ${item.sku} · ` : ""}Por {item.unit}</span></div>
                <div className="catalog-cost"><span>COSTE REFERENCIA</span><strong>{formatMoney(item.referenceCost, item.currency)}</strong></div>
                <button className="outline-button catalog-use-button" onClick={() => onUseInCalculator(item)}>Costear</button>
                <button className="delete-button" aria-label={`Eliminar ${item.name}`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="local-storage-note">Este catálogo se guarda únicamente en este navegador. Todavía no se comparte entre dispositivos ni se sincroniza con la nube.</p>
    </div>
  );
}
