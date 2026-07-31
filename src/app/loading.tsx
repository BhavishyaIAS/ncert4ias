export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        Loading…
      </div>
    </div>
  );
}
