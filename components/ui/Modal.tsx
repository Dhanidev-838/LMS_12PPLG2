"use client";

import { ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  dismissible?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  dismissible = true,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissible) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={dismissible ? onClose : undefined}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-xl border border-border bg-surface text-foreground shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              aria-label="Tutup dialog"
              title="Tutup"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}
