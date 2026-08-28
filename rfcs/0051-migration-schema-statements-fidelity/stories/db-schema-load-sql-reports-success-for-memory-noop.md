---
title: "db schema:load --format=sql reports success for a :memory: load that did nothing"
status: ready
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sqlite-structure-load-in-memory-lane-decision` (PR #7136) settled what
`structureLoad` does for a `:memory:` config: option 1 — no trails-only adapter
path, just Rails' three-liner
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:60-63`).
The child `sqlite3 :memory: < dump.sql` opens its own throwaway in-memory
database, applies the script there, and exits, so the connection that owns the
real database never sees it. That is Rails' behaviour and it is now pinned by
`sqlite-database-tasks.trails.test.ts` — "leaves the live in-memory connection
untouched, as Rails' child process does".

The loose end is the CLI. `trails db schema:load --format=sql` against a
`:memory:` config now runs, prints "Loading schema from ...", prints
"Schema loaded.", exits 0, and has loaded nothing. The decision documented in
the story explicitly wanted the operation reported as meaningless for
`:memory:` rather than silently succeeding; that half was not built in #7136
because the predicate it needs is not reachable from trailties.

`isInMemoryDatabase` (`packages/activerecord/src/sqlite/sqlite-uri.ts:25`) is
`@internal` and not re-exported from `packages/activerecord/src/index.ts`, so
`packages/trailties/src/commands/db.ts` (the `schema:load` action, and the
shared `runTestLoadSchema` helper) has no way to ask the question. Adding the
export purely for this would have put a new public name on the measured surface
inside a PR that was retiring surface.

Rails has no counterpart to weigh this against — it has no in-memory lane at
all — so this is a CLI product decision, not a port.

## Converged shape

Decide and implement one of:

1. `db schema:load --format=sql` detects a `:memory:` sqlite config before
   dispatching, prints that the operation is not meaningful for an in-memory
   database, and exits non-zero (or zero with the message) instead of claiming
   "Schema loaded.". Needs a reachable predicate — prefer routing the check
   through an already-public seam over exporting `isInMemoryDatabase`, since
   that name is `@internal` and `@noRailsEquivalent PERMANENT`.
2. Leave the behaviour and fix only the output, so the success lines are not
   printed for a lane where nothing was loaded.

Whichever is chosen, `SQLiteDatabaseTasks#structureLoad` must stay Rails'
three-liner — do not reintroduce a `:memory:` branch there. That is the
decision #7136 recorded, and re-litigating it needs new evidence, not a
convenience.

## Acceptance criteria

- [ ] `trails db schema:load --format=sql` against a `:memory:` config no
      longer reports success for a load that did nothing.
- [ ] `structureLoad` still matches `sqlite_database_tasks.rb:60-63` with no
      in-memory branch.
- [ ] `packages/trailties/src/commands/db.test.ts` covers the new behaviour.
- [ ] No new public surface on `@blazetrails/activerecord`, or a reviewed
      `@noRailsEquivalent` if one is genuinely unavoidable.
- [ ] Green on sqlite and `sqlite3_mem`.
