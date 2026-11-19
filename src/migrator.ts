import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MigrationContext } from "@blazetrails/activerecord";
import { getCryptoAsync } from "@blazetrails/activesupport";

/**
 * Migrations, through Rails' own entry point.
 *
 * `MigrationContext` discovers `db/migrate/<version>_<name>.ts` itself, so the
 * hand-rolled loader this file used to carry is gone — along with the bug it
 * needed: MigrationRunner read the version off the INSTANCE, so passing it as a
 * static (as trails' own example once did) silently recorded the class name in
 * schema_migrations instead of the timestamp.
 *
 * MigrationRunner was dropped in trails#7069 as a trails-only invention; this is
 * the converged shape.
 */
const MIGRATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrate");

function context(): MigrationContext {
  return new MigrationContext([MIGRATE_DIR]);
}

export async function migrate(): Promise<void> {
  // A foreign key's default name is a digest, and the synchronous lookup cannot
  // load node:crypto under ESM; the async one seats it for the rest of the run.
  await getCryptoAsync();
  await context().migrate();
}

export async function rollback(steps = 1): Promise<void> {
  await context().rollback(steps);
}

export async function status(): Promise<{ status: string; version: string; name: string }[]> {
  const rows = await context().migrationsStatus();
  return rows.map((r) => ({ status: r.status, version: String(r.version), name: r.name }));
}

export async function hasPendingMigrations(): Promise<boolean> {
  return (await status()).some((r) => r.status === "down");
}

/**
 * Refuse to run a verb against a database older than this CLI's schema.
 *
 * A CLI that adds a column writes it on every verb, so a database one
 * migration behind fails each verb with `unknown attribute 'stage' for Story.`,
 * which names neither the cause nor the fix (tasks-db-missing-stage-column).
 */
export async function checkPendingMigrations(): Promise<void> {
  const pending = (await status()).filter((r) => r.status === "down");
  if (pending.length === 0) return;
  const names = pending.map((r) => `${r.version}_${r.name}`).join(", ");
  throw new Error(
    `Migrations are pending: ${names}. Run \`pnpm db:migrate\` in the tasks checkout to resolve.`,
  );
}
