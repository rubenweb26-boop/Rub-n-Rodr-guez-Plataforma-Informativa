import fs from "node:fs";
import path from "node:path";

const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

async function executeSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL error (${res.status}): ${text}`);
  }
  return text;
}

async function main() {
  if (!SUPABASE_MANAGEMENT_TOKEN || !PROJECT_REF) throw new Error("Set SUPABASE_MANAGEMENT_TOKEN and SUPABASE_PROJECT_REF in the environment.");
  console.log("Applying migrations to Supabase project:", PROJECT_REF);

  const migrationsDir = path.resolve("supabase/migrations");
  const files = [
    "0001_security_foundation.sql",
    "0002_recurring_subscriptions.sql",
    "0003_ruben_investigations_advertisers_and_categories.sql",
    "0004_delete_empty_account.sql"
  ];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\n--- Running ${file} ---`);
    let sql = fs.readFileSync(filePath, "utf-8");

    // Ensure provider constraints include 'onvo'
    sql = sql.replace(
      "check (provider in ('tilopay', 'manual'))",
      "check (provider in ('tilopay', 'manual', 'onvo', 'stripe'))"
    );
    sql = sql.replace(
      "check (provider in ('tilopay', 'manual'))",
      "check (provider in ('tilopay', 'manual', 'onvo', 'stripe'))"
    );
    sql = sql.replace(
      "check (provider in ('tilopay', 'manual'))",
      "check (provider in ('tilopay', 'manual', 'onvo', 'stripe'))"
    );
    sql = sql.replace(
      "check (provider = 'tilopay')",
      "check (provider in ('tilopay', 'manual', 'onvo', 'stripe'))"
    );

    try {
      const result = await executeSql(sql);
      console.log(`Success ${file}:`, result.slice(0, 100));
    } catch (err) {
      console.error(`Error in ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log("\nAll migrations applied successfully!");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

