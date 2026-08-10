---
title: "actionpack flat barrel cannot express Http::Parameters vs ActionController::Parameters"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence item: ActionDispatch::Http::Parameters IS reachable at the barrel that mirrors its Ruby namespace (packages/actionpack/src/action-dispatch/http/index.ts), and nothing shadows ActionController::Parameters. The remaining issue is the flat outer barrel, a trails packaging artifact with no Rails counterpart to converge onto — a module-layout design question, not a divergence in ported behaviour."
---

## Context

`packages/actionpack/src/action-dispatch/index.ts` is a flat barrel that
already exports `Parameters` from
`../action-controller/metal/strong-parameters.js`
(`ActionController::Parameters`). PR #5407 added a second Rails-named
`Parameters` class for `ActionDispatch::Http::Parameters`
(`packages/actionpack/src/action-dispatch/http/parameters.ts`), which the two
namespaces keep distinct in Ruby but the flat barrel cannot.

Workaround shipped in #5407: the new class is exported from
`action-dispatch/http/index.ts` only and deliberately NOT re-exported from
`action-dispatch/index.ts`. That is a hole in the barrel, not a fix — the
name is simply unreachable from the outer barrel.

Aliasing either export would invent surface Rails does not have, so the fix
has to be structural (namespace objects mirroring the Ruby module tree, or a
documented rule that same-named classes resolve at their own namespace
barrel). The same collision will recur for every future `Http::X` that shares
a last segment with an `ActionController::X`.

## Acceptance criteria

- Pick and document one rule for last-segment collisions between namespaces in
  the actionpack barrels.
- `ActionDispatch::Http::Parameters` becomes reachable under that rule without
  an invented alias and without shadowing `ActionController::Parameters`.
- No new extra-surface allowlist entries; `pnpm parity:api` extra-surface
  novel count for the touched files does not regress.
