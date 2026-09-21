"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const focusRing = "focus:border-[#6B85F6] focus:ring-2 focus:ring-[#6B85F6]/20";
const baseField = `w-full rounded-lg border border-[#D1D5DB] px-3.5 py-2.5 text-sm outline-none transition-shadow ${focusRing}`;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[#374151]">{label}</label>}
      <input ref={ref} className={`${baseField} ${error ? "border-red-400" : ""} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[#374151]">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={`${baseField} resize-none ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, className = "", children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-semibold text-[#374151]">{label}</label>}
      <select ref={ref} className={`${baseField} bg-white ${error ? "border-red-400" : ""} ${className}`} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";