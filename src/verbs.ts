/**
 * Mutation verbs, as database transactions.
 *
 * This file is the whole point of the rewrite. The old CLI's equivalent path
 * was: take an advisory PID lock file in the shared git dir → `git pull
 * --rebase` → edit frontmatter → `git commit` → synchronous `git push` → on a
 * non-fast-forward, `reset --hard` and retry once → on a second loss, give up.
 * That machinery is ~600 lines and it lost a claim outright on 2026-06-08.
 *
 * Here a claim is one conditional UPDATE whose affected-row count IS the race
 * resolution. No lock, no retry, no rollback, no reset.
 *
 * EXIT CODES are a contract with btwhooks and the agent skills — preserved
 * exactly from the old CLI:
 *   0  success, including an idempotent repeat
 *   2  benign conflict — "someone else holds it, pick another story"
 *   3  lost claim race
 *   1  real error
 *
 * SAVES, NOT `updateAll`, for anything that lands a story. `Relation#updateAll`
 * is one statement and skips callbacks, so a verb written that way is invisible
 * to the model callbacks in rfc-close.ts and the RFC never auto-closes. The one
 * deliberate exception is `claim` below, where the conditional update's
 * affected-row count IS the race resolution.
 */
import { Base } from "@blazetrails/activerecord";
import { Event, Story, type StoryStatus } from "./models/index.js";
import { VerbExit } from "./db.js";

/** ISO seconds, matching the `claim:` format the old CLI wrote. */
export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function record(
  verb: string,
  storyId: string,
  extra: { pr?: number | null; actor?: string | null; detail?: unknown } = {},
): Promise<void> {
  await Event.create({
    at: nowIso(),
    verb,
    story_id: storyId,
    rfc_id: null,
    pr: extra.pr ?? null,
    actor: extra.actor ?? null,
    detail: extra.detail == null ? null : JSON.stringify(extra.detail),
  });
}

async function findAll(ids: string[]): Promise<Story[]> {
  return Story.where({ id: ids }).toArray();
}

function requireFound(ids: string[], found: Story[]): void {
  const have = new Set(found.map((s) => s.id));
  const missing = ids.filter((id) => !have.has(id));
  if (missing.length) {
    console.error(`error: story not found: ${missing.join(", ")}`);
    throw new VerbExit(1);
  }
}

/**
 * Claim, all-or-nothing across ids.
 *
 * The batch is atomic on purpose (ported rule): a bundle worker that claims 3
 * of 5 stories and then aborts leaves the other 2 `claimed` with nobody behind
 * them — invisible to `ready` (not ready) and to the merge sweep (no PR), i.e.
 * silently dropped from the backlog. One taken id refuses the lot.
 *
 * Re-claiming what we already hold is SUCCESS, not a conflict: the loop re-runs
 * `claim` after a client-side error, and the story is already ours.
 */
export async function claim(ids: string[], assignee: string): Promise<void> {
  await Base.transaction(async () => {
    const found = await findAll(ids);
    requireFound(ids, found);

    const taken = found.filter((s) => s.assignee !== null && s.assignee !== assignee);
    if (taken.length) {
      const verb = taken.length > 1 ? "are" : "is";
      console.error(`error: ${taken.map((s) => s.id).join(", ")} ${verb} already claimed`);
      throw new VerbExit(2);
    }

    const available = found.filter((s) => s.status === "ready" && s.assignee === null);
    if (available.length === 0) {
      // Everything is already ours — idempotent repeat.
      for (const id of ids) console.log(`claimed ${id} as ${assignee}`);
      return;
    }

    const at = nowIso();
    for (const s of available) {
      // The race resolution. Zero rows means another agent claimed it between
      // our read and this write; nothing was written, so there is nothing to
      // roll back — we just report the loss.
      const affected = await Story.where({ id: s.id, status: "ready" }).updateAll({
        status: "claimed",
        assignee,
        claim_at: at,
        updated_on: today(),
      });
      if (affected === 0) {
        console.error(`error: lost claim race on ${s.id} — pick another story`);
        throw new VerbExit(3);
      }
      await record("claim", s.id, { actor: assignee });
    }
    for (const id of ids) console.log(`claimed ${id} as ${assignee}`);
  });
}

/** Inverse of claim: claimed → ready, clearing the holder. */
export async function release(ids: string[]): Promise<void> {
  await Base.transaction(async () => {
    const found = await findAll(ids);
    requireFound(ids, found);
    for (const s of found) {
      if (s.status !== "claimed") {
        console.error(`error: ${s.id} is ${s.status}, not claimed — nothing to release`);
        throw new VerbExit(2);
      }
    }
    for (const s of found) {
      await Story.where({ id: s.id }).updateAll({
        status: "ready",
        assignee: null,
        claim_at: null,
        updated_on: today(),
      });
      await record("release", s.id);
      console.log(`released ${s.id}`);
    }
  });
}

/**
 * `in-progress` and `done`, both stamped with the PR.
 *
 * Best-effort PER ID, unlike claim (ported rule): an id already carrying this
 * exact status+pr is skipped rather than aborting the rest, because a bundle
 * whose PR merged midway must be completable by re-running the same command.
 */
export async function markTracking(
  ids: string[],
  status: Extract<StoryStatus, "in-progress" | "done">,
  pr: number | null,
): Promise<void> {
  await Base.transaction(async () => {
    const found = await findAll(ids);
    requireFound(ids, found);
    for (const s of found) {
      if (s.status === status && s.pr === pr) {
        console.log(`${status} ${s.id} (already, skipped)`);
        continue;
      }
      await s.update({ status, pr, updated_on: today() });
      await record(status, s.id, { pr });
      console.log(`${status} ${s.id}${pr === null ? "" : ` #${pr}`}`);
    }
  });
}

/**
 * Append a `spawn` event recording WHERE a dispatch came from.
 *
 * Spawn provenance was invisible: the loop, the story-page button, the RFC
 * batch button and the CI-fixer all called the same spawner, and nothing
 * recorded which. btwhooks' own Spawn registry is pruned once the PR opens, so
 * even that could not answer the question a week later.
 *
 * This lands in `events`, which is append-only and already what the velocity
 * and burndown charts read — so provenance is durable and chartable for free.
 *
 * Does NOT touch story state: a spawn is something that happened TO a story,
 * not a state transition. The claim that follows is the state change.
 */
export async function recordSpawn(
  ids: string[],
  source: string,
  opts: { branch?: string | null; pane?: string | null; rfc?: string | null } = {},
): Promise<void> {
  const detail = { source, branch: opts.branch ?? null, pane: opts.pane ?? null };

  // An RFC-scoped dispatch (a refine agent) names no story: it grooms a whole
  // RFC's backlog. Record it against rfc_id so the provenance is still there,
  // rather than dropping it for want of a story id.
  if (opts.rfc && ids.length === 0) {
    await Event.create({
      at: nowIso(),
      verb: "spawn",
      story_id: null,
      rfc_id: opts.rfc,
      pr: null,
      actor: source,
      detail: JSON.stringify(detail),
    });
    console.log(`recorded spawn (${source}) for rfc ${opts.rfc}`);
    return;
  }

  await Base.transaction(async () => {
    for (const id of ids) {
      await record("spawn", id, { actor: source, detail });
    }
  });
  console.log(`recorded spawn (${source}) for ${ids.length} stor${ids.length === 1 ? "y" : "ies"}`);
}

export async function block(id: string, reason: string): Promise<void> {
  await Base.transaction(async () => {
    const [s] = await findAll([id]);
    requireFound([id], s ? [s] : []);
    await Story.where({ id }).updateAll({
      status: "blocked",
      blocked_by: reason,
      updated_on: today(),
    });
    await record("block", id, { detail: { note: reason } });
    console.log(`blocked ${id}`);
  });
}

/**
 * Close a story with a required reason.
 *
 * The reason is not decoration: a closed story is how work gets abandoned, and
 * this note is the only record of WHY. It is carried into `events` as well as
 * the row, so it survives even if the story file is later deleted.
 */
export async function close(id: string, reason: string): Promise<void> {
  if (!reason.trim()) {
    console.error("error: close requires a reason");
    throw new VerbExit(1);
  }
  await Base.transaction(async () => {
    const [s] = await findAll([id]);
    requireFound([id], s ? [s] : []);
    await s.update({ status: "closed", closed_reason: reason, updated_on: today() });
    await record("close", id, { detail: { note: reason } });
    console.log(`closed ${id}`);
  });
}

/**
 * Set a story's status directly.
 *
 * Clears the fields the OLD status owned, because leaving them behind produces
 * a row that contradicts itself and stops agents cold. A story moved off
 * `blocked` kept its `blocked_by` text, which `export` then wrote into the
 * markdown frontmatter — so the first thing an agent read on a `ready` story
 * was a blocker saying the work could not be done. Six spawns bounced off
 * `sqlite-structure-tasks-in-memory-branch-has-no-rails-counterpart` that way,
 * two of them branching and committing nothing. Moving to `ready` likewise
 * drops a stale `claim`/`assignee`, which otherwise reads as "someone else
 * already owns this".
 */
export async function statusSet(id: string, status: StoryStatus): Promise<void> {
  await Base.transaction(async () => {
    const [s] = await findAll([id]);
    requireFound([id], s ? [s] : []);
    const fields: Record<string, unknown> = { status, updated_on: today() };
    if (status !== "blocked") fields.blocked_by = null;
    if (status === "ready") {
      fields.assignee = null;
      fields.claim_at = null;
    }
    await s.update(fields);
    await record("status", id, { detail: { arg: status } });
    console.log(`status ${status}: ${id}`);
  });
}

export async function setPriority(id: string, priority: number | null): Promise<void> {
  await Base.transaction(async () => {
    const [s] = await findAll([id]);
    requireFound([id], s ? [s] : []);
    await Story.where({ id }).updateAll({ priority, updated_on: today() });
    await record("priority", id, {
      detail: { arg: priority === null ? "(clear)" : String(priority) },
    });
    console.log(`priority ${priority === null ? "(clear)" : priority}: ${id}`);
  });
}
