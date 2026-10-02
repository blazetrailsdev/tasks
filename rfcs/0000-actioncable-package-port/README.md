---
rfc: "0000-actioncable-package-port"
title: "@blazetrails/actioncable: port Action Cable, with its socket layer over Node"
status: draft
created: 2026-10-01
updated: 2026-10-01
owner: "@deanmarano"
packages:
  - actioncable
  - rack
  - ruby-compat
  - trailties
  - activesupport
  - actionpack
  - activerecord
  - "scripts"
clusters:
  - fidelity
related-rfcs:
  - "0169-activejob-package-port"
  - "0171-thor-port"
  - "0158-activesupport-assertion-surfaced-port-bugs"
  - "0147-execution-context-at-thread-spawn-sites"
  - "0151-activesupport-autoload-slot-registry"
  - "0149-bare-keyed-option-hashes"
  - "0142-trailties-surfaced-deviations"
  - "0104-twitter-app-full-stack-integration"
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — `@blazetrails/actioncable`

## Summary

trails has no Action Cable. There is no `packages/actioncable`, no
`actioncable` entry in `vendor/sources.ts`, and `trails new` switches the
subsystem off in every generated app
(`packages/trailties/src/generators/app-base.ts:33-34`).

This RFC creates `packages/actioncable`, published as
`@blazetrails/actioncable`, and ports Action Cable from the vendored Rails tree
(`vendor/rails/v8.0.2/actioncable/`): channels, connections, subscriptions,
broadcasting, the server, all five subscription adapters (`inline`, `async`,
`test`, `postgresql`, `redis`), `TestHelper` and the two `TestCase`
classes, the engine, the channel generators and the view helper. The browser
client is already JavaScript and is not ported.

Almost all of it is ordinary Rails code. The exception is the socket layer,
which Rails builds on two gems with no line-for-line counterpart: `nio4r` (a
selector loop on its own thread) and `websocket-driver`. The second has an npm
package by the same author with the same driver API. The first is replaced by
Node's own event loop. **How much parity that costs is decided here, before any
socket story is written** (§ "Parity plan"): 3 of 45 files are bound to
the runtime, they keep their file, class and method names, and 3 to 5
methods have nothing to port.

One prerequisite lies outside the package and blocks the end-to-end tests:
trails' Rack handler cannot hand a socket to an application
(`packages/rack/src/handler/node.ts:70` sets `rack.hijack?` to `false` and
the server has no `upgrade` listener). That is the root story.

**Size: 56 stories, 17,920 est-loc**, every story at most 550 est-loc
(the tasks-repo ceiling is 700). Every file under `actioncable/lib` (45
`.rb`, 7 generator templates, 1 `USAGE`) and every one of the 41 Ruby test
files is owned by exactly one story (two test files are split by case). Every
one of the 171 extracted test cases, the 9 shared-module cases and the 13
railties generator cases is listed by name in the story that ports it.

## Motivation

### What the package covers

`vendor/rails/v8.0.2/actioncable/lib/` is 4,172 lines in 45 `.rb` files, with 324
`def`s under `lib/action_cable`. The extractors, run unmodified over the
vendored tree, report:

```console
$ RUBY_API_OUTPUT_PATH=<scratch>/ac-api.json LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
  LIB_PATHS_JSON='{"actioncable":"'$PWD'/vendor/rails/v8.0.2/actioncable/lib/action_cable"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
  actioncable: 38 classes, 35 modules, 358 public methods (89 internal)

$ TEST_PATHS_JSON='{"actioncable":"'$PWD'/vendor/rails/v8.0.2/actioncable/test"}' \
  ruby scripts/test-compare/extract-ruby-tests.rb
  actioncable: 30 files, 171 tests
```

The test tree is 32 `*_test.rb` files (3,266 lines), six stubs, a test
helper, and two shared modules (`subscription_adapter/common.rb`,
`channel_prefix.rb`) whose nine `def test_*` cases the extractor does not
count: they run once per including class, in five adapter test classes and one
subclass.

Gemspec dependencies (`actioncable.gemspec:35-40`): `activesupport`,
`actionpack`, `nio4r`, `websocket-driver`, `zeitwerk`.

| Rails file (`vendor/rails/v8.0.2/actioncable/lib/…`, `action_cable/` elided)                                       | lines | story                                                             |
| ------------------------------------------------------------------------------------------------------------------ | ----: | ----------------------------------------------------------------- |
| `deprecator.rb`, `gem_version.rb`, `version.rb`                                                                    |    40 | `actioncable-package-skeleton`                                    |
| `action_cable.rb`                                                                                                  |    80 | `port-actioncable-namespace-and-internal-constants`               |
| `connection/tagged_logger_proxy.rb`                                                                                |    47 | `port-actioncable-connection-tagged-logger-proxy`                 |
| `server/worker/active_record_connection_management.rb`, `server/worker.rb`                                         |    98 | `port-actioncable-server-worker`                                  |
| `connection/stream_event_loop.rb`                                                                                  |   136 | `port-actioncable-connection-stream-event-loop`                   |
| `server/configuration.rb`                                                                                          |    70 | `port-actioncable-server-configuration`                           |
| `subscription_adapter/base.rb`, `subscription_adapter/channel_prefix.rb`, `subscription_adapter/subscriber_map.rb` |   127 | `port-actioncable-subscriber-map-base-adapter-and-channel-prefix` |
| `server/broadcasting.rb`                                                                                           |    62 | `port-actioncable-server-broadcasting`                            |
| `server/base.rb`, `server/connections.rb`                                                                          |   153 | `port-actioncable-server-connections-and-base`                    |
| `subscription_adapter/async.rb`, `subscription_adapter/inline.rb`, `subscription_adapter/test.rb`                  |   109 | `port-actioncable-inline-async-and-test-adapters`                 |
| `channel/broadcasting.rb`, `channel/naming.rb`                                                                     |    78 | `port-actioncable-channel-naming-and-broadcasting`                |
| `channel/callbacks.rb`, `channel/periodic_timers.rb`                                                               |   154 | `port-actioncable-channel-callbacks-and-periodic-timers`          |
| `channel/streams.rb`                                                                                               |   215 | `port-actioncable-channel-streams`                                |
| `channel/base.rb`                                                                                                  |   334 | `port-actioncable-channel-base`                                   |
| `connection/authorization.rb`, `connection/identification.rb`                                                      |    67 | `port-actioncable-connection-identification-and-authorization`    |
| `connection/callbacks.rb`, `connection/internal_channel.rb`                                                        |   107 | `port-actioncable-connection-callbacks-and-internal-channel`      |
| `connection/message_buffer.rb`, `connection/subscriptions.rb`                                                      |   142 | `port-actioncable-connection-subscriptions-and-message-buffer`    |
| `connection/stream.rb`                                                                                             |   117 | `port-actioncable-connection-stream`                              |
| `connection/client_socket.rb`, `connection/web_socket.rb`                                                          |   204 | `port-actioncable-connection-client-socket-and-web-socket`        |
| `connection/base.rb`                                                                                               |   294 | `port-actioncable-connection-base`                                |
| `remote_connections.rb`                                                                                            |    82 | `port-actioncable-remote-connections`                             |
| `test_case.rb`, `test_helper.rb`                                                                                   |   176 | `port-actioncable-test-helper-and-test-case`                      |
| `channel/test_case.rb`                                                                                             |   356 | `port-actioncable-channel-test-case`                              |
| `connection/test_case.rb`                                                                                          |   243 | `port-actioncable-connection-test-case`                           |
| `subscription_adapter/postgresql.rb`                                                                               |   133 | `port-actioncable-postgresql-adapter`                             |
| `subscription_adapter/redis.rb`                                                                                    |   256 | `port-actioncable-redis-adapter`                                  |
| `helpers/action_cable_helper.rb`                                                                                   |    45 | `port-actioncable-helper`                                         |
| `engine.rb`                                                                                                        |    98 | `port-actioncable-engine`                                         |
| `rails/generators/test_unit/channel_generator.rb`, `templates/channel_test.rb.tt`                                  |    30 | `port-actioncable-test-unit-channel-generator`                    |
| `rails/generators/channel/channel_generator.rb`, `USAGE`, `templates/**/*.tt` (6)                                  |   197 | `port-actioncable-channel-generator`                              |

| Rails test file (`vendor/rails/v8.0.2/actioncable/test/…`)              | lines |    cases | story                                                                                                                        |
| ----------------------------------------------------------------------- | ----: | -------: | ---------------------------------------------------------------------------------------------------------------------------- |
| `channel/base_test.rb`                                                  |   285 |       23 | `port-actioncable-channel-base-and-rejection-tests`                                                                          |
| `channel/broadcasting_test.rb`                                          |    48 |        4 | `port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests`                                                     |
| `channel/naming_test.rb`                                                |    12 |        1 | `port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests`                                                     |
| `channel/periodic_timers_test.rb`                                       |    85 |        5 | `port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests`                                                     |
| `channel/rejection_test.rb`                                             |    56 |        2 | `port-actioncable-channel-base-and-rejection-tests`                                                                          |
| `channel/stream_test.rb`                                                |   370 |       13 | `port-actioncable-channel-stream-test`                                                                                       |
| `channel/test_case_test.rb`                                             |   251 |       21 | `port-actioncable-channel-test-case-test`                                                                                    |
| `client_test.rb`                                                        |   343 |        8 | `port-actioncable-client-test-harness-and-client-cases` (4), `port-actioncable-client-test-disconnect-and-restart-cases` (4) |
| `connection/authorization_test.rb`                                      |    36 |        1 | `port-actioncable-connection-base-authorization-and-forgery-tests`                                                           |
| `connection/base_test.rb`                                               |   143 |        8 | `port-actioncable-connection-base-authorization-and-forgery-tests`                                                           |
| `connection/callbacks_test.rb`                                          |   100 |        3 | `port-actioncable-connection-identifier-and-callbacks-tests`                                                                 |
| `connection/client_socket_test.rb`                                      |    93 |        2 | `port-actioncable-connection-client-socket-and-stream-tests`                                                                 |
| `connection/cross_site_forgery_test.rb`                                 |    92 |        6 | `port-actioncable-connection-base-authorization-and-forgery-tests`                                                           |
| `connection/identifier_test.rb`                                         |    77 |        4 | `port-actioncable-connection-identifier-and-callbacks-tests`                                                                 |
| `connection/multiple_identifiers_test.rb`                               |    34 |        1 | `port-actioncable-connection-identifier-and-callbacks-tests`                                                                 |
| `connection/stream_test.rb`                                             |    69 |        2 | `port-actioncable-connection-client-socket-and-stream-tests`                                                                 |
| `connection/string_identifier_test.rb`                                  |    36 |        1 | `port-actioncable-connection-identifier-and-callbacks-tests`                                                                 |
| `connection/subscriptions_test.rb`                                      |   160 |        8 | `port-actioncable-connection-subscriptions-test`                                                                             |
| `connection/test_case_test.rb`                                          |   213 |       17 | `port-actioncable-connection-test-case-test`                                                                                 |
| `javascript_package_test.rb`                                            |    19 |        1 | `actioncable-browser-client-interop-and-non-port-record`                                                                     |
| `server/base_test.rb`                                                   |    38 |        3 | `port-actioncable-server-base-and-health-check-tests`                                                                        |
| `server/broadcasting_test.rb`                                           |    54 |        3 | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `server/health_check_test.rb`                                           |    57 |        3 | `port-actioncable-server-base-and-health-check-tests`                                                                        |
| `stubs/global_id.rb`                                                    |    10 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `stubs/room.rb`                                                         |    18 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `stubs/test_adapter.rb`                                                 |    21 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `stubs/test_connection.rb`                                              |    35 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `stubs/test_server.rb`                                                  |    42 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `stubs/user.rb`                                                         |    17 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `subscription_adapter/async_test.rb`                                    |    19 |    0 own | `port-actioncable-inline-async-and-test-adapters`                                                                            |
| `subscription_adapter/base_test.rb`                                     |    65 |        6 | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `subscription_adapter/channel_prefix.rb`                                |    30 | 1 shared | `port-actioncable-inline-async-and-test-adapters`                                                                            |
| `subscription_adapter/common.rb`                                        |   131 | 8 shared | `port-actioncable-inline-async-and-test-adapters`                                                                            |
| `subscription_adapter/inline_test.rb`                                   |    19 |    0 own | `port-actioncable-inline-async-and-test-adapters`                                                                            |
| `subscription_adapter/postgresql_test.rb`                               |    87 |        3 | `port-actioncable-postgresql-adapter-tests-and-ci-lane`                                                                      |
| `subscription_adapter/redis_test.rb`                                    |   152 |        3 | `port-actioncable-redis-adapter` (2), `port-actioncable-redis-adapter-live-tests-and-ci-service` (1 + included)              |
| `subscription_adapter/subscriber_map_test.rb`                           |    19 |        1 | `port-actioncable-subscriber-map-base-adapter-and-channel-prefix`                                                            |
| `subscription_adapter/test_adapter_test.rb`                             |    47 |        3 | `port-actioncable-inline-async-and-test-adapters`                                                                            |
| `test_helper.rb`                                                        |    41 |        — | `port-actioncable-test-stubs-and-test-helper`                                                                                |
| `test_helper_test.rb`                                                   |   141 |       13 | `port-actioncable-test-helper-and-test-case`                                                                                 |
| `worker_test.rb`                                                        |    46 |        2 | `port-actioncable-server-worker`                                                                                             |
| `railties/test/generators/channel_generator_test.rb` (trailties)        |   172 |       13 | `port-actioncable-channel-generator`                                                                                         |
| `railties/test/application/configuration_test.rb:3632,4265` (trailties) |       |        2 | `port-actioncable-engine`                                                                                                    |

### What already exists in trails

File presence was checked for each of these. Completeness was not: each story
verifies the members it calls.

| Rails dependency                                                                                                                                                                                                            | trails                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ActionDispatch::Request` (`cookie_jar`, `request_method`, `filtered_path`, `ip`)                                                                                                                                           | `actionpack/src/action-dispatch/middleware/cookies.ts:607`, `http/request.ts:236,432`, `http/filter-parameters.ts:52`                                                                                                                          |
| `ActionDispatch::Http::Headers.from_hash`, `TestRequest.create`                                                                                                                                                             | `http/headers.ts:58`, `testing/test-request.ts:18`                                                                                                                                                                                             |
| Routing `mount`, `routes.prepend`                                                                                                                                                                                           | `routing/mapper.ts:1490`, `routing/route-set.ts:964`                                                                                                                                                                                           |
| `ActiveSupport::Callbacks`, `Rescuable`, `TaggedLogging`, `Notifications`, `ParameterFilter`, `OrderedOptions`, JSON, `Executor`, `Reloader`, `thread_mattr_accessor`, `class_attribute`, `cattr_accessor`, lazy load hooks | `activesupport/src/{callbacks,rescuable,tagged-logging,notifications,parameter-filter,ordered-options,execution-wrapper,reloader,class-attribute,module-ext,lazy-load-hooks}.ts`, `json/`, `core-ext/module/attribute-accessors-per-thread.ts` |
| `ActiveSupport::Testing::ConstantLookup`, `MethodCallAssertions`, `_assert_nothing_raised_or_warn`                                                                                                                          | `activesupport/src/testing/constant-lookup.ts:4`, `index.ts:587,618`                                                                                                                                                                           |
| `Rails::Engine`, `NamedBase`, `HealthController`, `config_for`, `env_config`                                                                                                                                                | `trailties/src/engine.ts:41`, `generators/named-base.ts:19`, `health-controller.ts:4`, `application.ts:241,312`                                                                                                                                |
| `Concurrent::ThreadPoolExecutor`, `Thread`, `Monitor`, `Mutex`, `Queue`, `catch` / `throw`, `Method#arity`, `rbObjSingletonClass`                                                                                           | `ruby-compat/src/{thread-pool-executor,thread,monitor,mutex,queue,kernel-catch,method,object}.ts`                                                                                                                                              |
| `to_gid_param`                                                                                                                                                                                                              | duck-typed; `globalid/src/index.ts:28` provides it for real models                                                                                                                                                                             |
| `pg` raw connection with notifications                                                                                                                                                                                      | `activerecord/src/connection-adapters/postgresql/database-statements.ts:298` (`pg.Client`)                                                                                                                                                     |
| `TopLevel.ActionCable` type                                                                                                                                                                                                 | `activesupport/src/namespaces.ts:58`, already read by the authentication generator                                                                                                                                                             |

### What does not exist

| Gap                                                                                                          | Story                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `rack.hijack` and an `upgrade` listener in `Rack::Handler::Node`                                             | `rack-handler-node-offers-rack-hijack-on-upgrade`                                            |
| The same under `trails server`'s Vite dev path                                                               | `trails-dev-server-forwards-upgrade-requests-to-rack-handler`                                |
| `ThreadPoolExecutor#shutdown`, `#shuttingdown?`, `<<`, `name:`, task counts, `Concurrent.global_io_executor` | `ruby-compat-thread-pool-executor-shutdown-and-task-counts`                                  |
| `Concurrent::TimerTask`, `Concurrent::AtomicFixnum`                                                          | `ruby-compat-concurrent-timer-task-and-atomic-fixnum`                                        |
| A way for a namespaced channel class to carry its Ruby name and resolve through `safe_constantize`           | `actioncable-class-names-round-trip-through-constantize`                                     |
| `NamedBase#js_template`                                                                                      | `port-actioncable-channel-generator`                                                         |
| An `app/channels` load root                                                                                  | `eager-load-app-channels-in-finisher`                                                        |
| A Redis npm client and a CI Redis service                                                                    | `port-actioncable-redis-adapter`, `port-actioncable-redis-adapter-live-tests-and-ci-service` |

### Prior art in the backlog

Grepped across `rfcs/` for `hijack`, `action.?cable`, `websocket`,
`handler/node`, `dev-server`, `TimerTask`, `AtomicFixnum`,
`shuttingdown`, `redis`, `LISTEN`, and `tasks touching` on
`packages/rack/src/handler/node.ts` and
`packages/trailties/src/server/dev-server.ts`. No story ports any part of
Action Cable or adds hijack support. Adjacent stories, none duplicated here:

| Story                                                                           | Status | Relation                                                                                                                    |
| ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `0158/cache-store-async-over-npm-clients`                                       | ready  | Names the Redis client candidates and has not picked. One client for both (Open question 4).                                |
| `0169/port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`        | draft  | Adds `ImmediateExecutor` / `ScheduledTask` beside `ThreadPoolExecutor`. Different classes; both touch `shutdown`.           |
| `0169/register-activejob-constants-for-class-name-round-trip`                   | draft  | Same class-name question for jobs. Whichever lands first picks the mechanism.                                               |
| `0169/eager-load-app-jobs-in-finisher`                                          | draft  | Same scan for `app/jobs`; share the helper.                                                                                 |
| `0169/port-activejob-enqueue-after-transaction-commit`                          | draft  | Seats `TopLevel.ActiveRecord`, which `Server::Worker` and the PostgreSQL adapter read.                                      |
| `0169/port-activejob-logging`                                                   | draft  | Carries the same `TaggedLogging#tagged` async-block convergence. Whichever lands first does it.                             |
| `0142/trails-server-adapts-application-to-function-rack-app`                    | draft  | Edits `commands/server.ts` around `Handler.Node.run`; no overlap with the upgrade path.                                     |
| `0142/authentication-generator-skip-action-cable-replaces-defined-engine-check` | done   | Already reads `TopLevel.ActionCable?.Engine`; the engine story makes it true.                                               |
| `0104/generator-scaffolds-unported-subsystems`                                  | done   | Added `skipActionCable: true`; `trails-new-scaffolds-action-cable-by-default` removes it.                                   |
| RFC 0171 (Thor)                                                                 | active | Converging generators onto `Thor::Group`. The two generator stories are written against whatever shape exists when claimed. |

## Design

### Package shape

`packages/actioncable/` is published as `@blazetrails/actioncable` at
`0.1.0`. Rails ships Action Cable as its own gem and every trails package
takes its gem's name.

Dependencies follow the gemspec: `@blazetrails/activesupport`,
`@blazetrails/actionpack`, plus `@blazetrails/ruby-compat` and
`@blazetrails/rack`. Optional peers, on the `pg` / `mysql2` precedent in
`packages/activerecord/package.json`: `websocket-driver`, `pg`, and one
Redis client. Each is imported only by the module that needs it, and
`Server::Configuration#pubsub_adapter` loads an adapter module only when
`config/cable` names it, as Rails `require`s it (`server/configuration.rb:46-48`).

**There is no `activerecord`, `globalid`, `actionview` or `trailties`
edge.** Action Cable reaches ActiveRecord through the constant at call time
(`server/worker/active_record_connection_management.rb:12`,
`subscription_adapter/postgresql.rb:41,52`), GlobalID through
`respond_to?(:to_gid_param)`, ActionView through the includer's `tag`, and
Rails through `defined?(Rails.application)` (`connection/base.rb:180`). Those
are `TopLevel` reads (CLAUDE.md § "Call-time constant resolution"). trailties
depends on actioncable, not the reverse.

Src mirrors `lib/action_cable/` (`connection/client_socket.rb` →
`src/connection/client-socket.ts`, per `docs/ruby-ts-conventions.md`). The
engine lives at `packages/trailties/src/trailties/action-cable.ts` beside
`active-record.ts` and `global-id.ts`; the generators at
`packages/trailties/src/generators/rails/channel/` and
`generators/test-unit/channel/`.

**Zeitwerk** (`lib/action_cable.rb:35-50`) is not ported (CLAUDE.md § "Trails
has no autoloader"). Framework-internal constant resolution uses the
`namespaces.ts` `Autoload` shape: six namespace objects, each class seating
itself with `rbModConstSet` in its defining module.

### Parity plan

Decided here, before the socket stories, so no story negotiates its own bar.

**Tier 1: ordinary Rails code, 100% line for line. 42 files, 288 of 324
methods.** Channels, connections, subscriptions, broadcasting, server
configuration, the worker, all five adapters, remote connections, test helpers,
the engine, the generators, the helper. The package is enrolled in **every**
parity gate in its second PR (`enroll-actioncable-in-compare-tooling-and-parity-gates`),
while it has three files, and held at zero: no `call-mismatches-exclude` shard,
no `arity-exclude` row, no mark above 0, and `ROWLESS_PACKAGES` for extra
surface, the way activerecord is rowless today. There is nothing to burn down
later because nothing is ever admitted.

**Tier 2: runtime-bound, 3 files, 36 methods, 412 lines.** They keep their
file, class name, method names and callers.

| File                                                      | What stays                                                                                 | What changes                                                                                                                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connection/client_socket.rb` (159 lines, 17 methods)     | Every method and all ready-state logic                                                     | The driver is built with `Driver.http` from a request-shaped object read off the Rack env, where Rails calls `WebSocket::Driver.rack(self, …)`; the driver's `io` `data` event calls `ClientSocket#write`, where the Ruby driver calls `socket.write`. |
| `connection/stream.rb` (117 lines, 9 methods)             | `each`, `close`, `shutdown`, `write`, `receive`, `hijack_rack_socket`, `clean_rack_hijack` | `write` calls the socket's `write`, which buffers in full; the `write_nonblock` result arms and the `@write_lock` / `@write_head` / `@write_buffer` bookkeeping are omitted.                                                                           |
| `connection/stream_event_loop.rb` (136 lines, 10 methods) | `timer`, `post`, `attach`, `detach`, `stop`                                                | `attach` / `detach` register and remove the socket's listeners where Rails registers with the selector.                                                                                                                                                |

Each omitted call carries `@missingRailsCall … — PERMANENT` (or
`@missingRailsArgs`) at its call site, citing one CLAUDE.md section. Nothing
is baselined. `connection/web_socket.rb` is Tier 1 with one such receipt:
`WebSocket::Driver.websocket?(env)` takes the same request-shaped object.

**Tier 3: nothing to port.** `StreamEventLoop#spawn`, `#run` and `#wakeup`,
the private selector loop, go in `SCOPED_SKIP_GROUPS` with a reason.
`StreamEventLoop#writes_pending` and `Stream#flush_write_buffer` are
recommended to join them (Open question 5): their only callers are
`Stream#write`'s partial-write arms and `run`.

**The ratification.** `ratify-node-event-loop-stands-in-for-the-nio4r-selector`
adds one CLAUDE.md section, on the precedent of § "The pool monitor guards only
sections that span an `await`" and § "Trails has no autoloader". It states
that Node's event loop stands in for the selector and its thread, names the
files it covers and the members kept and skipped, and is the one thing
every Tier 2 receipt cites. The three Tier 2 lib stories depend on it.

**`Server::Worker` is Tier 1.** ruby-compat already has
`Concurrent::ThreadPoolExecutor`
(`packages/ruby-compat/src/thread-pool-executor.ts:14`), each task in its own
ruby-compat `Thread`. `worker.rb` ports line for line over it once
`shutdown` and `shuttingdown?` exist, and so do `StreamEventLoop#post` and
`#timer`.

The four Tier 2 unit tests Rails has (`connection/client_socket_test.rb`,
`connection/stream_test.rb`) are ported, not parked:
`port-actioncable-connection-client-socket-and-stream-tests` forbids a
`PERMANENT-SKIP` on any of them.

### Socket layer

**The hijack.** `Connection::Stream#hijack_rack_socket`
(`connection/stream.rb:98-107`) needs `env["rack.hijack"]`. Node delivers an
upgrade request to the http server's `upgrade` event with the raw socket, so
`Rack::Handler::Node` gains an upgrade path that sets `rack.hijack?` and
`rack.hijack` and leaves the socket alone when the app answers `-1`. The
Vite dev server gets the same listener, sharing one implementation and skipping
Vite's own HMR upgrades. Ordinary requests keep `rack.hijack?` false.

**The driver.** The npm `websocket-driver` (faye/websocket-driver-node 0.7.5,
Apache-2.0, same author as the Ruby gem). It ships no types and there is no
`@types` package, so the package declares the surface it calls. Read against
its source, `on("open" | "message" | "close" | "error")` with `e.data` /
`e.reason` / `e.code` / `e.message`, `start()`, `text()`, `binary()`,
`close(reason, code)`, `parse(chunk)` and `protocol` all match what
`client_socket.rb` calls, and `start()` emits `open` synchronously as the
Ruby driver does.

**The request object.** `Driver.http(request, options)` reads only
`request.headers`, `request.url` and `request.method`, and
`Driver.isWebSocket(request)` the same. Both are satisfied by an object built
from the Rack env. That is also the only option Rails' own tests leave: they
construct connections from `Rack::MockRequest.env_for` with a hand-rolled
`rack.hijack` (`test/connection/client_socket_test.rb:67-78`), with no server
and no Node request (Open question 1).

**Rejected: `ws`.** It exposes a finished socket, not a parse / frame driver,
so `ClientSocket#parse`, `start_driver` and the driver event wiring would
have nothing to call, and it wants to own the upgrade.

### Async surface

The Redis and PostgreSQL adapters do I/O, so the adapter contract is async from
its first PR: `SubscriptionAdapter::Base#broadcast`, `#subscribe`,
`#unsubscribe` and `#shutdown` return promises
(`port-actioncable-subscriber-map-base-adapter-and-channel-prefix`). User code
does I/O too: every ActiveRecord read in a channel's `subscribed` or a
connection's `connect` is awaited. The cascade, traced through every caller:

| Rails method                                                                                                                  | trails | Why                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| `SubscriptionAdapter::*#broadcast` / `subscribe` / `unsubscribe` / `shutdown`                                                 | async  | adapter I/O                                                                      |
| `Server::Broadcasting#broadcast`, `Broadcaster#broadcast`                                                                     | async  | awaits `pubsub.broadcast` inside `instrument`                                    |
| `Channel::Broadcasting.broadcast_to` (class and instance)                                                                     | async  | calls `server.broadcast`                                                         |
| `RemoteConnection#disconnect`, `Server::Base#disconnect`                                                                      | async  | calls `server.broadcast`                                                         |
| `Server::Base#restart`                                                                                                        | async  | awaits `pubsub.shutdown`                                                         |
| `Channel::Streams#stop_stream_from` / `stop_stream_for` / `stop_all_streams`                                                  | async  | call `pubsub.unsubscribe` directly                                               |
| `Channel::Base#subscribe_to_channel`, `unsubscribe_from_channel`, `perform_action`, `dispatch_action`                         | async  | run the user's `subscribed`, `unsubscribed` and actions, and the callbacks above |
| `Connection::Subscriptions#execute_command`, `add`, `remove`, `remove_subscription`, `perform_action`, `unsubscribe_from_all` | async  | call the channel methods above                                                   |
| `Connection::Base#handle_channel_command`, `dispatch_websocket_message`, `handle_open`, `handle_close`                        | async  | run `connect` / `disconnect` and the subscriptions methods                       |
| `Server::Worker#work`, `invoke`                                                                                               | async  | await the block before clearing the per-thread connection                        |
| `TestHelper#assert_broadcasts`, `assert_no_broadcasts`, `capture_broadcasts`, `assert_broadcast_on`                           | async  | their block broadcasts; they re-broadcast                                        |
| `Channel::TestCase#subscribe`, `unsubscribe`, `perform`, and its two broadcast assertions                                     | async  | await the channel                                                                |
| `Connection::TestCase#connect`, `disconnect`, `assert_reject_connection`                                                      | async  | await the connection's hooks                                                     |

**Stay synchronous:** `stream_from` and `stream_for` (Rails already posts
the subscribe to the event loop and reports through a success callback),
`transmit`, `reject`, `broadcasting_for`, `channel_name`,
`Connection::Base#process` / `receive` / `transmit` / `close` / `beat`
and the four `on_*` socket callbacks, `MessageBuffer`, `SubscriberMap`,
`ClientSocket`, and every reader.

Blocks that wrap awaited work restore or complete on settle:
`Notifications.instrument`
(`packages/activesupport/src/notifications/instrumenter.ts:176`) and
`Executor.wrap` (`execution-wrapper.ts:99-125`) already defer to a
promise-returning block. `TaggedLogging#tagged` does not: it pops its tags in
a `finally` (`tagged-logging.ts:62-70`), and
`port-actioncable-connection-tagged-logger-proxy` converges it.

The Rails-facing calls this turns into promises are listed under Open
question 3. None could stay synchronous: there is no synchronous Redis
`PUBLISH` in Node.

### Threads

Rails posts each inbound message and each stream callback to a thread pool, and
keeps the current connection in a per-thread accessor. trails keeps the pool:
each task runs in a ruby-compat `Thread`, which is its own async context, so
`thread_mattr_accessor :connection` is per task and
`config.action_cable.worker_pool_size` caps the invocations in flight
(Open question 2). Rails' test "user supplied callbacks are run through the
worker pool" asserts a `Thread.current` local set by a callback is not visible
to the caller, and passes only on that model.

Monitors follow CLAUDE.md § "The pool monitor guards only sections that span an
`await`": the four lazy readers on `Server::Base` and the `SubscriberMap`
sections contain no `await` and are not wrapped; `Server::Base#restart` and
the Redis listener's subscription lock do, and are.

### Subscription adapters

| Adapter                   | trails                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Inline`, `Async`, `Test` | Pure code. `port-actioncable-inline-async-and-test-adapters`, with the shared adapter test suites.                                                                                             |
| `PostgreSQL`              | `LISTEN` / `NOTIFY` on an un-pooled raw `pg.Client`, whose `notification` event replaces the `wait_for_notify(1)` poll. `port-actioncable-postgresql-adapter` and its tests-and-CI-lane story. |
| `Redis`                   | Over one npm Redis client, an optional peer shared with the cache store (Open question 4). `port-actioncable-redis-adapter` and its live-test story.                                           |

Never an empty `TopLevel` seat for an application to fill: trails#8057 was
closed for that.

**Solid Cable**, Rails 8's default production adapter, is a separate gem that
is not vendored. It is future work and is not seeded here.

### Browser client

`app/javascript/action_cable/` is already JavaScript, published as
`@rails/actioncable` (Rails 8.0.2 is npm `8.0.200`). **It is not ported, not
vendored and not re-exported.** A trails application installs it; the channel
generator's JavaScript templates import it and its
`install_javascript_dependencies` step adds it, as in Rails. The compiled
bundles, the Rollup / Karma setup, `test/javascript/**` and
`javascript_package_test.rb` are recorded as non-ports.

What trails owes the client is the wire protocol.
`actioncable-browser-client-interop-and-non-port-record` adds the published
package as a devDependency and drives its `createConsumer` against a real
trails server, so a protocol slip in the port fails a test instead of a browser.

### Class names

Action Cable names classes by Ruby constant path in `channel_name`, in the
`channel` a browser sends, in `"ApplicationCable::Connection".safe_constantize`,
in the adapter lookup, in every log line and instrumentation payload, and in
`TestCase.tests`. A JS class's `name` is its last segment.
`actioncable-class-names-round-trip-through-constantize` settles the mechanism
once, shared with ActiveJob's, and `eager-load-app-channels-in-finisher`
registers an application's `app/channels` under those names.

### Tooling enrollment

A `rails`-source package entry in `vendor/sources.ts`:

```ts
{
  name: "actioncable",
  libPath: "actioncable/lib/action_cable",
  testPath: "actioncable/test",
},
```

and every registration and gate listed in
`enroll-actioncable-in-compare-tooling-and-parity-gates`. Non-ports go in
`scripts/parity/unported-files/actioncable.ts`; skipped members in
`SCOPED_SKIP_GROUPS`. `lib/rails/generators/**` is outside `libPath`, as
every framework generator is, and its test is in trailties' population.

### Work outside `packages/actioncable`

| Package           | Change                                                                                                              | Story                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rack, ruby-compat | `rack.hijack` on upgrade; `upgrade` on the `HttpServer` adapter                                                     | `rack-handler-node-offers-rack-hijack-on-upgrade`                                                                                                                             |
| trailties         | Vite dev path forwards upgrades                                                                                     | `trails-dev-server-forwards-upgrade-requests-to-rack-handler`                                                                                                                 |
| ruby-compat       | `ThreadPoolExecutor` shutdown surface, `global_io_executor`                                                         | `ruby-compat-thread-pool-executor-shutdown-and-task-counts`                                                                                                                   |
| ruby-compat       | `TimerTask`, `AtomicFixnum`                                                                                         | `ruby-compat-concurrent-timer-task-and-atomic-fixnum`                                                                                                                         |
| (CLAUDE.md)       | The ratified section                                                                                                | `ratify-node-event-loop-stands-in-for-the-nio4r-selector`                                                                                                                     |
| activesupport     | `TopLevel.ActionCable` seat and type; the class-name reader if the mechanism needs it; `tagged` restoring on settle | `port-actioncable-namespace-and-internal-constants`, `actioncable-class-names-round-trip-through-constantize`, `port-actioncable-connection-tagged-logger-proxy`              |
| activerecord      | `TopLevel.ActiveRecord` seat if 0169 has not landed it; a public route to an un-pooled raw connection               | `port-actioncable-server-worker`, `port-actioncable-postgresql-adapter`                                                                                                       |
| actionpack        | `MountOptions` accepts `internal` / `anchor`                                                                        | `port-actioncable-engine`                                                                                                                                                     |
| trailties         | Engine and its `rails/all` entry, generators, `NamedBase#js_template`, `app/channels` scan, `trails new`            | the five trailties stories in phase 9                                                                                                                                         |
| scripts           | Enrollment, gates, unported-files, skip groups, CI PostgreSQL lane and Redis service                                | `enroll-actioncable-in-compare-tooling-and-parity-gates`, `port-actioncable-postgresql-adapter-tests-and-ci-lane`, `port-actioncable-redis-adapter-live-tests-and-ci-service` |

## Non-goals

- **The browser client.** Already JavaScript; consumed from npm (§ "Browser
  client").
- **Solid Cable.** A separate, unvendored gem.
- **Any transport other than WebSocket over the hijacked socket.** Rails has
  none.
- **A `ws`-based server.** See § "Socket layer".
- **Porting nio4r.** There is no selector to own in Node.
- **Zeitwerk.** CLAUDE.md § "Trails has no autoloader".
- **The legacy `async.callback` / `stream.send` server protocols beyond their
  Rails bodies.** `Stream#each`, `@stream_send` and `start_driver`'s
  `async.callback` arm are ported because they are in the file; no trails
  server sets those env keys and no story adds one that does.
- **Sprockets asset precompilation.** The engine's `action_cable.asset`
  initializer is ported behind its `respond_to?(:assets)` guard, which is
  false.

## Alternatives considered

- **Build on `ws` and keep only the channel layer faithful.**
  `connection/client_socket.rb`, `stream.rb`, `web_socket.rb` and
  `stream_event_loop.rb` would have no counterpart, four Rails test files
  would be unportable, and `Connection::Base`'s constructor would diverge. The
  driver package keeps all four files and their tests.
- **Pass the Node `IncomingMessage` through the Rack env to the driver.** It
  works under a live server and nowhere else: Rails' unit tests build the env
  by hand. It also puts a non-Rack object in the env that `Rack::Lint` has no
  rule for.
- **Leave hijack out and give Action Cable its own `upgrade` listener.** The
  cable server would no longer be a Rack app mounted in the routes
  (`engine.rb:62-70`), origin checks and the health check would bypass the
  middleware stack, and `Stream#hijack_rack_socket` would have no body.
- **Replace `Server::Worker`'s executor with bare promise scheduling.**
  ruby-compat already has the executor; dropping it loses `worker_pool_size`,
  `stopping?`, and the per-task `Thread` the per-thread connection accessor
  and one Rails test depend on.
- **Synchronous `broadcast` now, async when Redis lands.** Every caller would
  be ported twice, and the test helpers' return types would change under
  applications. trails#8057 is the precedent for async from the first PR.
- **Enrol in the gates once the port is "mostly done".** That is how the other
  packages acquired baselines to burn down. Three files in, zero is free.
- **Seed coarse stories and let convergence stories accrete.** Prior port RFCs
  grew 4–9× in stories that way. This seed files the predictable traps as
  checklist items in the story that owns the Ruby body.
- **Port the JavaScript client to TypeScript inside the package.** It is not
  Ruby, it is already published, and a fork would drift from the protocol it
  exists to speak.

## Rollout

| phase                                                                   | stories |    est-loc |
| ----------------------------------------------------------------------- | ------: | ---------: |
| 0. Outside the package: rack hijack, dev server, ruby-compat, CLAUDE.md |       5 |      1,220 |
| 1. Package, enrollment, namespace, class names                          |       4 |      1,050 |
| 2. Runtime primitives: logger proxy, worker, event loop                 |       3 |        800 |
| 3. Server and pub/sub core, in-process adapters, test stubs             |       6 |      1,900 |
| 4. Channel                                                              |       7 |      2,600 |
| 5. Connection and socket layer                                          |      12 |      3,750 |
| 6. Test helpers and TestCase classes                                    |       5 |      1,850 |
| 7. End-to-end client tests                                              |       2 |        800 |
| 8. PostgreSQL and Redis adapters                                        |       4 |      1,600 |
| 9. Engine, generators, `trails new`, browser client, close-out          |       8 |      2,350 |
| **Total**                                                               |  **56** | **17,920** |

**Dependency roots** (no deps, startable in parallel):
`rack-handler-node-offers-rack-hijack-on-upgrade`, `ruby-compat-thread-pool-executor-shutdown-and-task-counts`, `ruby-compat-concurrent-timer-task-and-atomic-fixnum`, `ratify-node-event-loop-stands-in-for-the-nio4r-selector`, `actioncable-package-skeleton`.

The suggested ordering put the whole socket layer after the "socket-free core".
The source does not allow that, in two places:

- **`StreamEventLoop` and `Server::Worker` come first.** Rails' test stub
  `TestServer` builds a real one of each (`test/stubs/test_server.rb:33-41`),
  and every channel and connection test runs through it.
- **`Stream`, `ClientSocket` and `WebSocket` come before
  `Connection::Base`**, whose constructor builds a `WebSocket`
  unconditionally (`connection/base.rb:73`) and whose unit tests drive a
  hand-hijacked socket. None of that needs the Rack handler; only
  `client_test.rb` does.

What is socket-free and testable without `Connection::Base`: the channel
modules and `Channel::Base` (against `TestConnection`), the in-process
adapters, the server, `TestHelper` and `Channel::TestCase`.

```text
[roots] rack hijack ─→ dev server upgrade
        rc: executor, rc: timer/atomic, CLAUDE.md section
        skeleton ─→ enroll ─→ namespace ─┬→ class names
                                          ├→ tagged logger proxy ─→ worker (← rc: executor)
                                          └→ event loop (← rc: executor, rc: timer, CLAUDE.md)
class names ─→ configuration ─┐
namespace ─→ subscriber map + base adapter ─→ server broadcasting ─┤
worker + event loop ──────────────────────────────────────────────┴→ server base ─┬→ inline/async/test adapters
                                                                                   └→ test stubs
class names + server broadcasting ─→ channel naming/broadcasting ─┐
namespace ─→ channel callbacks/timers ────────────────────────────┴→ streams ─→ channel base (← rc: atomic)
namespace ─→ identification/authorization ─→ callbacks/internal channel ─┐
class names ─→ subscriptions/message buffer ─────────────────────────────┤
event loop ─→ stream ─→ client socket + web socket ──────────────────────┴→ connection base (← server base)
channel base + stubs ─→ channel base/rejection tests, naming/broadcasting/timers tests
connection base + stubs ─→ 4 connection test stories, server tests, channel stream test
adapters + stubs ─→ test helper ─→ channel test case ─→ its test;  connection test case ─→ its test
rack hijack + connection base + channel base + adapters ─→ client test (4) ─→ client test (4) (← remote connections)
adapters ─→ postgresql ─→ its tests + CI lane;  adapters ─→ redis ─→ redis live tests + CI service
server base ─→ helper ─→ engine (← channel base, connection base, adapters, rack hijack) ─→ app/channels scan (← class names) ─┐
skeleton ─→ test-unit generator ─→ channel generator ───────────────────────────────────────────────────┴→ trails new
client test ─→ browser client interop
everything ─→ close-out
```

### 0. Outside the package: rack hijack, dev server, ruby-compat, CLAUDE.md

| story                                                         | est-loc | Rails cases |
| ------------------------------------------------------------- | ------: | ----------: |
| `rack-handler-node-offers-rack-hijack-on-upgrade`             |     400 |             |
| `trails-dev-server-forwards-upgrade-requests-to-rack-handler` |     200 |             |
| `ruby-compat-thread-pool-executor-shutdown-and-task-counts`   |     250 |             |
| `ruby-compat-concurrent-timer-task-and-atomic-fixnum`         |     250 |             |
| `ratify-node-event-loop-stands-in-for-the-nio4r-selector`     |     120 |             |

### 1. Package, enrollment, namespace, class names

| story                                                    | est-loc | Rails cases |
| -------------------------------------------------------- | ------: | ----------: |
| `actioncable-package-skeleton`                           |     250 |             |
| `enroll-actioncable-in-compare-tooling-and-parity-gates` |     350 |             |
| `port-actioncable-namespace-and-internal-constants`      |     200 |             |
| `actioncable-class-names-round-trip-through-constantize` |     250 |             |

### 2. Runtime primitives: logger proxy, worker, event loop

| story                                             | est-loc | Rails cases |
| ------------------------------------------------- | ------: | ----------: |
| `port-actioncable-connection-tagged-logger-proxy` |     200 |             |
| `port-actioncable-server-worker`                  |     300 |           2 |
| `port-actioncable-connection-stream-event-loop`   |     300 |             |

### 3. Server and pub/sub core, in-process adapters, test stubs

| story                                                             | est-loc |  Rails cases |
| ----------------------------------------------------------------- | ------: | -----------: |
| `port-actioncable-server-configuration`                           |     250 |              |
| `port-actioncable-subscriber-map-base-adapter-and-channel-prefix` |     300 |            1 |
| `port-actioncable-server-broadcasting`                            |     200 |              |
| `port-actioncable-server-connections-and-base`                    |     350 |              |
| `port-actioncable-inline-async-and-test-adapters`                 |     450 | 3 + 9 shared |
| `port-actioncable-test-stubs-and-test-helper`                     |     350 |            9 |

### 4. Channel

| story                                                                    | est-loc | Rails cases |
| ------------------------------------------------------------------------ | ------: | ----------: |
| `port-actioncable-channel-naming-and-broadcasting`                       |     200 |             |
| `port-actioncable-channel-callbacks-and-periodic-timers`                 |     300 |             |
| `port-actioncable-channel-streams`                                       |     350 |             |
| `port-actioncable-channel-base`                                          |     450 |             |
| `port-actioncable-channel-base-and-rejection-tests`                      |     500 |          25 |
| `port-actioncable-channel-naming-broadcasting-and-periodic-timers-tests` |     250 |          10 |
| `port-actioncable-channel-stream-test`                                   |     550 |          13 |

### 5. Connection and socket layer

| story                                                              | est-loc | Rails cases |
| ------------------------------------------------------------------ | ------: | ----------: |
| `port-actioncable-connection-identification-and-authorization`     |     250 |             |
| `port-actioncable-connection-callbacks-and-internal-channel`       |     250 |             |
| `port-actioncable-connection-subscriptions-and-message-buffer`     |     300 |             |
| `port-actioncable-connection-stream`                               |     300 |             |
| `port-actioncable-connection-client-socket-and-web-socket`         |     500 |             |
| `port-actioncable-connection-base`                                 |     450 |             |
| `port-actioncable-connection-base-authorization-and-forgery-tests` |     400 |          15 |
| `port-actioncable-connection-identifier-and-callbacks-tests`       |     350 |           9 |
| `port-actioncable-connection-subscriptions-test`                   |     250 |           8 |
| `port-actioncable-connection-client-socket-and-stream-tests`       |     300 |           4 |
| `port-actioncable-remote-connections`                              |     200 |             |
| `port-actioncable-server-base-and-health-check-tests`              |     200 |           6 |

### 6. Test helpers and TestCase classes

| story                                        | est-loc | Rails cases |
| -------------------------------------------- | ------: | ----------: |
| `port-actioncable-test-helper-and-test-case` |     450 |          13 |
| `port-actioncable-channel-test-case`         |     350 |             |
| `port-actioncable-channel-test-case-test`    |     400 |          21 |
| `port-actioncable-connection-test-case`      |     300 |             |
| `port-actioncable-connection-test-case-test` |     350 |          17 |

### 7. End-to-end client tests

| story                                                       | est-loc | Rails cases |
| ----------------------------------------------------------- | ------: | ----------: |
| `port-actioncable-client-test-harness-and-client-cases`     |     500 |           4 |
| `port-actioncable-client-test-disconnect-and-restart-cases` |     300 |           4 |

### 8. PostgreSQL and Redis adapters

| story                                                      | est-loc | Rails cases |
| ---------------------------------------------------------- | ------: | ----------: |
| `port-actioncable-postgresql-adapter`                      |     350 |             |
| `port-actioncable-postgresql-adapter-tests-and-ci-lane`    |     300 |           3 |
| `port-actioncable-redis-adapter`                           |     550 |           2 |
| `port-actioncable-redis-adapter-live-tests-and-ci-service` |     400 |           1 |

### 9. Engine, generators, `trails new`, browser client, close-out

| story                                                    | est-loc | Rails cases |
| -------------------------------------------------------- | ------: | ----------: |
| `port-actioncable-helper`                                |     150 |             |
| `port-actioncable-engine`                                |     500 |             |
| `eager-load-app-channels-in-finisher`                    |     250 |             |
| `port-actioncable-test-unit-channel-generator`           |     150 |             |
| `port-actioncable-channel-generator`                     |     550 |          13 |
| `trails-new-scaffolds-action-cable-by-default`           |     350 |             |
| `actioncable-browser-client-interop-and-non-port-record` |     250 |             |
| `actioncable-close-out`                                  |     150 |             |

## How we estimated

- **Lib ports:** Ruby code lines (without comments and blanks) × ~1.3 for the
  TS body with JSDoc citations, plus one `.trails.test.ts` case per predicted
  trap (15–25 lines each), rounded to 50.
- **Test ports:** Ruby test lines × ~1.35 (async `await`, explicit fixtures,
  vitest matchers). Each story lists its cases, so a count can be compared per
  story.
- **Infra stories** (rack, dev server, ruby-compat, CI service, enrollment):
  sized from the trails files they touch and the tests they need.
- **Not in the estimate:** review-round rework and CI reruns. Growth would come
  from a Rails case exposing a port bug in another package; file it under this
  RFC with the Rails `file:line`.

To compare later: count stories under this RFC and sum shipped PR LOC
(additions + deletions, the ceiling's exclusions) against **56 / 17,920**.
`actioncable-close-out` writes the comparison into the Changelog.

## Seed completeness

Every file under `actioncable/lib` (45 `.rb`, 7 templates, 1 `USAGE`) is
owned by exactly one story.
Every Ruby file under `actioncable/test` is owned by exactly one story, except
`client_test.rb` and `subscription_adapter/redis_test.rb`, which are split by
case. All 171 extracted cases are assigned by name exactly once, as are the 9
shared-module cases and the 13 railties generator cases. The script that
generated the story files asserts each of those statements against the vendored
tree and the extractor's output, and asserts that no slug collides with an
existing story.

A story added later is a spec miss. Note it as one in the new story's Context,
citing the Rails line this authoring missed.

## Verification

- `pnpm parity:api --package actioncable` reads every file at 100%, apart from
  the members in `SCOPED_SKIP_GROUPS`.
- `pnpm parity:test` credits all 170 portable extracted cases and the shared
  cases under each including class; `javascript_package_test.rb` reads as
  unported with its reason. trailties credits the 13 channel generator cases.
- Every parity gate is green for actioncable at zero, with no baseline row,
  exclude shard or mark above 0, and actioncable is in `ROWLESS_PACKAGES`.
- Every receipt under `packages/actioncable/src` is `PERMANENT`, sits in a
  file the CLAUDE.md section names (or at an adapter call a story lists), and
  cites that section.
- `client_test.rb`'s eight cases pass against `ActionCable.server` behind
  `Rack::Handler::Node` over TCP, and the published `@rails/actioncable`
  client completes a subscribe / perform / broadcast / disconnect cycle against
  it.
- CI runs the PostgreSQL and Redis adapter tests against real services, and
  neither skips.
- `trails new` generates a cable config and `application_cable` classes; the
  generated app answers a WebSocket at `/cable` under both `trails server`
  paths; `trails g channel chat speak` writes a channel and its test.
- `parity:api` / `parity:test` deltas for every other package are
  non-negative at every step.

## Open questions

Each has a recommendation and names the story that resolves it. None is decided
silently.

1. **How does the upgrade request reach `ClientSocket`?** Carried through the
   Rack env as the Node `IncomingMessage`, or a request-shaped object built
   from the env. **Recommendation: built from the env.** The npm driver reads
   only `headers`, `url` and `method`, and Rails' unit tests have no Node
   request to carry. Resolved in
   `port-actioncable-connection-client-socket-and-web-socket`.
2. **Do `worker_pool_size` and the `Concurrent::TimerTask` /
   `ThreadPoolExecutor` knobs keep meaning?** **Recommendation: yes.**
   `worker_pool_size` caps invocations in flight (each a ruby-compat
   `Thread`), the event loop's executor keeps `max_threads: 10`, and
   `TimerTask`'s `execution_interval` is a real interval. They bound
   concurrency, not OS threads; the package README says so. Resolved in
   `port-actioncable-server-worker` and
   `port-actioncable-connection-stream-event-loop`.
3. **Which synchronous Rails-facing APIs become promises?**
   `ActionCable.server.broadcast`, `Channel.broadcast_to` (class and
   instance), `ActionCable.server.disconnect` and
   `remote_connections.where(…).disconnect`, `ActionCable.server.restart`,
   `stop_stream_from` / `stop_stream_for` / `stop_all_streams`, the four
   `TestHelper` assertions, `Channel::TestCase#subscribe` / `perform` /
   `unsubscribe`, and `Connection::TestCase#connect` / `disconnect` /
   `assert_reject_connection`. `stream_from`, `stream_for`, `transmit`
   and `reject` stay synchronous. **Recommendation: accept the list as the
   language shortcoming CLAUDE.md already ratifies for `create` and
   `Relation`**, and have
   `port-actioncable-subscriber-map-base-adapter-and-channel-prefix` decide
   whether it needs its own CLAUDE.md section ("Action Cable's broadcast is
   async") for later stories to cite, as RFC 0169 does for `perform`. An
   unawaited `broadcast` in application code is the visible cost: it still
   sends, and a failure becomes an unhandled rejection.
4. **Which Redis npm client?** `0158/cache-store-async-over-npm-clients` names
   `redis` and `ioredis` and has not picked. **Recommendation: whichever of
   that story and `port-actioncable-redis-adapter` lands first picks, and the
   other follows**, the arrangement that story already has with RFC 0168's
   memcached client. The adapter needs a dedicated subscriber connection, an
   event for each subscribe acknowledgement, and a way to turn the client's own
   reconnect off.
5. **Do `StreamEventLoop#writes_pending` and `Stream#flush_write_buffer`
   keep a body?** Their only callers are `Stream#write`'s partial-write arms
   (`stream.rb:54,65`) and `run` (`stream_event_loop.rb:105`), neither of
   which exists over a socket that buffers every write. **Recommendation: they
   join `spawn` / `run` / `wakeup` in the skip group**; a method no trails
   code can call is an empty stub. Resolved in
   `ratify-node-event-loop-stands-in-for-the-nio4r-selector`.
6. **How does a channel keep a method from being an action?**
   `action_methods` depends on Ruby's `private`, which trails does not have
   at run time (CLAUDE.md § "Method visibility is compile-time only").
   **Recommendation: the mechanism `AbstractController::Base.action_methods`
   already uses** (`packages/actionpack/src/abstract-controller/base.ts:172-209`),
   so controllers and channels answer the question the same way. Resolved in
   `port-actioncable-channel-base`.
7. **How are action and identifier names spelled on the wire?** A Rails client
   sends `perform("get_latest")`; the trails method is `getLatest`. The same
   question applies to `identified_by :current_user` and the params a channel
   reads. **Recommendation: the wire carries what the application's own client
   code sends, and `extract_action` maps it by the Symbol-to-camelCase rule in
   one place**, so a trails app written in camelCase and a Rails-written client
   in snake_case both dispatch. Resolved in `port-actioncable-channel-base`.
8. **How does `parity:test` credit a case defined in an included module?**
   `common.rb`'s eight cases run under five classes and one subclass. **Recommendation: credit
   per including class**, decided once in
   `enroll-actioncable-in-compare-tooling-and-parity-gates`.

## Changelog

- 2026-10-01: initial RFC (56 stories, 17,920 est-loc).
