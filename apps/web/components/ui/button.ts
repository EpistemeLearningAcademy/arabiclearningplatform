type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary:
    "border border-line bg-white text-ink hover:border-brand hover:text-brand",
  ghost: "text-brand hover:bg-brand-tint",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 py-2.5 text-sm",
  sm: "min-h-9 px-3 py-1.5 text-xs",
};

/** Use with <Link> or <button>: className={buttonClasses("primary")} */
export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return [base, variants[variant], sizes[size]].join(" ");
}