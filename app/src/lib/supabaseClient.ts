import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isDemoMode = !url || !anonKey || url.includes("YOUR-PROJECT-REF");

export const supabase: SupabaseClient | null = isDemoMode ? null : createClient(url!, anonKey!);

/** Base URL for calling edge functions directly (ingest-classify, rank-brief). */
export const functionsBaseUrl = url ? `${url.replace(/\/$/, "")}/functions/v1` : "";
