---
title: "activerecord: in_batches validates its options before acting on the ignored order"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8713
claim: "2026-10-09T15:09:37Z"
assignee: "activerecord-converge-invented-control-flow-arms-root-g-p-part-2-residue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8494. Rails' `in_batches`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:258-265`) runs
`ensure_valid_options_for_batching!(cursor, start, finish, order)` first, then
`act_on_ignored_order(error_on_ignore)`, then returns the `BatchEnumerator` for the blockless arm.

`packages/activerecord/src/relation/batches.ts#inBatches` runs `actOnIgnoredOrder` at call time and
`ensureValidOptionsForBatchingBang` later, inside the generator, because the validation awaits
`model.schemaCache().indexes(tableName)` (`batches.rb:315`) and the blockless arm returns the
enumerator synchronously. Two observable differences follow:

- `errorOnIgnore: true` together with an invalid `start` / `finish` / `cursor` / `order` raises the
  ignored-order error where Rails raises the validation error.
- A blockless `inBatches` with an invalid option raises nothing until the enumerator is iterated,
  where Rails raises at the call.

Moving `actOnIgnoredOrder` into the generator after the validation was tried in trails#8494 and
reds `batches.test.ts` "in batches should error on ignore the order": Rails'
`in_batches(error_on_ignore: true).delete_all` (`test/cases/batches_test.rb:324-326`) must raise at
the blockless call, and `BatchEnumerator#each` does not forward `error_on_ignore`
(`relation/batches/batch_enumerator.rb:104-108`).

The three checks that need no query (`:start` size, `:finish` size, `:order` values,
`batches.rb:307-312,321-323`) can run synchronously ahead of `actOnIgnoredOrder`. Only the
unique-index lookup (`:314-319`) needs the schema cache, and
`SchemaCache#getCachedIndexes`-style peeks are the settled sync shape (CLAUDE.md § "Schema
reflection peeks at a warm cache").

## Acceptance criteria

- [ ] `inBatches` validates before `actOnIgnoredOrder`, in Rails' order, for both the block and the blockless arm, or the story is blocked naming the check that cannot run synchronously.
- [ ] A blockless `inBatches` with an invalid `order` raises at the call, with a `.trails.test.ts` case; the two existing invalid-order cases in `batches.trails.test.ts` still pass.
- [ ] `batches.test.ts` and `batches.trails.test.ts` green; `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` green.
