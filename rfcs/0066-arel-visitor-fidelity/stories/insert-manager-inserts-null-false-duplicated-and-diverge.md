---
title: "insert-manager inserts null/false tests duplicated and diverge from Rails"
status: in-progress
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5031
claim: "2026-07-21T18:15:17Z"
assignee: "insert-manager-inserts-null-false-duplicated-and-diverge"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5017
(insert-manager-valueslist-test-duplicated-and-diverges), which fixed the same
defect class for `can create a ValuesList node` but kept scope to that one test.

`packages/arel/src/insert-manager.test.ts` still has two tests duplicated
across fragmented `describe("insert")` blocks:

- `inserts false` — `:58` and `:185`
- `inserts null` — `:65` and `:171`

Rails declares each exactly once
(`vendor/rails/activerecord/test/cases/arel/insert_manager_test.rb:79` and
`:89`). Since `test:compare` matches our tests to Rails' by name, the duplicate
cannot improve the mapping.

Both also diverge from the Rails tests they are named after:

`inserts false` (insert_manager_test.rb:79-86) uses `table[:bool]`, no `into`,
and asserts the exact rendering `INSERT INTO "users" ("bool") VALUES ('f')`.
Ours uses `users.get("active")`, calls `into`, and asserts a loose
`toContain("FALSE")` — which would pass on several renderings Rails would not
produce. The `'f'` quoting of `false` is the actual behavior under test and our
version does not check it.

`inserts null` (insert_manager_test.rb:89-96) uses `table[:id]` and never calls
`into` (it exercises the defaults-the-table path). Ours uses
`users.get("name")` and calls `into` explicitly, so it does not cover that path.

Note the three `converts to sql` tests are NOT duplicates — Rails has three
distinct ones under the `into`, `columns`, and `values` describe blocks
(:154, :164, :177). All three are ported as of #5017; leave them alone.

## Acceptance criteria

- [ ] `inserts false` and `inserts null` each appear once.
- [ ] The surviving copies port Rails' assertions per
      insert_manager_test.rb:79-96: `bool`/`id` columns, no `into` call, exact
      `to_sql` equality including `VALUES ('f')` for false.
- [ ] Test names unchanged.
- [ ] Fragmented duplicate `describe("insert")` blocks consolidated if it falls
      out naturally; not required.
- [ ] test:compare delta for `insert_manager_test.rb` non-negative (currently
      19/19, 0 Miss, 9 TS-extra).
