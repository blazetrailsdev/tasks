---
title: "Remove dead Callback.apply dispatcher in activesupport callbacks"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: 40
pr: 3889
claim: "2026-06-22T15:23:56Z"
assignee: "remove-dead-callback-apply-method"
blocked-by: null
---

## Context

`packages/activesupport/src/callbacks.ts` defines `Callback.apply(target, block)`
(the `kind === "before" | "after" | "around"` dispatcher, ~line 628). Reviews on
PR #3700 (twice) confirmed it has **no in-tree callers** — the live runner is
`CallbackChain._invoke` (via `CallbackSequence.invoke` → `runCallbacks`), and the
`Before` / `After` / `Around` filter classes are the compiled path. `Callback.apply`
is dead code.

In PR #3700 its before-branch was converted from `... !== false` to a try/catch
on the abort sentinel for consistency, but since nothing calls it, it is pure
maintenance weight. Rails has no direct analogue invoked this way (the dispatch
happens through `CallbackSequence`/`Filters`), so removing it does not reduce
api:compare fidelity.

Key file:

- `packages/activesupport/src/callbacks.ts` — `Callback.apply` (~line 628) and
  its `WrappedBefore`/dispatch helpers if they become unused after removal.

## Acceptance criteria

- [ ] Confirm zero callers (in-tree + generated) of `Callback.apply`.
- [ ] Remove `Callback.apply` and any helpers it solely used.
- [ ] api:compare / test:compare delta non-negative; typecheck + lint clean.
