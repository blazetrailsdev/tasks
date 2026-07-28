---
title: "Port ActiveRecord::Migration::CompositeForeignKeyTest"
status: ready
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:824`
defines `ActiveRecord::Migration::CompositeForeignKeyTest`, which is entirely
unported. It is a sibling class of `ForeignKeyTest` in the same Ruby file, so
`test:compare` folds it into the same row: after
`fix-foreign-key-test-describe-path` (PR #5457) that row reads
`migration/foreign_key_test.rb -> migration/foreign-key.test.ts  22 OK / 50 missing`.
The 50 missing split across the `SchemaDumpingHelper` dumper cases (already
tracked by `port-migration-foreign-key-dumper-cases`) and this composite class.

The ported half lives in `packages/activerecord/src/migration/foreign-key.test.ts`,
now nested as `describeIfSupports("foreign_keys", "Migration", ...)` >
`describe("ForeignKeyTest", ...)`. A composite port adds a sibling inner
`describe("CompositeForeignKeyTest", ...)` under the same outer `Migration`
describe, matching the Ruby nesting.

Composite-PK support is a known rough edge in trails, so expect some cases to
need adapter gating or to be genuinely blocked — record which, don't invent
behavior.

## Acceptance criteria

- [ ] Port the cases in `CompositeForeignKeyTest` (foreign_key_test.rb:824+),
      test names verbatim, into a sibling
      `describe("CompositeForeignKeyTest", ...)` in `foreign-key.test.ts`.
- [ ] Use canonical schema/models only — no bespoke tables.
- [ ] `pnpm test:compare --package activerecord` shows the
      `migration/foreign_key_test.rb` missing count drop by the number ported.
- [ ] `--gates --check` still exits 0 (no new gate mismatches).
