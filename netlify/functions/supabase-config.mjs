const clean = value => String(value || "").trim().replace(/^['"]|['"]$/g, "");

export async function handler() {
  const supabaseUrl = clean(process.env.SUPABASE_URL);
  const supabasePublishableKey = clean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      statusCode: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ error: "Supabase environment variables are not configured." })
    };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify({ supabaseUrl, supabasePublishableKey })
  };
}
