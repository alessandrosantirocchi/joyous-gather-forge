import type { ReactNode } from "react";

export function SezioneTitolo({
  titolo,
  azione,
}: {
  titolo: string;
  azione?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">{titolo}</h2>
      {azione}
    </div>
  );
}

export function Pannello({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-card ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Etichetta({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
      {children}
    </span>
  );
}

export function Vuoto({ testo }: { testo: string }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{testo}</p>;
}
