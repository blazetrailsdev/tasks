---
title: "seed-fixtures-once-per-worker-under-transactional-fixtures"
status: draft
updated: 2026-08-29
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
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

`packages/activerecord/src/test-fixtures.ts:154` and `:259` each build a
per-test `store` and seed it from a `beforeEach`. A TODO carried on both
(deleted by the RFC 0023 no-freeform-comments sweep of activerecord, PR for
story `strip-freeform-comments-ar-remaining-dirs`) recorded the deferred work
verbatim:

> TODO(fixtures-adoption Spike S1): seed once per worker in a global
> `beforeAll` (before the pinned transaction opens) when transactional fixtures
> are active, falling back to this per-test seed otherwise. Deferred to a
> follow-up PR to keep this one under the LOC ceiling.

Rails seeds a fixture set once and relies on the wrapping transaction to roll
each test back (`vendor/rails/activerecord/lib/active_record/fixtures.rb`,
`setup_fixtures` / `@@already_loaded_fixtures`), rather than re-inserting every
row per test. Our per-test seed is both slower and a divergence from that shape.

## Acceptance criteria

- [ ] When transactional fixtures are active, the fixture rows are seeded once
      per worker in a `beforeAll` that runs before the pinned transaction opens.
- [ ] The per-test seed remains as the fallback when transactional fixtures are
      off.
- [ ] Both `test-fixtures.ts` call sites are converged; no third seeding path is
      introduced.
- [ ] AR suites stay green on all three adapter lanes.
