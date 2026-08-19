import * as React from "react";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/app-shell";
import { Panel } from "../components/panel";
import { Button } from "../components/ui/button";
import { Confirm, useConfirm } from "../components/ui/confirm";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/data-state";
import { Field, Input } from "../components/ui/field";
import { Modal } from "../components/ui/modal";
import { errorMessage, formatNumber } from "../lib/format";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../queries/categories";

interface Row {
  id: string;
  name: string;
  productCount: number;
}

function Categories() {
  const query = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const confirm = useConfirm<Row>();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string>();

  const openCreate = () => {
    setEditing(null);
    setName("");
    setError(undefined);
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setName(row.name);
    setError(undefined);
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Le nom de la catégorie est trop court.");
      return;
    }
    setError(undefined);

    const options = {
      onSuccess: () => {
        toast.success(editing ? "Catégorie modifiée." : "Catégorie ajoutée.");
        setOpen(false);
      },
      onError: (err: unknown) => toast.error(errorMessage(err)),
    };

    if (editing) update.mutate({ id: editing.id, name: name.trim() }, options);
    else create.mutate({ name: name.trim() }, options);
  };

  const confirmDelete = () => {
    if (!confirm.target) return;
    remove.mutate(
      { id: confirm.target.id },
      {
        onSuccess: () => {
          toast.success("Catégorie supprimée.");
          confirm.close();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const saving = create.isPending || update.isPending;

  return (
    <AppShell
      title="Catégories"
      subtitle="Organisez votre catalogue de produits"
      actions={
        <Button size="sm" className="h-9" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouvelle catégorie</span>
        </Button>
      }
    >
      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={3} />
        ) : query.isError ? (
          <ErrorState message="Impossible de charger les catégories." onRetry={() => query.refetch()} />
        ) : query.data && query.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="table-head">
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-right">Produits</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="num px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(row.productCount)}
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
            icon={<Tags className="size-5" />}
            title="Aucune catégorie"
            description="Créez des catégories pour retrouver vos produits plus vite."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Nouvelle catégorie
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        size="sm"
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
        <form onSubmit={submit} noValidate>
          <Field label="Nom de la catégorie" error={error} required>
            <Input
              placeholder="Ex. Boissons"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        </form>
      </Modal>

      <Confirm
        open={confirm.open}
        title="Supprimer la catégorie"
        message={`Voulez-vous vraiment supprimer « ${confirm.target?.name} » ? Les produits associés ne seront pas supprimés, ils perdront simplement leur catégorie.`}
        loading={remove.isPending}
        onCancel={confirm.close}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

export default Categories;
