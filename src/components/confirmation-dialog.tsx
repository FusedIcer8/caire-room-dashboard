"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

interface ConfirmationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly confirmVariant: "danger" | "warning";
  readonly onConfirm: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
}: ConfirmationDialogProps) {
  const confirmClass =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-500"
      : "bg-amber-600 hover:bg-amber-500";

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#2a2a3a] bg-[#12121a] p-6 text-white shadow-2xl">
          <AlertDialog.Title className="mb-2 text-lg font-bold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-6 text-sm text-gray-400">
            {description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-3">
            <AlertDialog.Cancel className="rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a3a]">
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${confirmClass}`}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
