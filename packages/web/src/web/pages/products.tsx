import * as React from "react";
import { Boxes, Loader2, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Confirm, useConfirm } from "../components/ui/confirm";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/data-state";
import { Field, Input, Select, Textarea } from "../components/ui/field";
import { Modal } from "../components/ui/modal";
import { errorMessage, formatMoney, formatNumber } from "../lib/format";
import { useCategories } from "../queries/categories";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useRestockProduct,
  useUpdateProduct,
} from "../queries/products";

interface Row {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
}

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  categoryId: "",
  purchasePrice: "",
  salePrice: "",
  stock: "0",
  minStock: "5",
};

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function Products() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [lowStockOnly, setLowStockOnly] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useProducts({
    search: debounced || undefined,
    categoryId: categoryId || undefined,
    lowStockOnly: lowStockOnly || undefined,
  });
  const categories = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const restock = useRestockProduct();
  const remove = useDeleteProduct();
  const confirm = useConfirm<Row>();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const [restockTarget, setRestockTarget] = React.useState<Row | null>(null);
  const [restockQty, setRestockQty] = React.useState("");
  const [restockError, setRestockError] = React.useState<string>();

  const set =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description ?? "",
      categoryId: row.categoryId ?? "",
      purchasePrice: String(row.purchasePrice),
      salePrice: String(row.salePrice),
      stock: String(row.stock),
      minStock: String(row.minStock),
    });
    setErrors({});
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    const purchasePrice = toNumber(form.purchasePrice || "0");
    const salePrice = toNumber(form.salePrice);
    const stock = toNumber(form.stock || "0");
    const minStock = toNumber(form.minStock || "0");

    if (form.name.trim().length < 2) next.name = "Le nom du produit est trop court.";
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
      next.purchasePrice = "Prix d'achat invalide.";
    if (!Number.isFinite(salePrice) || salePrice <= 0)
      next.salePrice = "Le prix de vente doit être supérieur à 0.";
    if (!Number.isFinite(stock) || stock < 0) next.stock = "Quantité invalide.";
    if (!Number.isFinite(minStock) || minStock < 0) next.minStock = "Seuil invalide.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId || null,
      purchasePrice,
      salePrice,
      stock,
      minStock,
    };

    const options = {
      onSuccess: () => {
        toast.success(editing ? "Produit modifié." : "Produit ajouté.");
        setOpen(false);
      },
      onError: (err: unknown) => toast.error(errorMessage(err)),
    };

    if (editing) update.mutate({ id: editing.id, ...payload }, options);
    else create.mutate(payload, options);
  };

  const submitRestock = (event: React.FormEvent) => {
    event.preventDefault();
    if (!restockTarget) return;
    const quantity = toNumber(restockQty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setRestockError("La quantité doit être supérieure à 0.");
      return;
    }
    setRestockError(undefined);
    restock.mutate(
      { id: restockTarget.id, quantity },
      {
        onSuccess: () => {
          toast.success(`Stock mis à jour pour « ${restockTarget.name} ».`);
          setRestockTarget(null);
          setRestockQty("");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const confirmDelete = () => {
    if (!confirm.target) return;
    remove.mutate(
      { id: confirm.target.id },
      {
        onSuccess: () => {
          toast.success("Produit supprimé.");
          confirm.close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const saving = create.isPending || update.isPending;
  const margin = (() => {
    const purchase = toNumber(form.purchasePrice || "0");
    const sale = toNumber(form.salePrice || "0");
    if (!Number.isFinite(purchase) || !Number.isFinite(sale) || sale <= 0) return null;
    return sale - purchase;
  })();

  return (
    <AppShell
      title="Produits"
      subtitle="Catalogue, prix et niveaux de stock"
      actions={
        <Button size="sm" className="h-9" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouveau produit</span>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          className="w-auto min-w-[170px]"
          aria-label="Filtrer par catégorie"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-[13.5px]">
          <input
            type="checkbox"
            aria-label="Stock faible uniquement"
            className="size-4 accent-[var(--warning)]"
            checked={lowStockOnly}
            onChange={(event) => setLowStockOnly(event.target.checked)}
          />
          Stock faible uniquement
        </label>
      </div>

      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={6} />
        ) : query.isError ? (
          <ErrorState message="Impossible de charger les produits." onRetry={() => query.refetch()} />
        ) : query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-right">Prix d'achat</th>
                  <th className="px-4 py-3 text-right">Prix de vente</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((row) => {
                  const low = row.stock <= row.minStock;
                  return (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.name}</p>
                        {row.description && (
                          <p className="max-w-xs truncate text-[12.5px] text-muted-foreground">
                            {row.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.categoryName ?? "—"}
                      </td>
                      <td className="num px-4 py-3 text-right text-muted-foreground">
                        {formatMoney(row.purchasePrice)}
                      </td>
                      <td className="num px-4 py-3 text-right font-semibold">
                        {formatMoney(row.salePrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge tone={row.stock <= 0 ? "danger" : low ? "warning" : "success"}>
                          {formatNumber(row.stock)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Réapprovisionner ${row.name}`}
                            title="Réapprovisionner"
                            onClick={() => {
                              setRestockTarget(row);
                              setRestockQty("");
                              setRestockError(undefined);
                            }}
                          >
                            <PackagePlus className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Modifier ${row.name}`}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Supprimer ${row.name}`}
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => confirm.ask(row)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Boxes className="size-5" />}
            title={debounced || categoryId || lowStockOnly ? "Aucun résultat" : "Aucun produit"}
            description={
              debounced || categoryId || lowStockOnly
                ? "Modifiez vos filtres pour voir plus de produits."
                : "Ajoutez votre premier produit pour commencer à vendre."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Nouveau produit
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier le produit" : "Nouveau produit"}
        description="Les montants sont en francs CFA."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nom du produit" error={errors.name} required className="sm:col-span-2">
            <Input placeholder="Ex. Sucre 1kg" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Catégorie" className="sm:col-span-2">
            <Select value={form.categoryId} onChange={set("categoryId")}>
              <option value="">Sans catégorie</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prix d'achat (FCFA)" error={errors.purchasePrice} required>
            <Input
              inputMode="decimal"
              placeholder="0"
              value={form.purchasePrice}
              onChange={set("purchasePrice")}
            />
          </Field>
          <Field
            label="Prix de vente (FCFA)"
            error={errors.salePrice}
            hint={margin !== null ? `Marge unitaire : ${formatMoney(margin)}` : undefined}
            required
          >
            <Input
              inputMode="decimal"
              placeholder="0"
              value={form.salePrice}
              onChange={set("salePrice")}
            />
          </Field>
          <Field label="Quantité en stock" error={errors.stock} required>
            <Input inputMode="decimal" value={form.stock} onChange={set("stock")} />
          </Field>
          <Field
            label="Stock minimum"
            error={errors.minStock}
            hint="Seuil déclenchant l'alerte."
            required
          >
            <Input inputMode="decimal" value={form.minStock} onChange={set("minStock")} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              placeholder="Détails, format, marque…"
              value={form.description}
              onChange={set("description")}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={restockTarget !== null}
        onClose={() => setRestockTarget(null)}
        title="Réapprovisionner"
        description={restockTarget ? `${restockTarget.name} — stock actuel : ${formatNumber(restockTarget.stock)}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRestockTarget(null)} disabled={restock.isPending}>
              Annuler
            </Button>
            <Button onClick={submitRestock} disabled={restock.isPending}>
              {restock.isPending && <Loader2 className="size-4 animate-spin" />}
              Ajouter au stock
            </Button>
          </>
        }
      >
        <form onSubmit={submitRestock} noValidate>
          <Field label="Quantité reçue" error={restockError} required>
            <Input
              inputMode="decimal"
              placeholder="Ex. 20"
              value={restockQty}
              onChange={(event) => setRestockQty(event.target.value)}
            />
          </Field>
        </form>
      </Modal>

      <Confirm
        open={confirm.open}
        title="Supprimer le produit"
        message={`Voulez-vous vraiment supprimer « ${confirm.target?.name} » ? Cette action est irréversible.`}
        loading={remove.isPending}
        onCancel={confirm.close}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default Products;
