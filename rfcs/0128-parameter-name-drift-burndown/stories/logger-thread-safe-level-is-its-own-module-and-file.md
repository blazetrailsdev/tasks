---
title: "logger-thread-safe-level-is-its-own-module-and-file"
status: draft
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails puts the thread-local log-level machinery in its own module and file,
`ActiveSupport::LoggerThreadSafeLevel`
(`vendor/rails/activesupport/lib/active_support/logger_thread_safe_level.rb`),
which `ActiveSupport::Logger` gets by `include LoggerThreadSafeLevel`
(`activesupport/lib/active_support/logger.rb:11`):

- `logger_thread_safe_level.rb:11` — `local_level=` (the three non-raising arms
  plus the two raises)
- `logger_thread_safe_level.rb:26` — `local_level`
- `logger_thread_safe_level.rb:30` — `level` (`local_level || super`)
- `logger_thread_safe_level.rb:35` — `log_at(level)` — swaps the level for the
  block
- `logger_thread_safe_level.rb:38` — `local_level_key`

trails has all five, correct in behaviour and already citing those line numbers,
but declared inline in the `Logger` class body:
`packages/activesupport/src/logger.ts:147-217` (`level`, `localLevelKey`,
`localLevel` getter/setter) and `:294` (`logAt`). So `parity:api` sees no
`logger_thread_safe_level.ts` at all and scores those members against
`logger.rb`.

Surfaced by
`actioncontroller-log-at-is-the-class-macro-not-the-logger-helper` (PR #7278),
whose converged shape named this file as the helper's Rails home; the
ActionController half landed there and this half was left because it is an
activesupport class-layout change, not a parameter-name one.

## Converged shape

`packages/activesupport/src/logger-thread-safe-level.ts` holds the five members
as a module mixed into `Logger` the way CLAUDE.md's "Module mixins" section
prescribes, keeping the Rails names and `logger.ts`'s existing citations. The
one real obstacle is `level`, which is `local_level || super` — the mixin has to
reach the `Logger`/`::Logger` implementation below it, so settle that against
`include()` / `Included<>` (`activesupport/src/include.ts`) rather than
inlining a copy.

## Acceptance criteria

- `logger-thread-safe-level.ts` exists and holds `level`, `localLevel`,
  `localLevel=`, `logAt` and `localLevelKey`; `logger.ts` declares none of them
  and reaches them by inclusion, as `logger.rb:11` does.
- `pnpm parity:api --package activesupport` gains the file and does not lose
  methods, arity or params (activesupport is at 0 param rows and must stay
  there).
- `pnpm parity:api:extra --package activesupport` gains no novel name.
- No test renamed; `logger.test.ts` and `silence-logger.test.ts` pass unchanged.
