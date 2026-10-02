---
title: "activerecord: BatchEnumerator includes an Enumerable derived from its async each (sum, to_a, iteration)"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-2` audit: the eight receipts
below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE`
onto this story.

Rails' `BatchEnumerator` is `include Enumerable` over one method, `each`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches/batch_enumerator.rb:6,108-112`).
Everything else it answers comes from that mixin:

- `delete_all` is `sum(&:delete_all)` (`batch_enumerator.rb:66-68`), `update_all` and `touch_all` are
  `sum do |relation| … end` (`:75-79`, `:86-90`), and `destroy_all` is
  `sum do |relation| relation.destroy_all.count(&:destroyed?) end` (`:97-101`).
- `to_a`, `first`, `map` and iteration itself are `Enumerable`'s.

`packages/activerecord/src/relation/batches/batch-enumerator.ts` has no mixin. Its `each` is async,
so the four bodies open-code the sum as `let total = 0; for await (… of this) total += await …`
under `@missingRailsCall sum`, and the class hand-declares the surface `Enumerable` would give it:

| Member                                                                                                       | Tag                        |
| ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `deleteAll`, `updateAll`, `touchAll`, `destroyAll`                                                           | `@missingRailsCall sum` ×4 |
| `[Symbol.asyncIterator]`                                                                                     | `@noRailsEquivalent`       |
| `then` / `catch` / `finally` (the merged interface, installed by `applyThenable(BatchEnumerator.prototype)`) | `@noRailsEquivalent` ×3    |

CLAUDE.md § "`Relation` is evaluated by an async query" ratifies `applyThenable` on
`Relation.prototype`, because `await rel` has to evaluate the relation. A `BatchEnumerator` is not a
`Relation` (`batch_enumerator.rb:5`, no superclass), and nothing in that section names it or an
async iterator. ruby-compat's `Enumerable` (`packages/ruby-compat/src/enumerable.ts`) is synchronous:
it derives `findAll` / `map` / `first` / `isAny` from a sync `each`, so it cannot be included here
as it stands.

`batch-enumerator-should-not-carry-a-generator` (RFC 0023) removes the `_generator` field and is the
neighbouring story on this class; it keeps the blockless iteration surface and does not touch `sum`
or the thenable.

`activerecord/src/batches.test.ts` and `batches.trails.test.ts` consume the enumerator through
`for await (const relation of Post.inBatches(…))` (`batches.test.ts:238,391,411,419`), so the
iteration surface has call sites to move if its spelling changes.

## Acceptance criteria

- [ ] ruby-compat carries an `Enumerable` whose members are derived from an async `each` (at least `sum` and `toA`, plus the async iterator), ported from `vendor/ruby/v3.3.11/enum.c` (`enum_sum`, `enum_to_a`), and `BatchEnumerator` includes it as `batch_enumerator.rb:6` does.
- [ ] `deleteAll`, `updateAll`, `touchAll` and `destroyAll` are `sum` calls with Rails' blocks, awaited in order (one batch's statement settles before the next batch is fetched), and the four `@missingRailsCall sum` receipts are deleted.
- [ ] `[Symbol.asyncIterator]` comes from the mixin, not a hand-written member, and its receipt is deleted.
- [ ] `applyThenable(BatchEnumerator.prototype)` and the merged `then` / `catch` / `finally` interface are deleted, with every `await <enumerator>` call site moved to `toA`; or, if a caller cannot move, the story is blocked with that call site named.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green with no baseline row added.

## Verification

```bash
pnpm vitest run packages/activerecord/src/batches.test.ts packages/activerecord/src/batches.trails.test.ts
pnpm parity:api:calls && pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
