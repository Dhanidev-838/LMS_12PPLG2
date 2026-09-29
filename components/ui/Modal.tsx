"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string; // contoh: "max-w-md", "max-w-lg"
  dismissible?: boolean;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-md", dismissible = true }: ModalProps) {
  const isDarkMode = typeof document !== "undefined" && document.documentElement.getAttribute("data-admin-theme") === "dark";

  // kunci scroll body pas modal kebuka
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out] ${isDarkMode ? "bg-[#020b15]/75" : "bg-black/50"}`}
      onClick={dismissible ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl border shadow-lg animate-[fadeUp_0.2s_ease-out] ${
          isDarkMode ? "border-[#2a3343] bg-[#111b2b] text-[#eef2ff]" : "border-[#e1e5ed] bg-white text-[#182033]"
        }`}
      >
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDarkMode ? "border-[#2a3343]" : "border-[#e1e5ed]"}`}>
          <h3 className={`text-sm font-bold ${isDarkMode ? "text-[#f3f6fb]" : "text-[#182033]"}`}>{title}</h3>
          {dismissible && (
            <button
              onClick={onClose}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                isDarkMode ? "text-[#c9d5eb] hover:bg-[#1b2435] hover:text-white" : "text-[#9CA3AF] hover:bg-[#6B85F6]/10 hover:text-[#182033]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  // portal ke body biar gak ke-trap sama overflow/z-index parent
  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}