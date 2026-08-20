---
title: "Retire CollectionProxy's keys/entries — JS-only index iterators Rails' to: :records list has no counterpart for"
status: claimed
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-20T13:22:33Z"
assignee: "proxy-record-delegates-read-through-merging-load-target"
blocked-by: null
closed-reason: null
---

## Context

PR #6759 retired CollectionProxy's hand-written Enumerable block onto
`RECORD_DELEGATES` / `delegateArrayMethod` (`relation/delegation.ts`), but two
members of that block survived on the class because neither has a home in a
delegate table:

- `keys(): IterableIterator<number>` (`associations/collection-proxy.ts`)
- `entries(): IterableIterator<[number, T]>` (same file, directly below)

They sit beside `[Symbol.iterator]`, which carries a `@noRailsEquivalent
PERMANENT` receipt because the JS iteration protocol has no Ruby counterpart.
`keys` / `entries` were left with a plain comment rather than a receipt, and
they are counted "moved" (not novel) by `parity:api:extra`, so they cost
nothing on that metric today — which is exactly why they are easy to forget.

Rails has neither. `delegate ... to: :records`
(`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:100-103`)
does not list them, and `Enumerable` gives `each_with_index` / `each_entry`,
not a JS index iterator. `Array#each_index` is the nearest Ruby shape for
`keys` and nothing in `collection_proxy.rb` reaches for it.

The one caller is
`packages/activerecord/src/associations/collection-proxy.test.ts`
("keys / entries work (values intentionally not added)"), which is a
trails-only test with no Rails counterpart.

## Converged shape

Pick one, in preference order:

1. Delete both. `[...proxy].entries()` and `[...proxy].keys()` already work
   through `[Symbol.iterator]`, which IS the ported iteration seam, so the
   surface is redundant rather than load-bearing. Retire the trails-only test
   with them.
2. If a caller genuinely needs them, they belong in the `to: :records` table in
   `relation/delegation.ts` next to `slice` — that file is the one place the
   delegate list lives — not as hand-written class members on the proxy.

Do NOT close this by adding a `@noRailsEquivalent` tag to keep them: that
ratifies a deviation this story exists to converge. `[Symbol.iterator]`'s
receipt is not precedent — it covers the protocol JS `for...of` requires, which
these two do not.

## Acceptance criteria

- [ ] `keys` and `entries` no longer exist as members of `CollectionProxy`.
- [ ] No new `@noRailsEquivalent` tag and no allowlist row added.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface
      for `associations/collection-proxy.ts` (1 novel today).
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
- [ ] `collection-proxy.test.ts` and the `associations/` suite stay green.
