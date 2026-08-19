import * as React from "react";
import { Loader2, Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Confirm, useConfirm } from "../components/ui/confirm";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/data-state";
import { Field, Input, Select } from "../components/ui/field";
import { Modal } from "../components/ui/modal";
import {
  dateInputValue,
  errorMessage,
  formatDate,
  formatMoney,
  todayInputValue,
} from "../lib/format";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenses,
  useUpdateExpense,
} from "../queries/expenses";

interface Row {
  id: string;
  description: string;
  category: string;
  amount: number;
  spentAt: Date | string;
}

interface FormState {
  description: string;
  category: string;
  amount: string;
  spentAt: string;
}

function Expenses() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [category, setCategory] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useExpenses({ search: debounced || undefined, category: category || undefined });
  const categories = useExpenseCategories();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const remove = useDeleteExpense();
  const confirm = useConfirm<Row>();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [form, setForm] = React.useState<FormState>({
    description: "",
    category: "",
    amount: "",
    spentAt: todayInputValue(),
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const set =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const total = (query.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  const openCreate = () => {
    setEditing(null);
    setForm({
      description: "",
      category: categories.data?.[0] ?? "",
      amount: "",
      spentAt: todayInputValue(),
    });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({
      description: row.description,
      category: row.category,
      amount: String(row.amount),
      spentAt: dateInputValue(row.spentAt),
    });
    setErrors({});
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    const amount = Number(form.amount.replace(",", "."));
    if (form.description.trim().length < 2) next.description = "La description est trop courte.";
    if (form.category.trim().length < 2) next.category = "Choisissez une catégorie.";
    if (!Number.isFinite(amount) || amount <= 0) next.amount = "Le montant doit être supérieur à 0.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      description: form.description.trim(),
      category: form.category,
      amount,
      spentAt: form.spentAt || undefined,
    };

    const options = {
      onSuccess: () => {
        toast.success(editing ? "Dépense modifiée." : "Dépense enregistrée.");
        setOpen(false);
      },
      onError: (err: unknown) => toast.error(errorMessage(err)),
    };

    if (editing) update.mutate({ id: editing.id, ...payload }, options);
    else create.mutate(payload, options);
  };

  const confirmDelete = () => {
    if (!confirm.target) return;
    remove.mutate(
      { id: confirm.target.id },
      {
        onSuccess: () => {
          toast.success("Dépense supprimée.");
          confirm.close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const saving = create.isPending || update.isPending;

  return (
    <AppShell
      title="Dépenses"
      subtitle="Suivez vos charges pour connaître votre bénéfice net"
      actions={
        <Button size="sm" className="h-9" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouvelle dépense</span>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher une dépense…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          className="w-auto min-w-[170px]"
          aria-label="Filtrer par catégorie"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.data?.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <div className="ml-auto rounded-lg border border-border bg-card px-4 py-2.5 text-[13.5px]">
          Total affiché : <span className="num font-semibold">{formatMoney(total)}</span>
        </div>
      </div>

      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={4} />
        ) : query.isError ? (
          <ErrorState message="Impossible de charger les dépenses." onRetry={() => query.refetch()} />
        ) : query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(row.spentAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.description}</td>
                    <td className="px-4 py-3">
                      <Badge>{row.category}</Badge>
                    </td>
                    <td className="num px-4 py-3 text-right font-semibold text-warning">
                      -{formatMoney(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Modifier la dépense"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Supprimer la dépense"
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
            icon={<Receipt className="size-5" />}
            title={debounced || category ? "Aucun résultat" : "Aucune dépense"}
            description={
              debounced || category
                ? "Modifiez vos filtres pour voir plus de dépenses."
                : "Enregistrez vos charges (loyer, transport, électricité…) pour calculer le bénéfice net."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Nouvelle dépense
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la dépense" : "Nouvelle dépense"}
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
          <Field label="Description" error={errors.description} required className="sm:col-span-2">
            <Input
              placeholder="Ex. Loyer du mois d'août"
              value={form.description}
              onChange={set("description")}
            />
          </Field>
          <Field label="Catégorie" error={errors.category} required>
            <Select value={form.category} onChange={set("category")}>
              <option value="">Choisir…</option>
              {categories.data?.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Montant (FCFA)" error={errors.amount} required>
            <Input inputMode="decimal" placeholder="0" value={form.amount} onChange={set("amount")} />
          </Field>
          <Field label="Date" className="sm:col-span-2">
            <Input type="date" value={form.spentAt} onChange={set("spentAt")} />
          </Field>
        </form>
      </Modal>

      <Confirm
        open={confirm.open}
        title="Supprimer la dépense"
        message={`Voulez-vous vraiment supprimer « ${confirm.target?.description} » ?`}
        loading={remove.isPending}
        onCancel={confirm.close}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default Expenses;
