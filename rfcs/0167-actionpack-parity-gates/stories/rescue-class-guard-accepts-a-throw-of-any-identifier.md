---
title: "parity: isRescueClassGuard accepts a throw of any identifier, not only the catch binding"
status: draft
updated: 2026-10-02
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8387. `scripts/api-compare/extract-ts-api.ts#isRescueClassGuard` (landed by trails#8378) reads `if (!(e instanceof Foo)) throw e;` at the head of a `catch` as the class list of a typed Ruby `rescue Foo`, and emits neither an `if` nor a `throw` for it.

Its last line accepts a throw of ANY identifier: `ts.isThrowStatement(then[0]) && ts.isIdentifier(then[0].expression)`. So `if (!(error instanceof Busy)) throw cause;` — a guard that raises a different exception than the one caught — also reads as the bare `rescue`, and the `throw` Rails' body would have to contain to match it is never asked for. The sibling rule in the same file, `isRethrowOf(statement, bound)`, already compares the thrown identifier against the catch binding.

No ported body is known to rely on the loose form; this is a tightening of the extractor so an invented raise cannot hide behind it.

## Acceptance criteria

- [ ] `isRescueClassGuard` takes the catch binding and matches only a rethrow of it (reuse `isRethrowOf`).
- [ ] A unit test in `extract-ts-api.test.ts` pins that `throw cause` under a negated `instanceof` guard keeps its `if` and `throw` tokens.
- [ ] The effect on `pnpm parity:api:arms:report` per package is recorded in the PR body; no arm-throw mark is raised.
