import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/auth";

const VOCI = [
  { to: "/calendario", label: "Calendario" },
  { to: "/classifiche", label: "Classifiche" },
  { to: "/atleti", label: "Le mie iscrizioni" },
  { to: "/titoli", label: "Titoli" },
  { to: "/news", label: "News" },
  { to: "/documenti", label: "Documenti" },
] as const;

export function SiteHeader() {
  const { session } = useSession();
  const [aperto, setAperto] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-ink-foreground/90">
        <div className="mx-auto flex h-9 max-w-[1200px] items-center justify-between px-5 text-[11px] uppercase tracking-[0.14em]">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-oro" />
            Stagione 2026/27 · Kickboxing · Muay Thai
          </span>
          <span className="hidden sm:flex items-center gap-5">
            <Link to="/documenti" className="transition-opacity hover:opacity-70">
              Documenti
            </Link>
            <Link to="/news" className="transition-opacity hover:opacity-70">
              News
            </Link>
          </span>
        </div>
      </div>
      <div className="h-[3px] barra-tricolore" />
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[10px] bg-primary font-display text-lg leading-none font-semibold text-primary-foreground">
              FS
            </span>
            <span className="font-display text-xl font-semibold uppercase tracking-wide">
              Fighting <span className="font-normal text-muted-foreground">Spirit</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-medium md:flex">
            {VOCI.map((v) => (
              <Link
                key={v.to}
                to={v.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-primary border-b-2 border-primary pb-1" }}
              >
                {v.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={session ? "/area" : "/auth"}
              className="rounded-[10px] bg-ink px-4 py-2 text-[13px] font-semibold text-ink-foreground transition-colors hover:bg-ink/90"
            >
              {session ? "La mia area" : "Area società"}
            </Link>
            <button
              type="button"
              aria-label="Apri menu"
              onClick={() => setAperto((v) => !v)}
              className="rounded-[10px] border border-border p-2 md:hidden"
            >
              {aperto ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {aperto && (
          <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden">
            {VOCI.map((v) => (
              <Link
                key={v.to}
                to={v.to}
                onClick={() => setAperto(false)}
                className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-primary font-medium" }}
              >
                {v.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
