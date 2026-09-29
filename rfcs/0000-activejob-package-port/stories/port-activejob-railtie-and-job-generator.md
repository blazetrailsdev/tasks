---
title: "Port ActiveJob::Railtie into trailties and `trails g job`; switch ActiveJob on in `trails new`"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["trailties", "activejob"]
deps:
  [
    "port-activejob-object-serializers",
    "port-activejob-instrumentation-and-log-subscriber",
    "port-activejob-test-helper-enqueued-assertions",
    "port-activejob-enqueue-after-transaction-commit",
    "port-activejob-test-and-async-adapters",
  ]
deps-rfc: []
est-loc: 550
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

### The railtie

`vendor/rails/v8.0.2/activejob/lib/active_job/railtie.rb` (123 lines) goes
beside the other framework railties as
`packages/trailties/src/trailties/active-job.ts`
(`trailties/active-record.ts` and `trailties/global-id.ts` are the models).
trailties takes a plain `@blazetrails/activejob` dependency.

- `config.active_job = OrderedOptions.new`, `custom_serializers = []`, and
  `log_query_tags_around_perform = true` (`:9-11`). This registers the
  `activeJob` config key that
  `0142/generated-environments-omit-namespaced-framework-settings` found
  unregistered. With it, `Configuration#loadDefaults("6.1")`'s existing
  `retryJitter` arm (`packages/trailties/src/application/configuration.ts:194-197`)
  starts to apply. Check that arm against `configuration.rb:190-191`.
- Initializers, in Rails' order:
  - `active_job.deprecator` (`:13-15`, `before: :load_environment_config`);
  - `active_job.logger` (`:17-19`, `on_load(:active_job) { self.logger = Rails.logger }`);
  - `active_job.custom_serializers` (`:21-26`, `after_initialize` →
    `Serializers.add_serializers`);
  - `active_job.enqueue_after_transaction_commit` (`:28-53`), which nests
    `on_load(:active_job)` in `on_load(:active_record)`, includes
    `EnqueueAfterTransactionCommit`, and emits the Rails 8.1 deprecation for
    the `:always` / `:never` config values;
  - `active_job.set_configs` (`:55-89`). It defaults `queue_adapter` to
    `Rails.env.test? ? :test : :async` (`:57`), forwards each option to
    `ActiveJob.x=` or `Base.x=` through `rbObjRespondTo` / `rbFPublicSend`
    (`:59-84`), and includes `TestHelper` into the integration test through
    `on_load(:action_dispatch_integration_test)` (`:86-88`);
  - `active_job.set_reloader_hook` (`:91-99`): an `:execute` `around`
    callback, `prepend: true`, wrapping `app.reloader.wrap`. The reloader
    wrap awaits the job;
  - `active_job.query_log_tags` (`:101-115`), which merges a `job:` tagging
    into `ActiveRecord::QueryLogs.taggings`;
  - `active_job.backtrace_cleaner` (`:117-121`).
- `packages/trailties/src/all.ts` imports `./trailties/active-job.js`, as
  `rails/all.rb:11` requires `active_job/railtie`.

### `trails new`

`packages/trailties/src/generators/app-base.ts:33-38`
`UNPORTED_SUBSYSTEM_SKIP_DEFAULTS` defaults `skipActiveJob: true`. Remove that
row. `skipActionMailer` and `skipActiveStorage` stay: those packages are
still unported. The `skipActiveJob` → mailer / storage implication (`:40-41`)
is Rails' and stays. `app-generator.ts:1030-1043` currently writes
`app/jobs/application-job.ts` as `export class ApplicationJob { queueAs =
"default"; }`. That is invented and extends nothing. Replace it with the
ported `application_job.rb.tt`, below. The environment lines at
`app-generator.ts:705-708,866-869` are already Rails'.

### `trails g job`

`vendor/rails/v8.0.2/activejob/lib/rails/generators/job/job_generator.rb`
(48 lines) is `JobGenerator < NamedBase`, with `class_option :queue` /
`:parent`, `check_class_collision suffix: "Job"`, `hook_for :test_framework`,
`create_job_file` (which writes `application_job` on first invoke), and the
private `parent_class_name` / `file_name` / `application_job_file_name`. Its
templates are `job.rb.tt` and `application_job.rb.tt`, and it has a `USAGE`
file. Port it to `packages/trailties/src/generators/rails/job/`, with its
templates in the shape the model generator uses
(`packages/trailties/src/generators/rails/model/model-generator.ts`). The file
is outside every compare population (RFC "Tooling enrollment"). Its test is
not: `vendor/rails/v8.0.2/railties/test/generators/job_generator_test.rb`, 6
cases, is credited under trailties.

Tests: the 6 generator cases, and a `.trails.test.ts` for the railtie covering
the default adapter per environment, `custom_serializers`, the reloader wrap
and the `EnqueueAfterTransactionCommit` include.

## Acceptance criteria

- [ ] A booted app has `config.activeJob`, `ActiveJob.Base.queueAdapterName`
      is `"async"` in development and `"test"` in test, and
      `ActiveJob.Base.logger` is `Trails.logger`.
- [ ] `trails new` emits an `ApplicationJob` extending `ActiveJob.Base` from
      the ported template.
- [ ] `trails g job foo --queue=urgent` writes `app/jobs/foo-job.ts`, and
      `job_generator_test.rb`'s 6 cases pass under their Rails names.
- [ ] `app-generator.test.ts` snapshots are updated deliberately, and the PR
      body lists the changed paths.

## Definition of done

Keeping the invented `export class ApplicationJob { queueAs = "default"; }` in `app-generator.ts` does not close this story, and neither does removing `skipActionMailer` / `skipActiveStorage` along with `skipActiveJob`.
