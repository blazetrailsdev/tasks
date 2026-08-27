---
title: "Decide what db schema:load --format=sql does for a :memory: config"
status: in-progress
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: ["activerecord", "trailties"]
deps: ["sqlite-structure-tasks-in-memory-branch-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 180
priority: null
pr: 7136
claim: "2026-08-27T20:13:47Z"
assignee: "sqlite-structure-load-in-memory-lane-decision"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#structureLoad`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts:172`) branches to a
trails-only adapter path Rails does not have:

    if (isInMemoryDatabase(this.dbConfig.database as string))
      return this.inMemoryStructureLoad(filename);   // :173-174

Rails' `structure_load`
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:60-63`)
is three lines that shell out unconditionally:

```ruby
def structure_load(filename, extra_flags)
  flags = extra_flags.join(" ") if extra_flags
  `sqlite3 #{flags} #{db_config.database} < "#{filename}"`
end
```

Split out of `sqlite-structure-tasks-in-memory-branch-has-no-rails-counterpart`,
which was blocked because it required deleting both in-memory halves at once
and only the dump half is mechanically convergeable. That story now owns the
dump (via `VACUUM INTO`) and is unblocked; this one owns the load, which is
**not** a mechanical convergence and must not be scheduled as one.

**Why the load half is different.** A child `sqlite3 :memory: < dump.sql`
process creates its own in-memory database, applies the script to it, and
discards it at exit — the parent connection that owns the real database never
sees any of it. SQLite has no inverse of `VACUUM INTO`: nothing pulls a file's
schema back into a live in-memory connection. So the adapter exec that
`inMemoryStructureLoad` (`:247`) already performs is the only mechanism that
can apply the script to the connection that owns the database. Deleting it
without replacing the behaviour makes `db schema:load --format=sql` a silent
no-op against `:memory:`.

## The decision this story exists to make

What should `db schema:load --format=sql` (and its `schema:dump` counterpart)
DO for a `:memory:` config? Rails never has to answer, because it has no
in-memory lane. The candidate answers, to be chosen explicitly rather than
drifted into:

1. **Retire the lane's use of the task methods.** The in-memory case never
   reaches `structureLoad`; the CLI reports that the operation is meaningless
   for `:memory:` and exits non-zero (or zero with a message). Rails' honest
   analogue for the dump direction is an empty dump. Requires rewriting
   `packages/trailties/src/commands/db.test.ts`'s `:memory:` expectations.
2. **Keep the adapter exec and justify it at the call site** as a
   documented, permanent trails extension for a lane Rails does not have,
   with a `@noRailsEquivalent PERMANENT` receipt. Note CLAUDE.md: a
   deviation story does not close by writing a better justification — so
   choosing this means the _lane_ is the ratified thing, and that argument
   has to be made on its own merits, not as a way to retire this story.
3. **Drop the in-memory lane from the CLI surface entirely**, so the config
   never reaches a task class. Largest blast radius; check what depends on
   `sqlite3_mem` before pricing it.

Option 1 is the one the original blocker leaned toward. It is a scope and
product call, not a port — which is why this is its own story.

## Decision

**Option 1.** `structureLoad` is Rails' three-liner
(`sqlite_database_tasks.rb:60-63`) unconditionally; `inMemoryStructureLoad` and
the `:memory:` branch are deleted. The `:memory:` lane gets Rails' behaviour: the
child `sqlite3` opens its own throwaway in-memory database, applies the script
to that, and exits, so `db schema:load --format=sql` is not a meaningful
operation against a `:memory:` config — in trails as it would be in Rails.

Option 2 was rejected because it ratifies a trails-only adapter path in a
three-line ported body, and CLAUDE.md's "converge, never ratify" rule makes the
lane itself the thing that would have to be argued. Option 3 was rejected as
out of proportion: `sqlite3_mem` is a first-class CI lane and dropping it from
the CLI surface is a far larger change than this gap warrants.

The reason is recorded at the call site on `structureLoad`, and pinned by
`sqlite-database-tasks.trails.test.ts` — "leaves the live in-memory connection
untouched, as Rails' child process does". The dump half is unaffected:
`structureDump` keeps its `VACUUM INTO` materialisation, and its in-memory
tests now lay their schema through the live connection rather than seeding
through `structureLoad`.

## Acceptance criteria

- [ ] One of the options above is chosen, with the reason recorded in the
      story and at the call site.
- [ ] `structureLoad` matches `sqlite_database_tasks.rb:60-63` on the
      file-backed path, whatever is decided for `:memory:`.
- [ ] If option 1: `inMemoryStructureLoad` and the `:173` branch are deleted,
      `isInMemoryDatabase`'s import is dropped if nothing else uses it, and
      `packages/trailties/src/commands/db.test.ts` asserts the new documented
      behaviour rather than the old round-trip.
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.

## Notes

Sequence after `sqlite-structure-tasks-in-memory-branch-has-no-rails-counterpart`
lands — that story deletes the dump branch and leaves `isInMemoryDatabase`
imported solely for the load branch, which is the state this story starts from.
