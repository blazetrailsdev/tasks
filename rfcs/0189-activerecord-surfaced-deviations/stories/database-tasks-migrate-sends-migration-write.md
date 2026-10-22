---
title: "activerecord: DatabaseTasks.migrate sends Migration.write instead of calling it"
status: draft
updated: 2026-10-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.migrate` (`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:277`)
is `Migration.write("No migrations ran. (using #{scope} scope)")` — a plain call to a
class method of `ActiveRecord::Migration`.

trails spells it `rbFSend(Migration, "write", ...)`
(`packages/activerecord/src/tasks/database-tasks.ts:252`), because `write` is ported as an
INSTANCE method (`packages/activerecord/src/migration.ts:983`), so `Migration.write(...)` does
not type-check. CLAUDE.md § "A dispatch by name is spelled directly" makes the direct call the
ported shape wherever the name is known where the call is written, and this name is a literal.

Surfaced while building the literal-name send ratchet (trails#9143). The ratchet freezes the
count, so this site is held but not converged.

Note the send may also be a live bug: `rbFSend` walks the receiver for a member named `write`,
and a class receiver has no such static, so the arm likely raises rather than printing.
Check it against Rails' behaviour before converging.

## Converged shape

`Migration.write(...)`, with `write` reachable as a class method the way Rails reaches it
(`Migration` extends the module that defines it, or the static is added beside the instance
method), and no `rbFSend` at the call site.

## Acceptance criteria

- [ ] `tasks/database-tasks.ts:252` calls `Migration.write(...)` directly.
- [ ] A test covers the "No migrations ran" path and asserts the message is written.
- [ ] `pnpm parity:api:sends` total drops by one; `pnpm parity:api:calls` and `parity:api:extra:gate` stay green.
