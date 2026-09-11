export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-ink-foreground/70">
      <div className="h-[3px] barra-tricolore" />
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-display font-semibold text-primary-foreground">
            FS
          </span>
          <span className="font-display text-lg font-semibold uppercase tracking-wide text-ink-foreground">
            Fighting Spirit
          </span>
        </div>
        <p className="text-[12px]">
          © 2026 Fighting Spirit · Portale iscrizione atleti, calendario gare e classifiche
        </p>
      </div>
    </footer>
  );
}
