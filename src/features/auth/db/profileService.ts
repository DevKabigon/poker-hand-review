import { supabase } from "@/lib/supabase/client";

export async function upsertProfileUsername(
  userId: string,
  username: string,
): Promise<void> {
  const normalized = username.trim();
  if (!normalized) return;

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username: normalized }, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to upsert profile username: ${error.message}`);
  }
}

export async function getProfileUsername(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile username: ${error.message}`);
  }

  return (data?.username as string | null) ?? null;
}
