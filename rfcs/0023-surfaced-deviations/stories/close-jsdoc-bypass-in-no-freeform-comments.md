---
title: "no-freeform-comments: require a tag or a Rails citation on JSDoc"
status: in-progress
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages:
  - "activemodel"
  - "arel"
deps: []
deps-rfc: []
est-loc: 260
priority: 2
pr: 7128
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-freeform-comments` (PR #6822) keeps every JSDoc block
unconditionally — `eslint/no-freeform-comments.mjs`, keep-rule 1. Reformatting
a doomed `//` comment as `/** ... */` bypasses the autofix by changing two
characters, and the rule's own header documents this as a known limitation.

**Decision, 2026-08-27 (maintainer): trails carries no English-language
comments — only our JSDoc flags and the tool directives the toolchain reads,
with no narrative prose around them, swept package by package starting with
arel.** That settles the question this story was filed to ask, and it is
STRICTER than the tag-or-citation predicate this story was first rewritten
around: prose is deleted wherever it lives, including inside a JSDoc block that
also carries a tag. A block is not saved by having one tag in it; the tag
survives and the paragraph around it does not. Descriptive API prose — `/** Add GROUP
BY. */`, `/** Set the FROM table. */` — is not an exception to the rule; it is
the thing the rule exists to delete. The Ruby is vendored at `vendor/rails/`
and every ported file carries a `Mirrors:` line, so a reader who wants to know
what `having` does reads `select_manager.rb`. A second description in trails
rots on its own.

This closes acceptance criterion 2 of the original story. Criterion 1 (find a
discriminator that spares ordinary API docs) and criterion 3 (close as not
statically closable) are both withdrawn — there is nothing to spare.

### Why this surfaced now

The arel fidelity audit (2026-08-27, `audits/arel-20260827T152610Z.md`) graded
line bloat a **C** and found arel carrying **2,718 comment lines against Rails'
271 — 10x**, roughly half of arel's 4,980-line excess over the Ruby. Breakdown
of arel's 2,715 comment lines (measured 2026-08-27, `packages/arel/src`
excluding tests):

- **1,796 (66%) JSDoc** — kept unconditionally by keep-rule 1. This story.
- 909 (33%) `//` line comments — kept by keep-rule 2, a Rails reference.
- 10 non-JSDoc block comments.

So the autofix is not failing: arel is clean under it, and the rule's keep-rules
simply cover two thirds of the volume. Note also that block-grouping was
investigated as a second leak and is NOT one: of the 909 `//` lines, 496 are
kept by a sibling line's citation, but only 6 blocks of 6+ lines rest on a
single citing line (39 lines total, longest 8). Leave `groupLineComments` alone.

### The sweep is much cheaper than when this was filed

The original measurement (2026-08-21) was 94 flagged blocks across arel and
activemodel. Re-measured 2026-08-27 with the same tag-or-citation predicate
(`@\w` or `RAILS_REF_RE`), across all 402 files currently enrolled in the rule
in `eslint.config.mjs:790-806`, `:816`, `:829`:

| package                        | flagged blocks |     lines |
| ------------------------------ | -------------: | --------: |
| arel                           |             27 |        61 |
| activemodel                    |             49 |       109 |
| activerecord (enrolled slices) |            347 |     1,578 |
| **total**                      |        **423** | **1,748** |

4,318 JSDoc blocks are enrolled in total, so ~90% already carry a tag or a
citation and are untouched. arel + activemodel together are 76 blocks / 170
lines — a single small PR. activerecord's enrolled slices carry the bulk, and
its flagged blocks average 4.5 lines against arel's 2.3, i.e. they are longer
narration rather than one-line API summaries.

## Converged shape

Add the tag-or-citation condition to keep-rule 1: a JSDoc block is kept when it
carries a JSDoc tag (`@\w` — `@internal`, `@noRailsEquivalent`,
`@missingRailsCall`, `@param`, …) **or** matches `RAILS_REF_RE`. Otherwise it is
deleted, like any other free-form comment. Keep-rule 2 (Rails references) and
keep-rule 3 (tool directives) are unchanged — line references stay.

Ship it behind **its own per-package enrollment set**, the way
`blazetrails/unbacked-internal-needs-receipt` is enrolled (RFC 0121): the
condition applies only to enrolled paths, the set is **only-grow**, and no
package is ever removed to turn a red run green. Without that, tightening the
rule reds all 402 enrolled files at once and forces a 1,748-line PR.

Seed the set with **activemodel** and sweep its 49 blocks in the same PR.
**arel is out of scope here** — its sweep is owned by
`0124-arel-surfaced-deviations/strip-english-comments-arel-visitors` and its
four sibling slices, which run against the stricter policy above (1,384 prose
lines, not the 27 bare blocks the tag-or-citation predicate alone would catch).
Enrol arel in the rule once those land. File one story per activerecord slice
for the remaining 347 blocks; do not fan them out from this PR.

Note the two counts measure different things and both are right: the
tag-or-citation predicate flags whole blocks that carry NEITHER a tag nor a
citation (27 in arel), while the policy deletes prose LINES wherever they sit
(1,384 in arel). The rule is the ratchet that stops regression; the sweeps are
what actually removes the volume.

## Acceptance criteria

- [ ] `eslint/no-freeform-comments.mjs` keep-rule 1 requires a tag or a Rails
      reference for enrolled paths, with tests covering: kept-with-tag,
      kept-with-citation, deleted-bare, and a non-enrolled path still keeping a
      bare block.
- [ ] The enrollment set is declared once and documented as only-grow.
- [ ] activemodel is enrolled and its 49 flagged blocks are gone in the same
      PR (109 lines). arel is enrolled only after its 0124 slices land.
- [ ] `pnpm lint` clean; no new eslint-disable, no allowlist widening.
- [ ] The rule's header doc drops the KNOWN LIMITATION paragraph and states the
      new contract, including that Rails' own comments are still not copied.
- [ ] CLAUDE.md's comment convention states the policy: JSDoc the toolchain
      reads, and Rails line references — nothing else.
- [ ] One story filed per remaining activerecord slice, each naming its flagged
      block count.

## Notes

The arel audit's line-bloat section says "the comment diet is not a story — it
is a review norm". That is wrong and predates this decision; it is a story, and
this is it.
