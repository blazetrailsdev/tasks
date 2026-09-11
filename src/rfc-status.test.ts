/**
 * rfc-status rewrites the RFC file's frontmatter, not just the row — status is
 * markdown-owned, so a row-only write would be reverted by the next ingest.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "./migrator.js";
import { Rfc, Story } from "./models/index.js";
import { rfcStatusSet, rfcTransitionAllowed } from "./rfc-status.js";

let dir: string;
const prevTasksDir = process.env.TASKS_DIR;
const rel = join("rfcs", "0001-x", "README.md");

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

beforeEach(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();
  for (const t of ["events", "stories", "rfcs"]) {
    await Base.connection.execute(`DELETE FROM ${t}`);
  }

  dir = mkdtempSync(join(tmpdir(), "rfc-status-"));
  process.env.TASKS_DIR = dir;
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "t"]);
  mkdirSync(join(dir, "rfcs", "0001-x"), { recursive: true });
  writeFileSync(
    join(dir, rel),
    '---\nrfc: "0001-x"\ntitle: "X"\nstatus: draft\nupdated: 2026-01-01\n---\n\nbody\n',
  );
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "seed"]);

  await Rfc.create({ id: "0001-x", status: "draft", title: "X", file_path: rel });
});

afterEach(() => {
  if (prevTasksDir === undefined) delete process.env.TASKS_DIR;
  else process.env.TASKS_DIR = prevTasksDir;
});

describe("rfc-status", () => {
  it("rewrites status in the frontmatter", async () => {
    const r = await rfcStatusSet("0001-x", "active", { commit: false });
    expect(r).toEqual({ from: "draft", to: "active", committed: false });
    const text = readFileSync(join(dir, rel), "utf8");
    expect(text).toContain("status: active");
    expect(text).not.toContain("updated: 2026-01-01");
    expect(text).toContain("\nbody\n");
  });

  it("refuses to close an RFC with unfinished stories", async () => {
    await Story.create({ id: "s1", rfc_id: "0001-x", status: "ready", file_path: "x.md" });
    await expect(rfcStatusSet("0001-x", "closed", { commit: false })).rejects.toThrow();
    expect(readFileSync(join(dir, rel), "utf8")).toContain("status: draft");
  });

  it("closes an RFC whose stories are all terminal", async () => {
    await Story.create({ id: "s1", rfc_id: "0001-x", status: "done", file_path: "x.md" });
    await Story.create({ id: "s2", rfc_id: "0001-x", status: "closed", file_path: "y.md" });
    await rfcStatusSet("0001-x", "closed", { commit: false });
    expect(readFileSync(join(dir, rel), "utf8")).toContain("status: closed");
  });

  it("rejects unknown statuses and moves out of closed", async () => {
    await expect(rfcStatusSet("0001-x", "ready", { commit: false })).rejects.toThrow();
    expect(rfcTransitionAllowed("closed", "active")).toBe(false);
    expect(rfcTransitionAllowed("active", "superseded")).toBe(false);
    expect(rfcTransitionAllowed("postponed", "active")).toBe(true);
  });
});
