---
title: "trailties-mailer-previews-test-port"
status: in-progress
updated: 2026-11-08
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9855
claim: "2026-11-07T22:45:22Z"
assignee: "trailties-mailer-previews-test-port"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb` has 34
tests. trails-mailers-controller ported `Rails::MailersController`
(`packages/trailties/src/mailers-controller.ts`) and one of them,
"/trails/mailers is accessible in development", in
`packages/trailties/src/application/mailer-previews.test.ts`.

The rest cannot share that file yet: each Rails test boots its own app in a
forked process (`ActiveSupport::Testing::Isolation`). In trails the test body
runs in the vitest parent (`Isolation.run` is not reached from
`activesupport/src/testing/autorun.ts:117-134` for this suite), so a second
`t.app("development")` in the same file fails with
`Cannot read properties of null (reading 'executor')` at
`activesupport/src/executor/test-helper.ts:8`: the first boot's
`ExecutorTestHelper` stays on `TestCase` after `teardownApp` restores
`Trails.application = null`. Each test passes run alone (`-t`).

The two production tests ("not accessible in production", "accessible with
correct configuration") also need `:mem_cache_store`, which buildApp
configures (`test-helpers/isolation/abstract-unit.ts:161`) and is unported.

## Acceptance criteria

- Several app boots per isolation test file work, so tests in one file do not
  share a booted app.
- The remaining 33 tests of `mailer_previews_test.rb` are ported, names
  verbatim (`rails` → `trails`), into `mailer-previews.test.ts`.
