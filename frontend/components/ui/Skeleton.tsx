
interface SkeletonProps {
  className?: string;
}

// A pulsing placeholder block. Size it with height and width classes.
export default function Skeleton({
  className = "",
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

interface SkeletonRowsProps {
  count: number;
}

// Placeholder rows shaped like the transaction lists.
export function SkeletonRows({ count }: SkeletonRowsProps) {
  return (
    <div className="divide-y divide-border-custom">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 !rounded-xl" />

            <div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          </div>

          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
