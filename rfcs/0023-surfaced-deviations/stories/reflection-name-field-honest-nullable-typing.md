---
title: "Decide whether MacroReflection#name should be honestly typed string | null"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
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

`MacroReflection#name` is typed `string` but is nullable at runtime:
`Reflection.create` admits a nil name (Rails
`reflection_test.rb:126`), and PR #4975 widened the constructor and `create`
signatures to `string | null`. The field itself still lies, via one documented
cast at `packages/activerecord/src/reflection.ts` (`this.name = name as string`).

That was a deliberate, measured tradeoff in #4975, not an oversight: widening
the field to `string | null` produces **15 downstream type errors in
`reflection.ts` alone** — foreign-key derivation, join-key computation, index
expressions, `InverseOfAssociationNotFoundError` arguments. Rather than push
null-checks Rails does not have onto ~13 call sites mid-PR, the unsoundness was
confined to one assignment and the string-derivation paths were made
nil-correct instead (see `nameString`, and the derivation-vs-raw-value rule in
that PR's description).

This story is the honest-typing follow-up: decide whether to carry the cast
permanently or absorb the 15 sites. Note Rails is untyped here — it stores the
raw nil and coerces at use sites — so there is no Rails behavior to converge
to. This is a TS soundness question, which is why it is worth triaging rather
than assuming.

## Acceptance criteria

- Decide and record: keep the documented cast, or widen
  `MacroReflection#name` to `string | null`.
- If widening: the ~15 sites are resolved by coercing through `nameString`
  (string derivations) or by an explicit null guard (raw-value uses), matching
  the derivation-vs-raw-value split already established in `reflection.ts`.
  Do NOT blanket-coerce — `AggregateReflection#mapping`
  (`reflection.rb:482`), the second through-source candidate (`:1109`), lookup
  keys, and error-constructor arguments are raw in Rails on purpose.
- `ConcreteReflection.name` (the public interface) is considered explicitly —
  widening it has a blast radius beyond `reflection.ts`.
- Reflection + `associations/` suites stay green.

## Notes

Closing this as "keep the cast, it is correctly scoped" is a legitimate
outcome — the point is the decision is recorded rather than left implicit.
