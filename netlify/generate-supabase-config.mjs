import { writeFileSync } from "node:fs";

const clean = value => String(value || "").trim().replace(/^['"]|['"]$/g, "");
const supabaseUrl = clean(process.env.SUPABASE_URL);
const supabasePublishableKey = clean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("Supabase browser config is incomplete. The storefront will fall back to the Netlify supabase-config function.");
}

writeFileSync(
  "supabase-config.json",
  JSON.stringify({ supabaseUrl, supabasePublishableKey }, null, 2)
);

console.log("Generated supabase-config.json for the storefront.");
