---
title: "Decide whether key?/has_key? should offer has as a method-name candidate"
status: ready
updated: 2026-07-27
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up from #5242, which added `CONTAINMENT_PREDICATE_ALIASES` in
`scripts/api-compare/conventions.ts` so `rubyMethodToTs("include?")` offers
`includes` (and `member?` → `includes`, `exclude?` → `excludes`).

`key?` / `has_key?` were deliberately left out of that map. Their only JS
analogue is `has`, which is fine as a _call_ alias — both are already in
`JS_ENUMERABLE_ALIASES` (`scripts/api-compare/enumerable-idioms.ts`) mapped to
`["has"]` — but was judged too generic to hand to `rubyMethodToTs` as a
method-NAME candidate, where it would match any unrelated `has()` in the file.

The gap is the same class the containment work fixed: a Ruby class defining
`key?` whose faithful port is a `has()` method matches no candidate today.
Real Rails sites: `ActiveSupport::HashWithIndifferentAccess#key?`
(`vendor/rails/activesupport/lib/active_support/hash_with_indifferent_access.rb`,
which also aliases `member?` → `key?` at :157), plus `ActionController::Parameters`.

## Acceptance criteria

- [ ] Decide whether `key?`/`has_key?` should offer `has` as a method-name
      candidate, scoped narrowly enough that it can't false-match an unrelated
      `has()` (e.g. only when the Ruby class has no other `has*` method, or
      only for the specific Rails classes above).
- [ ] If yes, add it beside `CONTAINMENT_PREDICATE_ALIASES` and drop the
      redundant alias-map entry (`compare.test.ts` asserts the alias map lists
      nothing the conventions already produce).
- [ ] If no, record the reasoning as a comment at the map so the question isn't
      re-derived a third time.
- [ ] parity:api delta non-negative; `pnpm parity:api:calls` green.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/conventions.ts` -> `scripts/parity/conventions.ts`

## Re-verified 2026-08-17 (ready sweep)

`conventions.ts` moved to `scripts/parity/conventions.ts` — that file is also now
the generator behind `docs/ruby-ts-conventions.md`, so any candidate added here
changes a CI-verified doc. Factor that into the acceptance criteria.
