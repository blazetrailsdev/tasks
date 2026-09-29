---
title: "Port ActiveJob::Railtie into trailties and switch ActiveJob on in `trails new`"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["trailties", "activejob"]
deps:
  [
    "port-activejob-log-subscriber",
    "port-activejob-test-helper-enqueued-assertions",
    "port-activejob-enqueue-after-transaction-commit",
    "port-activejob-async-adapter",
    "port-activejob-scalar-serializers",
  ]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/railtie.rb` (123 lines) goes beside the other framework railties as
`packages/trailties/src/trailties/active-job.ts` (models: `trailties/active-record.ts`,
`trailties/global-id.ts`); trailties takes a plain `@blazetrails/activejob`
dependency, and `packages/trailties/src/all.ts` imports it (`rails/all.rb:11`).

- `config.active_job = OrderedOptions.new`, `custom_serializers = []`,
  `log_query_tags_around_perform = true` (`:9-11`). This registers the
  `activeJob` config key, which lets `Configuration#loadDefaults("6.1")`'s
  existing `retryJitter` arm (`packages/trailties/src/application/configuration.ts:194-197`)
  apply; check it against `configuration.rb:190-191`.
- Initializers in Rails' order: `active_job.deprecator` (`:13-15`),
  `active_job.logger` (`:17-19`), `active_job.custom_serializers` (`:21-26`),
  `active_job.enqueue_after_transaction_commit` (`:28-53`),
  `active_job.set_configs` (`:55-89`), `active_job.set_reloader_hook`
  (`:91-99`), `active_job.query_log_tags` (`:101-115`),
  `active_job.backtrace_cleaner` (`:117-121`).

**`trails new`.** `packages/trailties/src/generators/app-base.ts:33-38`
`UNPORTED_SUBSYSTEM_SKIP_DEFAULTS` defaults `skipActiveJob: true`; remove that
row. `skipActionMailer` / `skipActiveStorage` stay (still unported), and the
`skipActiveJob` implication (`:40-41`) is Rails' and stays. The environment
lines at `app-generator.ts:705-708,866-869` are already Rails'.

## Fidelity traps (predicted at authoring)

- [ ] **`options.queue_adapter ||= (Rails.env.test? ? :test : :async)`** (`:57`) is Ruby `||=` (nil/false only) and a Symbol value.
- [ ] **Config forwarding.** `set_configs` sends each option `k=` to `ActiveJob` if it responds, else to `Base` (`:59-84`), excluding three keys (`:70-74`); use `rbObjRespondTo` / `rbFPublicSend`, and camelCase names must map from the Ruby option names.
- [ ] **Nested load hooks.** `on_load(:active_job) {{ on_load(:active_record) {{ … }} }}` (`:29-30`) fires only when both have loaded, in either order.
- [ ] **`app.config.active_job.key?(:enqueue_after_transaction_commit)`** (`:33`) is key presence on `OrderedOptions`, not truthiness; the deprecation fires even for `false`.
- [ ] **Reloader wrap.** `ActiveJob::Callbacks.singleton_class.set_callback(:execute, :around, prepend: true) {{ |_, inner| app.reloader.wrap {{ inner.call }} }}` (`:93-97`): the wrap must await `inner`.
- [ ] **`app.config.respond_to?(:active_record)`** (`:102`) and `query_log_tags |= [:job]` (`:107`, Array union, Symbol `":job"`).
- [ ] **`on_load(:action_dispatch_integration_test) {{ include ActiveJob::TestHelper }}`** (`:86-88`).

## Acceptance criteria

- [ ] A booted app has `config.activeJob`; `ActiveJob.Base.queueAdapterName` is `"async"` in development and `"test"` in test; `ActiveJob.Base.logger` is `Trails.logger`.
- [ ] A `.trails.test.ts` covers `custom_serializers`, the reloader wrap and the `EnqueueAfterTransactionCommit` include.
- [ ] `trails new` without `--skip-active-job` generates an app with ActiveJob on.

## Definition of done

Removing `skipActionMailer` / `skipActiveStorage` along with `skipActiveJob` does not close this story.
