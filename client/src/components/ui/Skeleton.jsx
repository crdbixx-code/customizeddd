export function Skeleton({ className = '' }) {
  return <div className={`bg-white/[0.06] animate-pulse rounded-md ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-panel border border-line rounded-xl2 overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-14 w-14 rounded-full bg-white/5 border border-line-hi flex items-center justify-center mb-4 text-ink-3">
          <Icon size={24} />
        </div>
      )}
      <h3 className="font-display font-semibold text-ink-1 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-ink-3 max-w-sm mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
