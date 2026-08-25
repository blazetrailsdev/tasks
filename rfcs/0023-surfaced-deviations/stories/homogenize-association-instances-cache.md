---
title: "Stop caching ad-hoc non-Association holders in _associationInstances"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into association-cache-holds-only-association-instances — duplicate story describing the same deviation; the surviving body carries both sets of Rails and trails file:line citations"
---

## Context

`_associationInstances` is documented as the canonical `Association` cache
(Rails' `@association_cache`), but trails also stores non-`Association` literals
in it for undeclared inverses — an ad-hoc holder exposing only
`target` / `_explicitTarget` / `isLoaded` / `setTarget`:

- `packages/activerecord/src/associations.ts` (the undeclared-inverse branch of
  the inverse-seeding helper)
- `packages/activerecord/src/support/seed-association-cache.ts`

Rails has no such shape: `@association_cache` holds `Association` instances
only, and an ad-hoc inverse simply is not cached. The heterogeneous map forces
every consumer to probe defensively (`isCollection?.()`, `_mergeLoaderResults?.()`,
`isLoaded?.()`, `reset?.()`), and a single missing `?.` is a runtime
`TypeError` on a path with no local test coverage — exactly what broke CI on
PR #5461 (`instance.isCollection is not a function`, reached indirectly through
validation error-message generation).

## Acceptance criteria

- [ ] Undeclared inverses either get a real `Association` instance or are not
      cached in `_associationInstances` at all — the map holds one type.
- [ ] The defensive optional-call probes on that map
      (`isCollection?.()`, `_mergeLoaderResults?.()`, `isLoaded?.()`, `reset?.()`)
      become plain calls, or the sites are documented as needing them for a
      different reason.
- [ ] `validations/absence-validation.test.ts` (the suite that caught the
      original TypeError) and the FakeTopic/FakeReply fixture paths stay green.
