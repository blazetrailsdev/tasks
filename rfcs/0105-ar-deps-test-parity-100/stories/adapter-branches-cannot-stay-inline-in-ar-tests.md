---
title: "adapter branches cannot stay inline in AR test bodies"
status: draft
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails puts `current_adapter?` branches **inline in the test body**, and the
assertion comparer counts every arm. `vitest/no-conditional-in-test` is `error`
for `packages/activerecord/**/*.test.ts` (`eslint.config.mjs:936-946`), so a
faithful port cannot keep the branch where Rails has it and must hoist it into a
same-file helper Rails does not have.

Concrete instances shipped in PR #7261 (`assertions-migration-cluster`), all
three in `packages/activerecord/src/migration/`:

- `change-schema.test.ts` `bigintColumn()` — hoists
  `change_schema_test.rb:109-114` (`SQLite3Adapter` → `sql_type`, else `type` +
  `limit`).
- `change-schema.test.ts` `datetimeSqlType()` — hoists the three-arm branch of
  `change_schema_test.rb:276-282`, `:294-300` and `:329-336`.
- `columns.test.ts` `indexesSurvivingColumnDrop()` — hoists
  `columns_test.rb:144-150` (PostgreSQL → `[]`, else the multi-column index
  name).

The hoist also has a **second, non-obvious constraint** that any future port
must respect: the helper's name must NOT begin with `assert`/`refute`/`expect`/
`must`/`wont`. `isAssertionCallee` (`scripts/test-compare/extract-ts-core.ts:40`)
treats such a name as a single assertion of its own and stops folding, so the
arms inside vanish from the count. That is exactly the bug the pre-existing
`assertBigintColumn` was hiding: Rails' three `assert_equal`s scored as trails 0
with `[unmapped: trails:assertBigintColumn]`.

So today the rule silently pushes ports toward one of two wrong shapes — an
invented helper, or an invented helper that also miscounts.

## Converged shape

Let an adapter branch sit where Rails puts it. Options, cheapest first:

1. Narrow `vitest/no-conditional-in-test` for AR tests so a condition whose test
   is `adapterType`/`currentAdapter()` (the `current_adapter?` analogue) is
   allowed, keeping the rule's real target — data-dependent `if`s that make a
   test assert nothing — intact.
2. Failing that, record the hoist-plus-naming rule where porters will hit it
   (CLAUDE.md's testing section), so the miscount is not re-derived per file.

Either way the naming constraint above should be written down; it is currently
discoverable only by watching an assertion count go to 0.

## Acceptance criteria

- An `adapterType` branch can live inline in an AR test body without a lint
  error, OR the hoist-plus-naming rule is documented for porters.
- The three helpers above are inlined back to Rails' shape if option 1 lands.
- `pnpm parity:test -- --package activerecord --assertions` reports no
  regression for `migration/change_schema_test.rb` or `migration/columns_test.rb`
  (both at 0/0/0 as of PR #7261).
