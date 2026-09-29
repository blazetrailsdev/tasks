---
rfc: "0169-activejob-package-port"
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
  - date
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

# RFC 0169 — `@blazetrails/activejob`

## Summary

trails has no ActiveJob. There is no `packages/activejob`, no `activejob` entry
in `vendor/sources.ts`, and `pnpm parity:api --package activejob` refuses the
name outright:

```console
$ API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api --package activejob
--package: unknown package "activejob". Did you mean: activemodel?
```

This RFC creates `packages/activejob` and ports ActiveJob from the vendored
Rails tree (`vendor/rails/v8.0.2/activejob/`). It covers `ActiveJob::Base` and
every module it includes, the argument serializers, the three in-process queue
adapters (`inline`, `async`, `test`), `TestHelper` / `TestCase`,
`EnqueueAfterTransactionCommit`, the GlobalID argument arm, the railtie,
`trails g job`, and the trails-side loading that lets a job class name
round-trip through `constantize`. The seven third-party gem adapters are
deliberate non-ports.

**The seed aims to be complete.** There is one story per Rails lib file (or
small cohesive group), one per Rails test file (or small group), each at most
400 est-loc. Every test-port story lists the Rails case names it must port,
and every lib story lists the fidelity traps its Ruby body already shows.
Growth past this seed is a spec miss, to be noted as such (see "Seed
completeness").

This RFC also unblocks RFC 0116. That RFC's `dependent: :destroy_async` closure
waits on `perform_later`, `Instrumentation#instrument` and `TestHelper`, and
its four stories now depend on this RFC's stories for them.

ActiveJob is the next framework package after actionpack / actiondispatch,
trailties and actionview (all priority 2). This RFC and its stories are
priority 3.

## Motivation

### What the package covers

`vendor/rails/v8.0.2/activejob/lib/` is 3,822 lines in 47 `.rb` files. The
extractors, run over the vendored tree with no change to either script, report:

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
two `if adapter_is?(:sucker_punch)` cases in `adapter_test.rb:10-35`. One more,
`QueueAdapterJobTest` (`test_helper_test.rb:2203-2213`), drives
`Zeitwerk.with_loader`, and trails has no autoloader (CLAUDE.md § "Trails has
no autoloader"). That leaves **395 portable tests**, and the test-port stories
list all 395 by name, each exactly once.

| Rails file (`vendor/rails/v8.0.2/activejob/lib/…`)                                                                 | lines | story                                                                                               |
| ------------------------------------------------------------------------------------------------------------------ | ----: | --------------------------------------------------------------------------------------------------- |
| `active_job/version.rb`, `gem_version.rb`, `deprecator.rb`                                                         |    34 | `activejob-package-skeleton`                                                                        |
| `active_job.rb`, `active_job/base.rb`                                                                              |   138 | `port-activejob-namespace-and-base`                                                                 |
| `active_job/arguments.rb`, `serializers.rb`, `serializers/object_serializer.rb`                                    |   322 | `port-activejob-arguments` (GlobalID arm: `port-activejob-globalid-argument-arm`)                   |
| `serializers/{symbol,module,range,big_decimal,duration}_serializer.rb`                                             |   111 | `port-activejob-scalar-serializers`                                                                 |
| `serializers/{time_object,date,date_time,time,time_with_zone}_serializer.rb`                                       |    90 | `port-activejob-time-serializers`                                                                   |
| `active_job/core.rb`                                                                                               |   202 | `port-activejob-core`                                                                               |
| `active_job/queue_name.rb`, `queue_priority.rb`                                                                    |   128 | `port-activejob-queue-name-and-priority`                                                            |
| `active_job/execution.rb`, `callbacks.rb:22-25`                                                                    |    76 | `port-activejob-execution`                                                                          |
| `active_job/queue_adapter.rb`, `queue_adapters.rb`, `queue_adapters/{abstract,inline}_adapter.rb`                  |   260 | `port-activejob-queue-adapter-and-inline-adapter`                                                   |
| `active_job/enqueuing.rb`, `configured_job.rb`                                                                     |   162 | `port-activejob-enqueuing-and-configured-job`                                                       |
| `active_job/callbacks.rb` (rest)                                                                                   |   163 | `port-activejob-callbacks`                                                                          |
| `active_job/timezones.rb`, `translation.rb`                                                                        |    26 | `port-activejob-timezones-and-translation`                                                          |
| `active_job/instrumentation.rb`                                                                                    |    52 | `port-activejob-instrumentation`                                                                    |
| `active_job/logging.rb`                                                                                            |    49 | `port-activejob-logging`                                                                            |
| `active_job/log_subscriber.rb`                                                                                     |   216 | `port-activejob-log-subscriber`                                                                     |
| `active_job/exceptions.rb`                                                                                         |   206 | `port-activejob-exceptions`                                                                         |
| `active_job/queue_adapters/test_adapter.rb`                                                                        |    86 | `port-activejob-test-adapter`                                                                       |
| `active_job/queue_adapters/async_adapter.rb`                                                                       |   116 | `port-activejob-async-adapter`                                                                      |
| `active_job/test_helper.rb`, `test_case.rb`                                                                        |   781 | `port-activejob-test-helper-enqueued-assertions`, `port-activejob-test-helper-performed-assertions` |
| `active_job/enqueue_after_transaction_commit.rb`                                                                   |    44 | `port-activejob-enqueue-after-transaction-commit`                                                   |
| `active_job/railtie.rb`                                                                                            |   123 | `port-activejob-railtie`                                                                            |
| `rails/generators/job/job_generator.rb`, `templates/*.tt`                                                          |    48 | `port-activejob-job-generator`                                                                      |
| `active_job/queue_adapters/{backburner,delayed_job,queue_classic,resque,sidekiq,sneakers,sucker_punch}_adapter.rb` |   389 | **not ported** (see Non-goals)                                                                      |

| Rails test file (`vendor/rails/v8.0.2/activejob/test/…`)                                                  | cases | story                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cases/argument_serialization_test.rb`                                                                    |    20 | `port-activejob-argument-serialization-test`                                                                                                                      |
| `cases/job_serialization_test.rb`, `serializers_test.rb`, `serializers/time_with_zone_serializer_test.rb` |    17 | `port-activejob-serialization-tests`                                                                                                                              |
| `cases/queue_naming_test.rb`, `queue_priority_test.rb`                                                    |    20 | `port-activejob-queue-naming-and-priority-tests`                                                                                                                  |
| `cases/queuing_test.rb`, `queue_adapter_test.rb`, `adapter_test.rb`                                       |    19 | `port-activejob-queuing-and-queue-adapter-tests`                                                                                                                  |
| `cases/callbacks_test.rb`                                                                                 |     8 | `port-activejob-callbacks`                                                                                                                                        |
| `cases/timezones_test.rb`, `translation_test.rb`                                                          |     3 | `port-activejob-timezones-and-translation`                                                                                                                        |
| `cases/async_adapter_test.rb`                                                                             |     2 | `port-activejob-async-adapter`                                                                                                                                    |
| `cases/enqueue_after_transaction_commit_test.rb`                                                          |     4 | `port-activejob-enqueue-after-transaction-commit`                                                                                                                 |
| `cases/rescue_test.rb`, `instrumentation_test.rb`                                                         |    10 | `port-activejob-rescue-and-instrumentation-tests`                                                                                                                 |
| `cases/exceptions_test.rb`                                                                                |    30 | `port-activejob-exceptions-test-part-1` (16), `-part-2` (14)                                                                                                      |
| `cases/logging_test.rb`                                                                                   |    45 | `port-activejob-logging-test-part-1` (22), `-part-2` (23)                                                                                                         |
| `cases/test_case_test.rb`                                                                                 |     3 | `port-activejob-test-helper-enqueued-assertions`                                                                                                                  |
| `cases/test_helper_test.rb`                                                                               |   214 | `port-activejob-test-helper-test-enqueued-part-1` (38), `-part-2` (41), `…-performed-part-1/2/3` (42 each), `port-activejob-test-helper-performed-assertions` (9) |
| `railties/test/generators/job_generator_test.rb` (trailties)                                              |     6 | `port-activejob-job-generator`                                                                                                                                    |

### Who is waiting on it

| Consumer                                                             | what it needs                                                                                                                                                      | depends on                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `0116/port-after-commit-jobs-callback`                               | `perform_later`: `associations/builder/association.rb:145-162` drains `_after_commit_jobs` with `job_class.perform_later(**job_arguments)`                         | `port-activejob-enqueuing-and-configured-job`     |
| `0116/port-destroy-association-async-job`                            | `ActiveJob::Base`, `TestHelper` (`vendor/rails/v8.0.2/activerecord/test/activejob/helper.rb:9-10` sets `queue_adapter = :test`)                                    | `port-activejob-test-helper-performed-assertions` |
| `0116/port-destroy-association-async-test-and-flip-models`           | `perform_enqueued_jobs` (21 uses), `assert_enqueued_jobs` (4), `assert_no_enqueued_jobs` (3), `assert_enqueued_with` (2)                                           | `port-activejob-test-helper-performed-assertions` |
| `0116/jobruntime-instrument-drops-both-super-delegations`            | a host `instrument` for `JobRuntime#instrument`'s `super` (`activerecord/lib/active_record/railties/job_runtime.rb:9-17`): `ActiveJob::Instrumentation#instrument` | `port-activejob-instrumentation`                  |
| `0127/attribute-on-load-include-to-hook-target-class`                | related only: it attributes `on_load(:active_job)` includes to `ActiveJob::Base`, "a class no api-compared package extracts today". This RFC makes it extracted.   | —                                                 |
| `trails new` (`packages/trailties/src/generators/app-base.ts:33-38`) | `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS.skipActiveJob: true` switches ActiveJob off in every generated app                                                               | `port-activejob-railtie`                          |

The other RFCs that mention ActiveJob were checked. Their ActiveJob stories are
all `done` or `closed`: `0080/converge-destroy-association-async-job-accessor`,
`0099/port-executor-wrapping-around-a-unit-of-work`,
`0104/port-rails-all-so-a-booted-app-loads-its-railties`,
`0104/railtie-configuration-options-not-shared`,
`0142/generated-environments-omit-namespaced-framework-settings`, and RFC 0147
(closed), whose Non-goals hand the `AsyncAdapter` executor to "whoever ports
`async_adapter.rb`": `port-activejob-async-adapter`. The 0023 stories are
superseded by RFC 0116 or independent of it (see its "Supersedes"). None is
re-filed here.

## Design

### Package shape

`packages/activejob/` is published as `@blazetrails/activejob` at `0.1.0`, like
`packages/globalid`. Its dependencies are the gemspec's (`activesupport`,
`globalid`; `vendor/rails/v8.0.2/activejob/activejob.gemspec:35-36`) plus
`@blazetrails/ruby-compat`, `@blazetrails/i18n` and `@blazetrails/date`.

**There is no `@blazetrails/activerecord` edge.** ActiveJob reaches ActiveRecord
only through the constant `ActiveRecord` at call time
(`enqueue_after_transaction_commit.rb:34`; the railtie's `railtie.rb:110` lives
in trailties), and its own test stubs that constant with a fake
(`test/cases/enqueue_after_transaction_commit_test.rb:60`). That is the case
CLAUDE.md § "Call-time constant resolution" gives the `TopLevel` seat for.
activerecord seats `TopLevel.ActiveRecord`; activerecord and trailties take
`@blazetrails/activejob` as a plain dependency.

Src mirrors `lib/active_job/` under the module root (`core.rb` → `src/core.ts`,
`queue_adapters/test_adapter.rb` → `src/queue-adapters/test-adapter.ts`, …,
per `docs/ruby-ts-conventions.md`). The railtie lives at
`packages/trailties/src/trailties/active-job.ts` beside `active-record.ts` and
`global-id.ts`; the generator at `packages/trailties/src/generators/rails/job/`.

### Async shape: `perform` and `enqueue` are async

A job body does I/O: every trails AR read is awaited, and so is every
`GlobalID::Locator.locate` (`packages/globalid/src/locator.ts:161`). So:

- **Execution.** `perform` may return a promise. `Execution#perform_now`,
  `ClassMethods#perform_now` and `execute(job_data)` are `async` and await
  `_perform_job` inside `run_callbacks(:perform)`; activesupport's
  `runCallbacks` already awaits promise-returning callbacks and blocks
  (`packages/activesupport/src/callbacks.ts:47-56,1230`).
- **Enqueue.** `enqueue`, `raw_enqueue`, `perform_later` and
  `ActiveJob.perform_all_later` are `async`; an adapter's `enqueue` /
  `enqueue_at` / `enqueue_all` may return a promise and every caller awaits it.
  `perform_later`'s block is captured and awaited, the shape CLAUDE.md
  § "A create path awaits its block before saving" ratifies for `create`.
- **Arguments.** `Arguments.serialize` stays sync; `Arguments.deserialize` is
  async from its first PR, because its GlobalID arm awaits `Locator.locate` and
  `RangeSerializer#deserialize` re-enters it.
- **Scoped state restores on settle.** `Time.use_zone`, `I18n.with_locale`,
  `tag_logger`, `ActiveSupport::Notifications.instrument` and
  `perform_enqueued_jobs`' settings all wrap an awaited block, so each restores
  when the promise settles.
- **Test assertions.** Every block-taking `TestHelper` assertion is `async`, as
  `assertDifference` already is (`packages/activesupport/src/testing/assertions.ts:183`).
- **Sync:** `queue_name`, `priority`, `serialize`, instance `deserialize`,
  `set`, `job_or_instantiate`, and the `TestAdapter` readers.

This is the language shortcoming CLAUDE.md already ratifies for `create` and
`Relation`. `port-activejob-execution` adds the CLAUDE.md section "A job's
`perform` and `enqueue` are async" so later stories cite it.

### Class names round-trip through `constantize`

Job data names classes by Ruby constant path: `"job_class" => self.class.name`
(`core.rb:109`) is `constantize`d back (`:63`), and `"_aj_serialized" =>
"ActiveJob::Serializers::SymbolSerializer"` is `safe_constantize`d
(`serializers.rb:43`). A JS class's `name` is only its last segment, and trails'
`constantize` (`packages/activesupport/src/inflector.ts:212`) resolves only
registered names or namespace-seat walks. Without work here, even the inline
adapter cannot run a user job. Three stories own it:
`register-activejob-constants-for-class-name-round-trip` picks the mechanism
and the one Ruby-name reader; `port-activejob-test-fixture-jobs` registers the
canonical fixtures; `eager-load-app-jobs-in-finisher` loads and registers an
application's `app/jobs`, the eager-scan counterpart of Zeitwerk's `app/jobs`
root (as `loadControllers` is for controllers,
`packages/trailties/src/application/finisher.ts:150`).

### Fidelity traps, filed up front

Each lib story carries a "Fidelity traps (predicted at authoring)" checklist
read off the Ruby body. The classes and where they land:

| Trap class                              | Where it bites                                                                                                                    | Stories                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Async shape, restore-on-settle          | `perform_now`, `enqueue`, `deserialize`, `use_zone`, `with_locale`, `tagged`, `instrument`, `perform_enqueued_jobs`, `stub_const` | execution, enqueuing, arguments, `converge-usezone-and-withlocale-to-restore-on-settle`, instrumentation, logging, TH performed, EATC |
| Ruby Symbol as `":name"`                | `SymbolSerializer`, `_aj_symbol_keys`, `queue_as :low`, `queue_adapter = :test`, `:unlimited`, `:polynomially_longer`, `:always`  | arguments, scalar serializers, queue name, queue adapter, exceptions, EATC, test adapter                                              |
| kwargs / `ruby2_keywords`               | `Core#initialize`, `job_or_instantiate`, `_aj_ruby2_keywords`, `KwargsJob`, `retry_on(… jitter:)` sentinel                        | `port-ruby-compat-ruby2-keywords-hash-flag`, arguments, core, enqueuing, exceptions                                                   |
| Truthiness (`0`, `""`, `[]` are truthy) | `set(wait: 0)`, `if symbol_keys = …`, `return handled if handled`, `only && except`                                               | core, arguments, execution, TH enqueued                                                                                               |
| `fetch` / `\|\|` vs `??`                | `job_data["locale"] \|\| …`, `job.fetch(:queue, …)`, `ENV.fetch("RAILS_MAX_THREADS", 5)`, `fetch("arguments")`                    | core, time serializers, TH enqueued, async adapter, test adapter                                                                      |
| Value-returning predicates              | `successfully_enqueued?`, `arguments_serialized?`, `log_arguments?`, `exclude_end?`, `serialize?`                                 | core, logging, scalar serializers, arguments                                                                                          |
| Bang arms                               | `require_active_job_test_adapter!`, `find_zone!`                                                                                  | TH enqueued, `converge-usezone-and-withlocale-to-restore-on-settle`                                                                   |
| `respond_to?` / `method_missing`        | `permitted?`, `enqueue_all`, `queue_adapter_name`, `tagged`, `MockLogger#method_missing`                                          | arguments, enqueuing, queue adapter, logging, `port-activesupport-log-subscriber-test-helper`                                         |
| Autoload seats / constant names         | `ActiveJob`, `QueueAdapters`, `Serializers` namespaces, `job_class`, `_aj_serialized`, `adapter_name`, `ex.class` in logs         | namespace and base, `register-activejob-constants-for-class-name-round-trip`, log subscriber, fixtures, finisher                      |
| `inherited` / `class_attribute`         | Proc-valued `queue_name`, `default_priority` read once, `Base.descendants`, own `_queue_adapter`, accessors vs class fields       | queue name and priority, core, TH enqueued, fixtures                                                                                  |
| Ruby `inspect` / `to_s` / `==`          | log arguments, `exception_executions` keys, `assert_enqueued_with` messages and matching, `BigDecimal#to_s`, `Float#round(2)`     | log subscriber, exceptions, TH enqueued / performed, scalar serializers                                                               |

### In-process adapters only

| Adapter                                     | trails                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `InlineAdapter` (`inline_adapter.rb:13-21`) | `port-activejob-queue-adapter-and-inline-adapter`. `enqueue` awaits `Base.execute(job.serialize)`; `enqueue_at` raises `NotImplementedError`.                                                                                                                                              |
| `TestAdapter` (`test_adapter.rb:14-85`)     | `port-activejob-test-adapter`.                                                                                                                                                                                                                                                             |
| `AsyncAdapter` (`async_adapter.rb:33-115`)  | `port-activejob-async-adapter`, over ruby-compat's `ThreadPoolExecutor` (`packages/ruby-compat/src/thread-pool-executor.ts:14`, each task in its own `Thread`, `:53`) plus `ImmediateExecutor` / `ScheduledTask` from `port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`. |
| `AbstractAdapter`, `QueueAdapters.lookup`   | `port-activejob-queue-adapter-and-inline-adapter`. `lookup` is `const_get(name.to_s.camelize << ADAPTER)` on the `QueueAdapters` namespace; an unported adapter name raises `NameError`, as Rails does when the gem is absent.                                                             |

`AsyncAdapter` is in scope (RFC 0116's Open question 2): the railtie defaults
every non-test environment to `:async` (`railtie.rb:57`).

**A real backend later is its own RFC.** It wraps an npm client declared as an
optional peer dependency, as `pg` / `mysql2` sit in
`packages/activerecord/package.json`, and it is async from its first PR. It is
**never** a set of empty `TopLevel` seats for an app to fill: trails#8057 was
closed for exactly that (see `0158/cache-store-async-over-npm-clients`). The
async adapter interface this RFC ships is what such a backend implements.

**Solid Queue**, Rails 8's default production backend, is a separate gem that is
not vendored. It is future work and is not seeded here.

### GlobalID arguments

`Arguments`' GlobalID arm (`arguments.rb:85-86,117-118,129-135,190-195`) goes
over `@blazetrails/globalid` (RFC 0069). `port-activejob-arguments` lands first
without it and `port-activejob-globalid-argument-arm` fills it in. This is a
sequencing split of one Rails method across two filed stories, not a deviation:
neither story may add a `@missingRailsCall` receipt for the arm. The Rails cases
that go through the arm are listed in the argument-serialization,
serialization, rescue/instrumentation, exceptions part 2, logging and
test-helper test stories, each of which depends on the arm.

### Canonical job fixtures

`vendor/rails/v8.0.2/activejob/test/jobs/` (24 files) are the canonical job
classes, as `activerecord/test/models/` are for AR. They are mirrored at
`packages/activejob/src/test-helpers/jobs/`, one file per Ruby file with the
Ruby class name, registered under that name. `port-activejob-test-fixture-jobs`
mirrors the fifteen that need only core behaviour, plus `models/person.rb` and
`support/stubs/strong_parameters.rb`; the rest land with the lib story whose
behaviour they exercise (named in each). `support/job_buffer.rb` lands with the
inline lane. Tests use these fixtures rather than inventing job classes.

### Adapter lanes

Rails runs the suite once per adapter: `rake test` runs `test:<adapter>` for
every entry in `ACTIVEJOB_ADAPTERS` (`vendor/rails/v8.0.2/activejob/Rakefile:5,8-17`),
each setting `ENV["AJ_ADAPTER"]` (`test/helper.rb:9`) and loading
`test/adapters/<adapter>.rb`. The difference is observable. `EnqueuedJobsTest`
(76 cases, `:38-808`) and `PerformedJobsTest` (126 cases, `:827-2114`), 202 of
`test_helper_test.rb`'s 215 cases, sit inside `if adapter_is?(:test)`
(`test/cases/test_helper_test.rb:39,828`); the other 13 are outside the guard.
`NotTestAdapterTest` is `unless adapter_is?(:test)` (`:2116`).
`async_adapter_test.rb` runs only under `async` (`Rakefile:38-41`), and three
`logging_test.rb` blocks are `unless adapter_is?(:inline, :sneakers)`
(`:216,247,293`).

So trails runs the activejob suite in **three lanes**, `AJ_ADAPTER=inline`,
`test` and `async`, each a vitest invocation whose setup file ports
`test/adapters/<adapter>.rb`. The guards are ported as-is. The skeleton
registers the `inline` invocation and `port-activejob-queue-adapter-and-inline-adapter`
its setup file; `port-activejob-test-adapter` and `port-activejob-async-adapter`
add the other two. A lane that never runs a guarded block would leave 202
ported cases green without executing them; Verification checks for that.

### Tooling enrollment

A `rails`-source package entry in `vendor/sources.ts`:

```ts
{
  name: "activejob",
  libPath: "activejob/lib/active_job",
  testPath: "activejob/test",
},
```

`testPath` is the test root so `test/serializers/time_with_zone_serializer_test.rb`
is counted. The remaining registrations are in
`enroll-activejob-in-compare-tooling`: `MANIFEST_PACKAGES`,
`vendor/sources.test.ts`, the three test-compare lists, a hand-added `0/0/0`
row in `scripts/test-compare/assertion-mismatch-mark.json` (no reseed), and the
`rails-private-jsdoc` enrollment. `lib/rails/generators/job/job_generator.rb` is
outside `libPath`, as every framework generator is today; its test is in
trailties' population. `GATED_PACKAGES` is not widened here.

### Where the non-ports are recorded

A new `scripts/parity/unported-files/activejob.ts` (`ACTIVEJOB_UNPORTED_FILES`,
spread into `index.ts` beside `GLOBALID_UNPORTED_FILES`) holds
`package: "activejob"` entries: a `pattern` per gem adapter file (so
`parity:api` does not score their 29 public methods), `testFile` entries for
`cases/delayed_job_adapter_test.rb` and `integration/queuing_test.rb`, a
per-test entry for `adapter_test.rb`'s two sucker_punch cases, and (from
`port-activejob-test-helper-test-enqueued-part-2`) a per-test entry for the
Zeitwerk case. `SKIP_GROUPS` (`scripts/parity/conventions.ts:530`) is not used:
it is member-level. `QueueAdapters`' `autoload` lines for the seven
(`queue_adapters.rb:118-124`) are not ported; an autoload without a file is an
empty seat.

### Work outside `packages/activejob`

| Package       | Change                                                                                                 | Story                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| activesupport | `useZone` stops throwing on an async block and restores on settle (`time-zone-config.ts:24-39`)        | `converge-usezone-and-withlocale-to-restore-on-settle`                                      |
| i18n          | `withLocale` restores on settle (`i18n.ts:254-266`)                                                    | `converge-usezone-and-withlocale-to-restore-on-settle`                                      |
| activesupport | `Notifications.instrument` / `TaggedLogging#tagged` checked, and converged if needed, for async blocks | `port-activejob-instrumentation`, `port-activejob-logging`                                  |
| activesupport | `ActiveSupport::LogSubscriber::TestHelper` (unported today) and its CLAUDE.md `method_missing` row     | `port-activesupport-log-subscriber-test-helper`                                             |
| activesupport | the Ruby-name reader for namespaced classes, if the chosen mechanism needs it                          | `register-activejob-constants-for-class-name-round-trip`                                    |
| activesupport | `TopLevel.ActiveRecord` type; `stubConst` restoring on settle                                          | `port-activejob-enqueue-after-transaction-commit`                                           |
| activerecord  | seat `TopLevel.ActiveRecord`                                                                           | `port-activejob-enqueue-after-transaction-commit`                                           |
| ruby-compat   | `Hash.ruby2_keywords_hash?` / `Hash.ruby2_keywords_hash`                                               | `port-ruby-compat-ruby2-keywords-hash-flag`                                                 |
| ruby-compat   | `Concurrent::ImmediateExecutor`, `Concurrent::ScheduledTask`                                           | `port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`                         |
| trailties     | railtie, `trails new` default, `trails g job`, `app/jobs` eager load                                   | `port-activejob-railtie`, `port-activejob-job-generator`, `eager-load-app-jobs-in-finisher` |

## Non-goals

- **The seven gem adapters** (`backburner`, `delayed_job`, `queue_classic`,
  `resque`, `sidekiq`, `sneakers`, `sucker_punch`). Each is a thin shim over a
  Ruby gem's client with no Node counterpart; a port would be empty seats.
  Recorded in `unported-files/activejob.ts`, not stubbed.
- **A real backend (Redis, Postgres, SQS …).** Its own RFC, over an npm client
  as an optional peer, async from its first PR.
- **Solid Queue.** A separate, unvendored gem; future work.
- **The integration suite** (`test/integration/queuing_test.rb`,
  `test/support/integration/`), which exists to drive the gem adapters.
- **The `dependent: :destroy_async` closure.** RFC 0116 owns it.
- **`ActiveRecord::Railties::JobRuntime` wiring** (`activerecord/railtie.rb:271-273`).
  `0116/jobruntime-instrument-drops-both-super-delegations` owns the module and
  the AR railtie's `on_load(:active_job)` include.

## Alternatives considered

- **Port only `TestAdapter` and `TestHelper`, the subset RFC 0116 needs.**
  `TestHelper` asserts on `enqueue` and `perform_now`, which run the callbacks,
  exceptions, logging and instrumentation stack; a subset would be a hollow
  `Base` filled in underneath already-ported tests.
- **A trails-only job runner inside activerecord.** RFC 0116 rejected it:
  invented surface with no Ruby counterpart.
- **Sync `perform_now` with an async escape hatch.** Every useful job body awaits
  an AR query; a sync `perform_now` either drops the promise (callbacks and
  exception handling finish before the body) or needs a second API.
- **Stub the gem adapters so `QueueAdapters.lookup(:sidekiq)` returns
  something.** Empty seats by another name; trails#8057 was closed for it.
- **A plain `activerecord` dependency from activejob.** The gemspec has none, the
  Rails test replaces the constant with a fake, and the edge would put
  activerecord in every job-only install.
- **Seed coarse stories and let convergence stories accrete in review.** Prior
  gem-port RFCs grew 4–9× in stories that way (0133: 5 → 45; 0137: 14 → 51; 0139:
  12 → 74; 0140: 4 → 147), almost all review-surfaced `converge-X-onto-rails-Y`
  items that a close reading at authoring would have found. This RFC files them
  up front instead.

## Rollout

1. **Package.** `activejob-package-skeleton` → `enroll-activejob-in-compare-tooling`.
2. **Independent prerequisites** (no deps; any time): `port-ruby-compat-ruby2-keywords-hash-flag`,
   `port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`,
   `converge-usezone-and-withlocale-to-restore-on-settle`,
   `port-activesupport-log-subscriber-test-helper`.
3. **Foundations.** `port-activejob-namespace-and-base` →
   `register-activejob-constants-for-class-name-round-trip` →
   `port-activejob-arguments` → (`port-activejob-scalar-serializers`,
   `port-activejob-time-serializers`, `port-activejob-globalid-argument-arm`).
4. **Job.** `port-activejob-core` → (`port-activejob-queue-name-and-priority`,
   `port-activejob-execution`) → `port-activejob-queue-adapter-and-inline-adapter`
   → `port-activejob-enqueuing-and-configured-job` (unblocks
   `0116/port-after-commit-jobs-callback`) → `port-activejob-test-fixture-jobs`.
5. **Behaviour.** `port-activejob-callbacks` → (`port-activejob-timezones-and-translation`,
   `port-activejob-instrumentation` (unblocks
   `0116/jobruntime-instrument-drops-both-super-delegations`)) →
   (`port-activejob-logging` → `port-activejob-log-subscriber`,
   `port-activejob-exceptions`); `port-activejob-enqueue-after-transaction-commit`
   off step 4.
6. **Adapters and TestHelper.** `port-activejob-test-adapter`,
   `port-activejob-async-adapter` → `port-activejob-test-helper-enqueued-assertions`
   → `port-activejob-test-helper-performed-assertions` (unblocks RFC 0116's other
   two stories).
7. **Test ports** (parallel, once their deps land): the argument-serialization,
   serialization, queue-naming, queuing, rescue/instrumentation, exceptions ×2,
   logging ×2 and test-helper ×5 stories.
8. **Integration.** `port-activejob-railtie` → (`port-activejob-job-generator`,
   `eager-load-app-jobs-in-finisher`).
9. **RFC 0116 flips to `active`** once `port-activejob-enqueuing-and-configured-job`,
   `port-activejob-instrumentation` and `port-activejob-test-helper-performed-assertions`
   are `done`. Its stories already carry those `deps`; the flip is a `tasks` verb
   for that moment, not part of this PR.

```text
skeleton → enroll → namespace+base → class-name registration → arguments ─┬→ scalar / time serializers
                                                                          ├→ globalid arm
                                                                          └→ core ─┬→ queue name+priority ─┐
                                                                                   └→ execution → queue adapter+inline ─┴→ enqueuing → fixtures
enqueuing → callbacks ─┬→ timezones+translation (← usezone/withlocale convergence)
                       └→ instrumentation ─┬→ logging → log subscriber
                                           └→ exceptions
enqueuing ─┬→ test adapter ─────────────┐
           ├→ async adapter (← ruby-compat executors)
           ├→ enqueue-after-transaction-commit
           └────────────────────────────┴→ TH enqueued → TH performed
test ports ← their lib stories (+ fixtures, globalid arm, AS LogSubscriber::TestHelper)
railtie ← log subscriber, TH enqueued, EATC, async adapter, scalar serializers → job generator, app/jobs eager load
[0116] after-commit drain ← enqueuing;  [0116] JobRuntime ← instrumentation;  [0116] job + async test ← TH performed
```

## Seed completeness

This seed aims to be complete: 46 stories, 14,650 est-loc, every portable Rails
lib file and all 395 portable test cases assigned by name, and the fidelity
traps each Ruby body shows filed as checklist items. A story that has to be
added later is a spec miss. Note it as one in the new story's Context (which
Rails line this RFC's authoring missed) so the next RFC's authoring learns from
it.

## Verification

- `pnpm parity:api --package activejob` prints a row with every file outside the
  seven gem adapters at 100%; the adapters read as unported with their `reason`.
- `pnpm parity:test` credits all 395 portable cases; the 20 gem-adapter cases and
  the Zeitwerk case read as unported.
- CI runs the activejob suite in the `inline`, `test` and `async` lanes. In the
  `test` lane all 202 `EnqueuedJobsTest` / `PerformedJobsTest` cases (76 + 126)
  execute; in `inline` and `async` those 202 skip and `NotTestAdapterTest`'s 8
  run. Each lane's skipped count matches its `adapter_is?` guards.
- `pnpm parity:test` credits the 6 cases of
  `railties/test/generators/job_generator_test.rb` in trailties.
- A booted fixture app enqueues and performs an `app/jobs` job through the
  inline adapter, and `trails new` emits an `ApplicationJob` extending
  `ActiveJob.Base`.
- RFC 0116's four stories become ready in the order their `deps` give.
- `parity:api` / `parity:test` deltas for every other package are non-negative
  at every step.

## Open questions

1. **What does `Concurrent::ScheduledTask` map onto?** Recommendation: a
   ruby-compat `ScheduledTask` beside `ThreadPoolExecutor`, a `setTimeout` that
   posts to the given executor, `unref`'d, cleared by `shutdown`. Resolved in
   `port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`.
2. **Does `rails-private-jsdoc` want `@internal` on all 72 internal methods at
   enrollment?** RFCs 0133, 0137 and 0168 answered yes (autofix in the
   enrollment PR). Same answer, resolved in `enroll-activejob-in-compare-tooling`.
3. **Does `ActiveJob::Base` need a Rails-faithful `inherited`?** Recommendation:
   `classAttribute()` semantics and no hook, per CLAUDE.md § "`inherited` is
   deferred to own-property memo guards"; `Base.descendants` for
   `queue_adapter_changed_jobs` is settled in
   `port-activejob-test-helper-enqueued-assertions`. Resolved in
   `port-activejob-queue-name-and-priority`.
4. **How is a Ruby Symbol hash key represented in job arguments?** Symbol-ness
   is persisted (`_aj_symbol_keys`) and asserted. Resolved in
   `port-activejob-arguments` under CLAUDE.md's `symbolize_keys` rule, and
   applied to `TestAdapter#job_to_hash` in `port-activejob-test-adapter`.
5. **Which mechanism gives classes their Ruby names?** Resolved in
   `register-activejob-constants-for-class-name-round-trip`.

## Changelog

- 2026-09-29: initial RFC (19 seed stories).
- 2026-09-29: owner direction: seed as many stories as the Rails source
  justifies. Re-seeded as 46 stories (≤ 400 est-loc each) with explicit Rails
  test-name lists and predicted fidelity traps; added the class-name round-trip,
  `app/jobs` eager load, ruby2_keywords, and ruby-compat executor stories;
  replaced "Growth expectation" with "Seed completeness".
