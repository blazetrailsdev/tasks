---
title: "Port fixture_set/{table_rows,table_row,model_metadata}.rb out of fixtures.ts"
status: closed
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of converge-fixture-row-building-onto-table-rows (RFC 0130), which predates it and owns the same convergence — reshaping fixtures.ts' row-building onto FixtureSet#table_rows / TableRow requires exactly these three modules. Its unique content (the three fixture_set/*.rb files with Rails line numbers, the three unported-files pattern rows, the fixtures.ts:74 receipt deletion, and the out-of-scope note on the #table_rows case exclusions) moved onto that story in blazetrailsdev/tasks#81."
---

## Context

PR #7655 ported `fixture_set/file.rb` and `fixture_set/render_context.rb`
(`packages/activerecord/src/fixture-set/file.ts`, `render-context.ts`) and
narrowed the old blanket `pattern: "fixture_set"` exclusion in
`scripts/parity/unported-files/unscoped.ts` to one row per remaining lib file.
Three are left unported:

- `vendor/rails/activerecord/lib/active_record/fixture_set/table_rows.rb` —
  `TableRows#initialize` (`:6-19`) builds the per-table row collection from a
  fixture set, resolving `model_metadata` and each `TableRow`; `#to_hash`
  (`:21-23`) is what `FixtureSet#table_rows` (`fixtures.rb:742`) answers.
- `vendor/rails/activerecord/lib/active_record/fixture_set/table_row.rb` —
  `TableRow#initialize` (`:8-16`) plus the private
  `fill_row_model_attributes`, `resolve_sti_reflections`,
  `fill_timestamps`, `resolve_enums`, `resolve_sti_reflections`'s
  `add_join_records` / `resolve_fk_reflection`.
- `vendor/rails/activerecord/lib/active_record/fixture_set/model_metadata.rb` —
  `ModelMetadata#primary_key_name` / `#primary_key_type` /
  `#has_primary_key_column?` / `#timestamp_column_names` /
  `#inheritance_column_name` (`:8-40`).

trails does all three jobs inline in `fixtures.ts` — `prepareModelFixtures`,
the ref/enum/timestamp resolution around `:560-740`, and the PK derivation at
`:56-79` (which already carries a `@noRailsEquivalent CONVERGEABLE` receipt
naming `FixtureSet#table_rows`, `fixtures.rb:742`). So this is a decomposition
deviation, not a behaviour gap: one Rails method per TS method is the bar, and
today three Rails classes are one flat TS module.

It blocks real test parity. `unscoped.ts` case-excludes the `fixtures_test.rb`
cases that instantiate a fixture set and compare `#table_rows` directly
(`fixtures_test.rb:668,687,695`) with the reason that trails has no
`FixtureSet` instance to call it on — `FixtureSet` (`fixtures.ts:896`) is
static-only.

## Converged shape

Three modules mirroring the Rails files, each one Rails method per TS method:

- `packages/activerecord/src/fixture-set/table-rows.ts` — `class TableRows`
  with `toHash()`.
- `packages/activerecord/src/fixture-set/table-row.ts` — `class TableRow` with
  Rails' private helpers extracted under Rails' names.
- `packages/activerecord/src/fixture-set/model-metadata.ts` —
  `class ModelMetadata` with the five readers as accessor properties (zero-arg
  Ruby readers, per CLAUDE.md).

`fixtures.ts`' inline resolution then delegates to them, and the
`@noRailsEquivalent CONVERGEABLE` receipt at `fixtures.ts:74` is deleted.

## Acceptance criteria

- The three modules exist with Rails' class, method, local and parameter names,
  Rails' branch order and Rails' decomposition.
- The three `pattern:` rows for them in `scripts/parity/unported-files/unscoped.ts`
  are deleted, and `parity:api` credits all three `fixture_set/*.rb` files.
- The `fixtures.ts:74` `@noRailsEquivalent CONVERGEABLE` receipt is removed, not
  reworded.
- `parity:api` activerecord method and file deltas are non-negative;
  `parity:api:extra:gate` novel/total do not rise.
- Retiring the `#table_rows` case-level exclusion rows is explicitly OUT of
  scope — file that separately once a `FixtureSet` instance exists.
