---
title: "turbo-system-test-secret-key-base-not-string"
status: ready
updated: 2026-11-22
rfc: "0061-ci-failures"
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

Seen on trails#10527 (run 44959392416, job 137014769360), in a PR that touches
nothing in turbo or the system-test setup:
`packages/turbo/test/system/form-submissions.system.test.ts` fails at load with
``ArgumentError: `secret_key_base` for test environment must be a type of String``
(raised from trailties' `Application#secret_key_base` validation,
`vendor/rails/v8.0.2/railties/lib/rails/application.rb` `validate_secret_key_base`).

## Acceptance criteria

- [ ] The turbo system-test app boots with a String `secret_key_base` in the test env.
- [ ] `pnpm vitest run --project system packages/turbo/test/system/form-submissions.system.test.ts` passes.
