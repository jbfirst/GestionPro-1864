import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation avant une action destructive. */
export function Confirm({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  loading,
  onCancel,
  onConfirm,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-4.5" />
        </span>
        <p className="text-sm leading-relaxed text-foreground/85">{message}</p>
      </div>
    </Modal>
  );
}

/** État local d'une confirmation de suppression. */
export function useConfirm<T>() {
  const [target, setTarget] = React.useState<T | null>(null);
  return {
    target,
    open: target !== null,
    ask: (value: T) => setTarget(value),
    close: () => setTarget(null),
  };
}
