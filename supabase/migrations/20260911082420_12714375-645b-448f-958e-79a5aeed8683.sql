
CREATE TYPE public.app_role AS ENUM ('admin','societa');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_societa text NOT NULL DEFAULT '',
  codice_societa text,
  citta text,
  regione text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profili leggibili da tutti" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "societa aggiorna il proprio profilo" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "societa crea il proprio profilo" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "utente legge i propri ruoli" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_societa, codice_societa, citta, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_societa', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'codice_societa',
    NEW.raw_user_meta_data->>'citta',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'societa') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.atleti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  societa_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_societa text NOT NULL DEFAULT '',
  nome text NOT NULL,
  cognome text NOT NULL,
  data_nascita date,
  sesso text NOT NULL DEFAULT 'M',
  peso_kg numeric,
  disciplina text NOT NULL DEFAULT 'Contatto Pieno',
  punti integer NOT NULL DEFAULT 0,
  vittorie integer NOT NULL DEFAULT 0,
  sconfitte integer NOT NULL DEFAULT 0,
  pareggi integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atleti TO authenticated;
GRANT SELECT ON public.atleti TO anon;
GRANT ALL ON public.atleti TO service_role;
ALTER TABLE public.atleti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atleti visibili a tutti" ON public.atleti FOR SELECT USING (true);
CREATE POLICY "societa gestisce i propri atleti" ON public.atleti FOR INSERT TO authenticated WITH CHECK (auth.uid() = societa_id);
CREATE POLICY "societa modifica i propri atleti" ON public.atleti FOR UPDATE TO authenticated USING (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "societa elimina i propri atleti" ON public.atleti FOR DELETE TO authenticated USING (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.eventi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  disciplina text NOT NULL DEFAULT 'Contatto Pieno',
  tipo text NOT NULL DEFAULT 'Istituzionale',
  data_evento date NOT NULL,
  luogo text NOT NULL,
  sede text,
  regione text,
  fine_iscrizioni timestamptz NOT NULL,
  descrizione text,
  stato text NOT NULL DEFAULT 'aperto',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventi TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventi TO authenticated;
GRANT ALL ON public.eventi TO service_role;
ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventi visibili a tutti" ON public.eventi FOR SELECT USING (true);
CREATE POLICY "admin gestisce eventi" ON public.eventi FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.iscrizioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventi(id) ON DELETE CASCADE,
  atleta_id uuid NOT NULL REFERENCES public.atleti(id) ON DELETE CASCADE,
  societa_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria_peso text,
  disciplina text,
  stato text NOT NULL DEFAULT 'in attesa',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, atleta_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iscrizioni TO authenticated;
GRANT SELECT ON public.iscrizioni TO anon;
GRANT ALL ON public.iscrizioni TO service_role;
ALTER TABLE public.iscrizioni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iscrizioni visibili a tutti" ON public.iscrizioni FOR SELECT USING (true);
CREATE POLICY "societa iscrive i propri atleti" ON public.iscrizioni FOR INSERT TO authenticated WITH CHECK (auth.uid() = societa_id);
CREATE POLICY "societa modifica le proprie iscrizioni" ON public.iscrizioni FOR UPDATE TO authenticated USING (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "societa cancella le proprie iscrizioni" ON public.iscrizioni FOR DELETE TO authenticated USING (auth.uid() = societa_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.titoli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  atleta_a text NOT NULL,
  atleta_b text NOT NULL,
  esito text,
  data_incontro date NOT NULL,
  evento text,
  luogo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.titoli TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.titoli TO authenticated;
GRANT ALL ON public.titoli TO service_role;
ALTER TABLE public.titoli ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titoli visibili a tutti" ON public.titoli FOR SELECT USING (true);
CREATE POLICY "admin gestisce titoli" ON public.titoli FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  contenuto text NOT NULL,
  data_pubblicazione date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news visibili a tutti" ON public.news FOR SELECT USING (true);
CREATE POLICY "admin gestisce news" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.documenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Regolamenti',
  descrizione text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.documenti TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documenti TO authenticated;
GRANT ALL ON public.documenti TO service_role;
ALTER TABLE public.documenti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documenti visibili a tutti" ON public.documenti FOR SELECT USING (true);
CREATE POLICY "admin gestisce documenti" ON public.documenti FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.eventi (nome, disciplina, tipo, data_evento, luogo, sede, regione, fine_iscrizioni, descrizione, stato) VALUES
('Trofeo Autunno W.L.','Contatto Pieno','Istituzionale','2026-11-08','Roma','Palazzetto S. Rita','Lazio','2026-10-30 23:59+01','Trofeo nazionale di contatto pieno, categorie senior e junior.','aperto'),
('Coppa Liguria Elite','Muay Thai','Istituzionale','2026-11-21','Genova','Pala Morelli','Liguria','2026-11-12 23:59+01','Gara regionale Muay Thai con incontri elite.','aperto'),
('Open Regionale FVG','Light Contact','Non Istituzionale','2026-12-05','Udine','Centro Sportivo','Friuli-Venezia Giulia','2026-11-28 23:59+01','Open aperto a tutte le societa affiliate.','aperto'),
('Memorial De Luca','Contatto Pieno','Istituzionale','2026-12-19','Bari','Pala Pignatelli','Puglia','2026-12-10 23:59+01','Memorial dedicato con finali titolate.','aperto'),
('Campionato Italiano Kickboxing','Kickboxing','Istituzionale','2027-02-14','Rimini','Fiera di Rimini','Emilia-Romagna','2027-01-31 23:59+01','Campionato nazionale assoluto.','aperto'),
('Gala Muay Thai Milano','Muay Thai','Non Istituzionale','2026-09-05','Milano','Arena Nord','Lombardia','2026-08-28 23:59+02','Gala serale con incontri pro.','concluso');

INSERT INTO public.atleti (nome, cognome, nome_societa, sesso, peso_kg, disciplina, punti, vittorie, sconfitte, pareggi, data_nascita) VALUES
('Marco','Rinaldi','M.T. Roma','M',71,'Contatto Pieno',903,22,1,0,'1999-04-12'),
('Luca','Bianchi','K.B. Torino','M',67,'Contatto Pieno',842,18,2,1,'2000-01-30'),
('Giulia','Serra','K.B. Milano','F',60,'Contatto Pieno',791,15,3,2,'2001-07-19'),
('Alessio','Zeloni','Kick And Punch','M',75,'Kickboxing',744,16,5,1,'1998-03-04'),
('Chiara','Zoppi','Turbo Team','F',56,'Muay Thai',712,14,4,0,'2002-11-22'),
('Lorenzo','Del Gaudio','Fight Academy','M',81,'Muay Thai',690,13,6,1,'1997-06-08'),
('Beatrice','Bertocci','Borgo Fight','F',63,'Light Contact',655,12,5,2,'2003-02-15'),
('Andrea','Nani','Turbo Team','M',86,'Contatto Pieno',631,11,7,0,'1996-09-27');

INSERT INTO public.titoli (titolo, atleta_a, atleta_b, esito, data_incontro, evento, luogo) VALUES
('WMC PRO Italiano MT -60Kg','Chiara Zoppi','Beatrice Bertocci','Vittoria Zoppi ai punti','2026-05-23','Borgo Fight 11','Monteodorisio'),
('WMC PRO Italiano MT -76Kg','Lorenzo Del Gaudio','Alessio Zeloni','Vittoria Del Gaudio per KO round 2','2026-05-23','Borgo Fight 11','Monteodorisio'),
('Cintura Nazionale CP -71Kg','Marco Rinaldi','Luca Bianchi','Vittoria Rinaldi 2-1','2026-04-11','Grand Prix Aurora','Roma');

INSERT INTO public.news (titolo, contenuto, data_pubblicazione) VALUES
('Aperte le iscrizioni al Trofeo Autunno','Le societa in regola con il tesseramento possono iscrivere i propri atleti fino al 30 ottobre.','2026-09-01'),
('Nuovo regolamento categorie di peso','Dalla stagione in corso entrano in vigore le nuove fasce di peso per le categorie junior.','2026-08-18'),
('Classifiche aggiornate dopo il Gala di Milano','Pubblicati i punteggi aggiornati del settore contatto pieno.','2026-09-08');

INSERT INTO public.documenti (titolo, categoria, descrizione, url) VALUES
('Regolamento tecnico Contatto Pieno','Regolamenti','Regolamento ufficiale di disciplina per il settore contatto pieno.',''),
('Guida alle iscrizioni online','Guide','Come iscrivere gli atleti agli eventi dalla propria area riservata.',''),
('Modulo certificato medico','Modulistica','Modello da consegnare in sede di pesatura.',''),
('Norme antidoping','Regolamenti','Documento informativo sulle norme antidoping.','');
