---
title: "controller-test-case-needs-local-secret-loaded-without-boot"
status: done
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9593
claim: "2026-11-17T13:37:03Z"
assignee: "ar-migration-generator-lives-at-generators-root"
blocked-by: null
closed-reason: null
---

## Context

Found upgrading trailmap to trails `6b369104ee` (trailmap#72). Every
`ActionController::TestCase` request in trailmap's suite failed with
`RuntimeError: tmp/local_secret.txt is not loaded; await Application#initialize first`
(190 tests).

`Configuration#secretKeyBase` (`packages/trailties/src/application/configuration.ts:434-443`)
calls `generateLocalSecret()` in a local environment, which now throws unless
`loadLocalSecret()` (`:552-563`, `@noRailsEquivalent PERMANENT`) ran first.
Only `Application#initialize` (`packages/trailties/src/application.ts:154-162`)
calls it. Rails' `generate_local_secret`
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb`) reads or
writes the file lazily and synchronously on first access, so a Rails test that
reads `secret_key_base` never depends on boot order.

trails apps' suites cannot boot under vitest (sibling story
`controller-tests-cannot-reach-app-helpers-without-booting`), so each app has to
call `Trails.application.config.loadLocalSecret()` itself before the first
request. trailmap does this in `test/support/controller-test-case.ts`, with a
pointer to this story.

## Acceptance criteria

- An `ActionController::TestCase` request against a registered but unbooted
  application reads `secret_key_base` without the app calling
  `loadLocalSecret()` first (e.g. the test case awaits the load in its own
  async setup, or the read path converges on Rails' lazy load).
- A trailties/actionpack test covers that, and fails on the current code.
- trailmap's explicit `loadLocalSecret()` call can then be deleted.
