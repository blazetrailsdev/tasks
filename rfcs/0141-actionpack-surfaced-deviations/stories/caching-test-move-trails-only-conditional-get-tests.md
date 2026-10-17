---
title: "actionpack: move 14 trails-only freshWhen/expiresIn tests out of the Rails FragmentCachingTest describe"
status: draft
updated: 2026-10-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/caching.test.ts` opens with a
`describe("FragmentCachingTest")` that holds 14 trails-only tests (`freshWhen …`,
`stale? …`, `expiresIn …`, `expiresNow …`). Rails' `FragmentCachingTest`
(`vendor/rails/v8.0.2/actionpack/test/controller/caching_test.rb:43-143`) has none of
them, so `pnpm parity:test --package actioncontroller` reports 14 extra tests on
`controller/caching_test.rb` (28 matched, 4 skipped, 14 extra after trails#9007).

## Acceptance criteria

- The 14 tests move to `controller/caching.trails.test.ts` (or the conditional-get
  Rails test they actually mirror, if one exists — check
  `actionpack/test/controller/render_test.rb` etag/last-modified tests first).
- `parity:test` reports 0 extra on `controller/caching_test.rb`.
