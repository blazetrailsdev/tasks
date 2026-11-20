---
title: "activerecord: receipt remaining PERMANENT-SKIP tests in unported-files"
status: ready
updated: 2026-11-20
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10366 added `scripts/parity/unported-files/activerecord.ts`. Four more
activerecord skips already carry `PERMANENT-SKIP:` lines in the TS but have no
register entry, so `pnpm parity:test` still counts them as skipped:

- `packages/activerecord/test/cases/associations/has-many-through-disable-joins-associations.test.ts:199,213`
  "empty on disable joins through", "empty on disable joins through using custom foreign key"
  (CLAUDE.md, "`Relation` is evaluated by an async query")
- `packages/activerecord/test/cases/destroy-association-async-job.test.ts:71`
  "destroy_association_async_job error shows a missing parent job class, as if ActiveJob were missing"
  (Rails `vendor/rails/v8.0.2/activejob/test/.../destroy_association_async_job_test.rb`, autoload deferral)
- `packages/activerecord/test/cases/associations/has-one-associations.test.ts:702`
  "has one proxy should not respond to private methods"
  (CLAUDE.md, "Method visibility is compile-time only")

## Acceptance criteria

- Each test gets a per-test `tests:` entry in `activerecord.ts`, reason citing its section; stubs stay.
- `pnpm parity:test` activerecord skipped count drops by the number of entries that were counted.
