---
title: "Add Rails-faithful fixtures() / setupFixtures() surface (additive)"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

# Add the Rails `fixtures()` / `setupFixtures()` surface (additive)

Part 0 / foundation of the fixtures-surface convergence (RFC 0048). **Purely
additive and non-breaking** — adds the Rails-faithful public names so new and
newly-ported tests can use `fixtures({ authors, posts })` / `setupFixtures()`
immediately, WITHOUT touching any existing call site. The convergence of the
alternate paths onto these names is split into follow-up stories.

## Context

`useHandlerFixtures(map, opts)` already IS the correct path internally — it calls
`setupHandlerSuite()` + `withTransactionalFixtures()` + `useFixtures(Base.connection)`
(use-handler-fixtures.ts:62-72), and its docstring says it "Mirrors Rails'
setup_fixtures/teardown_fixtures." Rails' surface is `fixtures :authors, :posts`
with no "handler" qualifier. So the Rails names can be introduced as thin
delegating aliases today; nothing about the runtime path changes.

## Acceptance criteria

- [ ] `fixtures(...)` exported from `test-helpers` (and the AR test entry),
      delegating to the handler path with the SAME overloads as
      `useHandlerFixtures` (map / names / tableless) so call sites can later be
      renamed mechanically. Primary documented form: `fixtures({ authors, posts })`.
- [ ] `setupFixtures()` exported, delegating to `setupHandlerSuite()`.
- [ ] Existing `useHandlerFixtures` / `setupHandlerSuite` exports are UNCHANGED
      and untouched (no call-site migration in this story).
- [ ] Convert ONE already-canonical file (e.g. `associations/collection-proxy.test.ts`)
      to `fixtures()` / `setupFixtures()` as a working proof; note the line delta.
- [ ] `test:compare` unchanged (no test-name changes).

## Notes

- Unblocks immediate use of `fixtures({})` in all RFC 0048 faithful ports.
- The `schema` arg stays accepted-but-optional here; defaulting it off is
  `fixtures-drop-schema-arg-default-off`.
