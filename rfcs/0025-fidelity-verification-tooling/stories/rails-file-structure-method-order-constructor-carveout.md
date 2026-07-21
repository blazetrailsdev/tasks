---
title: "rails-file-structure-method-order-constructor-carveout"
status: in-progress
updated: 2026-07-21
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5044
claim: "2026-07-21T20:55:19Z"
assignee: "rails-file-structure-method-order-constructor-carveout"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5039 (method-order interleave by source line). #5039
made the manifest faithful — a leading `class << self` block is now expected at
its real source position — but two limits in the RULE mean a lint-clean file is
not necessarily a converged one. Both predate #5039 and come from #5030.

### 1. The constructor carve-out defeats the manifest

`eslint/rails-file-structure-method-order.mjs:250-260` force-hoists any member
named `constructor` to index 0, then `continue`s past `constructor` in the
expected-order loop. Nothing can be placed ahead of it, even when the manifest
explicitly says so.

`packages/activemodel/src/error.ts` is the clearest victim. The manifest expects
`fullMessage`, `generateMessage`, `constructor, …` — matching Rails, where
`def self.full_message` (error.rb:15) and `def self.generate_message` (:64) both
precede `initialize` (:103). The rule cannot express that, so the statics sit at
error.ts:110/:172, AFTER the constructor at :86, and the file lints clean anyway.

Same for `packages/activemodel/src/attribute.ts`: the manifest puts `constructor`
at index 8 (behind the five `class << self` factories, per attribute.rb:7-24 vs
`initialize` at :33), but the file leads with `constructor` at :37.

The carve-out's stated reason is real — Struct-derived Rails classes have no
`initialize`, so the manifest omits `constructor` and it would fall into the
unmapped tail. The fix is to make the carve-out conditional: hoist only when
`constructor` is ABSENT from the expected list, and otherwise honor its
manifest position.

### 2. Same-named static + instance members collapse to one entry

`pushMethod` dedupes candidates by name per class bucket, so a class with both a
static and an instance member of the same name gets ONE expected slot, and
`computeTargetOrder` moves whichever it matches (it groups all same-named nodes
together, so both move as a unit).

`packages/arel/src/table.ts`: Ruby `engine` exists only as a class-level
`attr_accessor` (table.rb:9, inside `class << self`); there is no `def engine`
in the file. Trails has BOTH `static engine` and an invented instance
`get engine()`. #5039's `--fix` moved the instance getter to the slot derived
from the class accessor's line — repositioning an invention against a Rails line
that belongs to a different, already-correctly-placed member.

## Acceptance criteria

- [ ] Constructor carve-out applies only when `constructor` is absent from the
      class's expected list; when present, its manifest position is honored.
- [ ] `error.ts` converges: `static fullMessage` / `static generateMessage`
      precede the constructor, matching error.rb:15/:64 vs :103.
- [ ] `attribute.ts` converges: the five `class << self` factories precede
      `constructor`, matching attribute.rb:7-24 vs :33.
- [ ] Static and instance members that share a name are distinguishable, so a
      Rails class-method slot cannot reposition an instance member (and vice
      versa). Decide explicitly whether an invented member with no Rails
      counterpart should be ordered at all, or left in the unmapped tail.
- [ ] `packages/arel/src` + `packages/activemodel/src` lint clean (the rule is
      live in CI for both).
