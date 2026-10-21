---
title: "port-activejob-logging-test-fixture-jobs"
status: draft
updated: 2026-10-21
rfc: "0169-activejob-package-port"
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

`port-activejob-test-fixture-jobs` mirrored the `activejob/test/jobs/` fixtures that need only `Base`. Four fixtures read `ActiveJob::Logging` (`logger`, `log_arguments`), which `packages/activejob/src` does not port yet, so they were left out:

- `vendor/rails/v8.0.2/activejob/test/jobs/logging_job.rb` — `perform(*dummy)` logs `dummy.join(" ")` (Ruby `Array#join` recurses into nested arrays); overrides `job_id` → `"LOGGING-JOB-ID"`.
- `nested_job.rb` — `perform` calls `LoggingJob.perform_later "NestedJob"`; overrides `job_id` → `"NESTED-JOB-ID"`.
- `overridden_logging_job.rb` — overrides `logger` with `@logger ||= ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new(nil))`.
- `disable_log_job.rb` — `self.log_arguments = false`; overrides `job_id`.

Mirror them into `packages/activejob/src/test-helpers/jobs/` beside `hello-job.ts`, each `registerConstant`ed under its Ruby name.

## Acceptance criteria

- [ ] Four same-named TS files, same class names, registered for `constantize`.
- [ ] `job_id` / `logger` overrides replace `Core`'s / `Logging`'s accessors.
- [ ] `LoggingJob` joins nested arrays as Ruby `Array#join` does.
