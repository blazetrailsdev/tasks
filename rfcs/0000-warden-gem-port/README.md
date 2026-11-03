---
rfc: "0000-warden-gem-port"
title: "@blazetrails/warden: port the warden gem and mount Warden::Manager in a trails app"
status: draft
created: 2026-11-03
updated: 2026-11-03
owner: "@deanmarano"
packages:
  - warden
  - trailties
  - actionpack
clusters:
  - warden-setup
  - warden-core
  - warden-specs
  - warden-wiring
related-rfcs:
  - "0148-ruby-compat-catch-throw"
  - "0133-rack-session-gem-port"
  - "0137-rack-test-gem-port"
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — `@blazetrails/warden`

## Summary

Port the `warden` gem (1.2.9, the latest release,
`https://github.com/wardencommunity/warden` tag `v1.2.9`) to a new published
package, `@blazetrails/warden`, file for file and spec for spec, and wire
`Warden::Manager` into a trails application's middleware stack the way the
gem's one large consumer, Devise, does. Warden is the Rack authentication
framework Devise is built on. Devise is named here as the future consumer and
is **not** scoped: no Devise story is filed by this RFC.

## Motivation

- **Warden is the authentication substrate for the Rails ecosystem.** Devise
  mounts it with `config.app_middleware.use Warden::Manager do |config| …`
  (devise 4.9.4 `lib/devise/rails.rb:11`) and reaches it from every controller
  through `request.env['warden']` (`lib/devise/controllers/helpers.rb:144-146`).
  A trails Devise port has nothing to stand on until warden exists.
- **It is small and its prerequisites are met.** lib is 1,390 Ruby lines in 15
  files, about 127 `def`s, one runtime dependency (`rack`), an acyclic require
  graph and no I/O. The spec suite is 2,924 lines, 230 examples in 13 files.
  The earlier codegen audit
  (`~/.btwhooks/data/github/blazetrailsdev/trails/audits/warden-codegen-20260914T170853Z.md`)
  named `catch(:warden)` / `throw(:warden, …)` as the blocking idiom. RFC 0148
  has since shipped `kernelCatch` / `kernelThrow` / `UncaughtThrowError`
  (`packages/ruby-compat/src/kernel-catch.ts:26,100,129-145`,
  story `port-kernel-catch-throw`, trails#7758), including the async-block arm
  (0148 Design §1.6) that `Manager#call` around a promise-returning Rack app
  needs.
- **No prior art in the backlog.** `grep -rli warden rfcs` finds only RFC
  0148's motivation paragraph; no story names warden, and nothing under
  `packages/` reads `env["warden"]`.

## Design

### 1. Package, vendor anchor and enrollment

`packages/warden` is modelled on `packages/rack-test` (RFC 0137): published,
`type: module`, depending on `@blazetrails/rack` and
`@blazetrails/ruby-compat`. The gem is vendored by a `vendor/sources.ts` entry
(`libPath: "lib/warden"`, `testPath: "spec"`) and enrolled in `parity:api` and
`parity:test` from day one, so every later story is measured.

**The pin is not justified by `vendor/rails/v8.0.2/Gemfile.lock`.** Every
existing source entry cites that lockfile; warden is not in it, because Rails
does not depend on it (Devise does). This RFC is the owner's scope decision
that admits it: the entry's comment cites this RFC and the gem release, and
the version is the latest 1.2.x (1.2.9). See Open question 1.

### 2. File map

Each lib file is one story or a named out-of-scope line. Ruby paths are
relative to the gem root.

| Ruby file                           | Lines | Story                                                                                                           |
| ----------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------- |
| `lib/warden/version.rb`             |     5 | `warden-package-setup`                                                                                          |
| `lib/warden.rb`                     |    47 | `port-warden-manager` (module, `NotAuthenticated`, `Test` autoloads); `port-warden-test-helpers` (`test_mode!`) |
| `lib/warden/config.rb`              |   112 | `port-warden-config`                                                                                            |
| `lib/warden/errors.rb`              |    67 | `port-warden-errors`                                                                                            |
| `lib/warden/hooks.rb`               |   212 | `port-warden-hooks`                                                                                             |
| `lib/warden/mixins/common.rb`       |    45 | `port-warden-strategies`                                                                                        |
| `lib/warden/strategies.rb`          |    48 | `port-warden-strategies`                                                                                        |
| `lib/warden/strategies/base.rb`     |   182 | `port-warden-strategies`                                                                                        |
| `lib/warden/session_serializer.rb`  |    53 | `port-warden-session-serializer`                                                                                |
| `lib/warden/proxy.rb`               |   395 | `port-warden-proxy`                                                                                             |
| `lib/warden/manager.rb`             |   149 | `port-warden-manager`                                                                                           |
| `lib/warden/test/helpers.rb`        |    37 | `port-warden-test-helpers`                                                                                      |
| `lib/warden/test/mock.rb`           |    69 | `port-warden-test-helpers`                                                                                      |
| `lib/warden/test/warden_helpers.rb` |    44 | `port-warden-test-helpers`                                                                                      |

| Spec file                                           | Examples | Story                                                                              |
| --------------------------------------------------- | -------: | ---------------------------------------------------------------------------------- |
| `spec/helpers/request_helper.rb`                    |  support | `port-warden-strategies` (`env_with_params`); `port-warden-manager` (`setup_rack`) |
| `spec/helpers/strategies/*.rb` (7 files)            |  support | `port-warden-strategies`                                                           |
| `spec/warden/config_spec.rb`                        |        7 | `port-warden-config`                                                               |
| `spec/warden/errors_spec.rb`                        |        7 | `port-warden-errors`                                                               |
| `spec/warden/strategies_spec.rb`                    |        9 | `port-warden-strategies`                                                           |
| `spec/warden/strategies/base_spec.rb`               |       32 | `port-warden-strategies-base-spec`                                                 |
| `spec/warden/session_serializer_spec.rb`            |        7 | `port-warden-session-serializer`                                                   |
| `spec/warden/scoped_session_serializer.rb`          |        9 | `port-warden-session-serializer`                                                   |
| `spec/warden/manager_spec.rb`                       |       24 | `port-warden-manager-spec`                                                         |
| `spec/warden/hooks_spec.rb`                         |       31 | `port-warden-hooks-spec`                                                           |
| `spec/warden/authenticated_data_store_spec.rb`      |        8 | `port-warden-hooks-spec`                                                           |
| `spec/warden/proxy_spec.rb` `:1-351`                |       27 | `port-warden-proxy-spec-authentication`                                            |
| `spec/warden/proxy_spec.rb` `:352-644`              |       26 | `port-warden-proxy-spec-users`                                                     |
| `spec/warden/proxy_spec.rb` `:645-1081`             |       30 | `port-warden-proxy-spec-state`                                                     |
| `spec/warden/test/{helpers,test_mode,mock}_spec.rb` |       13 | `port-warden-test-helpers`                                                         |

Out of scope in the gem tree: `Rakefile`, `Gemfile`, `warden.gemspec`,
`.github/`, `CHANGELOG.md` (no runtime code).

### 3. Idiom decisions every story inherits

- **`catch(:warden)` / `throw(:warden, opts)`** (`manager.rb:34`,
  `proxy.rb:134`, `proxy.rb:368`, and the `throw` users write in hooks and
  failure paths, `hooks.rb:43`) are `kernelCatch("warden", …)` /
  `kernelThrow("warden", opts)`: a Ruby Symbol is a JS string, and no warden
  site turns on Symbol-vs-String, so the tag carries no leading colon
  (trails CLAUDE.md § "Ruby idioms that do not translate literally"). No third
  catch/throw copy may be invented (RFC 0148 Motivation).
- **`Class.new(Warden::Strategies::Base)` + `class_eval(&block)`**
  (`strategies.rb:8-9`) is `class extends Base {}` followed by running the
  block with the new class as `this`, the shape ruby-compat's
  `rbModDefineMethod` / `rbModMethodDefined`
  (`packages/ruby-compat/src/object.ts:900,966`) already serve. The block's
  `def authenticate!` is a `defineMethod` (or prototype assignment) inside that
  block. Open question 2.
- **`SessionSerializer.send :define_method, "#{scope}_serialize"`**
  (`manager.rb:69-91`) is `rbModDefineMethod` on `SessionSerializer`, and its
  readers' `respond_to?(method_name) ? send(method_name, …)`
  (`session_serializer.rb:26-35`) keep `rbObjRespondTo` / `rbFSend`: the
  name is computed from an application-supplied scope, an open set, which is
  CLAUDE.md § "A dispatch by name is spelled directly"'s `rbFSend` case.
- **`def_delegators`** (`proxy.rb:23,26`) generate real methods in Ruby, so
  each delegated name is a method on `Proxy` at its Rails name; no Forwardable
  helper is invented.
- **`Errors#method_missing`** (`errors.rb:52-54`) is a new definer for
  CLAUDE.md § "Ruby protocol methods with a different JS mechanism"; its row is
  added to that table in `port-warden-errors`.
- **`Hooks`'s generated `prepend_*`** (`hooks.rb:203-210`, a `class_eval`
  string over a closed list of six names) are six written methods.
- **Async.** A trails Rack app's `call` may return a promise, so
  `Manager#call` awaits inside `kernelCatch`'s async arm. `Proxy`'s
  `authenticate*`, `user`, and `set_user` stay synchronous unless a story
  finds an awaited read on their path; a serializer whose `deserialize` loads
  a record (Devise's) is the consumer's business, and any async widening is a
  recorded deviation in the story that makes it, not a default.

### 4. Middleware wiring (no Rails counterpart)

Rails ships no Warden wiring. What trails mirrors is Devise's pattern:
`config.app_middleware.use Warden::Manager do |config| … end`
(devise `lib/devise/rails.rb:11`), which an application writes as
`config.middleware.use Warden::Manager`. trailties already ports both
surfaces: `MiddlewareStackProxy#use` (`packages/trailties/src/configuration.ts:36`)
and `Railtie::Configuration#app_middleware`
(`packages/trailties/src/trailtie/configuration.ts:91`, Rails
`railties/lib/rails/railtie/configuration.rb:39`). So the wiring adds **no
public name**: the stories verify that `use(Warden.Manager, opts, block)`
reaches `Manager`'s constructor with its block (`manager.rb:19-24`), that a
controller reads `this.request.env["warden"]`, and that a `throw` from a
controller action unwinds through actionpack's rescue layers to
`Manager#call`. Devise's `warden` controller helper (`helpers.rb:144`) is
Devise surface and is not added to ActionController. Any name a story finds it
must add carries a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>`
receipt per CLAUDE.md § "Fidelity is the job"; none is expected.

## Non-goals

- **Devise.** Named as the consumer that motivates this RFC; no Devise story is
  filed here, and no Devise-shaped helper (`warden`, `authenticate_user!`,
  `sign_in`) lands in actionpack or trailties.
- **Warden plugins and strategies beyond the gem** (`warden-jwt_auth`,
  OmniAuth's warden glue): third-party gems.
- **A `warden` generator in trailties:** nothing in Rails or warden generates
  one.

## Alternatives considered

- **Port only what Devise calls.** Rejected: parity is measured per gem, the
  spec suite is the fidelity check, and the whole lib is ~1,400 lines.
- **A trails-owned authentication middleware.** Rejected: invented surface
  with no Ruby counterpart; Rails 8's own authentication generator is session
  based and already covered elsewhere (RFC 0104).
- **Codegen the whole gem in one PR** (the 2026-09-14 audit's framing).
  Rejected for this RFC: per-file stories under the PR ceiling, as RFCs 0133
  and 0137 shipped.

## Rollout

1. Setup — `warden-package-setup`.
2. Leaves, in parallel — `port-warden-config`, `port-warden-errors`,
   `port-warden-hooks`, `port-warden-strategies`,
   `port-warden-session-serializer`; then `port-warden-strategies-base-spec`.
3. Core — `port-warden-proxy`, then `port-warden-manager`.
4. Specs and test support, in parallel — `port-warden-manager-spec`,
   `port-warden-hooks-spec`, `port-warden-proxy-spec-authentication`,
   `port-warden-test-helpers`; then `port-warden-proxy-spec-users` and
   `port-warden-proxy-spec-state` in parallel (both append to the
   `proxy.test.ts` the authentication story creates).
5. Wiring — `actionpack-rescue-paths-rethrow-kernel-throw`,
   `mount-warden-manager-in-trails-middleware`,
   `warden-worked-example-integration-test`.

## Verification

- `parity:api` for `warden`: 100% of the gem's public methods matched
  (about 127 `def`s), with `parity:api:extra --package warden` reporting no
  untagged extra.
- `parity:test` for `warden`: all 230 examples matched, none skipped except
  under a cited `PERMANENT-SKIP:`.
- The worked-example integration test passes on CI in the trailties lane.

## Open questions

1. **Vendor policy for a gem outside Rails' lockfile.** Every
   `vendor/sources.ts` entry cites `Gemfile.lock`. Recommendation: admit warden
   on this RFC's authority, the comment citing the RFC and the 1.2.9 release.
   Owner decision required before `active`.
2. **Strategy-class block shape.** `Strategies.add(label, strategy, block)`
   with the block run against a fresh `class extends Base {}` (recommended),
   or a block that returns the class body. The first keeps `add`'s Ruby
   signature and `update`'s `class_eval` on an existing class
   (`strategies.rb:24-30`); the second cannot express `update`.
3. **Config's base.** `Config < Hash` (`config.rb:7`) with plugins reading
   and writing keys. Recommendation: a ruby-compat `Hash` subclass only if
   `config_spec.rb` or `Manager` needs a `Hash` feature
   (`packages/ruby-compat/README.md` § "When a Ruby Hash is a Hash"),
   else a class over a plain object; `port-warden-config` decides and records.

## Changelog

- 2026-11-03: initial draft RFC.
