/** `body` is what trailmap's `/search` matches: the markdown, without frontmatter. */
import { beforeEach, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";
import { backfillBodiesForTest, ingestChunkForTest, type IngestResult } from "./ingest.js";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const result = (): IngestResult => ({
  from: null,
  to: "x",
  created: 0,
  updated: 0,
  closed: 0,
  rfcsTouched: 0,
  scanned: 0,
});

const bodyOf = async (model: typeof Story | typeof Rfc, id: string) =>
  ((await model.where({ id }).pluck("body")) as (string | null)[])[0];

function checkout(): string {
  const dir = mkdtempSync(join(tmpdir(), "ingest-body-"));
  mkdirSync(join(dir, "rfcs/0001-a/stories"), { recursive: true });
  writeFileSync(join(dir, "rfcs/0001-a/README.md"), "---\ntitle: A\n---\nThe RFC.\n");
  writeFileSync(join(dir, "rfcs/0001-a/stories/s.md"), "---\ntitle: S\n---\nThe story.\n");
  return dir;
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) await Base.connection.execute(`DELETE FROM ${t}`);
});

describe("a document's body", () => {
  it("is stored by ingest with the frontmatter stripped", async () => {
    await ingestChunkForTest(
      ["rfcs/0001-a/README.md", "rfcs/0001-a/stories/s.md"],
      checkout(),
      result(),
    );

    expect(await bodyOf(Rfc, "0001-a")).toBe("The RFC.\n");
    expect(await bodyOf(Story, "s")).toBe("The story.\n");
  });

  it("is backfilled on a row that predates the column, once", async () => {
    await Rfc.create({ id: "0001-a", status: "active", file_path: "rfcs/0001-a/README.md" });
    await Story.create({
      id: "s",
      rfc_id: "0001-a",
      status: "ready",
      file_path: "rfcs/0001-a/stories/s.md",
    });
    await Story.create({
      id: "gone",
      rfc_id: "0001-a",
      status: "ready",
      file_path: "rfcs/0001-a/stories/gone.md",
    });

    await backfillBodiesForTest(checkout());

    expect(await bodyOf(Story, "s")).toBe("The story.\n");
    expect(await bodyOf(Rfc, "0001-a")).toBe("The RFC.\n");
    expect(await bodyOf(Story, "gone")).toBe("");
  });
});
