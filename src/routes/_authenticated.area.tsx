import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfilo, useSession } from "@/lib/auth";
import { formatDataBreve, formatDataCompleta, DISCIPLINE } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";

export const Route = createFileRoute("/_authenticated/area")({
  head: () => ({
    meta: [
      { title: "Area società — Fighting Spirit" },
      { name: "description", content: "Gestisci i tuoi atleti e le iscrizioni agli eventi." },
    ],
  }),
  component: AreaSocieta,
});

function AreaSocieta() {
  const { user } = useSession();
  const { data: profilo } = useProfilo(user?.id);
  const { data: admin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<
    "atleti" | "iscrizioni" | "eventi" | "conferme"
  >("atleti");

  async function esci() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Area società
          </p>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
            {profilo?.nome_societa || user?.email}
          </h1>
          {profilo?.codice_societa && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              Codice società: {profilo.codice_societa}
              {profilo?.citta ? ` · ${profilo.citta}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={esci}
          className="rounded-[10px] border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Esci
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {([
          ["atleti", "I miei atleti"],
          ["iscrizioni", "Iscrizioni"],
          ...(admin
            ? ([
                ["eventi", "Gestione eventi"],
                ["conferme", "Conferma iscrizioni"],
              ] as const)
            : []),
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              tab === k
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "atleti" && <MieiAtleti userId={user!.id} />}
        {tab === "iscrizioni" && <MieIscrizioni userId={user!.id} />}
        {tab === "eventi" && admin && <GestioneEventi />}
        {tab === "conferme" && admin && <ConfermaIscrizioni />}
      </div>
    </div>
  );
}

function MieiAtleti({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    peso: "",
    disciplina: "Contatto Pieno",
    sesso: "M",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const { data: atleti = [], isLoading } = useQuery({
    queryKey: ["miei-atleti", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atleti")
        .select("*")
        .eq("societa_id", userId)
        .order("cognome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const aggiungi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("atleti").insert({
        societa_id: userId,
        nome: form.nome,
        cognome: form.cognome,
        peso_kg: form.peso ? Number(form.peso) : null,
        disciplina: form.disciplina,
        sesso: form.sesso,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ nome: "", cognome: "", peso: "", disciplina: "Contatto Pieno", sesso: "M" });
      setMsg("Atleta aggiunto.");
      queryClient.invalidateQueries({ queryKey: ["miei-atleti", userId] });
      queryClient.invalidateQueries({ queryKey: ["atleti"] });
    },
    onError: (e: any) => setMsg(e.message ?? "Errore."),
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atleti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["miei-atleti", userId] });
      queryClient.invalidateQueries({ queryKey: ["atleti"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Pannello className="p-5 lg:col-span-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Aggiungi atleta
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            aggiungi.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required />
            <Input label="Cognome" value={form.cognome} onChange={(v) => setForm({ ...form, cognome: v })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Peso (kg)" value={form.peso} onChange={(v) => setForm({ ...form, peso: v })} type="number" />
            <Select
              label="Disciplina"
              value={form.disciplina}
              onChange={(v) => setForm({ ...form, disciplina: v })}
              options={DISCIPLINE}
            />
          </div>
          <Select
            label="Sesso"
            value={form.sesso}
            onChange={(v) => setForm({ ...form, sesso: v })}
            options={["M", "F"]}
          />
          <button
            type="submit"
            disabled={aggiungi.isPending}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {aggiungi.isPending ? "Salvataggio…" : "Aggiungi atleta"}
          </button>
          {msg && <p className="text-[12px]">{msg}</p>}
        </form>
      </Pannello>

      <div className="lg:col-span-7">
        <Pannello className="divide-y divide-border overflow-hidden">
          {isLoading && <Vuoto testo="Caricamento…" />}
          {!isLoading && atleti.length === 0 && <Vuoto testo="Nessun atleta inserito." />}
          {atleti.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium">
                  {a.cognome} {a.nome}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {a.disciplina} · {a.peso_kg ?? "—"} kg
                </p>
              </div>
              <button
                type="button"
                onClick={() => elimina.mutate(a.id)}
                className="text-[12px] text-destructive hover:underline"
              >
                Elimina
              </button>
            </div>
          ))}
        </Pannello>
      </div>
    </div>
  );
}

function MieIscrizioni({ userId }: { userId: string }) {
  const { data: iscrizioni = [], isLoading } = useQuery({
    queryKey: ["mie-iscrizioni", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iscrizioni")
        .select("id, stato, categoria_peso, evento_id, eventi(nome, data_evento, luogo)")
        .eq("societa_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Pannello className="divide-y divide-border overflow-hidden">
      {isLoading && <Vuoto testo="Caricamento…" />}
      {!isLoading && iscrizioni.length === 0 && (
        <Vuoto testo="Nessuna iscrizione effettuata. Apri un evento dal calendario." />
      )}
      {iscrizioni.map((i: any) => (
        <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-medium">{i.eventi?.nome}</p>
            <p className="text-[12px] text-muted-foreground">
              {formatDataCompleta(i.eventi?.data_evento)} · {i.eventi?.luogo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted-foreground">
              {i.categoria_peso ?? "—"}
            </p>
            <span className="text-[12px] font-medium capitalize">{i.stato}</span>
          </div>
        </div>
      ))}
    </Pannello>
  );
}

function GestioneEventi() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: "",
    disciplina: "Contatto Pieno",
    tipo: "Istituzionale",
    data_evento: "",
    luogo: "",
    sede: "",
    fine_iscrizioni: "",
    descrizione: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const crea = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventi").insert({
        nome: form.nome,
        disciplina: form.disciplina,
        tipo: form.tipo,
        data_evento: form.data_evento,
        luogo: form.luogo,
        sede: form.sede || null,
        fine_iscrizioni: form.fine_iscrizioni,
        descrizione: form.descrizione || null,
        stato: "aperto",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg("Evento creato.");
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      setForm({
        nome: "",
        disciplina: "Contatto Pieno",
        tipo: "Istituzionale",
        data_evento: "",
        luogo: "",
        sede: "",
        fine_iscrizioni: "",
        descrizione: "",
      });
    },
    onError: (e: any) => setMsg(e.message ?? "Errore."),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Pannello className="p-5 lg:col-span-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Nuovo evento
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            crea.mutate();
          }}
        >
          <Input label="Nome evento" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Disciplina" value={form.disciplina} onChange={(v) => setForm({ ...form, disciplina: v })} options={DISCIPLINE} />
            <Select label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} options={["Istituzionale", "Non Istituzionale"]} />
          </div>
          <Input label="Data evento" type="date" value={form.data_evento} onChange={(v) => setForm({ ...form, data_evento: v })} required />
          <Input label="Luogo (città)" value={form.luogo} onChange={(v) => setForm({ ...form, luogo: v })} required />
          <Input label="Sede / palazzetto" value={form.sede} onChange={(v) => setForm({ ...form, sede: v })} />
          <Input label="Fine iscrizioni (data-ora)" type="datetime-local" value={form.fine_iscrizioni} onChange={(v) => setForm({ ...form, fine_iscrizioni: v })} required />
          <label className="text-[12px] font-medium text-muted-foreground">
            Descrizione
            <textarea
              value={form.descrizione}
              onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
              className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              rows={3}
            />
          </label>
          <button
            type="submit"
            disabled={crea.isPending}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {crea.isPending ? "Salvataggio…" : "Crea evento"}
          </button>
          {msg && <p className="text-[12px]">{msg}</p>}
        </form>
      </Pannello>

      <ListaEventiAdmin />
    </div>
  );
}

function ListaEventiAdmin() {
  const queryClient = useQueryClient();
  const { data: eventi = [], isLoading } = useQuery({
    queryKey: ["eventi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventi")
        .select("id, nome, data_evento, luogo, stato")
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eventi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventi"] }),
  });

  return (
    <div className="lg:col-span-7">
      <Pannello className="divide-y divide-border overflow-hidden">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && eventi.length === 0 && <Vuoto testo="Nessun evento." />}
        {eventi.map((e: any) => (
          <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div>
              <p className="text-sm font-medium">{e.nome}</p>
              <p className="text-[12px] text-muted-foreground">
                {formatDataBreve(e.data_evento)} · {e.luogo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => elimina.mutate(e.id)}
              className="text-[12px] text-destructive hover:underline"
            >
              Elimina
            </button>
          </div>
        ))}
      </Pannello>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-[12px] font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  etichette?: Record<string, string>;
}) {
  return (
    <label className="text-[12px] font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {etichette?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfermaIscrizioni() {
  const queryClient = useQueryClient();
  const [eventoId, setEventoId] = useState<string>("");

  const { data: eventi = [] } = useQuery({
    queryKey: ["eventi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventi")
        .select("id, nome, data_evento, luogo, stato")
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const eventoSelezionato = eventoId || (eventi[0] as any)?.id || "";

  const { data: iscrizioni = [], isLoading } = useQuery({
    queryKey: ["iscrizioni-admin", eventoSelezionato],
    enabled: Boolean(eventoSelezionato),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iscrizioni")
        .select(
          "id, stato, categoria_peso, disciplina, created_at, atleti(nome, cognome, nome_societa, peso_kg, disciplina)",
        )
        .eq("evento_id", eventoSelezionato)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cambiaStato = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const { error } = await supabase
        .from("iscrizioni")
        .update({ stato })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["iscrizioni-admin"] }),
  });

  const conteggi = {
    totali: iscrizioni.length,
    confermate: iscrizioni.filter((i: any) => i.stato === "confermata").length,
    attesa: iscrizioni.filter((i: any) => i.stato === "in attesa").length,
  };

  return (
    <div className="flex flex-col gap-5">
      <Pannello className="flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="min-w-[260px] flex-1">
          <Select
            label="Evento"
            value={eventoSelezionato}
            onChange={setEventoId}
            options={(eventi as any[]).map((e) => e.id)}
            etichette={Object.fromEntries(
              (eventi as any[]).map((e) => [
                e.id,
                `${e.nome} — ${formatDataBreve(e.data_evento)}`,
              ]),
            )}
          />
        </div>
        <p className="text-[12px] text-muted-foreground">
          {conteggi.totali} iscrizioni · {conteggi.confermate} confermate ·{" "}
          {conteggi.attesa} in attesa
        </p>
      </Pannello>

      <Pannello className="divide-y divide-border overflow-hidden">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && iscrizioni.length === 0 && (
          <Vuoto testo="Nessuna iscrizione per questo evento." />
        )}
        {(iscrizioni as any[]).map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
          >
            <div>
              <p className="text-sm font-medium">
                {i.atleti?.cognome} {i.atleti?.nome}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {i.atleti?.nome_societa} ·{" "}
                {i.disciplina || i.atleti?.disciplina}
                {i.atleti?.peso_kg ? ` · ${i.atleti.peso_kg} kg` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  i.stato === "confermata"
                    ? "rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400"
                    : i.stato === "respinta"
                      ? "rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive"
                      : "rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                }
              >
                {i.stato}
              </span>
              {i.stato !== "confermata" && (
                <button
                  type="button"
                  onClick={() =>
                    cambiaStato.mutate({ id: i.id, stato: "confermata" })
                  }
                  className="rounded-[10px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
                >
                  Conferma
                </button>
              )}
              {i.stato !== "respinta" && (
                <button
                  type="button"
                  onClick={() =>
                    cambiaStato.mutate({ id: i.id, stato: "respinta" })
                  }
                  className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted"
                >
                  Respingi
                </button>
              )}
            </div>
          </div>
        ))}
      </Pannello>
    </div>
  );
}
