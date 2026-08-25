import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Base, Migration, MigrationRunner } from "@blazetrails/activerecord";

const MIGRATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrate");
const MIGRATION_FILE = /^(\d{14})_([a-z0-9_]+)\.ts$/;

/**
 * Load every `db/migrate/<version>_<name>.ts` in version order. The 14-digit
 * filename prefix is stamped onto the class so MigrationRunner records it in
 * `schema_migrations`.
 */
export async function loadMigrations(): Promise<Migration[]> {
  const files = readdirSync(MIGRATE_DIR)
    .filter((f) => MIGRATION_FILE.test(f))
    .sort();

  const migrations: Migration[] = [];
  for (const file of files) {
    const match = MIGRATION_FILE.exec(file);
    if (!match) continue;
    const mod = (await import(join(MIGRATE_DIR, file))) as {
      default?: new (name?: string, version?: number) => Migration;
    };
    if (!mod.default) throw new Error(`${file} must \`export default\` a Migration subclass`);
    // Migration's constructor is `(name?, version?)` and `version` is a
    // read-only getter over the private field it sets. Assigning a static on
    // the class instead — as trails' examples/twitter-clone/src/migrator.ts
    // does — leaves the instance getter undefined, so MigrationRunner's
    // `String(m.version ?? m.constructor.name)` (migrator.ts:36) silently
    // records the CLASS NAME in schema_migrations. A later class rename then
    // re-runs an applied migration. Pass it through the constructor.
    migrations.push(new mod.default(match[2], Number(match[1])));
  }
  return migrations;
}

async function runner(): Promise<MigrationRunner> {
  return new MigrationRunner(Base.connection, await loadMigrations());
}

export async function migrate(): Promise<void> {
  await (await runner()).migrate();
}

export async function rollback(steps = 1): Promise<void> {
  await (await runner()).rollback(steps);
}

export async function status(): Promise<{ status: string; version: string; name: string }[]> {
  return (await runner()).status();
}

export async function hasPendingMigrations(): Promise<boolean> {
  return (await status()).some((r) => r.status === "down");
}
