import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createRouteSupabaseClient } from "@/lib/auth";

export interface AdminProfile {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
}

export const requireAdmin = cache(async () => {
  const { supabase } = await createRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    error ||
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    redirect("/dashboard");
  }

  return {
    user,
    profile: profile as AdminProfile,
  };
});
