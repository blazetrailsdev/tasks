---
title: "Port `rails g job` as `trails g job`, replace the invented ApplicationJob stub, with job_generator_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["trailties"]
deps: ["port-activejob-railtie"]
deps-rfc: []
est-loc: 350
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/rails/generators/job/job_generator.rb` (48 lines): `JobGenerator <
NamedBase` with `class_option :queue` (default `"default"`) and `:parent`
(default `"ApplicationJob"`), `check_class_collision suffix: "Job"`,
`hook_for :test_framework`, `self.default_generator_root`, `create_job_file`
(writes `application_job` on first `invoke` when absent), and private
`parent_class_name`, `file_name` (strips a trailing `_job`), and
`application_job_file_name` (engine-aware). Templates `job.rb.tt` and
`application_job.rb.tt`, and a `USAGE` file.

Port it to `packages/trailties/src/generators/rails/job/`, templates in the
shape the model generator uses (`packages/trailties/src/generators/rails/model/model-generator.ts`).
Replace `app-generator.ts:1030-1043`'s invented
`export class ApplicationJob { queueAs = "default"; }` with the ported
`application_job` template (an `ApplicationJob` extending `ActiveJob.Base`, with
the two commented `retry_on` / `discard_on` lines).

The generator file is outside every compare population (RFC "Tooling
enrollment"); its test is in trailties':

`vendor/rails/v8.0.2/railties/test/generators/job_generator_test.rb`: 6 cases:

- [ ] `:9` "job skeleton is created"
- [ ] `:16` "job queue param"
- [ ] `:24` "job parent param"
- [ ] `:31` "job namespace"
- [ ] `:39` "application job skeleton is created"
- [ ] `:46` "job suffix is not duplicated"

## Fidelity traps (predicted at authoring)

- [ ] **`file_name`** strips `/_job\z/i` before the template appends `Job` (`job_suffix_is_not_duplicated`).
- [ ] **`if behavior == :invoke && !File.exist?(application_job_file_name)`**: `:invoke` is a Symbol; `trails destroy job` must not remove `application-job.ts`.
- [ ] **`mountable_engine?`** chooses `app/jobs/<namespaced_path>/application_job.rb`.

## Acceptance criteria

- [ ] `trails g job foo --queue=urgent` writes `app/jobs/foo-job.ts`, and the 6 cases pass under their Rails names.
- [ ] `app-generator.test.ts` snapshots are updated deliberately, listed in the PR body.

## Definition of done

Keeping the invented `ApplicationJob` stub does not close this story.
