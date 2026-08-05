---
title: "Resolve mixin constants that live outside active_record/"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`resolveMixinPath` (`scripts/prism-codegen/rails-scope.ts`, merged in #5838)
now verifies that a candidate file really defines the mixin constant and
reports the ones it cannot resolve. `score-cli --verbose` lists 58 such
constants against vendored Rails, and every one is a module the reader cannot
see: `readRuby` resolves paths under `activerecord/lib/active_record/` only, so
`ActiveSupport::Concern`, `ActiveModel::AttributeMethods`,
`ActiveModel::Dirty`, `Enumerable` and friends resolve to nothing. Their defs
are therefore absent from `reachableRailsDefs`, which under-scopes the await
decision for every file that includes them.

One outlier is in-corpus: `base.rb :: Delegation::DelegateCache` is defined in
`relation/delegation.rb`, which none of base.rb's path layouts reach.

## Acceptance criteria

- The reader resolves `ActiveModel::*` / `ActiveSupport::*` constants against
  the vendored `activemodel/lib` and `activesupport/lib` trees (or an explicit
  decision is recorded that those modules stay out of the await scope, with the
  report annotating them as deliberately out-of-corpus rather than misses).
- `base.rb :: Delegation::DelegateCache` resolves, or the report distinguishes
  in-corpus misses from out-of-corpus ones so an in-corpus miss stands out.
- The unresolved count reported by `score-cli` drops accordingly, and a test
  covers a constant resolved from outside `active_record/`.
