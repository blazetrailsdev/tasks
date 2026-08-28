---
title: "none? -> every credits an unnegated predicate callback"
status: ready
updated: 2026-07-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-on from #5428, which made the wide ratchet require a real `!` before
crediting a negating alias. One residual imprecision was left deliberately
unfixed there, and it is worth deciding on separately.

`NEGATED_ALIASES` (`scripts/api-compare/enumerable-idioms.ts`) marks the aliases
that need the marker per-alias rather than per Ruby call, because `none?` has a
faithful UNnegated port: Rails `@stack.none?(&:dirty?)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:573`)
ports to `stack.every((t) => !t.isDirty())` — the `!` is inside the callback, so
the call itself is not negated. `none? → every` therefore stays a direct alias.

The cost is that a bare `xs.every(p)` — the de-Morgan _opposite_ of `none?` —
still credits a Ruby `none?`. The extractor records call names, not callback
bodies, so it cannot currently tell `every((t) => !t.isDirty())` from
`every((t) => t.isDirty())`. Requiring the marker for `every` was measured
during #5428 and produced 4 false positives on exactly the faithful shape
(`index_name_for_remove`, `restorable?`, `using_limitable_reflections?` x2), so
it is not a viable tightening on its own.

Two possible resolutions, to be chosen during triage:

1. Teach the extractor to record whether a predicate callback's body is itself
   negated (`every((x) => !p(x))` → a distinct marker), then require that form
   for `none? → every`.
2. Decide the residual is acceptable and record it in the `NEGATED_ALIASES`
   docstring so it is not re-litigated.

## Acceptance criteria

- [ ] Pick (1) or (2) with the false-positive measurement re-run against
      current `main` (`API_COMPARE_FORCE=1 pnpm parity:api --wide-calls`).
- [ ] If (1): `pnpm parity:api:calls` green with no new baseline entries.
- [ ] If (2): the limitation is stated once, in the `NEGATED_ALIASES` docstring.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
