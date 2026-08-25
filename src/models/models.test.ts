import { beforeAll, describe, expect, it } from "vitest";
import { Base } from "@blazetrails/activerecord";
import { migrate } from "../migrator.js";
import { Event, Meta, Rfc, Story, StoryDep, StoryPath } from "./index.js";

beforeAll(async () => {
  await Base.establishConnection({ adapter: "node-sqlite", database: ":memory:", pool: 1 });
  await migrate();

  await Rfc.create({ id: "0061-ci-failures", status: "active", title: "CI failures" });
  await Rfc.create({ id: "0002-draft-rfc", status: "draft", title: "Draft" });

  await Story.create({ id: "base", rfc_id: "0061-ci-failures", status: "done", est_loc: 10 });
  await Story.create({ id: "dependent", rfc_id: "0061-ci-failures", status: "ready", est_loc: 20 });
  await Story.create({ id: "blocked-one", rfc_id: "0061-ci-failures", status: "ready" });
  await StoryDep.create({ story_id: "dependent", depends_on_id: "base" });
  await StoryPath.create({ story_id: "dependent", path: "packages/activerecord/src/relation.ts" });
});

describe("models", () => {
  it("enum generates predicates and scopes", async () => {
    const s = await Story.findBy({ id: "base" });
    expect(s!.isDone()).toBe(true);
    expect(await Story.ready().count()).toBe(2);
  });

  it("stores the hyphenated enum value, not the camelCase label", async () => {
    const s = await Story.findBy({ id: "dependent" });
    s!.status = "in-progress";
    await s!.save();
    const raw = (
      await Base.connection.selectAll("SELECT status FROM stories WHERE id='dependent'")
    ).toArray();
    expect(raw[0].status).toBe("in-progress");
    s!.status = "ready";
    await s!.save();
  });

  it("resolves belongsTo", async () => {
    const s = await Story.findBy({ id: "dependent" });
    const rfc = await s!.loadBelongsTo("rfc");
    expect((rfc as Rfc).id).toBe("0061-ci-failures");
  });

  it("walks the self-referential has_many-through dep graph", async () => {
    const s = await Story.findBy({ id: "dependent" });
    const deps = await s!.deps.toArray();
    expect(deps.map((d) => d.id)).toEqual(["base"]);
    expect(deps[0].status).toBe("done");
  });

  it("walks hasMany paths", async () => {
    const s = await Story.findBy({ id: "dependent" });
    const paths = await s!.paths.toArray();
    expect(paths.map((p) => p.path)).toEqual(["packages/activerecord/src/relation.ts"]);
  });

  it("resolves the atomic claim by affected-row count", async () => {
    const won = await Story.where({ id: "blocked-one", status: "ready" }).updateAll({
      status: "claimed",
      assignee: "agent-1",
    });
    const lost = await Story.where({ id: "blocked-one", status: "ready" }).updateAll({
      status: "claimed",
      assignee: "agent-2",
    });
    expect(won).toBe(1);
    expect(lost).toBe(0);
    const after = await Story.findBy({ id: "blocked-one" });
    expect(after!.assignee).toBe("agent-1");
  });

  it("round-trips meta watermarks", async () => {
    expect(await Meta.get("last_ingested_sha")).toBeNull();
    await Meta.set("last_ingested_sha", "abc123");
    expect(await Meta.get("last_ingested_sha")).toBe("abc123");
    await Meta.set("last_ingested_sha", "def456");
    expect(await Meta.get("last_ingested_sha")).toBe("def456");
    expect(await Meta.count()).toBe(1);
  });

  it("appends events", async () => {
    await Event.create({ at: new Date().toISOString(), verb: "done", story_id: "base", pr: 7027 });
    expect(await Event.where({ verb: "done" }).count()).toBe(1);
  });
});
