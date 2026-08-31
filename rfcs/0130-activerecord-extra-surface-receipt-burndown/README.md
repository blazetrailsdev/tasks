---
rfc: "0130-activerecord-extra-surface-receipt-burndown"
title: "Burn activerecord's 342 untagged novel names down to zero so the package leaves the counted extra-surface mark for tagged-only mode"
status: draft
created: 2026-08-30
updated: 2026-08-30
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - fidelity
  - tooling
related-rfcs:
  - "0117-arel-extra-surface-burndown"
  - "0119-connection-adapter-fidelity"
  - "0120-extra-surface-gating-rollout"
  - "0121-unbacked-internal-receipts"
  - "0129-ruby-compat"
priority: 3
---

# RFC 0130 — activerecord extra-surface receipt burndown

## Summary

`extra-surface.ts` subtracts any declaration carrying a `@noRailsEquivalent`
receipt from both measured dimensions, so a package's `novel` count has never
been a count of extra surface — it is a count of the extra surface **nobody has
written a receipt for**. arel reached zero and now runs in tagged-only mode: no
row in `scripts/api-compare/extra-surface-mark.json`, gated at `novel === 0`,
every extra justified at its own declaration.

activerecord cannot follow until its 342 untagged novel names are resolved.
This RFC is that burndown. Its end state is one line deleted from the mark file
and `activerecord` moved from `COUNTED_PACKAGES` to `TAGGED_ONLY_PACKAGES`.

## Motivation

Two problems, one fix.

**The mark file is a merge-conflict generator.** It holds six integers, two of
which are activerecord's. Between 2026-07-19 and 2026-08-30 it was rewritten by
**48 commits** — every PR anywhere in the package that deletes one novel name
has to decrement the same line. Two branches in flight collide there by
construction, and the conflict cannot be resolved by reading either side: it
needs a re-measurement (`API_COMPARE_FORCE=1 pnpm parity:api`, several minutes)
before you know what number to write. A receipt has none of that property — it
lives in the file the PR is already editing.

**A count is a weaker gate than a receipt.** `novel: 342` says surface exists;
it does not say which surface, why it exists, or whether anyone intends to
remove it. `@noRailsEquivalent PERMANENT` and `@noRailsEquivalent CONVERGEABLE
<story-id>` say all three, at the declaration, where the next reader is. That is
already the repo rule for a name you add today (CLAUDE.md, "Did you add any
public TS name?"); the 342 are the names that predate the rule being gated.

## Design

### The 342 are not one population

Measured 2026-08-30 against a forced `parity:api` run
(`pnpm parity:api:extra --package activerecord --novel-only`): 342 novel across
134 files, of which **210 sit in a Rails-matched file** and **132 sit in a file
with no Ruby counterpart at all** (44 such files). They resolve four ways, and a
story must say which way each name went — the burndown is not "add 342 tags".

1. **Delete it.** Invented surface with a call site that can move to the ported
   method, or with no call site at all. The preferred outcome; it lowers `total`
   as well as `novel`.
2. **Credit it in the extractor.** Some names are Rails surface the Ruby
   extractor cannot see. The 16 `after*` / `before*` / `around*` names on
   `base.ts` and its neighbours are generated in Ruby by
   `define_model_callbacks`, so no `def` exists in the `.rb` for the extractor
   to match — the same class of blind spot `#7193` fixed for Hash-constant and
   option-hash keys. A receipt on those would be a lie about a faithful port;
   the fix belongs in the extractor and lands once for the whole group.
3. **`@noRailsEquivalent PERMANENT`.** A genuine TypeScript language shortcoming
   already ratified repo-wide — the five `*Sync` twins of an async Ruby-sync
   method, the zero-import slot modules (`associations/_scope-slots.ts`), the
   generated-reader machinery. CLAUDE.md's "Generated attribute readers are
   properties" and "Call-time constant resolution" sections are the citation;
   these do not re-argue the decision.
4. **`@noRailsEquivalent CONVERGEABLE <story-id>`.** Real divergence with a real
   plan. The story is the receipt, so filing it is part of the work — a bare
   `CONVERGEABLE` with no id is half a receipt and the extra-surface run says so.

### Shape of the work

By top-level directory, the 342 fall out as:

| Names | Area                                                                        |
| ----- | --------------------------------------------------------------------------- |
| 107   | package root (`base.ts` 19, `fixtures.ts` 9, `enum.ts` 5, `errors.ts` 5, …) |
| 81    | `connection-adapters/` + `adapters/` + `sqlite/`                            |
| 48    | `relation/` (`relation/delegation.ts` 15)                                   |
| 29    | `associations/`                                                             |
| 15    | `type-virtualization/`                                                      |
| 15    | `encryption/`                                                               |

Stories are cut by area, not by count, so each one is reviewable against a
single Rails subtree and its `vendor/rails/` counterpart. Each lands the same
shape: names resolved by one of the four routes above, and activerecord's
`novel` mark **tightened in the same PR** with `pnpm parity:api:extra:tighten`.

The mark keeps shrinking under the existing only-shrink rule throughout. There
is no intermediate mode: activerecord is counted until it is zero, and moves in
one reviewed line after that.

## Non-goals

- **Raising the mark, ever.** The mark is only-shrink and there is no reseed.
  A story that cannot resolve a name files a `CONVERGEABLE` receipt for it;
  it does not buy room.
- **activemodel.** Same reasoning applies, but it has no burndown behind it and
  is not gated. Enrolling it is its own RFC, as `0120` has always said.
- **`total`.** Tagged-only mode drops the moved-not-novel dimension by design
  (see the module comment). Chasing `total` to zero is not part of reaching
  enrollment.
- **The `@internal` half.** RFC 0121's `unbacked-internal-needs-receipt` policies
  a different tag on an overlapping population. activerecord's enrollment there
  is tracked by 0121 and is not re-litigated here.

## Alternatives considered

- **Shard the mark file per package.** One file per gated package removes the
  cross-package collisions but not the activerecord ones, which are ~all of
  them. It buys a fraction of the benefit and leaves the count-vs-receipt
  problem entirely.
- **Replace the counts with a sorted list of novel member keys.** Merges far
  better than an integer — non-overlapping deletions resolve cleanly — and
  would gate name-for-name. Rejected because it recreates a central deviation
  register for exactly the surface CLAUDE.md says belongs at the call site
  ("A documented deviation is debt, not permission"). We already have the
  per-declaration form; a second register competing with it is the failure mode
  that rule exists to prevent.
- **Tag all 342 mechanically, then enrol.** Fast and worthless: a receipt whose
  reason was generated rather than reasoned is the "better justification for the
  deviation" that CLAUDE.md forbids closing a convergence story with. Route 1
  (delete) has to be tried per name, which is what makes this a burndown rather
  than a sed script.

## Rollout

Each phase resolves its names, tightens the mark, and is independently
mergeable. Ordering is by expected delete-rate, highest first, so the mark falls
fastest early.

1. Phase 1 — `receipt-relation-delegation-and-relation-tree`
2. Phase 2 — `credit-define-model-callbacks-in-the-ruby-extractor`
3. Phase 3 — `receipt-connection-adapters-and-sqlite-drivers`
4. Phase 4 — `receipt-associations-and-join-dependency`
5. Phase 5 — `receipt-encryption-and-type-virtualization`
6. Phase 6 — `receipt-package-root-base-fixtures-enum-errors`
7. Phase 7 — `enrol-activerecord-in-tagged-only-mode`

## Verification

- `pnpm parity:api:extra --package activerecord --novel-only` reports
  `totalNovel: 0`, down from **342** measured 2026-08-30.
- `scripts/api-compare/extra-surface-mark.json` contains no `activerecord` key,
  and `activerecord` appears in `TAGGED_ONLY_PACKAGES`.
- `pnpm parity:api:extra:gate` is green with `activerecord novel 0/0
(tagged-only)` in its summary line.
- Every `@noRailsEquivalent` written by this RFC states `PERMANENT` or
  `CONVERGEABLE <story-id>`; the extra-surface run's unstated-permanence count
  does not rise.
- The mark file's commit rate falls to zero for activerecord — the metric this
  RFC exists for.

## Open questions

1. **Do the 132 no-counterpart names belong here?** They sit in 44 TS files no
   `.rb` maps onto (`type-virtualization/`, `sqlite/better-sqlite3.ts`,
   `index.ts`), so every public name in them scores novel by construction, the
   way ruby-compat's whole surface does under RFC 0129. Recommendation: yes,
   keep them in scope — a file with no Rails counterpart is the strongest case
   for a receipt, not the weakest — but a per-file FILE-level tag is the right
   form for several of them, and phase 3/5 should reach for `fileTagVerdict`
   rather than 11 identical member tags.
2. **Does crediting `define_model_callbacks` (phase 2) belong to this RFC or to
   0126/0127?** It is extractor work, not activerecord work, and it lowers the
   count for other packages too. Recommendation: keep the story here because
   this burndown is what motivates it, and mark it `packages: []` so the tooling
   RFCs' owners see it.

## Changelog

- 2026-08-30: initial RFC
