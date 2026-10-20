"use client";

import { useEffect } from "react";

export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-extrabold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="secondary-button" onClick={onCancel}>Keep</button>
          <button type="button" className="rounded-md bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
