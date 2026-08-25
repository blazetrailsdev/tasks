---
title: "Decide the emission shape for a splat combined with a block or keyword arguments"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #6121 made the codegen **decline** any def whose signature would place a
parameter after a rest parameter, because JS forbids it and the emitted code did
not parse as JS. Before that fix the generator shipped invalid signatures —
visible in the checked-in golden snapshots on `main`:

- `export function extending(...modules, block)` —
  `activerecord/lib/active_record/relation/query_methods.rb` `def extending(*modules, &block)`
- `export function select(...fields, block)` — `query_methods.rb` `def select(*fields, &block)`
- `export function touch(...names, { time = null } = {})` —
  `activerecord/lib/active_record/persistence.rb` `def touch(*names, time: nil)`
- `function _with(...args, block)` — `query_methods.rb:493-497`
  `def with(*args) ... if block_given?` (surfaced only once the reserved-name
  fix unblocked `with`)

The guard is `endsInRestParameter` in `scripts/prism-codegen/handlers/structure.ts`
(consulted from `emitParams`' keyword and block arms, and from `defParts`'
implicit-block arm). It trades emission for validity: def coverage moved from
434/472 to 426/461 in the same PR.

Declining is correct but not the endgame. Ruby puts a block and keyword
arguments _after_ a splat and neither is positional; JS has no ordering that is
both valid and call-compatible. Deciding the shape is the open work — e.g. a
trailing options/block object folded into the rest, or a non-positional
convention — and it has to be decided once, for the whole corpus, not per def.

Declining also took seven rows out of `scripts/prism-codegen/convergence-baseline.json`
(the guard's only-shrink baseline), because a declined def leaves the compared
population entirely — they did **not** converge:

- `active_record/persistence.rb::touch::missing`
- `active_record/relation.rb::{isAny,isNone,isOne,touchAll}::divergent`
- `active_record/relation/query_methods.rb::extending::missing`
- `active_record/relation/query_methods.rb::extendingBang::divergent`

Re-enabling emission will red the guard with those defs' real port divergence.
That is the mechanism working: they come back through review, not silently.

## Acceptance criteria

- A single decided emission shape for `*splat` combined with (a) an explicit
  `&block`, (b) keyword arguments, and (c) an implicit `block_given?` block,
  written down where the codegen conventions live.
- `emitParams` / `defParts` emit that shape instead of declining; the
  `endsInRestParameter` guard is removed or narrowed to whatever genuinely has
  no image.
- Every emitted signature parses as JS — the covering test in
  `scripts/prism-codegen/codegen.test.ts` ("declines a def that would place a
  parameter after a rest parameter") is updated to assert the new shape rather
  than the decline.
- Def coverage recovers past 434/472; 0 parse errors invariant holds.
- The seven baseline rows above are re-reviewed on their merits as they resurface.
