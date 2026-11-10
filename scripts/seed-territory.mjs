import fs from "node:fs";
import path from "node:path";

const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_MANAGEMENT_TOKEN || !PROJECT_REF) throw new Error("Set SUPABASE_MANAGEMENT_TOKEN and SUPABASE_PROJECT_REF in the environment.");

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

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

async function main() {
  console.log("Loading Costa Rica DTA data...");
  const rawData = JSON.parse(fs.readFileSync("rubenweb-platform/data/costa-rica-dta.json", "utf-8"));

  // 1. Provinces
  console.log(`Seeding ${rawData.provinces.length} provinces...`);
  const provValues = rawData.provinces
    .map(p => `('${escapeSql(p.code)}', '${escapeSql(p.name)}')`)
    .join(",\n");
  await executeSql(`
    INSERT INTO public.provinces (code, name)
    VALUES ${provValues}
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
  `);

  // 2. Cantons in batches of 100
  console.log(`Seeding ${rawData.cantons.length} cantons...`);
  for (let i = 0; i < rawData.cantons.length; i += 100) {
    const chunk = rawData.cantons.slice(i, i + 100);
    const cantonValues = chunk
      .map(c => `('${escapeSql(c.code)}', '${escapeSql(c.provinceCode)}', '${escapeSql(c.name)}')`)
      .join(",\n");
    await executeSql(`
      INSERT INTO public.cantons (code, province_code, name)
      VALUES ${cantonValues}
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, province_code = EXCLUDED.province_code;
    `);
  }

  // 3. Districts in batches of 150
  console.log(`Seeding ${rawData.districts.length} districts...`);
  for (let i = 0; i < rawData.districts.length; i += 150) {
    const chunk = rawData.districts.slice(i, i + 150);
    const distValues = chunk
      .map(d => `('${escapeSql(d.code)}', '${escapeSql(d.cantonCode)}', '${escapeSql(d.name)}')`)
      .join(",\n");
    await executeSql(`
      INSERT INTO public.districts (code, canton_code, name)
      VALUES ${distValues}
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, canton_code = EXCLUDED.canton_code;
    `);
  }

  console.log("Costa Rica territorial data seeded successfully!");
}

main().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

