---
title: "Same-file closure resolves calls on a foreign receiver as same-file methods"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6665
claim: "2026-08-17T19:08:15Z"
assignee: "closure-resolves-foreign-receiver-calls-as-same-file-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6657, which closed the receiver-blindness of the same-file
closure for property READS (`FOREIGN_READ_PREFIX` in
`scripts/api-compare/enumerable-idioms.ts`, consumed by
`reachedSameFileMethods` in `scripts/api-compare/compare.ts`). The reviewer
confirmed the remaining half is an intentional scope boundary of that PR, not
an oversight — this story is the other half.

`extract-ts-api.ts#collectCalls` records an invoked call off a foreign receiver
(`obj.someMethod()`, `details.digest(x)`) as the bare name `someMethod`, with
no receiver. The same-file closure then resolves that name against a same-file
method of the same name and unions its call-set — and everything it reaches
within `SAME_FILE_CLOSURE_DEPTH` — into a body that only called a method on
somebody else's object. Editing that unrelated method moves this body's
`missing` set with its own body byte-identical: the exact perturbation class
PR #6542 closed for `constructor` and PR #6657 closed for reads.

The read half was fixable without loss because a read carries no callee: a
name is marked foreign only when EVERY occurrence in the body was a read off a
non-`this`/`super` receiver, so one `this.foo()` anywhere keeps `foo`
resolvable. The call half needs the same per-occurrence tally over CALL sites,
which is why it was left out of #6657 rather than folded in.

Care is needed not to over-mark: `Base.connection()` and any capitalized
receiver is a class reference whose static of that name may genuinely be a
same-file member (`isForeignReadReceiver` already encodes that rule), and the
trails `this`-typed mixin convention means `_qm.emitJoinPlan.call(this, x)`
DOES dispatch a real same-file body.

## Converged shape

Extend the FOREIGN_READ_PREFIX tally in `extract-ts-api.ts#collectCalls` to
CallExpression sites whose callee is a property access on a foreign receiver,
reusing `isForeignReadReceiver` unchanged. The `X.call(...)` / `X.apply(...)`
dispatch arm must keep crediting the dispatched identifier as non-foreign —
that is the mixin convention and the body really is same-file.

## Acceptance criteria

- A body that calls `obj.foo()` does not inherit the call-set of a same-file
  method named `foo`; a test asserts it, and a sibling test asserts that one
  `this.foo()` in the same body keeps `foo` resolvable.
- `X.call(...)` / `X.apply(...)` dispatch to a same-file body still resolves.
- Any rows the change unmasks are converged, or baselined with a Rails
  `file:line` citation; `pnpm parity:api:calls` and `pnpm parity:api:calls:args`
  stay green.
