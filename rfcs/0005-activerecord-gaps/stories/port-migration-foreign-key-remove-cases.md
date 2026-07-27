---
title: "Port the remove_foreign_key half of migration/foreign_key_test.rb"
status: done
updated: 2026-07-27
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5450
claim: "2026-07-27T20:17:51Z"
assignee: "port-migration-foreign-key-remove-cases"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `port-migration-foreign-key-add-cases`, which ports only the
`add_foreign_key` half of
`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb`. The
`remove_foreign_key` cases (`foreign_key_test.rb:330` onward —
`test_remove_foreign_key_inferes_column`, `_by_column`, `_by_name`,
`_by_symbol_column`, the `if_exists` variants, and
`test_remove_foreign_key_with_restrict_dependent`) are still unported, as are
the `SchemaDumpingHelper`-driven dumper cases in the same class.

trails already has converged behavior for most of this — RFC 0051 shipped
`abstract-fk-mutators-use-foreign-keys-guard`,
`foreign-key-exists-composite-column-value-match`, and
`foreign-key-defined-for-slice-stored-option-keys` — but only via unit tests on
`schema-statements-on-adapter.test.ts` stubs, not against Rails' own test class
on a real connection. PR #5287 pinned the `ifExists`-probe-matches-on-to_table
behavior that way (`removeForeignKey ifExists probe matches on to_table only,
not name (Rails)`); the Rails-named cases still count as missing in
`test:compare`.

Depends on `port-migration-foreign-key-add-cases` landing first, since that
story creates `packages/activerecord/src/migration/foreign-key.test.ts` and
lifts the shared `withRocketTables` setup
(`foreign_key_test.rb:178-194`) out of `schema-statements-on-adapter.test.ts`.
Do not open both PRs in parallel — they touch the same file.

## Acceptance criteria

- [ ] The `remove_foreign_key` cases of `foreign_key_test.rb` are ported into
      the existing `packages/activerecord/src/migration/foreign-key.test.ts`,
      test names matching Rails verbatim.
- [ ] Cases run against the ambient connection via the shared
      `withRocketTables` setup — no new `:memory:` adapter, no bespoke tables.
- [ ] The `unless current_adapter?(:SQLite3Adapter)` FK-name guards are honored
      rather than dropped.
- [ ] Decide explicitly whether the `SchemaDumpingHelper` dumper cases fit here
      or need their own story; if they exceed the 500-LOC ceiling, register them
      separately rather than widening this PR.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
