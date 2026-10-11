
interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
}

export default function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  error,
}: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-primary"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 ${
          error
            ? "border-accent focus:border-accent focus:ring-accent/20"
            : "border-border-custom focus:border-secondary focus:ring-secondary/20"
        }`}
      />

      {(error || hint) && (
        <p
          id={`${id}-note`}
          className={`mt-2 text-xs ${
            error ? "text-accent" : "text-muted"
          }`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
