---
title: "plan-test-moves places test files in test-helpers dirs by rules 1-3"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9916
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/plan-test-moves.ts` treats every file under a `test-helpers/` segment as support (`SUPPORT_DIRS`), so a real `*.test.ts` inside a library `test-helpers/` dir is sent to `test/support/`. In trails#9853, `lib/action-dispatch/system-testing/test-helpers/setup-and-teardown.test.ts` and `lib/action-dispatch/testing/test-helpers/page-dump-helper.trails.test.ts` landed in `test/support/`, where `extract-ts-tests.ts:84`'s `action-dispatch/**` glob no longer saw them (parity:test dropped 2 files / 6 tests) until they were hand-moved to `test/action-dispatch/{system-testing,testing}/test-helpers/`.

## Acceptance criteria

- [ ] A `*.test.ts` / `*.trails.test.ts` is placed by rules 1-3 even when its directory is a support dir; only non-test files take the support route.
- [ ] `plan-test-moves.test.ts` covers a test file under `lib/<x>/test-helpers/`.
