---
title: "prefer-await-relation-widen-receiver-gate"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`prefer-await-relation` (the ESLint rule) was narrowed in PR #4281 to fire
only on **call-expression receivers** (`await Author.where(...)`, `all()`) —
never on a plain identifier binding. That narrowing was a workaround, not a
design choice: `stripThenable` deleted `.then` from the relation instance in
place, so any binding that had been `load`/`reload`/`presence`/`destroyAll`'d
was no longer awaitable at runtime while still typing as thenable. The rule
could not tell a safe binding from a stripped one, so it gave up on all of
them.

PR #4968 removed that divergence: `stripThenable` now returns a then-less
`Proxy` view and leaves the original binding awaitable. Every relation
binding is therefore awaitable again, whatever has been called on it, so the
gate's premise no longer holds.

## Acceptance criteria

- Widen `prefer-await-relation` past the call-expression-only receiver gate
  so identifier receivers (`await davids` for a `const davids = Author.where(...)`)
  are also reported.
- Run the autofix across the AR suite and confirm no test regresses to
  deep-equalling a `Relation {...}` against an array (the #4281 failure mode
  in `relation/delete-all.test.ts`'s `destroy all`).
- Drop the now-stale comment in the rule explaining the narrowing.
- Ratchet/lint baselines updated in the same PR if the widened rule reds CI.
