"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3_000,
        style: {
          background: "#ffffff",
          color: "#17233e",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          fontSize: "13px",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
        },
        success: { iconTheme: { primary: "#0f9d7a", secondary: "#ffffff" } },
        error: { iconTheme: { primary: "#e11d48", secondary: "#ffffff" } },
      }}
    />
  );
}
