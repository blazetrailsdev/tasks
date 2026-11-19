---
rfc: "0000-web-console-gem-port"
title: "Port the web-console gem"
status: draft
created: 2026-11-19
updated: 2026-11-19
owner: "@deanmarano"
packages:
  - "web-console"
  - "trailties"
  - "ruby-compat"
clusters:
  - vendor
  - bindings
  - port
  - beyond-rails
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Port the web-console gem

## Summary

Port rails/web-console 4.3.0 as `@blazetrails/web-console`: the development-only
middleware that puts an interactive console on the exception page, bound to the
frame that raised, and the `console` view/controller helper. Its one hard
dependency is a captured scope (Ruby's `Binding`, via `bindex`), which JS does
not expose; this RFC replaces it with the V8 inspector protocol (`node:inspector`).
Because the server and the browser both run V8 and JavaScript, the same
mechanism opens a path Rails cannot take: frame-level inspection that continues
into Chrome DevTools. That layer is scoped separately, after the faithful port.

**Out of scope for the initial trails launch.** This RFC stays `draft` until
after launch, and no RFC 0248 (trailties parity) story depends on it.

## Motivation

- Rails 8's app template adds `gem "web-console"` to the development group
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Gemfile.tt:72-73`),
  removed by `--skip-dev-gems`
  (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:95`).
  `app_generator_test.rb:789` (`test_web_console`), `:1032`
  (`test_skip_dev_gems`) and `api_app_generator_test.rb:44` assert on it.
- trails' `DebugExceptions` (`packages/actionpack/lib/action-dispatch/middleware/debug-exceptions.ts`)
  renders the error page, but there is nothing to evaluate in.
- ruby-compat's `Binding` (`packages/ruby-compat/lib/variable.ts:96`) carries
  only its receiver: "JS cannot capture a scope". web-console is the one gem
  whose purpose is a captured scope, so it is the place to decide how trails
  gets one.

## Design

### The gem

web-console 4.3.0 is 760 lines of Ruby across 17 files in `lib/web_console/`
plus ERB templates and a JS client (`templates/*.erb`), with 74 tests in
`test/web_console/`. Dependencies: `railties`, `actionview`, `bindex`
(`web-console.gemspec:22-24`). Main pieces:

| File                                                          | Role                                                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `middleware.rb` (137)                                         | Rack middleware: injects the console, serves `PUT /__web_console/repl_sessions/:id` (eval) and `POST …/trace` (switch frame) |
| `session.rb`, `exception_mapper.rb`, `evaluator.rb`           | a session per exception; maps backtrace frames to bindings; evaluates input in the current binding                           |
| `extensions.rb`, `interceptor.rb`                             | the `console` helper; the `DebugExceptions` hook that stores the exception's bindings                                        |
| `request.rb`, `whiny_request.rb`, `permissions.rb`            | the allowed-networks check                                                                                                   |
| `template.rb`, `view.rb`, `injector.rb`, `templates/`         | rendering and injecting the console markup and client JS                                                                     |
| `railtie.rb`, `context.rb`, `source_location.rb`, `errors.rb` | config, autocomplete context, frame locations                                                                                |

### Bindings from the V8 inspector

`bindex` gives each exception the bindings of every frame it unwound
(`Exception#bindings`), and `Bindex.current_bindings` the caller's
(`extensions.rb:13`). The port's carrier is the V8 inspector:

- In development the web-console railtie opens an in-process
  `inspector.Session`, enables `Debugger`, and sets pause-on-exceptions.
- On a pause, it reads `callFrames[].scopeChain` into a remote-object group
  keyed by the exception, then resumes. Those objects outlive the pause until the
  group is released.
- `Evaluator#eval` evaluates against a captured frame through
  `Runtime.callFunctionOn` with the frame's scope objects, and formats the
  result or the error as `evaluator.rb` does.
- The carrier is a ruby-compat `Binding` that also holds the frame's scopes,
  so `rbFBinding` keeps its shape and template bindings are unchanged.

Whether a same-thread session can capture scopes on a pause without
deadlocking, which exceptions to pause on (all, or only those that reach
`DebugExceptions`), and the dev-mode cost of pause-on-exceptions are the
spike's questions (`web-console-inspector-bindings-spike`). If same-thread
capture fails, the fallback is a worker thread connected with
`Session#connectToMainThread`.

### Beyond Rails

After the faithful port, a separate phase uses the same inspector session to
link the error page to Chrome DevTools at the raising frame, so server frames
and browser frames are inspected in one tool and one language. It goes beyond
any Rails behavior, so its public names carry `@noRailsEquivalent` receipts,
and it is not needed for parity.

## Non-goals

- **The initial launch.** This RFC is post-launch work.
- **The `bindex` gem as a package.** Its job is done by the inspector carrier,
  not by a port of its C extension.
- **Production use.** web-console is development-only in Rails; so is the port.

## Alternatives considered

- **Leave it unported (permanent).** Rejected: the inspector makes a faithful
  port possible, and the debugging story is a trails strength.
- **A source transform that records locals per frame.** Rejected: it rewrites
  every app file and slows every call, where the inspector costs nothing until
  an exception pauses.
- **`node --inspect` plus an external debugger only.** Rejected as the port: it
  is not web-console's in-page console. It is the direction of the
  beyond-Rails phase.

## Rollout

1. Vendor and spike: `vendor-web-console-gem`, `web-console-inspector-bindings-spike`.
2. Faithful port: `web-console-request-permissions`,
   `web-console-templates-view-injector`,
   `web-console-evaluator-session-exception-mapper`,
   `web-console-middleware-interceptor-extensions`,
   `web-console-railtie-and-app-generator-entry`.
3. Beyond Rails: `web-console-devtools-bridge`.

## Verification

- `pnpm parity:api -- --package web-console` and `pnpm parity:test -- --package web-console`
  at 100% against web-console 4.3.0's `lib/` and its 74 tests.
- `app_generator_test.rb`'s `test_web_console` and `test_skip_dev_gems` and
  `api_app_generator_test.rb:44` ported and passing in trailties.
- In a generated app, raising in a controller action renders a console whose
  input evaluates in that action's frame.

## Open questions

1. **Pause on all exceptions or only on uncaught ones?** Recommendation:
   decide from the spike's cost measurement.
