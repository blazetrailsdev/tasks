---
title: "Split trails' merged Migrator into Rails' MigrationContext + Migrator class pair"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails splits migration orchestration across two classes in `migration.rb`:

- `MigrationContext` (migration.rb:1211-1402) — long-lived, owns
  `migrations_paths`, file discovery, `migrations`, `migrations_status`,
  `current_version`, `needs_migration?`, `protected_environment?`, and the
  `migrate` / `up` / `down` / `run` / `rollback` / `forward` entry points. It
  holds no per-run state.
- `Migrator` (migration.rb:1404-1560) — constructed fresh per run with
  `@direction` / `@target_version`, owns `run`, `migrate`, `runnable`,
  `migrated`, the advisory-lock wrapper and the private per-run helpers.

trails collapses both into a single exported `Migrator` class in
`packages/activerecord/src/migration.ts`, and separately uses the name
`MigrationContext` for an unrelated schema-DSL wrapper (`createTable`,
`addIndex`, `columns`, …) that has no Rails counterpart under that name —
Rails' `MigrationContext` has no schema DSL at all.

PR #5484 (split-per-run-migrator-out-of-migration-context) converged the
_behaviour_: `direction` / `target_version` are now construction state, and
`run` / `up` / `down` each build a per-run `Migrator`, so `run_without_lock`,
`migrate_without_lock` and `invalid_target?` are zero-arg like Rails. What it
could NOT do inside one PR is the naming/object-graph half: the correct
`Migrator` name is occupied by the merged class, and the correct
`MigrationContext` name is occupied by the schema-DSL class. api-compare is
class-agnostic (it keys on `(tsFile, methodName)`), which is why the merged
class still scores clean — the deviation is invisible to the gates.

Blast radius measured at the time: `Migrator` has ~293 references across 25
files (activerecord, activerecord-cli, trailties, website), `MigrationContext`
~179 across 37 files. Well past the 500-LOC PR ceiling, so this needs
sequencing across several merged-then-branched PRs, not a fan-out.

Related: `0051-migration-schema-statements-fidelity/collapse-migrationcontext-remaining-dsl-and-introspection`
and `collapse-migrationcontext-introspection-onto-adapter` (both done) have been
draining the schema-DSL `MigrationContext` toward the adapter — that is the
work that eventually frees the name.

## Acceptance criteria

- The schema-DSL `MigrationContext` is fully drained onto the adapter /
  `SchemaStatements` (or renamed), freeing the `MigrationContext` name.
- The long-lived half of trails' `Migrator` moves to `MigrationContext`,
  matching migration.rb:1211-1402; the per-run half keeps the `Migrator` name,
  matching migration.rb:1404-1560.
- `api:extra` shows no novel extra surface and the class names are the Rails
  ones; sequenced as ordered, individually-merged PRs from `main`, each under
  the 500-LOC ceiling — no stacked branches.
