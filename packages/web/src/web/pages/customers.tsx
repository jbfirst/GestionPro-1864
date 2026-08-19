import * as React from "react";
import { Loader2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Button } from "../components/ui/button";
import { Confirm, useConfirm } from "../components/ui/confirm";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/data-state";
import { Field, Input } from "../components/ui/field";
import { Modal } from "../components/ui/modal";
import { errorMessage, formatMoney, formatNumber } from "../lib/format";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../queries/customers";

interface Row {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  purchaseCount: number;
  totalSpent: number;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const emptyForm: FormState = { name: "", phone: "", email: "", address: "" };

function Customers() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useCustomers(debounced || undefined);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const remove = useDeleteCustomer();
  const confirm = useConfirm<Row>();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Partial<FormState>>({});

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
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
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
    });
    setErrors({});
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<FormState> = {};
    if (form.name.trim().length < 2) next.name = "Le nom du client est trop court.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Adresse email invalide.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    const options = {
      onSuccess: () => {
        toast.success(editing ? "Client modifié." : "Client ajouté.");
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
          toast.success("Client supprimé.");
          confirm.close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const saving = create.isPending || update.isPending;

  return (
    <AppShell
      title="Clients"
      subtitle="Votre fichier client et son historique d'achats"
      actions={
        <Button size="sm" className="h-9" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouveau client</span>
        </Button>
      }
    >
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher un client…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={5} />
        ) : query.isError ? (
          <ErrorState message="Impossible de charger les clients." onRetry={() => query.refetch()} />
        ) : query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-right">Achats</th>
                  <th className="px-4 py-3 text-right">Total dépensé</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.name}</p>
                      {row.address && (
                        <p className="text-[12.5px] text-muted-foreground">{row.address}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{row.phone ?? "—"}</p>
                      {row.email && <p className="text-[12.5px]">{row.email}</p>}
                    </td>
                    <td className="num px-4 py-3 text-right">{formatNumber(row.purchaseCount)}</td>
                    <td className="num px-4 py-3 text-right font-semibold">
                      {formatMoney(row.totalSpent)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Users className="size-5" />}
            title={debounced ? "Aucun résultat" : "Aucun client"}
            description={
              debounced
                ? "Essayez avec un autre nom ou numéro."
                : "Ajoutez vos clients réguliers pour suivre leurs achats."
            }
            action={
              !debounced ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Nouveau client
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier le client" : "Nouveau client"}
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
          <Field label="Nom" error={errors.name} required className="sm:col-span-2">
            <Input placeholder="Ex. Kodjo Mensah" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Téléphone">
            <Input placeholder="+228 90 00 00 00" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              placeholder="client@exemple.com"
              value={form.email}
              onChange={set("email")}
            />
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            <Input placeholder="Quartier, ville" value={form.address} onChange={set("address")} />
          </Field>
        </form>
      </Modal>

      <Confirm
        open={confirm.open}
        title="Supprimer le client"
        message={`Voulez-vous vraiment supprimer « ${confirm.target?.name} » ? Son historique de ventes restera enregistré sans nom de client.`}
        loading={remove.isPending}
        onCancel={confirm.close}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default Customers;
