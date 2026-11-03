import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createCatalogItem, updateCatalogItem } from "../domain/catalog";
import type { CatalogCurrency, CatalogDraft, CatalogItem, CatalogItemKind } from "../domain/catalog";
import { createSupabaseCatalogRepository } from "../infrastructure/supabase-catalog-repository";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

export function CloudCatalogPage({ businessId, currency, formatMoney, onUseInCalculator }: {
  businessId: string;
  currency: CatalogCurrency;
  formatMoney: (value: number, currency: CatalogCurrency) => string;
  onUseInCalculator: (item: CatalogItem) => void;
}) {
  const repository = useMemo(() => createSupabaseCatalogRepository(getSupabaseClient()), []);
  const requestId = useRef(0);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CatalogItemKind>("product");
  const [unit, setUnit] = useState("pieza");
  const [sku, setSku] = useState("");
  const [referenceCost, setReferenceCost] = useState(0);
  const [draftCurrency, setDraftCurrency] = useState<CatalogCurrency>(currency);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadItems = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setErrorMessage("");
    try {
      const records = await repository.listActive(businessId);
      if (currentRequest !== requestId.current) return;
      setItems(records);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar el catálogo.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [businessId, repository]);

  useEffect(() => {
    void loadItems();
    return () => { requestId.current += 1; };
  }, [loadItems]);

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
    setErrorMessage("");
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    const draft: CatalogDraft = { name, kind, unit, sku, currency: draftCurrency, referenceCost };
    try {
      if (editingId) {
        const validated = updateCatalogItem(editingId, draft, items);
        const updated = await repository.update(businessId, editingId, validated);
        setItems((current) => current.map((item) => item.id === editingId ? updated : item));
        setMessage("Cambios guardados en el catálogo cloud.");
      } else {
        const validated = createCatalogItem(draft, items, crypto.randomUUID());
        const created = await repository.create(businessId, validated);
        setItems((current) => [created, ...current]);
        setMessage("Elemento añadido al catálogo cloud.");
      }
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible guardar el elemento.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveItem(item: CatalogItem) {
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await repository.archive(businessId, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Elemento archivado. No se eliminó del historial del negocio.");
      if (editingId === item.id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible archivar el elemento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="secondary-page catalog-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 06 · NUBE</p>
      <h1>Tu catálogo de productos y servicios.</h1>
      <p className="page-lead">Los elementos se guardan en el negocio seleccionado y se protegen mediante los permisos de sus integrantes.</p>
      <section className="surface-card catalog-form-card">
        <div className="section-heading"><div className="section-number">01</div><div><h2>{editingId ? "Editar elemento" : "Añadir al catálogo"}</h2><p>Usa unidades claras y conserva la moneda correcta de cada registro.</p></div></div>
        <form className="catalog-form" onSubmit={saveItem}>
          <label className="field"><span>Nombre</span><input value={name} maxLength={100} required placeholder="Ej. Jabón artesanal" onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value as CatalogItemKind)}><option value="product">Producto</option><option value="service">Servicio</option></select></label>
          <label className="field"><span>Unidad</span><input value={unit} maxLength={40} required placeholder="pieza, sesión, paquete..." onChange={(event) => setUnit(event.target.value)} /></label>
          <label className="field"><span>SKU / código (opcional)</span><input value={sku} maxLength={40} placeholder="Código interno" onChange={(event) => setSku(event.target.value)} /></label>
          <label className="field"><span>Moneda</span><select value={draftCurrency} onChange={(event) => setDraftCurrency(event.target.value as CatalogCurrency)}><option value="MXN">MXN</option><option value="USD">USD</option></select></label>
          <label className="field"><span>Coste de referencia ({draftCurrency})</span><input type="number" min="0" step="0.01" value={referenceCost} onChange={(event) => setReferenceCost(Math.max(0, Number(event.target.value) || 0))} /></label>
          <div className="catalog-form-actions"><button className="primary-button compact" type="submit" disabled={saving}>{saving ? "Guardando…" : editingId ? "Guardar cambios" : "Añadir al catálogo"} <span>↗</span></button>{editingId && <button className="outline-button" type="button" onClick={resetForm}>Cancelar</button>}</div>
        </form>
        {message && <p className="save-message" role="status">{message}</p>}
        {errorMessage && <p className="error-state" role="alert">{errorMessage}</p>}
      </section>
      <section className="catalog-list-section">
        <div className="section-heading"><div className="section-number">02</div><div><h2>Elementos registrados</h2><p>{items.length} elementos activos en este negocio.</p></div><button className="outline-button" type="button" disabled={loading || saving} onClick={() => void loadItems()}>{loading ? "Actualizando…" : "Actualizar lista"}</button></div>
        {loading ? <p className="local-storage-note">Cargando catálogo…</p> : items.length === 0 ? (
          <div className="empty-state"><span>◇</span><h2>Tu catálogo está listo para comenzar</h2><p>Añade productos o servicios para reutilizar sus referencias al calcular precios.</p></div>
        ) : (
          <div className="catalog-list">
            {items.map((item) => (
              <article className="catalog-row" key={item.id}>
                <div className="catalog-row-symbol">{item.kind === "product" ? "◇" : "◉"}</div>
                <div className="catalog-row-main"><strong>{item.name}</strong><span>{item.kind === "product" ? "Producto" : "Servicio"} · {item.unit}{item.sku ? ` · SKU ${item.sku}` : ""}</span></div>
                <div className="catalog-row-cost"><span>COSTE DE REFERENCIA</span><strong>{formatMoney(item.referenceCost, item.currency)}</strong></div>
                <div className="catalog-row-actions"><button className="outline-button" disabled={saving} onClick={() => onUseInCalculator(item)}>Usar</button><button className="outline-button" disabled={saving} onClick={() => startEditing(item)}>Editar</button><button className="text-button" disabled={saving} onClick={() => void archiveItem(item)}>Archivar</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="local-storage-note">Los registros activos se almacenan en Supabase. Archivar conserva el registro, pero lo retira de la lista de trabajo.</p>
    </div>
  );
}
