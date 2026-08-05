---
title: "Stdlib idiom longtail: include?/has, none?/every, new-of-constructor token"
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

Follow-up to `codegen-stdlib-idiom-mapping` (PR #5842), which mapped the
large Ruby stdlib idiom clusters (is_a?/class/to_s/nil?/empty?/enumerable
renames, statement-position each → for-of) and lifted `pnpm codegen:score`
from 35 to 42 matched. The post-merge cluster analysis of the remaining 298
divergent rows left three smaller idiom mismatches on the table:

- Ruby `x.include?(y)` now emits `.includes(y)`
  (scripts/prism-codegen/handlers/stdlib.ts STDLIB_RENAME), but the port
  spells the membership test `.has(y)` when the receiver is a Map/Set —
  12 divergent rows carry a port-only `ref:has` token vs gen `ref:includes`
  (e.g. relation/query_methods.rb rows). Receiver type is unknowable at
  emission, so this is likely a scorer-side canon pair
  (`includes` ≡ `has`) rather than a generator change.
- Ruby `none? { }` has no image; Rails
  `reflections.none?(&:collection?)`
  (vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb,
  `using_limitable_reflections?`) is ported as `every((r) => !r.collection)`
  — gen `ref:none` vs port `ref:every`. Emit `every` with a negated block
  body (symToProc and BlockNode both).
- Ruby `self.class.new(...)` emits `new this.constructor(...)` → skeleton
  `new:constructor`, while the port's `new (this.constructor as ...)()`
  parenthesized/casted form tokens as `new:?`
  (scripts/prism-codegen/score.ts NewExpression case) — canon the
  parenthesized/as-wrapped constructor NewExpression to `new:constructor`
  (relation.rb `_new` row).

## Acceptance criteria

- The three mismatches above are folded (generator emission or skeleton
  canon, whichever preserves honesty), `pnpm codegen:score` matched count
  rises or the affected rows are signed off, and no existing matched row
  regresses.
- Per-idiom tests in scripts/prism-codegen/stdlib-idioms.test.ts /
  score.test.ts.
