---
title: "Paren-less self-call emits a property access instead of a call"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5831
claim: "2026-08-01T22:01:02Z"
assignee: "codegen-parenless-self-call-emits-property-access"
blocked-by: null
closed-reason: null
---

## Context

A paren-less, argument-less implicit self-call is emitted as a bare property
access, not a call: `emitCall` in `scripts/prism-codegen/handlers/expressions.ts`
short-circuits with `if (!recv && callArgs.length === 0 && !block && !hasParens(n)) return target;`.

So Ruby `@relation = build_relation` generates
`this.relation = this.buildRelation;` — an unbound method reference where the
port expects the method's value. In Ruby that is unambiguously a call.

PR #5828 had to work around this: `hasAsyncProvenance`
(`scripts/prism-codegen/await-policy.ts`) excludes exactly this shape from
earning async provenance, because the target holds a function rather than the
awaited result. Test: "claims no provenance from a paren-less self-call, which
emits a method reference" in `scripts/prism-codegen/codegen.test.ts`.

The short-circuit presumably exists to render attribute reads (`@name`,
`valid?`) as property access in the port, which is often right. Distinguishing
the two needs the port index: a name that resolves to a getter stays a property
access; one that resolves to a method should emit `()`.

## Acceptance criteria

- A paren-less self-call whose resolved port symbol is a method (not a getter)
  emits a call, not a property access.
- Getter-backed reads keep emitting property access; goldens for those are
  unchanged.
- The `hasAsyncProvenance` invoked-check is revisited: once the emission is
  correct, the exclusion should narrow to whatever still emits bare.
- Goldens regenerated; `pnpm codegen:score` matched count does not regress.
