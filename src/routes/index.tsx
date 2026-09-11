import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAtleti,
  fetchConteggiIscritti,
  fetchEventi,
  type Evento,
} from "@/lib/queries";
import { contoAllaRovescia, formatDataBreve, iniziali, DISCIPLINE } from "@/lib/format";
import { SezioneTitolo, Pannello, Etichetta } from "@/components/ui-blocchi";
import { FiltriDisciplina, TabellaEventi } from "@/components/tabella-eventi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fighting Spirit — Iscrizioni, calendario gare e classifiche" },
      {
        name: "description",
        content:
          "Il portale delle società: iscrivi i tuoi atleti agli eventi, consulta il calendario gare, le classifiche ufficiali e gli incontri titolati.",
      },
      { property: "og:title", content: "Fighting Spirit — Portale iscrizione atleti" },
      {
        property: "og:description",
        content:
          "Calendario gare, iscrizioni online delle società e classifiche degli sport da combattimento.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [filtro, setFiltro] = useState("Tutti");
  const { data: eventi = [] } = useQuery({ queryKey: ["eventi"], queryFn: fetchEventi });
  const { data: atleti = [] } = useQuery({ queryKey: ["atleti"], queryFn: fetchAtleti });
  const { data: iscritti = {} } = useQuery({
    queryKey: ["conteggi-iscritti"],
    queryFn: fetchConteggiIscritti,
  });

  const oggi = new Date().toISOString().slice(0, 10);
  const prossimi = eventi.filter((e) => e.data_evento >= oggi).slice(0, 3);
  const podio = atleti.filter((a) => a.disciplina === "Contatto Pieno").slice(0, 3);
  const ordinePodio = [podio[1], podio[0], podio[2]].filter(Boolean);
  const filtrati =
    filtro === "Tutti" ? eventi.slice(0, 6) : eventi.filter((e) => e.disciplina === filtro);

  return (
    <div className="mx-auto max-w-[1200px] px-5">
      <section className="grid items-stretch gap-8 py-10 lg:grid-cols-12 lg:py-14">
        <div className="flex flex-col justify-between lg:col-span-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Tabellone federale
          </div>
          <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-semibold uppercase leading-none sm:text-5xl">
            Il peso che conta, il nome sul ring
          </h1>
          <p className="mt-4 max-w-[42ch] text-pretty text-sm text-muted-foreground sm:text-base">
            Iscrivi gli atleti della tua società, segui il calendario gare e tieni d'occhio le
            classifiche ufficiali della federazione.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/calendario"
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span aria-hidden="true">→</span>
              Apri calendario
            </Link>
            <Link
              to="/classifiche"
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium ring-1 ring-foreground/20 transition-colors hover:ring-foreground/40"
            >
              Classifiche
            </Link>
          </div>
        </div>

        <Pannello className="flex flex-col p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              Top 3 · Contatto Pieno
            </h2>
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Punti W-L-D
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {ordinePodio.map((a) => {
              const posizione = podio.indexOf(a) + 1;
              const primo = posizione === 1;
              return (
                <div
                  key={a.id}
                  className={
                    primo
                      ? "flex items-center gap-3 rounded-xl bg-oro/10 px-3 py-3 ring-1 ring-oro/30"
                      : "flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-3 transition-colors hover:bg-muted"
                  }
                >
                  <span
                    className={`w-6 text-center font-display text-lg font-semibold ${primo ? "text-oro" : "text-muted-foreground"}`}
                  >
                    {posizione}
                  </span>
                  <span
                    className={`grid size-9 place-items-center rounded-full font-display text-sm font-semibold ${primo ? "bg-oro text-ink-foreground" : "bg-background ring-1 ring-border"}`}
                  >
                    {iniziali(a.nome, a.cognome)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.nome} {a.cognome}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {a.nome_societa} · <span className="font-mono">{a.peso_kg ?? "—"} kg</span>
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-display text-lg font-semibold leading-none">{a.punti}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {a.vittorie}-{a.sconfitte}-{a.pareggi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/classifiche"
            className="mt-4 text-[13px] font-medium text-primary transition-colors hover:opacity-80"
          >
            Vedi classifica completa →
          </Link>
        </Pannello>
      </section>

      <section className="py-8">
        <SezioneTitolo
          titolo="Prossimi eventi"
          azione={
            <Link to="/calendario" className="text-[13px] font-medium text-primary">
              Tutti gli eventi →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prossimi.map((e) => (
            <CardEvento key={e.id} evento={e} iscritti={iscritti[e.id] ?? 0} />
          ))}
        </div>
      </section>

      <section className="py-8 pb-16">
        <SezioneTitolo
          titolo="Calendario eventi"
          azione={<FiltriDisciplina valore={filtro} onChange={setFiltro} opzioni={DISCIPLINE} />}
        />
        <TabellaEventi eventi={filtrati} iscritti={iscritti} />
      </section>
    </div>
  );
}

function CardEvento({ evento, iscritti }: { evento: Evento; iscritti: number }) {
  const countdown = contoAllaRovescia(evento.fine_iscrizioni);
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-black/5 transition-colors hover:ring-primary/30">
      <div className="flex items-center justify-between">
        <Etichetta>{evento.disciplina}</Etichetta>
        <span className="font-mono text-[11px] text-muted-foreground">{iscritti} iscritti</span>
      </div>
      <div>
        <p className="font-display text-xl font-semibold uppercase leading-tight">{evento.nome}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {evento.sede ? `${evento.sede} · ` : ""}
          {evento.luogo}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        {countdown ? (
          <span className="flex gap-2 text-[12px]">
            <span className="font-mono">
              {countdown.giorni} <span className="text-muted-foreground">Gi</span>
            </span>
            <span className="font-mono">
              {countdown.ore} <span className="text-muted-foreground">Ore</span>
            </span>
            <span className="font-mono">
              {countdown.minuti} <span className="text-muted-foreground">Min</span>
            </span>
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            Iscrizioni chiuse il {formatDataBreve(evento.fine_iscrizioni)}
          </span>
        )}
        {countdown && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Chiude tra
          </span>
        )}
      </div>
      <Link
        to="/eventi/$id"
        params={{ id: evento.id }}
        className="inline-flex items-center justify-center rounded-[10px] bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/90"
      >
        Dettagli e iscrizione
      </Link>
    </article>
  );
}
