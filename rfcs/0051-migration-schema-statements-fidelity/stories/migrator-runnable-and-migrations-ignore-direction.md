---
title: "Port Migrator#runnable / #migrations direction-awareness and the start/finish/target helpers"
status: draft
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

Rails' `Migrator#migrations` and `#runnable` are both direction-aware
(`vendor/rails/activerecord/lib/active_record/migration.rb:1466-1480`):

```ruby
def runnable
  runnable = migrations[start..finish]
  if up?
    runnable.reject { |m| ran?(m) }
  else
    # skip the last migration if we're headed down, but not ALL the way down
    runnable.pop if target
    runnable.find_all { |m| ran?(m) }
  end
end

def migrations
  down? ? @migrations.reverse : @migrations.sort_by(&:version)
end
```

with the private `start` / `finish` / `target` helpers at migration.rb:1538-1546:

```ruby
def target;  migrations.detect { |m| m.version == @target_version } end
def finish;  migrations.index(target) || migrations.size - 1        end
def start;   up? ? 0 : (migrations.index(current) || 0)             end
```

trails (`packages/activerecord/src/migration.ts`) has none of this shape:

- `get migrations()` returns `[...this._migrations]`, always ascending — it
  never reverses for `down?`.
- `async runnable()` is `return this.pendingMigrations()` — direction-blind, no
  `start..finish` slice, no `runnable.pop if target`, and for `down` it returns
  _unapplied_ migrations where Rails returns _applied_ ones
  (`find_all { |m| ran?(m) }`). It is effectively wrong for every down run.
- `start` / `finish` / `target` do not exist; `_migrateUp` / `_migrateDown`
  hand-roll the equivalent filtering inline.

PR #5484 (split-per-run-migrator-out-of-migration-context) made `direction` and
`targetVersion` construction state on `Migrator`, which is the precondition
these methods need — `up?` / `down?` (`isUp()` / `isDown()`) and
`this._targetVersion` are now available without threading. Before that PR these
could not be ported at all.

Note `runnable()` currently has no test coverage and no caller inside
`migration.ts` — `_migrateUp` / `_migrateDown` are used instead — so converging
it is a prerequisite for ever routing the migrate paths through Rails' actual
selection logic.

## Acceptance criteria

- `migrations` reverses when `isDown()`, matching migration.rb:1474.
- `runnable` ports migration.rb:1466-1472 including the `runnable.pop if target`
  arm and the `ran?` polarity flip between up and down.
- Private `start` / `finish` / `target` helpers land under their Rails names in
  `migration.ts`, with `api:compare` showing no new arity mismatch and no novel
  extra surface.
- Tests cover a down run with a target (last migration skipped) and without one
  (all the way down). Rails' `migrator_test.rb` cases with matching names are
  ported verbatim where they exist; any trails-only case goes in
  `migrator.trails.test.ts`.
