import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!connectionString)
  throw new Error("Database connection is not configured.");

const sql = postgres(connectionString, { max: 1, prepare: false });
try {
  await sql`
    create table if not exists product_schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;
  const directory = resolve("db/migrations");
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const applied = await sql`
      select 1 from product_schema_migrations where name = ${file}
    `;
    if (applied.length) continue;
    const source = await readFile(resolve(directory, file), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(source);
      await transaction`
        insert into product_schema_migrations (name) values (${file})
      `;
    });
    process.stdout.write(`Applied ${file}\n`);
  }
} finally {
  await sql.end();
}
