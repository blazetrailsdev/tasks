---
title: "activemodel: take custody of the ~74 remaining activemodel-labelled stories in 0023"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`0023-surfaced-deviations` is the retired catch-all. Counted 2026-09-01:

```console
grep -l '"activemodel"' rfcs/0023-surfaced-deviations/stories/*.md | wc -l   # ~80
```

with ~74 still open (`draft`/`ready`) after the six this RFC already moved.
0124 did exactly this for arel — re-verified all 37 arel-labelled open stories
in 0023, closed the 7 that no longer applied, and moved the rest into the
package bucket.

Until this lands, activemodel deviations live in two places, and anyone filing
a new one must check both. That double-lookup already caused one real failure:
the 2026-09-01 fidelity audit independently rediscovered three findings that
were already open stories here, and the first draft of this RFC shipped them
as duplicates.

Story IDs are filename-based, so a move preserves every existing reference —
including any `CONVERGEABLE <story-id>` receipt in `packages/**`. Grep before
closing anything: a closed story cited in code reds the stale-refs check.

## Scope

Only stories whose SUBJECT is activemodel. Per 0124's rule, cross-package
sweeps that merely touch `packages/activemodel/` stay in 0023 or move to their
owning package — e.g. `hoist-module-super-and-bind-call-into-activesupport`,
`consolidate-kernel-integer-and-float-conversions`,
`claude-md-module-mixins-section-contradicts-itself`,
`assertion-counter-ignores-ported-minitest-assertions`.

Expect clusters to fall out naturally; several groups are already visible:
the `attribute-method-pattern-*` / `*-generated-attribute-methods-*` family,
the `model-name-*` family (two more beyond the one already moved), the
numericality family, and the type-cast family
(`integertype-castvalue-to-i-semantics`, `float-cast-lacks-string-to-f-semantics`,
`binary-cast-coerces-non-string-values`, `bigdecimal-lacks-nan-and-infinity-forms`).

## Acceptance criteria

- Every activemodel-subject story in 0023 is either moved into this RFC (file
  moved, `rfc:` updated, a declared `cluster` assigned) or closed via
  `tasks close <id> <reason>` with a reason citing the tree state that retired
  it — never closed by markdown edit (`status` is DB-owned).
- Stories labelled `activerecord` as well as `activemodel` keep both labels;
  this RFC declares both packages.
- `grep -l '"activemodel"' rfcs/0023-surfaced-deviations/stories/*.md` returns
  only cross-package sweeps, each named in this RFC's Non-goals.
- `pnpm validate` clean for both RFCs; `node scripts/build-index.mjs` rerun.
- No story is closed without first `git grep`-ing its ID across the trails
  repo for a `CONVERGEABLE` receipt citing it.

## Definition of done

Re-homing alone does not close this story if any moved story lost its cluster,
its `packages` labels, or its prose in the move. This is a custody transfer,
not a rewrite — do not "tidy" the moved stories' bodies.

## Notes

This is docs-only (LOC-exempt), but it is a large diff. Split it by family
across two or three PRs if that reads better; file the splits as siblings here
rather than fanning out PRs from one claim.
