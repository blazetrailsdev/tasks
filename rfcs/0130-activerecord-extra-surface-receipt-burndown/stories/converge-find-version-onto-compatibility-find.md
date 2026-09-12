---
title: "converge-find-version-onto-compatibility-find"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**`findVersion` itself is converged (trails#7729).** It is now the exact lookup
`Compatibility.find` is (`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:6-14`),
raising `ArgumentError` with Rails' message shape
(`Unknown migration version "8.5"; expected one of "8.0"`), and the nearest-lower fallback
plus the `compareVersions` / `parseVersion` helpers that served it are deleted. A regression
test pins it (`migrator.trails.test.ts`, "findVersion raises for a version above the highest
registered one").

What remains is the reason the fallback existed: **trails defines ZERO
`Compatibility::V*` classes, where Rails defines nine** — `V8_0` down to `V4_2`
(`migration/compatibility.rb`). trails registers only `Current`.

That was reviewed and accepted as the right trade in trails#7729 rather than left implicit:
nothing in the repo resolved through the fallback, and a `Migration[7.0]` that silently ran
today's semantics was the exact failure `Compatibility` exists to prevent (its own comment at
`:16-19` — "if you write a migration on Rails 6.1, then upgrade to Rails 7, the migration
should do the same thing to your database as it did when you were running Rails 6.1"). A clear
`ArgumentError` beats a silent wrong answer. But it does mean `Migration[7.0]` now raises
where it previously resolved, and the only real fix is the classes.

## Converged shape

Port the `Compatibility::V*` classes trails needs, each carrying its Rails behaviour deltas, and
register them. Rails' set and the deltas are all in
`vendor/rails/activerecord/lib/active_record/migration/compatibility.rb`:

- `V8_0` (`:32`) is the current alias — trails' `Current` already fills this slot and just needs
  registering under its own name as well.
- `V7_2` (`:36`) — `create_table` default `_uses_legacy_table_name`, validate-constraint
  defaults.
- `V7_1` (`:48`) — `change_column_null` / `add_column` datetime precision, index algorithm.
- `V7_0` (`:100`) — `create_table` `id: :integer` legacy primary keys, `new_column_definition`.
- `V6_1` (`:160`) — `change_column` / `add_column` precision defaults, `t.timestamps`.
- `V6_0` (`:216`), `V5_2` (`:246`), `V5_1` (`:280`), `V5_0` (`:300`), `V4_2` (`:399`).

Each is an independently shippable slice; they do not have to land together, but each one that
lands restores a version `Migration[x]` can name again.

## Acceptance criteria

- [ ] The `Compatibility::V*` classes are ported with their behaviour deltas and registered, so `Migration[x]` resolves every version trails claims to support.
- [ ] `Current` is registered under its own version as well as as `Current`.
- [ ] Each ported class has tests covering the delta it carries, mirroring Rails' `test/cases/migration/compatibility_test.rb`.
- [ ] `findVersion`'s `@noRailsEquivalent CONVERGEABLE` receipt is retired: `Compatibility.find` is its Rails counterpart and the ported shape now matches it.
