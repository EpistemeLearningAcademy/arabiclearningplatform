const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
} as const;

export function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-sand font-bold text-brand ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}