---
title: "trailmap: config/initializers/error-reporting.ts gets a test for its set and unset SENTRY_DSN branches"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trailmap#208. The Rails twin's `rails/config/initializers/sentry.rb` has `rails/test/initializers/sentry_test.rb`, which loads the initializer with `ENV` and `Sentry.init` stubbed and covers both branches, including `release` coming from `GIT_REV`. The trails side, `config/initializers/error-reporting.ts` (which calls `Sentry.init` when `SENTRY_DSN` is set and subscribes to `Trails.error`), has no test at all.

## Acceptance criteria

- A test under `test/config/` or `test/initializers/` proves that with `SENTRY_DSN` unset nothing initializes or subscribes, and with it set `Sentry.init` receives the dsn, environment and `release` (= `GIT_REV`), and a `Trails.error.report` reaches `captureException` at the reported severity.
