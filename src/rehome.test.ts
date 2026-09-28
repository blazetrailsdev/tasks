/**
 * Rehome moves the FILE, not just the row. Writing `rfc_id` alone would leave
 * `file_path` under the old RFC, and the next ingest of that still-present
 * file would put the story straight back — so these tests assert on disk.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";
import { rehome } from "./rehome.js";
import { buildStoryContent } from "./authoring.js";

let dir: string;
const prevTasksDir = process.env.TASKS_DIR;

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

function readme(rfc: string, packages: string[], clusters: string[]): void {
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `\n  - "${x}"`).join("") : " []");
  writeFileSync(
    join(dir, "rfcs", rfc, "README.md"),
    `---\nrfc: "${rfc}"\ntitle: "T"\nstatus: active\ncreated: 2026-09-01\nupdated: 2026-09-01\n` +
      `owner: "@o"\npackages:${list(packages)}\nclusters:${list(clusters)}\n---\n`,
  );
}

/** Add a story under 0001-from, on disk and in the DB, as a committed file. */
async function seedStory(
  id: string,
  opts: { cluster?: string; packages?: string[]; estLoc?: number } = {},
): Promise<void> {
  const rel = storyPath("0001-from", id);
  writeFileSync(
    join(dir, rel),
    buildStoryContent("0001-from", id, { date: "2026-09-02", status: "draft", ...opts }),
  );
  git(["add", "-A"]);
  git(["commit", "-q", "-m", id]);
  await Story.create({ id, rfc_id: "0001-from", status: "draft", file_path: rel });
}

function storyPath(rfc: string, id: string): string {
  return join("rfcs", rfc, "stories", `${id}.md`);
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }

  dir = mkdtempSync(join(tmpdir(), "rehome-"));
  process.env.TASKS_DIR = dir;
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "t"]);

  const rel = storyPath("0001-from", "s1");
  mkdirSync(join(dir, "rfcs", "0001-from", "stories"), { recursive: true });
  mkdirSync(join(dir, "rfcs", "0123-holding", "stories"), { recursive: true });
  writeFileSync(
    join(dir, rel),
    buildStoryContent("0001-from", "s1", { date: "2026-09-02", status: "draft" }),
  );
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "seed"]);

  await Rfc.create({ id: "0001-from", status: "active", title: "From" });
  await Rfc.create({ id: "0123-holding", status: "active", title: "Holding" });
  await Story.create({ id: "s1", rfc_id: "0001-from", status: "draft", file_path: rel });
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("rehome", () => {
  it("moves the file and rewrites its rfc frontmatter", async () => {
    const r = await rehome(["s1"], "0123-holding", { commit: false });

    expect(r.moved).toEqual([
      { id: "s1", from: storyPath("0001-from", "s1"), to: storyPath("0123-holding", "s1") },
    ]);
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(false);
    const moved = readFileSync(join(dir, storyPath("0123-holding", "s1")), "utf8");
    expect(moved).toContain('rfc: "0123-holding"');
    // Rehoming is not a status change: the story arrives in its new home in
    // exactly the state it left, for the sunset agent to decide on there.
    expect(moved).toContain("status: draft");
  });

  it("is a no-op for a story already under the destination", async () => {
    const r = await rehome(["s1"], "0001-from", { commit: false });
    expect(r.moved).toEqual([]);
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });

  it("refuses a terminal destination rather than reddening validate on main", async () => {
    await Rfc.create({ id: "0099-done", status: "closed", title: "Done" });
    await expect(rehome(["s1"], "0099-done", { commit: false })).rejects.toMatchObject({ code: 1 });
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });

  it("refuses the whole batch when any id is unknown", async () => {
    await expect(rehome(["s1", "nope"], "0123-holding", { commit: false })).rejects.toMatchObject({
      code: 1,
    });
    expect(existsSync(join(dir, storyPath("0001-from", "s1")))).toBe(true);
  });

  describe("against pnpm validate's story rules", () => {
    beforeEach(() => {
      // 0001-from declares what its stories use; 0123-holding declares neither.
      readme("0001-from", ["ruby-compat"], ["autoload"]);
      readme("0123-holding", ["activerecord"], ["schema"]);
      git(["add", "-A"]);
      git(["commit", "-q", "-m", "readmes"]);
    });

    it("widens the destination with a known cluster and package, staged with the move", async () => {
      await seedStory("s-known", { cluster: "autoload", packages: ["ruby-compat"] });

      await rehome(["s-known"], "0123-holding", { commit: false });

      const dest = readFileSync(join(dir, "rfcs", "0123-holding", "README.md"), "utf8");
      expect(dest).toContain('packages:\n  - "activerecord"\n  - "ruby-compat"\n');
      expect(dest).toContain('clusters:\n  - "schema"\n  - "autoload"\n');
      expect(git(["diff", "--cached", "--name-only"]).split("\n")).toContain(
        "rfcs/0123-holding/README.md",
      );
    });

    it("refuses the whole batch, touching nothing, when one story's cluster is unknown", async () => {
      await seedStory("s-known", { cluster: "autoload" });
      await seedStory("s-typo", { cluster: "autolaod" });

      await expect(
        rehome(["s-known", "s-typo"], "0123-holding", { commit: false }),
      ).rejects.toMatchObject({ code: 1 });

      expect(git(["status", "--porcelain"])).toBe("");
    });

    it("refuses a story that fails validate's story rules", async () => {
      await seedStory("s-huge", { estLoc: 5000 });

      await expect(rehome(["s-huge"], "0123-holding", { commit: false })).rejects.toMatchObject({
        code: 1,
      });

      expect(git(["status", "--porcelain"])).toBe("");
    });
  });

  it("closes the source RFC when the move leaves only terminal stories behind", async () => {
    const rel = storyPath("0001-from", "s2");
    writeFileSync(
      join(dir, rel),
      buildStoryContent("0001-from", "s2", { date: "2026-09-02", status: "done" }),
    );
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "s2"]);
    await Story.create({ id: "s2", rfc_id: "0001-from", status: "done", file_path: rel });

    await rehome(["s1"], "0123-holding");

    expect((await Rfc.findBy({ id: "0001-from" }))?.status).toBe("closed");
    expect((await Rfc.findBy({ id: "0123-holding" }))?.status).toBe("active");
  });
});
