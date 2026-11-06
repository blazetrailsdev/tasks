---
title: "activejob-test-adapter-payload-bare-keys"
status: claimed
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-06T02:57:10Z"
assignee: "activejob-test-adapter-payload-bare-keys"
blocked-by: null
closed-reason: null
---

## Context

`packages/activejob/src/queue-adapters/test-adapter.ts:79` writes the enqueued-job payload as `jobData[":job"]`, and `packages/activejob/src/test-helper.ts` (`jobsWith`, `fetch(job, ":job")`) reads it the same way. Rails' `job_to_hash` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/test_adapter.rb`) builds `{ job: job.class, args: ..., queue: ... }`, a plain option hash. Under CLAUDE.md's `symbolize_keys` rule a hash like that is bare-keyed (`job`, `args`, `queue`, `at`). Consumers mirror the colon form today: `packages/actionmailer/src/test-helper.ts` `deliveryJobFilter` reads `fetch(job, ":job")` (Rails `test_helper.rb:259`, `job.fetch(:job)`).

## Acceptance criteria

- The test adapter's payload keys are bare (`job`, `args`, `queue`, `at`), and every reader in activejob, actionmailer and actioncable is converged in the same change.
- The activejob and actionmailer test-helper suites pass.
