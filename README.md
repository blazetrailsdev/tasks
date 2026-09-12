# blazetrailsdev/tasks (next)

RFCs and structured work tracking for [`blazetrailsdev/trails`](https://github.com/blazetrailsdev/trails).

Successor to the git-as-database tasks repo. Story **state** lives in SQLite,
reached through trails' own ActiveRecord; **prose and structure** stay in
markdown under `rfcs/`, reviewed via PR.

## Why the split

The old repo used git as both its transaction log and its event store: every
status flip was a `pull --rebase` → commit → `push` race guarded by an advisory
lock file, and burndowns were reconstructed by parsing 27k commit subjects.
Transactions and event logs both want a real store. Prose does not.

## Field ownership

Frontmatter fields are partitioned into two sets with **exactly one authority
each**, and the sets are disjoint — so this is not bidirectional sync and
cannot conflict.

| Owner        | Fields                                                                                    | Written by               |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------ |
| **Markdown** | `title`, `rfc`, `cluster`, `deps`, `deps-rfc`, `est-loc`, `packages`, body prose          | humans/agents via PR     |
| **DB**       | `status`, `pr`, `claim`, `assignee`, `blocked-by`, `closed-reason`, `updated`, `priority` | the CLI's mutation verbs |

- **`tasks ingest`** (git → DB) upserts only markdown-owned columns. It is the
  sole creator and deleter of rows. Frontmatter `status` and `priority` are
  honored **on insert only**, as birth seeds — never as sync values.
- **`priority` is DB-owned** (`DB_OWNED` in `src/ingest.ts`, asserted by
  `src/priority-ownership.test.ts`). Set it with `tasks priority <id> <n>`.
  It used to be markdown-owned while the verb wrote the DB, which made every
  priority an agent set silently temporary — export never carried it out and
  the next ingest reverted it. Editing `priority:` in a story file still does
  nothing durable.
- **`tasks export`** (DB → git) writes only DB-owned fields, batched hourly into
  a single commit. Never in the mutation path.
- CI **rejects any PR that edits a DB-owned field**, so a hand-edited
  `status: done` fails loudly instead of being silently ignored at ingest.

## The atomic claim

There is no lock file. A claim is one conditional update, and the affected-row
count is the race resolution:

```sql
UPDATE stories SET status='claimed', assignee=?, claim_at=?
 WHERE id=? AND status='ready'
```

Zero rows affected means another agent won; the CLI exits 2.

## trails is tracked from main, continuously

This CLI depends on trails, and the agents it dispatches are the ones editing
trails. That is a deadlock waiting to happen: consuming trails from the live
checkout means a broken trails `main` wedges the CLI that dispatches the agent
who would fix it.

The old answer was a static pin, which traded the deadlock for unbounded
staleness — it reached **538 commits behind** — and defeated the second half of
RFC 0136: trailmap is meant to be the _proving ground_ for trails, and a
proving ground that stale proves very little.

The answer now keeps both properties. `vendor/` still holds immutable packed
tarballs and `vendor/TRAILS_PIN` still records the SHA, so the installed bytes
are always a named commit and `git revert` of a bump is still the one
deliberate action that returns to a known-good state. What changed is that the
bump happens by itself, and only ever after the bytes have been proven:

```bash
pnpm trails:track     # scripts/track-trails.sh — the whole job, cron-safe
pnpm trails:status    # which trails am I on, how far behind, did the last run fail?
pnpm smoke            # the gate, on the currently installed trails
```

`track-trails.sh` builds trails main in a tracking clone of its own, vendors
and installs it in a **scratch worktree**, and runs `pnpm smoke` there. A red
trails main dies at that step, having touched nothing the fleet runs. Only a
candidate that passed is applied to this checkout — where it is installed and
smoked a second time, with a rollback to the previous pin if that fails — and
only then committed and pushed.

`pnpm smoke` is what "proven" means: connect, migrate, write through the
models, run the ready queue, and finally invoke `bin/tasks ready --json` as a
subprocess so the packaged `dist` is exercised the way an agent invokes it. CI
runs it too, so a hand-edited `vendor/` is held to the same bar and the gate
cannot rot between bumps.

**Failures are surfaced, never swallowed.** A held pin is the failure mode that
used to be invisible, so a failed run exits non-zero, records itself where
`pnpm trails:status` reads it back, and writes a ready-to-file story body with
the `pnpm tasks new` command to file it — per RFC 0136, a trails gap this
application hits is supposed to _become_ a story against the framework.
`pnpm trails:status` escalates to a non-zero exit once a failed run has held
the pin for more than 48h.

Bumping by hand still works and is still a normal thing to do:

```bash
scripts/vendor-trails.sh              # re-pack from the trails checkout at HEAD
scripts/vendor-trails.sh ~/src/trails <ref>
pnpm install && pnpm smoke
```

`vendor-trails.sh` refuses to vendor when the checkout's HEAD is not the ref it
is recording, because packing reads the working tree — a pin that misdescribes
the installed bytes is worse than a stale one. `track-trails.sh` satisfies that
honestly with a detached checkout rather than working around it.

Never replace these with a `link:`/`file:` pointer at a working checkout: that
is the shape with no gate in front of it, and it is the deadlock.

## Editing this checkout

btwhooks fast-forwards this checkout whenever the repo is pushed, so it is not a
quiet place to work. It stashes a dirty tree before pulling and pops it after —
but a pop that conflicts is left in the stash, and an edit that vanishes
mid-keystroke reads as "nothing to commit, working tree clean" rather than as an
error.

Prefer a worktree (`scripts/start-worktree.sh <name>`) for anything non-trivial.
If you do edit here, commit in the same breath, and check `git stash list` if a
change seems to have evaporated.

## Requirements

Node 22.5+ for `node:sqlite` (pinned to 24.16.0 in `.tool-versions`). The
SQLite binding is the builtin — **no native modules** — which is what lets the
same host-installed `node_modules` run inside the musl-based btwhooks container.
Do not switch to `better-sqlite3`.
