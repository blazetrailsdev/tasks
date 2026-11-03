---
title: "Let a Kernel#throw from a controller action pass actionpack's rescue layers"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-wiring
packages: ["actionpack", "activesupport", "trailties"]
deps: ["port-kernel-catch-throw"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`env["warden"].authenticate!` inside a controller action is
`throw(:warden, opts)` (`vendor/warden/v1.2.9/lib/warden/proxy.rb:134`), caught
by `Manager#call` several middleware above the controller. In Ruby a `throw`
is not an exception, so every `rescue Exception` between the two
(`ActionDispatch::ShowExceptions#call`,
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb:31-36`;
`DebugExceptions#call`, `debug_exceptions.rb:31-41`; `Executor#call`,
`executor.rb:13-31`; `Callbacks#call`, `callbacks.rb:24-33`;
`ActionController::Rescue#process_action`, `metal/rescue.rb:28-32`) lets it
through untouched, running only `ensure` bodies.

In trails a JS `catch` sees the in-flight throw. ruby-compat answers that with
`throwDataP` (`packages/ruby-compat/src/kernel-catch.ts:77`, MRI
`THROW_DATA_P`): a ported `rescue` asks it and re-throws. Its only caller on
the request path today is `action-controller/metal/instrumentation.ts`.

The `catch` sites between an action and an outer middleware, as of
2026-11-03 (`grep -n "catch (" <file>`), each classified:

| Site                                                        | Ruby counterpart                               | Today                                       |
| ----------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `action-dispatch/middleware/show-exceptions.ts:23,55,77,84` | `show_exceptions.rb:31-36` `rescue Exception`  | swallows: renders 500                       |
| `action-dispatch/middleware/debug-exceptions.ts:200,225`    | `debug_exceptions.rb:31-41` `rescue Exception` | swallows: renders 500                       |
| `action-dispatch/middleware/executor.ts:48`                 | `executor.rb:13-31` `rescue => error`          | reports, re-raises                          |
| `action-dispatch/middleware/callbacks.ts:36`                | `callbacks.rb:24-33` `ensure`                  | re-raises                                   |
| `action-controller/metal/rescue.ts:23`                      | `metal/rescue.rb:28-32` `rescue Exception`     | hands to `rescue_with_handler`              |
| `activesupport/src/rescuable.ts:146`                        | `rescuable.rb` `handler_for_rescue`            | may match a `rescue_from Exception` handler |
| `activesupport/src/callbacks.ts:1304,1337`                  | `callbacks.rb` around-callback `ensure`        | re-raises after cleanup                     |
| `trailties/src/rack/logger.ts:65`                           | `rails/rack/logger.rb` `ensure`                | re-raises after finishing                   |
| `action-dispatch/middleware/cookies.ts:593`                 | `cookies.rb` verifier rescue                   | narrow `instanceof`, re-raises the rest     |

`reloader.ts`, `actionable-exceptions.ts`, `request-id.ts`, `flash.ts` and
`abstract-controller/callbacks.ts` have no `catch`. Five rows can lose a throw
(`show-exceptions`, `debug-exceptions`, `executor`, `metal/rescue`,
`rescuable`); the other four (`callbacks` middleware, activesupport
`callbacks`, `logger`, `cookies`) already re-throw what they do not recognise
and only need confirming that their cleanup runs, as Ruby's `ensure` would.

This is an existing actionpack gap that warden is the first to hit, which is
why it is filed here with an `actionpack` package tag.

## Acceptance criteria

- `show-exceptions.ts`, `debug-exceptions.ts`, `executor.ts` (its report arm:
  Ruby's `rescue => error` does not see a throw, so nothing is reported) and
  `metal/rescue.ts` / `rescuable.ts` re-throw when `throwDataP(e)`, before any
  rendering, reporting or handler lookup; `instrumentation.ts` is the shape.
- The other four rows are confirmed to re-throw unchanged, and the PR states
  that a fresh `grep -n "catch ("` over the files in the table and the
  middleware directory finds no site outside it (or adds the new one).
- A `.trails.test.ts` in actionpack: an action that calls
  `kernelThrow("warden", { … })` inside a stack wrapped in
  `kernelCatch("warden", …)` reaches the catch with the value, with
  `ShowExceptions` and `DebugExceptions` in the stack, and `ensure` bodies
  (`Executor`'s completion) still run.
- The call gates are unchanged or shrink.
