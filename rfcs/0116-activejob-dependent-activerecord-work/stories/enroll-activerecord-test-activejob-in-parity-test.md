---
title: "enroll-activerecord-test-activejob-in-parity-test"
status: draft
updated: 2026-10-29
rfc: "0116-activejob-dependent-activerecord-work"
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

Rails' `activerecord/test/activejob/` (`destroy_association_async_job_test.rb`, `job_runtime_test.rb`, `destroy_association_async_test.rb`) is not collected by `parity:test`: `vendor/sources.ts` gives activerecord `testPath: "activerecord/test/cases"`, and `scripts/test-compare/extract-ruby-tests.rb` globs only under it. trails#9432 ported the tests to `packages/activerecord/src/destroy-association-async-job.test.ts` and `src/trailties/job-runtime.test.ts`, but they earn no credit.

## Acceptance criteria

- `test/activejob/*_test.rb` is extracted for activerecord, either as a second test root or through a pseudo-package like `activerecord-test-support`. Existing `cases/` path mapping must stay unchanged.
- `compare.ts` maps those files onto the trails test files above, moving the files if the mapping requires it.
- The `parity:test` activerecord delta is at least +7.
