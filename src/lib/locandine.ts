import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET_LOCANDINE = "locandine";

export async function urlLocandina(path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET_LOCANDINE)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function useLocandina(path: string | null | undefined) {
  return useQuery({
    queryKey: ["locandina", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: () => urlLocandina(path),
  });
}
