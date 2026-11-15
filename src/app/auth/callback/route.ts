import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const u = data.user;
      const userMetadata = u.user_metadata || {};
      const fullName =
        userMetadata.full_name ||
        userMetadata.name ||
        u.email?.split("@")[0] ||
        "";
      const avatarUrl =
        userMetadata.avatar_url || userMetadata.picture || "";

      // Sync user to public.users table
      try {
        await supabase.from("users").upsert(
          {
            id: u.id,
            email: u.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            provider: u.app_metadata?.provider || "google",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (upsertErr) {
        console.warn("Auth callback user upsert warning:", upsertErr);
      }

      // Redirect to next destination (e.g. main page '/')
      const redirectUrl = new URL(next, requestUrl.origin);
      return NextResponse.redirect(redirectUrl);
    } else if (error) {
      console.error("Auth callback session exchange error:", error.message);
    }
  }

  // Fallback to home page on error or missing code
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
