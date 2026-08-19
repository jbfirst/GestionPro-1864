import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <span className="field-label">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn("field-input", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn("field-input h-auto min-h-20 py-2 leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn("field-input pr-8 cursor-pointer", className)} {...props}>
        {children}
      </select>
    );
  },
);
