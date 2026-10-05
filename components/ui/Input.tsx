"use client";

import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  useId,
} from "react";

const baseField =
  "min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const errorDescription = error ? [describedBy, errorId].filter(Boolean).join(" ") : describedBy;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorDescription}
          className={`${baseField} ${error ? "border-danger focus-visible:ring-danger" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const errorDescription = error ? [describedBy, errorId].filter(Boolean).join(" ") : describedBy;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorDescription}
          className={`${baseField} resize-y py-2.5 ${error ? "border-danger focus-visible:ring-danger" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, className = "", children, id, "aria-describedby": describedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const errorDescription = error ? [describedBy, errorId].filter(Boolean).join(" ") : describedBy;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorDescription}
          className={`${baseField} ${error ? "border-danger focus-visible:ring-danger" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
