/** The CLI refuses a database older than its schema (tasks-db-missing-stage-column). */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { checkPendingMigrations, migrate, rollback } from "./migrator.js";

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
});

describe("checkPendingMigrations", () => {
  it("passes a migrated database", async () => {
    await expect(checkPendingMigrations()).resolves.toBeUndefined();
  });

  it("names the migration a database is missing", async () => {
    await rollback(1);
    const err = await checkPendingMigrations().catch((e: unknown) => e);
    expect((err as Error).message).toMatch(/Migrations are pending: \d{14}_Create refinements\./);
  });
});
