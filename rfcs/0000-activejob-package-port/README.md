---
rfc: "0000-activejob-package-port"
title: "@blazetrails/activejob: port ActiveJob with its in-process adapters"
status: draft
created: 2026-09-29
updated: 2026-09-29
owner: "@deanmarano"
packages:
  - activejob
  - trailties
  - activerecord
  - globalid
  - activesupport
  - i18n
  - ruby-compat
clusters:
  - fidelity
related-rfcs:
  - "0116-activejob-dependent-activerecord-work"
  - "0069-globalid-trailtie-port"
  - "0133-rack-session-gem-port"
  - "0137-rack-test-gem-port"
  - "0168-rack-cache-gem-port"
  - "0142-trailties-surfaced-deviations"
  - "0147-execution-context-at-thread-spawn-sites"
  - "0127-fidelity-tooling-signals-and-hygiene"
priority: 3
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — `@blazetrails/activejob`

## Summary

trails has no ActiveJob. There is no `packages/activejob`, no `activejob` entry
in `vendor/sources.ts`, and `pnpm parity:api --package activejob` refuses the
name outright:

```console
$ API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api --package activejob
--package: unknown package "activejob". Did you mean: activemodel?
```

This RFC creates `packages/activejob` and ports ActiveJob from the vendored
Rails tree (`vendor/rails/v8.0.2/activejob/`). The port covers `ActiveJob::Base`
and every module it includes, the argument serializers, the three in-process
queue adapters (`inline`, `async` and `test`), `TestHelper` / `TestCase`,
`EnqueueAfterTransactionCommit`, the GlobalID argument arm, the railtie, and
`trails g job`. The seven third-party gem adapters are deliberate non-ports.

This RFC also unblocks RFC 0116: that RFC's `dependent: :destroy_async` closure
is waiting on `perform_later` and `TestHelper`, and its stories now depend on
this RFC's stories for them.

ActiveJob is the next framework package after actionpack / actiondispatch,
trailties and actionview, which are all at priority 2. This RFC and its seed
stories are priority 3.

## Motivation

### What the package covers

`vendor/rails/v8.0.2/activejob/lib/` is 3,822 lines in 47 `.rb` files. The
api extractor, run over `lib/active_job` with no change to the script, reports:

```console
$ RUBY_API_OUTPUT_PATH=<scratch>/aj-api.json LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
  LIB_PATHS_JSON='{"activejob":"'$PWD'/vendor/rails/v8.0.2/activejob/lib/active_job"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
  activejob: 39 classes, 29 modules, 247 public methods (72 internal)

$ TEST_PATHS_JSON='{"activejob":"'$PWD'/vendor/rails/v8.0.2/activejob/test"}' \
  ruby scripts/test-compare/extract-ruby-tests.rb
Total: 416 tests across 22 files (0 adapter/feature-gated)
```

Of those 416 tests, 20 belong to the gem adapters and are not ported:
`delayed_job_adapter_test.rb` (3), `integration/queuing_test.rb` (15), and the
two `if adapter_is?(:sucker_punch)` cases in `adapter_test.rb:10-35`. One
more, `QueueAdapterJobTest` (`test_helper_test.rb:2203-2213`), drives
`Zeitwerk.with_loader`, and trails has no autoloader (CLAUDE.md § "Trails has
no autoloader"). That leaves **395 portable tests**. `test_helper_test.rb` holds 214 of them in 2,213
lines.

| Rails file:line (`vendor/rails/v8.0.2/activejob/lib/…`)                                                            | lines | what it is                                                                                                                         | story                                                                                               |
| ------------------------------------------------------------------------------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `active_job.rb:34-59`                                                                                              |    59 | `ActiveJob` namespace, `extend ActiveSupport::Autoload`, `verbose_enqueue_logs`                                                    | `port-activejob-core-queue-name-and-priority`                                                       |
| `active_job/version.rb`, `gem_version.rb`, `deprecator.rb`                                                         |    34 | `VERSION`, `gem_version`, `ActiveJob.deprecator`                                                                                   | `activejob-package-skeleton`                                                                        |
| `active_job/base.rb:63-78`                                                                                         |    79 | `Base` includes 12 modules, then `run_load_hooks(:active_job, self)` at `:77`                                                      | `port-activejob-core-queue-name-and-priority`                                                       |
| `active_job/core.rb:8-201`                                                                                         |   202 | job attributes, `initialize`, `serialize` / `deserialize`, `set`, `successfully_enqueued?`                                         | `port-activejob-core-queue-name-and-priority`                                                       |
| `active_job/queue_name.rb`, `queue_priority.rb`                                                                    |   128 | `queue_as`, `queue_name_prefix`, `queue_with_priority`                                                                             | `port-activejob-core-queue-name-and-priority`                                                       |
| `active_job/configured_job.rb:4-21`                                                                                |    22 | `ConfiguredJob`, the value `set` returns                                                                                           | `port-activejob-core-queue-name-and-priority`                                                       |
| `active_job/arguments.rb:10-196`                                                                                   |   197 | `Arguments.serialize` / `deserialize`, `SerializationError`, `DeserializationError`                                                | `port-activejob-arguments` (GlobalID arm: see below)                                                |
| `active_job/serializers.rb`, `serializers/*.rb`                                                                    |   382 | `Serializers.serialize` / `deserialize` / `add_serializers`, `ObjectSerializer` and 11 subclasses                                  | `port-activejob-arguments`, `port-activejob-object-serializers`                                     |
| `active_job/enqueuing.rb:8-139`                                                                                    |   140 | `EnqueueError`, `ActiveJob.perform_all_later`, `perform_later`, `enqueue`, `raw_enqueue`                                           | `port-activejob-enqueuing-execution-and-inline-adapter`                                             |
| `active_job/execution.rb:12-71`                                                                                    |    72 | `perform_now`, `execute`, `perform`, `_perform_job`; `include ActiveSupport::Rescuable` (`:14`)                                    | `port-activejob-enqueuing-execution-and-inline-adapter`                                             |
| `active_job/queue_adapter.rb:6-77`, `queue_adapters.rb:112-139`                                                    |   218 | `ActiveJob.adapter_name`, `queue_adapter=` / `queue_adapter_name`, `QueueAdapters.lookup`                                          | `port-activejob-enqueuing-execution-and-inline-adapter`                                             |
| `active_job/queue_adapters/abstract_adapter.rb`, `inline_adapter.rb`                                               |    42 | `AbstractAdapter`, `InlineAdapter`                                                                                                 | `port-activejob-enqueuing-execution-and-inline-adapter`                                             |
| `active_job/queue_adapters/test_adapter.rb`, `async_adapter.rb`                                                    |   202 | `TestAdapter` and its filters; `AsyncAdapter` over `Concurrent::ThreadPoolExecutor` (`:89`)                                        | `port-activejob-test-and-async-adapters`                                                            |
| `active_job/callbacks.rb:18-166`, `timezones.rb`, `translation.rb`                                                 |   193 | `before/after/around_perform`, `before/after/around_enqueue`, the `:execute` chain (`:22-32`), `Time.use_zone`, `I18n.with_locale` | `port-activejob-callbacks-timezones-and-translation`                                                |
| `active_job/exceptions.rb:7-205`                                                                                   |   206 | `retry_on`, `discard_on`, `after_discard`, `retry_job`, the backoff and jitter algorithms                                          | `port-activejob-exceptions-retry-and-discard`                                                       |
| `active_job/instrumentation.rb`, `logging.rb`, `log_subscriber.rb`                                                 |   317 | `ActiveJob.instrument_enqueue_all`, `Instrumentation#instrument`, `tag_logger`, `LogSubscriber`                                    | `port-activejob-instrumentation-and-log-subscriber`                                                 |
| `active_job/test_helper.rb:8-769`, `test_case.rb`                                                                  |   781 | `TestHelper` assertions, `perform_enqueued_jobs`, `TestQueueAdapter`, `ActiveJob::TestCase`                                        | `port-activejob-test-helper-enqueued-assertions`, `port-activejob-test-helper-performed-assertions` |
| `active_job/enqueue_after_transaction_commit.rb:4-43`                                                              |    44 | `raw_enqueue` deferred through `ActiveRecord.after_all_transactions_commit` (`:34`)                                                | `port-activejob-enqueue-after-transaction-commit`                                                   |
| `active_job/railtie.rb:8-122`                                                                                      |   123 | `config.active_job`, 9 initializers                                                                                                | `port-activejob-railtie-and-job-generator`                                                          |
| `rails/generators/job/job_generator.rb`, `templates/*.tt`                                                          |    48 | `rails g job`                                                                                                                      | `port-activejob-railtie-and-job-generator`                                                          |
| `active_job/queue_adapters/{backburner,delayed_job,queue_classic,resque,sidekiq,sneakers,sucker_punch}_adapter.rb` |   389 | the seven gem adapters                                                                                                             | **not ported** (see Non-goals)                                                                      |

### Who is waiting on it

| Consumer                                                             | status | what it needs                                                                                                                                                                   |
| -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0116/port-after-commit-jobs-callback`                               | draft  | `perform_later`. `associations/builder/association.rb:145-162` drains `_after_commit_jobs` with `job_class.perform_later(**job_arguments)`                                      |
| `0116/port-destroy-association-async-job`                            | draft  | `ActiveJob::Base`, `TestHelper` (`vendor/rails/v8.0.2/activerecord/test/activejob/helper.rb:9-10` sets `queue_adapter = :test`)                                                 |
| `0116/port-destroy-association-async-test-and-flip-models`           | draft  | `perform_enqueued_jobs` (21 uses), `assert_enqueued_jobs` (4), `assert_no_enqueued_jobs` (3), `assert_enqueued_with` (2)                                                        |
| `0116/jobruntime-instrument-drops-both-super-delegations`            | draft  | a host `instrument` for `JobRuntime#instrument`'s `super` (`activerecord/lib/active_record/railties/job_runtime.rb:9-17`): that host is `ActiveJob::Instrumentation#instrument` |
| `0127/attribute-on-load-include-to-hook-target-class`                | draft  | related only: it attributes `on_load(:active_job)` includes to `ActiveJob::Base`, a class "no api-compared package extracts today". This RFC makes it extracted.                |
| `trails new` (`packages/trailties/src/generators/app-base.ts:33-38`) | —      | `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS.skipActiveJob: true` switches ActiveJob off in every generated app. The railtie story removes that row.                                       |

The other RFCs that mention ActiveJob were checked. Their ActiveJob stories are
all `done` or `closed`: `0080/converge-destroy-association-async-job-accessor`,
`0099/port-executor-wrapping-around-a-unit-of-work`,
`0104/port-rails-all-so-a-booted-app-loads-its-railties`,
`0104/railtie-configuration-options-not-shared`,
`0142/generated-environments-omit-namespaced-framework-settings`, and RFC 0147
(closed), whose Non-goals hand the `AsyncAdapter` executor to "whoever ports
`async_adapter.rb`". That is `port-activejob-test-and-async-adapters`. The
0023 stories are superseded by RFC 0116 or independent of it (see RFC 0116's
"Supersedes"). None of them is re-filed here.

## Design

### Package shape

`packages/activejob/` is published as `@blazetrails/activejob` at `0.1.0`, the
way `packages/globalid` is. Its dependencies are the gemspec's:
`s.add_dependency "activesupport", version` and
`s.add_dependency "globalid", ">= 0.3.6"`
(`vendor/rails/v8.0.2/activejob/activejob.gemspec:35-36`), plus
`@blazetrails/ruby-compat` and `@blazetrails/i18n` (`translation.rb`, `core.rb`'s
`locale`).

**There is no `@blazetrails/activerecord` edge.** ActiveJob reaches
ActiveRecord only through the constant `ActiveRecord` at call time
(`enqueue_after_transaction_commit.rb:34`; the railtie's `railtie.rb:110` lives in trailties), and its own
test stubs that constant with a fake (`stub_const(Object, :ActiveRecord,
fake_active_record, exists: false)`,
`test/cases/enqueue_after_transaction_commit_test.rb:60`). That is the case
CLAUDE.md § "Call-time constant resolution" gives the `TopLevel` seat for: "a
top-level constant … when the gem reading it does not depend on the gem defining
it". activerecord seats `TopLevel.ActiveRecord`, and ActiveJob reads it at call
time. activerecord and trailties take `@blazetrails/activejob` as a plain
dependency. They need it for `DestroyAssociationAsyncJob < ActiveJob::Base` and
the railtie.

Src mirrors `lib/active_job/` under the module root: `core.rb` →
`src/core.ts`, `queue_adapters/test_adapter.rb` →
`src/queue-adapters/test-adapter.ts`, `serializers/symbol_serializer.rb` →
`src/serializers/symbol-serializer.ts`, and so on under
`docs/ruby-ts-conventions.md`. The railtie lives beside the other framework
railties at `packages/trailties/src/trailties/active-job.ts`
(`trailties/active-record.ts` and `trailties/global-id.ts` are the precedent).
The generator goes to `packages/trailties/src/generators/rails/job/`.

### Async shape: `perform` and `enqueue` are async

A job body does I/O. Every trails AR read is awaited, and so is every
`GlobalID::Locator.locate` (`packages/globalid/src/locator.ts:161`). So the
execution and enqueue paths are async from their first PR:

- **Execution.** `perform` is the user's method and may return a promise.
  `Execution#perform_now`, `ClassMethods#perform_now` and `execute(job_data)`
  (`execution.rb:22-57`) are `async` and await `_perform_job` inside
  `run_callbacks(:perform)`. activesupport's `runCallbacks` already awaits
  promise-returning callbacks and blocks (`packages/activesupport/src/callbacks.ts:47-56,1230`).
- **Enqueue.** `Enqueuing#enqueue`, `raw_enqueue` (`enqueuing.rb:112-139`),
  `ClassMethods#perform_later` (`:81-89`) and `ActiveJob.perform_all_later`
  (`:14-37`) are `async`. An adapter's `enqueue` / `enqueue_at` /
  `enqueue_all` may return a promise, and every caller awaits it.
  `perform_later`'s block is yielded after `enqueue`. The block is captured and
  awaited before `perform_later` returns, which is the shape CLAUDE.md
  § "A create path awaits its block before saving" ratifies for `create`.
- **Arguments.** `Arguments.serialize` stays sync. `Arguments.deserialize` is
  async from its first PR, because its GlobalID arm
  (`arguments.rb:133-135`) awaits `Locator.locate`. `deserialize_arguments_if_needed`
  (`core.rb:183-188`) is async with it. Its callers are `perform_now` and the
  test helper, which are already async.
- **Scoped state restores on settle.** `Time.use_zone` (`timezones.rb:8`),
  `I18n.with_locale` (`translation.rb:8`), `tag_logger` (`logging.rb:36-43`) and
  `ActiveSupport::Notifications.instrument` all wrap an `around_perform` block
  that is now a promise. A synchronous `ensure` would restore the zone or
  locale before the awaited body runs. Today trails' `useZone` throws on an
  async block (`packages/activesupport/src/time-zone-config.ts:24-39`), and
  `withLocale` restores synchronously (`packages/i18n/src/i18n.ts:254-266`).
  `port-activejob-callbacks-timezones-and-translation` converges both so that
  they restore when the promise settles.
- **Test assertions.** Every block-taking `TestHelper` assertion is `async` and
  awaits its block, as `assertDifference` already does
  (`packages/activesupport/src/testing/assertions.ts:183`).
- **What stays sync:** `queue_name`, `priority`, `serialize`, `deserialize`
  (the instance method that reads job data), `set`, `job_or_instantiate`, and
  the `TestAdapter` readers. None of them does I/O.

This is the same language shortcoming CLAUDE.md already ratifies twice: JS
has no synchronous await, so a body that must wait for I/O returns a promise.
`port-activejob-enqueuing-execution-and-inline-adapter` adds a CLAUDE.md
section, "A job's `perform` and `enqueue` are async", that records the
decision above, so later stories cite it instead of re-deriving it.

### In-process adapters only

| Adapter                                     | trails                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `InlineAdapter` (`inline_adapter.rb:13-22`) | ported. `enqueue` is `Base.execute(job.serialize)`, awaited. `enqueue_at` raises `NotImplementedError` as Rails does.                                                                                                                                                                                                                                                                 |
| `TestAdapter` (`test_adapter.rb:14-85`)     | ported. The `enqueued_jobs` / `performed_jobs` arrays and the `filter` / `reject` / `queue` / `at` filters are pure.                                                                                                                                                                                                                                                                  |
| `AsyncAdapter` (`async_adapter.rb:33-115`)  | ported over ruby-compat's `ThreadPoolExecutor` (`packages/ruby-compat/src/thread-pool-executor.ts:14`), which already runs each task in a ruby-compat `Thread` (`:53`) and so gets an execution context per task. That is RFC 0147's rule, and 0147's Non-goals hand this site to this port. `Concurrent::ScheduledTask` (`:99`) becomes a `setTimeout` posting to the same executor. |
| `AbstractAdapter`, `QueueAdapters.lookup`   | ported. `lookup` is `const_get(name.to_s.camelize << ADAPTER)` (`queue_adapters.rb:135-137`), so it resolves a constant on the `QueueAdapters` namespace. That namespace is extended with `ActiveSupport::Autoload` as in `:113`, like `arel/src/namespaces.ts`. An unported adapter name raises `NameError`, exactly as Rails does when the gem is not loaded.                       |

`AsyncAdapter` is in scope. RFC 0116 left this open (its Open question 2).
The Rails railtie defaults every non-test environment to `:async`
(`railtie.rb:57`), so without it a generated app enqueues onto an adapter that
does not exist.

**A real backend later is its own RFC.** It wraps an npm client declared as an
optional peer dependency, the way `pg` / `mysql2` sit in
`packages/activerecord/package.json`, and it is async from its first PR. It is
**never** a set of empty `TopLevel` seats for an app to fill: trails#8057 was
closed for exactly that (see `0158/cache-store-async-over-npm-clients`). The
adapter interface this RFC ships (async `enqueue` / `enqueue_at` /
`enqueue_all`) is what such a backend implements.

**Solid Queue**, Rails 8's default production backend, is a separate gem that
is not vendored. It is future work, it is not seeded here, and it would get its
own RFC on the same terms.

### GlobalID arguments

`Arguments.serialize_argument`'s `when GlobalID::Identification` arm
(`arguments.rb:85-86`, `convert_to_global_id_hash` at `:190-196`) and
`deserialize_argument`'s `serialized_global_id?` / `deserialize_global_id` arm
(`:117-118`, `:129-135`) go over `@blazetrails/globalid`, which RFC 0069 ported
(`Identification` at `packages/globalid/src/identification.ts:27`, `Locator` at
`locator.ts:161`). They land in `port-activejob-globalid-arguments-and-rescue-tests`,
together with the test model `test/models/person.rb`, `test/jobs/gid_job.rb`,
and the Rails cases that go through them. `GlobalID.app = "aj"`
(`test/helper.rb:7`) is set in the package's test setup.

`port-activejob-arguments` lands first without that arm, and
`port-activejob-globalid-arguments-and-rescue-tests` fills it in. The second
story also waits for `port-activejob-exceptions-retry-and-discard`, because
`test/jobs/rescue_job.rb` calls `retry_job`. This is a sequencing split of one
Rails method across two PRs. It is not a deviation: the second story is
already filed, and neither story may add a `@missingRailsCall` receipt for the
arm. `"successfully retry job throwing DeserializationError"`
(`test/cases/exceptions_test.rb:308-311`) goes through the arm, so it moves
from the exceptions story into this one. That keeps the two stories free of a
cycle.

### Canonical job fixtures

`vendor/rails/v8.0.2/activejob/test/jobs/` (24 files) are the canonical job
classes, as `activerecord/test/models/` are for AR. They are mirrored at
`packages/activejob/src/test-helpers/jobs/`, one file per Ruby file with the
Ruby class name, along with `test/models/person.rb` →
`src/test-helpers/models/person.ts` and `test/support/job_buffer.rb` →
`src/test-helpers/support/job-buffer.ts`. Each story adds the fixtures its tests
need. Tests use these fixtures instead of inventing job classes.

### Adapter lanes

Rails runs the suite once per adapter. `rake test` is `test:default`, which
runs `test:<adapter>` for every entry in `ACTIVEJOB_ADAPTERS`
(`vendor/rails/v8.0.2/activejob/Rakefile:5,8-17`), and each run sets
`ENV["AJ_ADAPTER"]` (`test/helper.rb:9`) and loads `test/adapters/<adapter>.rb`.
The difference is observable. `EnqueuedJobsTest` and `PerformedJobsTest`, 200
of `test_helper_test.rb`'s 215 cases, sit inside `if adapter_is?(:test)`
(`test/cases/test_helper_test.rb:39,828`). `NotTestAdapterTest` is
`unless adapter_is?(:test)` (`:2116`). `async_adapter_test.rb` runs only under
`async` (`Rakefile:38-41`), and three `logging_test.rb` blocks are
`unless adapter_is?(:inline, :sneakers)` (`:216,247,293`).

So trails runs the activejob suite in **three lanes**, `AJ_ADAPTER=inline`,
`test` and `async`: the in-process subset of `ACTIVEJOB_ADAPTERS`. Each lane
is one vitest invocation with the env var set, whose setup file ports
`test/adapters/<adapter>.rb`. The `adapter_is?` guards are ported as-is. The
skeleton registers the `inline` lane. `port-activejob-test-and-async-adapters`
adds `test` and `async`. A lane that never runs a guarded block would leave
200 ported cases green without executing them. The Verification section
checks for that.

### Tooling enrollment

A `rails`-source package entry in `vendor/sources.ts`:

```ts
{
  name: "activejob",
  libPath: "activejob/lib/active_job",
  testPath: "activejob/test",
},
```

`testPath` is the test root rather than `test/cases`, so that
`test/serializers/time_with_zone_serializer_test.rb` is counted. The two gem
test files under it are excluded as listed below. The remaining registrations
are the ones RFC 0137 and the memories for new packages list:

- `MANIFEST_PACKAGES` (`scripts/api-compare/config.ts`) and the
  `vendor/sources.test.ts` key lists;
- `pkgDirs` (`scripts/test-compare/compare.ts`),
  `scripts/test-compare/extract-ts-tests.ts`, and
  `scripts/test-compare/generate-stubs.ts`;
- a sorted `0/0/0` row in `scripts/test-compare/assertion-mismatch-mark.json`,
  hand-added. A reseed would move every package's counters.

`lib/rails/generators/job/job_generator.rb` is outside `libPath`. So is every
framework generator today: nothing compares
`activerecord/lib/rails/generators/active_record/`. Its test,
`railties/test/generators/job_generator_test.rb` (6 cases), is already in
trailties' test population and gets credited there.

`GATED_PACKAGES` in `scripts/api-compare/extra-surface-mark.json` is not
widened here. Gating is its own reviewed burndown.

### Where the non-ports are recorded

The gem adapters are whole files, so they go in the file-level register rather
than the member-level one. A new
`scripts/parity/unported-files/activejob.ts` (`ACTIVEJOB_UNPORTED_FILES`,
spread into `index.ts` beside `GLOBALID_UNPORTED_FILES`) holds
`package: "activejob"` entries:

- `pattern` for each of the seven `queue_adapters/*_adapter.rb` files, so
  `parity:api` does not score their 29 public methods as missing;
- `testFile: "cases/delayed_job_adapter_test.rb"` and
  `testFile: "integration/queuing_test.rb"`, so `parity:test` does not score
  their 18 cases as missing. The integration suite builds a dummy app per
  backend and drives real Sidekiq, Resque and similar workers
  (`test/support/integration/adapters/*.rb`);
- a per-test entry, `testFile: "cases/adapter_test.rb"` with `tests:` naming
  `"sucker_punch adapter should be deprecated"` and `"sucker_punch
check_adapter should warn"` (`adapter_test.rb:10-35`), the file's two
  `adapter_is?(:sucker_punch)` cases. Its third case is ported;
- a per-test entry for `test_helper_test.rb`'s Zeitwerk case, added by
  `port-activejob-test-helper-enqueued-assertions`, whose reason cites
  CLAUDE.md § "Trails has no autoloader".

Each entry's `reason` is the one in Non-goals below. `SKIP_GROUPS`
(`scripts/parity/conventions.ts:530`) is not used, because it skips member
names across every file and would hide the same name if it were ever ported
in a real file. `QueueAdapters`' `autoload` lines for the seven
(`queue_adapters.rb:118-124`) are not ported. An autoload without a file is an
empty seat.

## Non-goals

- **The seven gem adapters** (`backburner`, `delayed_job`, `queue_classic`,
  `resque`, `sidekiq`, `sneakers`, `sucker_punch`). Each is a thin shim over a
  Ruby gem's client (`Sidekiq::Client.push`, `Resque.enqueue_to`, and so on)
  that has no Node counterpart. A port would be empty seats over a client that
  does not exist. They are recorded in `unported-files/activejob.ts`, not
  stubbed.
- **A real backend (Redis, Postgres, SQS …).** That is its own RFC, over an npm
  client as an optional peer, async from its first PR (see "In-process
  adapters only").
- **Solid Queue.** It is a separate gem, not vendored, and it is future work.
- **The integration suite** (`test/integration/queuing_test.rb`,
  `test/support/integration/`). It exists to exercise the gem adapters.
- **The `dependent: :destroy_async` closure.** RFC 0116 owns it. This RFC only
  unblocks it.
- **`ActiveRecord::Railties::JobRuntime` wiring** (`activerecord/railtie.rb:271-273`).
  `0116/jobruntime-instrument-drops-both-super-delegations` owns the module,
  and the AR railtie's `on_load(:active_job)` include lands with it.

## Alternatives considered

- **Port only `TestAdapter` and `TestHelper`, the subset RFC 0116 needs.**
  Rejected: `TestHelper` asserts on `enqueue` and `perform_now`, which run the
  whole callbacks, exceptions, logging and instrumentation stack. A subset
  would be a hollow `Base` that later stories fill in underneath already-ported
  tests.
- **A trails-only job runner inside activerecord.** RFC 0116 already rejected
  this: it is invented surface with no Ruby counterpart.
- **Sync `perform_now` with an async escape hatch.** Rejected: every useful
  job body awaits an AR query. A sync `perform_now` would either drop the
  promise, so callbacks and exception handling run before the body finishes,
  or need a second API. This is the cascade CLAUDE.md § "Serialization's dual
  sync/async hash" warns about, with no sync caller to protect.
- **Stub the gem adapters so `QueueAdapters.lookup(:sidekiq)` returns
  something.** Rejected: that is empty `TopLevel` seats by another name, and
  trails#8057 was closed for it.
- **A plain `activerecord` dependency from activejob.** Rejected: the gemspec
  has none, the Rails test replaces the constant with a fake, and the edge
  would put activerecord into every job-only consumer's install.

## Rollout

1. **Package.** `activejob-package-skeleton`.
2. **Measure.** `enroll-activejob-in-compare-tooling`.
3. **Values.** `port-activejob-arguments`, then
   `port-activejob-object-serializers`.
4. **Job.** `port-activejob-core-queue-name-and-priority`, then
   `port-activejob-enqueuing-execution-and-inline-adapter`. This is the async
   decision and the CLAUDE.md section, and it unblocks
   `0116/port-after-commit-jobs-callback`.
5. **Behaviour.** `port-activejob-callbacks-timezones-and-translation` →
   `port-activejob-instrumentation-and-log-subscriber` (unblocks
   `0116/jobruntime-instrument-drops-both-super-delegations`) →
   `port-activejob-exceptions-retry-and-discard` →
   `port-activejob-globalid-arguments-and-rescue-tests`.
   `port-activejob-enqueue-after-transaction-commit` runs in parallel off
   step 4.
6. **TestHelper.** `port-activejob-test-and-async-adapters` (off step 4) →
   `port-activejob-test-helper-enqueued-assertions` →
   `port-activejob-test-helper-performed-assertions`, which unblocks
   RFC 0116's other two stories.
7. **Test ports** (parallel, once their deps land).
   `port-activejob-test-helper-test-enqueued-jobs`,
   `…-test-performed-jobs-first-half`, `…-test-performed-jobs-second-half`, and
   `port-activejob-logging-test`.
8. **Integration.** `port-activejob-railtie-and-job-generator`.
9. **RFC 0116 flips to `active`** once
   `port-activejob-enqueuing-execution-and-inline-adapter` and
   `port-activejob-test-helper-performed-assertions` are `done`. Its stories
   already carry those `deps`. The flip is a `tasks` verb for that moment, not
   part of this PR.

```text
skeleton → enroll → arguments ─┬→ object-serializers ─────────────────────────────────────────────┐
                               └→ core → enqueuing/inline ─┬→ callbacks/tz/i18n → instrumentation ─┼→ exceptions → globalid+rescue
                                                           ├→ enqueue-after-transaction-commit ────┤
                                                           └→ test+async adapters → TH enqueued ───┴→ railtie + job generator
                                                                                        └→ TH performed
THT enqueued              ← TH enqueued, globalid+rescue
THT performed ×2          ← TH performed, exceptions, globalid+rescue
logging-test              ← TH performed, exceptions, globalid+rescue
[0116] after-commit drain ← enqueuing/inline      [0116] JobRuntime ← instrumentation
[0116] job, async test    ← TH performed
```

## Growth expectation

Seed: **19 stories, 9,250 est-loc.** That is larger than the 5–6k a
rack-test-sized comparison suggests, and the reason is measured.
ActiveJob's lib is 2,066 code lines by RFC 0116's count (1,700 without the gem
adapters). Its portable tests are about 4,200 Ruby lines, and
`test_helper_test.rb` alone is 2,213 lines and 215 cases, 52% of the suite. At
trails' measured Ruby→TS ratios (activemodel 2.36×, activesupport 1.55×,
RFC 0116), the lib is about 3.4k TS. The tests port close to 1:1, at about
4.2k. Fixtures, the railtie, the generator and the tooling add about 1.5k.
The seed budgets that and nothing for growth.

Prior RFCs grew 4–9× in stories and 2–3× in LOC from creation to now:

| RFC                  | stories at creation → now | est-loc at creation → now |
| -------------------- | ------------------------- | ------------------------- |
| 0133 rack-session    | 5 → 45                    | 2.9k → 7.5k               |
| 0137 rack-test       | 14 → 51                   | 3.4k → 7.0k               |
| 0139 journey         | 12 → 74                   | 2.8k → 8.8k               |
| 0140 actionview core | 4 → 147                   | 2.7k → 16.5k              |

The growth was review-surfaced convergence stories (`converge-X-onto-rails-Y`),
not missed files. In 0137, all 37 later additions were of that kind. This seed
covers every portable file and test case up front, so the LOC multiplier should
sit at the low end. Expect **40–60 stories and 12–15k LOC** at close, with
convergence stories filed into this RFC as review surfaces them.

## Verification

- `pnpm parity:api --package activejob` prints a row, and every file outside
  the seven gem adapters is at 100%. The adapters read as unported with their
  `reason`, not as 0%.
- `pnpm parity:test` credits all 395 portable cases. The 20 gem-adapter
  cases and the one Zeitwerk case read as unported.
- CI runs the activejob suite in the `inline`, `test` and `async` lanes. In
  the `test` lane, the `EnqueuedJobsTest` / `PerformedJobsTest` cases execute
  rather than skip, and a lane's skipped count matches its `adapter_is?`
  guards.
- `pnpm parity:test` credits the 6 cases of
  `railties/test/generators/job_generator_test.rb` in trailties.
- `packages/trailties/src/generators/app-base.ts` has no `skipActiveJob` row
  in `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS`, and `trails new` emits
  `app/jobs/application-job.ts` from the ported template.
- The three RFC 0116 stories and `jobruntime-instrument-drops-both-super-delegations`
  become ready in the order their `deps` give.
- `parity:api` / `parity:test` deltas for every other package are
  non-negative at every step.

## Open questions

1. **What does `Concurrent::ScheduledTask` map onto?** `AsyncAdapter`'s
   `enqueue_at` (`async_adapter.rb:96-102`) schedules on the executor after
   `delay`. Recommendation: a `setTimeout` that posts to the same
   `ThreadPoolExecutor`, `unref`'d so a pending job does not hold the process
   open, with `shutdown(wait:)` clearing pending timers. Resolved in
   `port-activejob-test-and-async-adapters`.
2. **Does `rails-private-jsdoc` want `@internal` on all 72 internal methods at
   enrollment?** RFCs 0133, 0137 and 0168 answered yes: run the autofix in the
   enrollment PR, before any body lands. Same answer here, resolved in
   `enroll-activejob-in-compare-tooling`.
3. **Does `ActiveJob::Base` need a Rails-faithful `inherited`?** `Core`'s
   `class_attribute`s and `QueueName`'s `queue_name` default read per class.
   Recommendation: use `classAttribute()` semantics (reads walk the chain,
   writes are local) and add no hook, per CLAUDE.md § "`inherited` is deferred
   to own-property memo guards". Resolved in
   `port-activejob-core-queue-name-and-priority`.

## Changelog

- 2026-09-29: initial RFC
