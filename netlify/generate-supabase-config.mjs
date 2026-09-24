import { writeFileSync } from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in Netlify environment variables.");
  process.exit(1);
}

writeFileSync(
  "supabase-config.json",
  JSON.stringify(
    {
      supabaseUrl,
      supabasePublishableKey
    },
    null,
    2
  )
);

console.log("Generated supabase-config.json for the storefront.");
