---
title: "Converge useHandlerFixtures/setupHandlerSuite call sites onto fixtures()/setupFixtures()"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 500
priority: 3
pr: null
claim: "2026-06-30T19:08:36Z"
assignee: "fixtures-rename-handler-callsites"
blocked-by: null
---

# Converge the handler-named fixture helpers onto `fixtures()` / `setupFixtures()`

Converges the first alternate surface — the `useHandlerFixtures` /
`setupHandlerSuite` names — onto the Rails names added by
`fixtures-additive-surface`. The runtime path is identical (these already ARE the
correct path), so this is a mechanical rename, but it is large.

## Scope

- `useHandlerFixtures` → `fixtures` (71 test files).
- `setupHandlerSuite` → `setupFixtures` (77 test files).
- Once BOTH this and `fixtures-unify-direct-adapter-path` land (zero remaining
  call sites), DELETE the old `useHandlerFixtures` / `setupHandlerSuite` exports.
- "handler" retained ONLY where it mirrors Rails' `ConnectionHandler`
  (`Base.connectionHandler`, base.ts:820, pool code).

## Acceptance criteria

- [ ] All `useHandlerFixtures` / `setupHandlerSuite` call sites migrated.
- [ ] Old exports removed (gate: direct-adapter story also done).
- [ ] `test:compare` does not regress; no test names change.

## Notes

- Single mechanical rename (CLAUDE.md rename exception) — note it in each PR
  body. Batch by directory into non-overlapping PRs from main under the 500-LOC
  ceiling; do NOT stack.
