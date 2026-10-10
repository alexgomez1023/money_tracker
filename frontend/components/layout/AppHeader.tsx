
import Icon from "@/components/ui/Icon";

export default function AppHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">
          Your financial overview
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
          Dashboard
        </h1>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-custom bg-surface-blue text-primary">
        <Icon name="user" size={21} />
      </div>
    </header>
  );
}
