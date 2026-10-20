"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Keep", onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} className="max-w-sm p-5" labelledBy="confirm-dialog-title">
      <div>
        <h2 id="confirm-dialog-title" className="text-base font-extrabold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="secondary-button" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="rounded-md bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
