---
rfc: "0217-rackup-gem-port"
title: "Rackup: a direct port of rackup 2.2.1 as @blazetrails/rackup"
status: active
created: 2026-11-03
updated: 2026-11-03
owner: "@deanmarano"
packages:
  - rackup
  - rack
  - trailties
  - ruby-compat
  - "scripts"
clusters:
  - port
  - fidelity
related-rfcs:
  - "0171-thor-port"
  - "0142-trailties-surfaced-deviations"
  - "0141-actionpack-surfaced-deviations"
  - "0193-small-gem-ports-parity-100"
---

# RFC 0217 — Rackup

## Summary

Rack 3 moved its server-facing half out of the `rack` gem into `rackup`, and
Rails 8 depends on it: `railties.gemspec` requires `rackup >= 1.0.0`
(`vendor/rails/v8.0.2/railties/railties.gemspec`), `Gemfile.lock:445`
resolves `rackup (2.2.1)`, and `Rails::Server < Rackup::Server`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/server/server_command.rb:11`).
trails has no rackup: `Rails::Server` carries a stand-in `server()` and drops
`super.merge(@default_options)`, and the Node handler lives in
`packages/rack/src/handler/` with no Rack counterpart. This RFC ports rackup
2.2.1 as `@blazetrails/rackup`, the way `0133-rack-session-gem-port`,
`0137-rack-test-gem-port`, `0168-rack-cache-gem-port` and
`0211-rake-gem-port` ported their gems, and gathers the rackup-shaped stories
already filed elsewhere into one place.

## Motivation

- `Rails::Server#start`, `#default_options`, `#middleware` and `#wrapped_app`
  all reach `Rackup::Server` through `super`; `bin/rails server` cannot be a
  faithful port while its parent class is missing.
- `Rack::Handler` was removed from rack 3; `packages/rack/src/index.ts`
  exports `Handler` anyway, which `rack-index-body-helpers-and-handler-extra-surface`
  (RFC 0193) left as the one rack name with no Rack home.
- Six open stories about `Rackup::Server` or the Node handler sit in RFCs
  0171 and 0142, each written as a trailties deviation.

## Inventory (rackup 2.2.1, `lib/` + `bin/`, 1,112 lines)

| File                            | Lines | Story                                                                                                              |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `lib/rackup.rb`                 | 21    | `rackup-package-parity-enrollment` (entry); its `require 'webrick'` arm is a non-goal                              |
| `lib/rackup/version.rb`         | 8     | `rackup-package-parity-enrollment`                                                                                 |
| `lib/rackup/handler.rb`         | 113   | `port-rackup-server-for-rails-server` (`register`, `[]`, `get`, `pick`, `default`, `require_handler`)              |
| `lib/rackup/server.rb`          | 462   | `port-rackup-server-for-rails-server` (class, `Options`), `rackup-server-spec-full-port` (remaining arms and spec) |
| `lib/rackup/handler/webrick.rb` | 162   | non-goal; `rackup-handler-node-moves-out-of-rack` is trails' handler                                               |
| `lib/rackup/handler/cgi.rb`     | 61    | non-goal                                                                                                           |
| `lib/rackup/stream.rb`          | 199   | `rackup-stream-port`                                                                                               |
| `lib/rackup/lobster.rb`         | 81    | `rackup-lobster-and-bin-rackup`                                                                                    |
| `bin/rackup`                    | 5     | `rackup-lobster-and-bin-rackup`                                                                                    |

Test suite (`test/` in the v2.2.1 tag; the gem ships none): `spec_server.rb`
(51 `it`), `spec_handler.rb` (6), `spec_lobster.rb` (6) are ported;
`spec_webrick.rb` (11) is not (non-goal below). rackup is to be vendored at
`vendor/rackup/v2.2.1/` with its `test/` tree.

The in-flight `port-rackup-server-for-rails-server` (re-scoped by the repo
owner on 2026-11-03) commits to exactly: the `vendor/sources.ts` entry,
`Rackup::Handler` (`handler.rb`), and `Rackup::Server` with its `Options`
(`server.rb`), `Server#server` behind `Handler.get` / `Handler.default`.
Wiring `Rails::Server` onto it is `rails-server-extends-rackup-server`, which
stays in RFC 0171 because it is trailties code. Everything else the package
needs (`rackup.rb`, `version.rb`, the parity gates, any spec that PR did not
port) is owned by a phase-2 story below; none assumes more of the in-flight
PR than those three criteria.

## Design

- One package, `packages/rackup`, files mirroring `lib/rackup/*.rb` one for
  one. `Rackup::Handler` keeps rackup's registry; trails' Node HTTP server is
  registered into it as `Handler::Node`, the handler `pick` finds first,
  where Ruby's `SERVER_NAMES` (`handler.rb:81`) lists puma, falcon, webrick.
- `Handler.get`'s `require_handler` (`handler.rb:106-111`) is a synchronous
  `require`; it follows the awaited-load shape of trails' CLAUDE.md
  § "An adapter file is loaded by an awaited step".
- `Server#daemonize_app` (`server.rb:427-432`) calls `Process.daemon`, which
  forks; under CLAUDE.md § "Runtime facts Node does not expose" (`fork`) it is
  ported as written over ruby-compat's `Process.daemon`, and
  `spec_server.rb:125` ("#start daemonizes if daemonize option is given") is a
  `PERMANENT-SKIP` citing that section.
- Profiling: `handle_profiling` / `make_profile_name` (`server.rb:357-393`)
  require `objspace` and `stackprof`, Ruby-runtime libraries with no Node
  counterpart. Both methods are ported line for line, so `--heap` /
  `--profile` / `--profile-mode` are parsed and warn as Ruby does when the
  library fails to load (the `LoadError` arm). The tests that need a heap dump
  or stackprof output are `PERMANENT-SKIP`: `spec_server.rb:134`, `:148`,
  `:368`, `:390`, `:412`. `:71`, `:75` and `:285` (option parsing and the
  invalid-mode warning) are ported.
- `Rails::Server` in `packages/trailties/src/commands/server.ts` extends
  `Rackup::Server`; trailties' server-command stories depend on the rackup
  stories below.

## Non-goals

- **`Rackup::Handler::WEBrick` and `spec_webrick.rb`:** WEBrick is a Ruby
  stdlib server with no Node counterpart; `Handler::Node` (already receipted
  `PERMANENT` in `packages/rack/src/handler/node.ts`) is the trails server.
- **`Rackup::Handler::CGI`:** a Node process is never a CGI script; no
  application of trails is deployed that way.
- **The webrick `require` arm of `lib/rackup.rb`:** follows from the above.

## Alternatives considered

- **Leave the handler in `@blazetrails/rack`:** keeps a name rack 3 deleted,
  and keeps `Rails::Server` with no parent class to extend.
- **Port `Rackup::Server` into trailties:** puts a gem's class in a Rails
  file, so `parity:api` cannot credit it to `rackup/server.rb`.

## Rollout

1. `port-rackup-server-for-rails-server` (in flight; moved here from 0171):
   vendor entry, `Handler`, `Server` with `Options`. Then, in RFC 0171,
   `rails-server-extends-rackup-server`.
2. `rackup-package-parity-enrollment`: `rackup.rb`, version, `spec_handler.rb`,
   gates.
3. `rackup-handler-node-moves-out-of-rack`, `rackup-server-spec-full-port`.
4. `rackup-stream-port`, `rackup-lobster-and-bin-rackup`.
5. Moved Node-handler stories (from 0142):
   `trails-server-adapts-application-to-function-rack-app`,
   `rack-node-handler-runs-requests-on-a-puma-style-thread-pool`,
   `handler-node-rack-errors-fails-rack-lint`,
   `node-handler-leaves-the-request-open-when-the-app-raises`,
   `request-build-error-answers-500-not-a-hang`.

## Verification

- `pnpm parity:api --package rackup` credits every method of `handler.rb`,
  `server.rb`, `stream.rb`, `lobster.rb` (100% of in-scope files).
- `pnpm parity:test --package rackup` matches all 63 in-scope `it` blocks
  (51 + 6 + 6, per § Inventory), less the six `PERMANENT-SKIP`s named in
  § Design.
- `packages/rack/src/handler/` is gone and `rack`'s `Handler` export with it.
- `rails-server-extends-rackup-server` (RFC 0171) is done: trailties'
  `Server` extends `Rackup.Server` with no stand-in `server()`.

## Open questions

None.

## Changelog

- 2026-11-03: initial RFC
