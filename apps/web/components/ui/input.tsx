import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

type FieldProps = { label: string; hint?: string; error?: string };

type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function controlClass(error?: string) {
  return [
    "mt-2 min-h-12 w-full rounded-md border bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-brand disabled:opacity-60",
    error ? "border-red-400" : "border-line",
  ].join(" ");
}

function FieldFrame({
  label,
  hint,
  error,
  id,
  children,
}: FieldProps & { id?: string; children: (control: ControlProps) => ReactNode }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const note = error ?? hint;
  const noteId = `${controlId}-note`;

  return (
    <div>
      <label htmlFor={controlId} className="text-sm font-semibold text-ink-soft">
        {label}
      </label>
      {children({
        id: controlId,
        "aria-describedby": note ? noteId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {note && (
        <p
          id={noteId}
          role={error ? "alert" : undefined}
          className={`mt-1.5 text-xs ${error ? "text-red-700" : "text-muted"}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldFrame label={label} hint={hint} error={error} id={id}>
      {(control) => (
        <input {...props} {...control} className={`${controlClass(error)} ${className}`} />
      )}
    </FieldFrame>
  );
}

export function Select({
  label,
  hint,
  error,
  id,
  className = "",
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldFrame label={label} hint={hint} error={error} id={id}>
      {(control) => (
        <select {...props} {...control} className={`${controlClass(error)} ${className}`}>
          {children}
        </select>
      )}
    </FieldFrame>
  );
}