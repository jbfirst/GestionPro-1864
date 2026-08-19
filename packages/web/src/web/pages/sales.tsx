import * as React from "react";
import { Eye, Loader2, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Button } from "../components/ui/button";
import { Confirm, useConfirm } from "../components/ui/confirm";
import { EmptyState, ErrorState, Loading, TableSkeleton } from "../components/ui/data-state";
import { Field, Input, Select, Textarea } from "../components/ui/field";
import { Modal } from "../components/ui/modal";
import {
  errorMessage,
  formatDateTime,
  formatMoney,
  formatNumber,
  todayInputValue,
} from "../lib/format";
import { useCustomerOptions } from "../queries/customers";
import { useProductOptions } from "../queries/products";
import { useCreateSale, useDeleteSale, useSale, useSales } from "../queries/sales";

interface SaleRow {
  id: string;
  reference: string;
  total: number;
}

interface Line {
  key: string;
  productId: string;
  quantity: string;
  unitPrice: string;
}

function newLine(): Line {
  return { key: crypto.randomUUID(), productId: "", quantity: "1", unitPrice: "" };
}

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function Sales() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useSales({
    search: debounced || undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const products = useProductOptions();
  const customers = useCustomerOptions();
  const create = useCreateSale();
  const remove = useDeleteSale();
  const confirm = useConfirm<SaleRow>();

  const [open, setOpen] = React.useState(false);
  const [lines, setLines] = React.useState<Line[]>([newLine()]);
  const [customerId, setCustomerId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [soldAt, setSoldAt] = React.useState(todayInputValue());
  const [formError, setFormError] = React.useState<string>();

  const [detailId, setDetailId] = React.useState<string | null>(null);
  const detail = useSale(detailId);

  const productById = React.useMemo(
    () => new Map((products.data ?? []).map((product) => [product.id, product])),
    [products.data],
  );

  const openCreate = () => {
    setLines([newLine()]);
    setCustomerId("");
    setNote("");
    setSoldAt(todayInputValue());
    setFormError(undefined);
    setOpen(true);
  };

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const total = lines.reduce((sum, line) => {
    const product = productById.get(line.productId);
    if (!product) return sum;
    const unitPrice = line.unitPrice ? toNumber(line.unitPrice) : product.salePrice;
    const quantity = toNumber(line.quantity);
    if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) return sum;
    return sum + unitPrice * quantity;
  }, 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const items = lines
      .filter((line) => line.productId)
      .map((line) => {
        const product = productById.get(line.productId)!;
        const unitPrice = line.unitPrice ? toNumber(line.unitPrice) : product.salePrice;
        return { productId: line.productId, quantity: toNumber(line.quantity), unitPrice };
      });

    if (items.length === 0) {
      setFormError("Ajoutez au moins un produit à la vente.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      setFormError("Chaque ligne doit avoir une quantité supérieure à 0.");
      return;
    }
    if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice <= 0)) {
      setFormError("Chaque ligne doit avoir un prix unitaire supérieur à 0.");
      return;
    }
    setFormError(undefined);

    create.mutate(
      {
        items,
        customerId: customerId || null,
        note: note.trim() || undefined,
        soldAt: soldAt || undefined,
      },
      {
        onSuccess: (sale) => {
          toast.success(`Vente ${sale.reference} enregistrée — ${formatMoney(sale.total)}.`);
          setOpen(false);
        },
        onError: (err) => {
          const message = errorMessage(err);
          setFormError(message);
          toast.error(message);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!confirm.target) return;
    remove.mutate(
      { id: confirm.target.id },
      {
        onSuccess: () => {
          toast.success("Vente annulée, le stock a été rétabli.");
          confirm.close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <AppShell
      title="Ventes"
      subtitle="Enregistrez vos ventes, le stock se met à jour automatiquement"
      actions={
        <Button size="sm" className="h-9" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouvelle vente</span>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Référence, client ou produit…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Field label="Du" className="w-[160px]">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </Field>
        <Field label="Au" className="w-[160px]">
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </Field>
      </div>

      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={5} />
        ) : query.isError ? (
          <ErrorState message="Impossible de charger les ventes." onRetry={() => query.refetch()} />
        ) : query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Produits</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-right">Bénéfice</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="num font-semibold">{row.reference}</p>
                      <p className="text-[12.5px] whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.soldAt)}
                      </p>
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate">{row.summary ?? "—"}</p>
                      <p className="num text-[12.5px] text-muted-foreground">
                        {formatNumber(row.itemCount)} article(s)
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.customerName ?? "Client de passage"}
                    </td>
                    <td className="num px-4 py-3 text-right text-success">
                      {formatMoney(row.profit)}
                    </td>
                    <td className="num px-4 py-3 text-right font-semibold">
                      {formatMoney(row.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Voir la vente ${row.reference}`}
                          onClick={() => setDetailId(row.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Annuler la vente ${row.reference}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => confirm.ask(row)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingCart className="size-5" />}
            title={debounced || from || to ? "Aucun résultat" : "Aucune vente"}
            description={
              debounced || from || to
                ? "Modifiez vos filtres pour voir plus de ventes."
                : "Enregistrez votre première vente pour suivre votre chiffre d'affaires."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Nouvelle vente
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle vente"
        description="Le stock est décrémenté automatiquement à l'enregistrement."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer la vente
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {products.data && products.data.length === 0 && (
            <p className="rounded-lg bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
              Ajoutez d'abord des produits au catalogue pour pouvoir vendre.
            </p>
          )}

          <div className="space-y-3">
            {lines.map((line, index) => {
              const product = productById.get(line.productId);
              return (
                <div
                  key={line.key}
                  className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_92px_120px_auto] sm:items-end"
                >
                  <Field label={index === 0 ? "Produit" : undefined}>
                    <Select
                      value={line.productId}
                      onChange={(event) => {
                        const nextProduct = productById.get(event.target.value);
                        updateLine(line.key, {
                          productId: event.target.value,
                          unitPrice: nextProduct ? String(nextProduct.salePrice) : "",
                        });
                      }}
                    >
                      <option value="">Choisir un produit…</option>
                      {products.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {formatNumber(item.stock)} en stock
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={index === 0 ? "Qté" : undefined}>
                    <Input
                      inputMode="decimal"
                      value={line.quantity}
                      onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                    />
                  </Field>
                  <Field label={index === 0 ? "Prix unitaire" : undefined}>
                    <Input
                      inputMode="decimal"
                      placeholder={product ? String(product.salePrice) : "0"}
                      value={line.unitPrice}
                      onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer la ligne"
                    disabled={lines.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, newLine()])}
          >
            <Plus className="size-4" />
            Ajouter un produit
          </Button>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client">
              <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">Client de passage</option>
                {customers.data?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date de la vente">
              <Input type="date" value={soldAt} onChange={(event) => setSoldAt(event.target.value)} />
            </Field>
            <Field label="Note" className="sm:col-span-2">
              <Textarea
                placeholder="Facultatif — mode de paiement, remarque…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>

          {formError && <p className="field-error">{formError}</p>}

          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="text-[13.5px] font-medium text-muted-foreground">Total</span>
            <span className="num font-display text-[20px] font-bold">{formatMoney(total)}</span>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={detail.data ? `Vente ${detail.data.reference}` : "Détail de la vente"}
        description={detail.data ? formatDateTime(detail.data.soldAt) : undefined}
      >
        {detail.isLoading ? (
          <Loading />
        ) : detail.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13.5px]">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{detail.data.customerName ?? "Client de passage"}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Bénéfice brut</p>
                <p className="num font-medium text-success">{formatMoney(detail.data.profit)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="table-head">
                    <th className="px-3 py-2.5 text-left">Produit</th>
                    <th className="px-3 py-2.5 text-right">Qté</th>
                    <th className="px-3 py-2.5 text-right">PU</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detail.data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5">{item.productName}</td>
                      <td className="num px-3 py-2.5 text-right">{formatNumber(item.quantity)}</td>
                      <td className="num px-3 py-2.5 text-right">{formatMoney(item.unitPrice)}</td>
                      <td className="num px-3 py-2.5 text-right font-semibold">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {detail.data.note && (
              <p className="rounded-lg bg-muted px-3 py-2.5 text-[13px] text-muted-foreground">
                {detail.data.note}
              </p>
            )}

            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-[13.5px] font-medium text-muted-foreground">Total encaissé</span>
              <span className="num font-display text-[20px] font-bold">
                {formatMoney(detail.data.total)}
              </span>
            </div>
          </div>
        ) : (
          <ErrorState message="Vente introuvable." />
        )}
      </Modal>

      <Confirm
        open={confirm.open}
        title="Annuler la vente"
        message={`Voulez-vous vraiment annuler la vente ${confirm.target?.reference} (${formatMoney(confirm.target?.total)}) ? Les quantités vendues seront remises en stock.`}
        confirmLabel="Annuler la vente"
        loading={remove.isPending}
        onCancel={confirm.close}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default Sales;
