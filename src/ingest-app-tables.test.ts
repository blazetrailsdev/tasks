/** trailmap's own tables (RFC 0243) live in tasks.db, and the CLI never writes them. */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { ingestChunkForTest, type IngestResult } from "./ingest.js";
import { exportState } from "./export.js";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP_TABLES = [
  "active_storage_blobs",
  "active_storage_attachments",
  "active_storage_variant_records",
  "audits",
  "refinements",
];

const rows = async () =>
  Object.fromEntries(
    await Promise.all(
      APP_TABLES.map(async (t) => [t, await Base.connection.selectAll(`SELECT * FROM ${t}`)]),
    ),
  );

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
});

async function seed() {
  const now = "2026-11-18 00:00:00";
  await Base.connection.execute(
    `INSERT INTO audits (slug, repo, format, written_at, created_at, updated_at) VALUES ('a', 'o/r', 'md', '${now}', '${now}', '${now}')`,
  );
  await Base.connection.execute(
    `INSERT INTO refinements (rfc_id, outcome, stories, created_at, updated_at) VALUES ('0001-a', 'changed', 3, '${now}', '${now}')`,
  );
}

function checkout(): string {
  const dir = mkdtempSync(join(tmpdir(), "ingest-app-tables-"));
  mkdirSync(join(dir, "rfcs/0001-a/stories"), { recursive: true });
  writeFileSync(join(dir, "rfcs/0001-a/README.md"), "---\ntitle: A\n---\nThe RFC.\n");
  writeFileSync(join(dir, "rfcs/0001-a/stories/s.md"), "---\ntitle: S\n---\nThe story.\n");
  return dir;
}

describe("trailmap's tables", () => {
  it("are untouched by ingest", async () => {
    await seed();
    const before = await rows();

    const result: IngestResult = {
      from: null,
      to: "x",
      created: 0,
      updated: 0,
      closed: 0,
      rfcsTouched: 0,
      scanned: 0,
    };
    await ingestChunkForTest(
      ["rfcs/0001-a/README.md", "rfcs/0001-a/stories/s.md"],
      checkout(),
      result,
    );

    expect(result.created).toBeGreaterThan(0);
    expect(await rows()).toEqual(before);
  });

  it("are untouched by export", async () => {
    await seed();
    const before = await rows();

    await exportState({ tasksDir: checkout(), commit: false });

    expect(await rows()).toEqual(before);
  });
});
