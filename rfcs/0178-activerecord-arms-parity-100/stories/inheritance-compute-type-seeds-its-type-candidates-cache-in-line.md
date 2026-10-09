---
title: "inheritance-compute-type-seeds-its-type-candidates-cache-in-line"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8712
claim: "2026-10-09T16:00:15Z"
assignee: "inheritance-compute-type-seeds-its-type-candidates-cache-in-line"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-1-residue` (trails#8712). One row of
`pnpm parity:api:arms:report --package=activerecord --direction=invented` it could not clear:

- `activerecord/inheritance.ts#computeType` — `+if`.

Rails' `compute_type` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:258-282`) reads
`@_type_candidates_cache[type_name]` with no guard, because `inherited` seeded it
(`inheritance.rb:288-295`: `subclass.set_base_class`,
`subclass.instance_variable_set(:@_type_candidates_cache, Concurrent::Map.new)`,
`@finder_needs_type_condition = nil`). The port (`packages/activerecord/src/inheritance.ts:37-40`) seeds it
inside `computeType` with `if (!hasOwn(klass, "_typeCandidatesCache")) klass._typeCandidatesCache = new Map()`,
which is the invented `if`.

Two fixes were tried on trails#8712 and both rejected:

- Teaching `extractSkeleton` that `if (!Object.hasOwn(x, "_y")) x._y = <fresh>` is no arm. Of the 11 sites
  that rule clears repo-wide only this one is an `inherited` seed. Eight port a Rails `@x ||= …` (Ruby emits
  `or`: `attribute_methods.rb:383,418`, `attribute_registration.rb:78`, `dynamic_matchers.rb:38`,
  thor `base.rb:472,537`), and two port `@uses_transaction = [] unless defined?(@uses_transaction)`
  (`test_fixtures.rb:89,94`), a real Rails `if` the fold turned into a false missing arm. The extractor cannot
  tell the three apart from the TS spelling.
- Seating the seed at the existing deferral. `inheritance.ts` defers only `set_base_class`, in the `baseClass`
  reader (`inheritance.ts:131`); nothing guarantees that reader runs before `computeType` on the same class.

What is missing is one deferred-`inherited` seat for `Inheritance` that all three of `inherited`'s effects go
through (`_computedBaseClass`, `_typeCandidatesCache`, `_finderNeedsTypeCondition` at `inheritance.ts:131,38,165`),
so `computeType` can read the cache unguarded. CLAUDE.md § "`inherited` is deferred to own-property memo
guards" ratifies the guard itself, so the alternative is an `@inventedArm if — PERMANENT` receipt citing that
section.

## Acceptance criteria

- [ ] `computeType` reads `_typeCandidatesCache` with no own-property guard in its body, or carries
      `@inventedArm if — PERMANENT` against CLAUDE.md § "`inherited` is deferred to own-property memo guards".
- [ ] No change to `scripts/api-compare/` that folds a `||=` or `unless defined?` port.
- [ ] The invented-direction report shows no `computeType` row.
