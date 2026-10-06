---
rfc: "0181-activerecord-member-placement"
title: "activerecord member placement: every body in the file that mirrors its .rb — split from RFC 0174"
status: active
created: 2026-10-06
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - placement
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0180-activerecord-receipt-parity"
  - "0182-activerecord-error-parity"
  - "0183-activerecord-excluded-source-files"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0130-activerecord-extra-surface-receipt-burndown"
  - "0123-blocked-convergence-holding"
priority: 2
---

# RFC 0181 — activerecord member placement: every body in the file that mirrors its .rb

## Summary

This RFC holds activerecord's **placement** residue: a method whose body is correct but sits in the wrong
file, most often a module's body written into the class that includes it. It was split out of
`0174-activerecord-api-parity-100` on 2026-10-06 and took the 13 stories of 0174's `placement` cluster plus
3 unclustered stories on the same subject. **16 stories, 14 open, 5,370 est-loc.** The destination of a story is
decided by one question: **does it move a body to the file that mirrors the `.rb` defining it?**

## Motivation

Rails' file layout is the layout `parity:api` scores, and CLAUDE.md § "Module mixins" asks for the code to
live "in the file that matches Rails' layout". Two reports measure where it does not:

- `pnpm parity:api:extra --package activerecord` lists **inlined-from** rows: a module member whose body
  sits on an including class's file. Report-only for activerecord; arel's is pinned at 0.
- `pnpm parity:api:moves` lists every member Rails defines in another `.rb`.

These stories touch the same few host files (`base.ts`, `relation.ts`, `postgresql-adapter.ts`), so they
conflict with each other and with almost nothing else in 0174. That is why they are worth reading as one
backlog.

### Baseline

Measured 2026-10-06 on trails `main` @ `53cf6a5875` after a clean `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api --calls`. The 0174 column is that RFC's baseline of 2026-09-30.

| Axis                              | 0174 baseline | Now     | Target        | Where the residue lives                                                                                                               |
| --------------------------------- | ------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| inlined module bodies (report)    | 128           | 40      | 0, then gated | `base.ts` ← `callbacks.rb` 17, `model_schema.rb` 4, `persistence.rb` 3; `abstract-adapter.ts` 3                                       |
| `parity:api:moves` (activerecord) | 947           | 154     | 0             | `relation.ts` → `relation/query-methods.ts` 55, `postgresql-adapter.ts` → pg `schema-statements.ts` 17, `base.ts` → `callbacks.ts` 16 |
| `parity:api:extra:gate`           | rowless       | rowless | hold          | —                                                                                                                                     |

Most of the fall in moves is `moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced`
(RFC 0172, done), which stopped the report double-counting include chains.

## Design

### Scope

**In:** a story whose first acceptance criterion moves a member's body to the file mirroring the `.rb`
that defines it, and the story that turns the inlined-bodies report into a gate. A story here changes no
body: same statements, same order, new home.

### Where a story goes

This table is repeated in 0174 § "Split: RFCs 0180 to 0183".

| The story's first acceptance criterion                                                                                                   | File it in |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| moves a member into the file mirroring the `.rb` that defines it (`inlined-from`, `parity:api:moves`)                                    | here       |
| changes an error class, message or raise site, or deletes an error-parity / callback-invocations exclude row                             | RFC 0182   |
| ports or un-excludes a `.rb` listed in `scripts/parity/unported-files/`                                                                  | RFC 0183   |
| deletes a receipt in `packages/activerecord/src`; or a `CONVERGEABLE <story-id>` receipt names the story; or a receipt audit surfaced it | RFC 0180   |
| deletes a row of the arms, void-return or duck-type report                                                                               | RFC 0178   |
| changes a test file, test model, fixture or the test schema                                                                              | RFC 0175   |
| any other activerecord source-side axis                                                                                                  | RFC 0174   |

The rows are read top to bottom and the first match wins. So a story a receipt names goes to RFC 0181,
0182 or 0183 when its subject is theirs, and to RFC 0180 otherwise.

### Principles

These are 0174's, unchanged:

- **Converge, never ratify.** Each story deletes rows or receipts. None adds a baseline row, a receipt, a
  skip or an exclude entry.
- **Blocked, not ratified.** Where a story hits a gap CLAUDE.md does not ratify, it is `blocked` with the
  concrete blocker (§ "Blocked"), never re-worded into a PERMANENT receipt.
- **Measurement faults are fixed in the tool**, with a unit test, and the fault story is filed in the RFC
  that owns the tool (RFC 0127 for signals and ratchets; RFC 0179 is closed).
- **Each story is one PR**, `est-loc` ≤ 650. A leftover is filed here as its own story with the Rails
  `file:line`.
- **Move, do not rewrite.** A relocation PR changes where a body lives. A deviation seen inside the body
  on the way is filed, not fixed in the same PR, so the diff stays reviewable as a move.
- **Verify both entry directions.** A relocation changes the module graph. Per CLAUDE.md § "Call-time
  constant resolution", import the built `dist/**.js` of both files as entry modules in plain node; a green
  vitest run does not show a TDZ cycle.
- **Re-measure first.** Neither report is gated, so a story's row list is the list on the day it was
  seeded. The reports are at 40 and 154 against the 128 and 947 the stories were cut from.

### Ordering

- The eight `activerecord-relocate-*` stories precede `activerecord-inlined-bodies-report-becomes-a-gate`,
  which precedes `activerecord-converge-moves-residue-base-hosted`: the inlined bodies are a subset of the
  base-hosted moves. The gate also waits on
  `activerecord-core-initialize-body-inlined-in-base-constructor` (blocked), which owns the one row no relocate story
  can clear.
- `activerecord-relocate-query-methods-bodies-inlined-in-relation` is the largest single move (55 of the 154) and is wanted by `activerecord-converge-build-where-clause-constructor-order` (RFC 0174), so it goes
  first.
- `base.ts` is rewritten by most of these stories. They are not ordered by `deps`; the second PR rebases.

### Gating

- **`active` from birth**, for 0174's reason: `claimable()` surfaces a story only when its own RFC is
  `active`. The 11 `ready` stories here were claimable in 0174 and stay claimable.
- **Edges out of this RFC, open:** `activerecord-relocate-persistence-model-schema-counter-cache-bodies`
  waits on `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`, and
  `activerecord-relocate-remaining-base-hosted-inlined-bodies` on
  `activerecord-converge-inheritance-convergeable-receipts` (both RFC 0180). The edges into RFC 0174 and
  the four on RFC 0172's moves fault story are all on done stories.
- **Edges into this RFC, open:** `activerecord-converge-build-where-clause-constructor-order` (RFC 0174)
  waits on `activerecord-relocate-query-methods-bodies-inlined-in-relation`.
- **Edges into this RFC from the 0174 close-out.** `activerecord-api-parity-100-close-out` named these
  stories one by one in `deps`. This split replaces those entries with one `deps-rfc` edge on
  `0181-activerecord-member-placement`, the whole-RFC case 0174 § "Gating" describes: the close-out waits until this RFC is
  closed, including stories filed here later. The edit is in the split's own diff, so nothing is owed
  after merge.

## Stories

| Story                                                                  | est-loc | Cluster   |
| ---------------------------------------------------------------------- | ------- | --------- |
| `activerecord-base-delegation-wrappers-over-core-class-methods`        | 250     | placement |
| `activerecord-converge-moves-residue-adapter-hosted`                   | 500     | placement |
| `activerecord-converge-moves-residue-base-hosted`                      | 500     | placement |
| `activerecord-converge-moves-residue-relation-hosted`                  | 500     | placement |
| `activerecord-converge-moves-residue-rest`                             | 300     | placement |
| `activerecord-core-initialize-body-inlined-in-base-constructor`        | 200     | placement |
| `activerecord-inlined-bodies-report-becomes-a-gate`                    | 150     | placement |
| `activerecord-relocate-adapter-hosted-inlined-bodies`                  | 350     | placement |
| `activerecord-relocate-callbacks-bodies-inlined-in-base`               | 450     | placement |
| `activerecord-relocate-core-bodies-inlined-in-base`                    | 400     | placement |
| `activerecord-relocate-persistence-model-schema-counter-cache-bodies`  | 450     | placement |
| `activerecord-relocate-pg-schema-statements-bodies-inlined-in-adapter` | 550     | placement |
| `activerecord-relocate-query-methods-bodies-inlined-in-relation`       | 600     | placement |
| `activerecord-relocate-relation-type-and-association-inlined-bodies`   | 300     | placement |
| `activerecord-relocate-remaining-base-hosted-inlined-bodies`           | 450     | placement |
| `signed-id-relation-methods-live-in-relation-ts`                       | 120     | placement |

## Blocked

- `activerecord-core-initialize-body-inlined-in-base-constructor`: `Core#initialize` (`core.rb:470-482`)
  wraps `super`. A function in `core.ts` cannot call `super()`, JS forbids `this` before `super()` returns,
  and ruby-compat's module `[initialize]` hook runs above `ActiveModel::API#initialize`, not around it. It is
  the same wall as `base-constructor-calls-init-internals-not-activemodel` (RFC 0123). `activerecord-inlined-bodies-report-becomes-a-gate` takes a `deps` edge on it in this split, so the gate
  cannot land while the row exists: there is no exception to the zero. The path to removing the row is the
  ruby-compat construction hook that `activemodel-api-initialize-concern-constructor` (RFC 0123) is blocked
  on; when that exists, `Core#initialize` can wrap `super` from `core.ts` and this story is unblocked with
  `tasks status-set`. Until then this RFC stays open and the 0174 close-out waits on it, which is the
  "blocked, not ratified" principle applied.

## Non-goals

- **Changing a relocated body.** That is the axis the body's deviation is on: RFC 0178 for arms, RFC 0180
  for a receipt, RFC 0174 for a call or argument row.
- **The moves report's own faults.** A row the report manufactures is fixed in the tool, in RFC 0127.
- **Other packages' moves.** The report lists 128 members in six other packages. They belong to those
  packages' RFCs.
- **A close-out story.** 0174's close-out re-measures this axis with every other one and pins it at zero.
  A second close-out here would measure the same rows twice.

## Alternatives considered

The four splits of 2026-10-06 were cut together. RFC 0178 § "Alternatives considered" rejected each of
these seams on 2026-10-02, for reasons that no longer hold:

- **`receipts` was "three unrelated things under one label".** RFC 0179 has since taken the comparer-rule
  stories out, so what is left is audits, receipt convergences and audit findings.
- **`placement`, `skips` and `calls-args` had edges into the clusters.** They still do (§ "Gating"), but a
  `deps` edge resolves by slug across RFCs, and cutting all four seams at once leaves 7 open cross-RFC
  edges in total.
- **`errors` and `excluded-files` were "too small to earn an RFC".** Each now also takes the unclustered
  stories on its subject, and 0174 at 301 stories is the larger cost.

- **Move only the inlined-bodies stories and leave moves in 0174**: rejected. The inlined bodies are a
  subset of the moves, and the base-hosted moves story depends on the gate story.
- **Leave the 2 done stories in 0174**: rejected, as in RFC 0178: the open stories cite them, and
  `activerecord-core-initialize-body-inlined-in-base-constructor` is the leftover of one.

## Rollout

Status is from the DB as of 2026-10-06.

1. **Relocate inlined module bodies.** 8 stories, 7 open, 3,150 est-loc.
   - Ready: `activerecord-relocate-adapter-hosted-inlined-bodies`, `activerecord-relocate-callbacks-bodies-inlined-in-base`, `activerecord-relocate-persistence-model-schema-counter-cache-bodies`, `activerecord-relocate-pg-schema-statements-bodies-inlined-in-adapter`, `activerecord-relocate-query-methods-bodies-inlined-in-relation`, `activerecord-relocate-relation-type-and-association-inlined-bodies`, `activerecord-relocate-remaining-base-hosted-inlined-bodies`
   - Done: `activerecord-relocate-core-bodies-inlined-in-base` (trails#8383)
2. **Leftovers no report flags.** 3 stories, 3 open, 570 est-loc.
   - Draft: `activerecord-base-delegation-wrappers-over-core-class-methods`, `signed-id-relation-methods-live-in-relation-ts`
   - Blocked: `activerecord-core-initialize-body-inlined-in-base-constructor`
3. **Gate.** 1 stories, 1 open, 150 est-loc.
   - Ready: `activerecord-inlined-bodies-report-becomes-a-gate`
4. **Moves residue.** 4 stories, 3 open, 1,500 est-loc.
   - Ready: `activerecord-converge-moves-residue-adapter-hosted`, `activerecord-converge-moves-residue-base-hosted`, `activerecord-converge-moves-residue-relation-hosted`
   - Done: `activerecord-converge-moves-residue-rest` (trails#8417)

## Verification

Each on a clean `pnpm build` followed by `API_COMPARE_FORCE=1 pnpm parity:api --calls`:

- `pnpm parity:api:extra --package activerecord` lists no `inlined-from` row, down from 40, and
  activerecord's inlined-from bucket is pinned at 0 as arel's is. There is no exception: the gate story
  depends on the blocked `Core#initialize` story (§ "Blocked").
- `pnpm parity:api:moves` lists no activerecord member, down from 154.
- `pnpm parity:api:extra:gate` stays rowless for activerecord.
- `pnpm tasks list --rfc 0181-activerecord-member-placement` shows no open story.

## End condition

This RFC closes when every Verification line holds.

## Open questions

None is open.

1. **Do the seeded row lists still match the reports?** Resolved: not re-cut. They were seeded from 128 and
   947 rows and the reports are at 40 and 154. Each story re-measures its own files first (§ "Principles"),
   and one whose rows are all gone is closed with `tasks close` and that reason.
2. **One unsized story.** Resolved: `signed-id-relation-methods-live-in-relation-ts` had a slug for a title
   and no `est-loc`. Both are set (120), which is why the RFC opens at 5,370 est-loc against the DB's 5,250.

## Changelog

- 2026-10-06: created by splitting the `placement` cluster out of `0174-activerecord-api-parity-100`. 16
  stories moved (2 done, 11 ready, 2 draft, 1 blocked). The 13 clustered ones change only their `rfc:`
  line; the 3 that were unclustered also take `cluster: placement`, and one a title and an `est-loc`.
