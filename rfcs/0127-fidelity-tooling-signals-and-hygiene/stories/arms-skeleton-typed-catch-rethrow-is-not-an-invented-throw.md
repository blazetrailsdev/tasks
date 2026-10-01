---
title: "arms skeleton: the rethrow closing a typed catch is Ruby's implicit re-raise, not an invented throw"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `activerecord-converge-missing-control-flow-arms-associations` (trails#8353).

A typed Ruby `rescue` has one faithful TS lowering:

```ts
} catch (error) {
  if (error instanceof RecordNotFound) { … }
  throw error;
}
```

`scripts/api-compare/extract-ts-api.ts` `visitCatchClause` / `visitCatchArms` token each `instanceof`
arm as `rescue`, then visit the remaining statements, so the trailing `throw error` emits a bare
`throw`. Ruby's `rescue Foo` re-raises a non-matching exception implicitly and emits nothing, so
every faithful typed-catch port reports one invented `throw` in `pnpm parity:api:arms:report`.

Examples after trails#8353: `activerecord/associations/association.ts#loadTarget` (`+throw`,
against `associations/association.rb:189-196`) and `associations/preloader/branch.ts` constructor
(against `preloader/branch.rb:11-24`). The `if (!(e instanceof Foo)) throw e;` spelling
(`associations/join-dependency.ts`) has the same residue plus an `if`.

RFC 0174: measurement faults are fixed in the tool, with a unit test.

## Acceptance criteria

- [ ] In a `catch` clause, a bare `throw <the catch binding>` that follows the clause's `instanceof` chain (or is the body of a negated `instanceof` guard) emits no `throw` token, and the negated guard emits `rescue` rather than `if`.
- [ ] A `throw` of anything else inside a catch, and a rethrow outside one, still emit.
- [ ] Unit tests in `scripts/api-compare/extract-ts-api.test.ts` cover both spellings and the two still-emitting cases.
- [ ] `pnpm parity:api:arms:throws` stays green; marks that fall are tightened, never reseeded.
