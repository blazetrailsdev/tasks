---
title: "BenchmarkLogger's debug/info/warn/error accept Logger's block form, as fatal does"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby `Logger`'s level methods take a message or a block
(`logger.fatal do ... end`, as `ActionController::Live#log_error` calls it,
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:398-403`).
trails' real `Logger` accepts both (`packages/activesupport/src/logger.ts`,
`fatal(progname?: unknown)`), but the `BenchmarkLogger` interface that types
`ActionController::Base.logger` and `AbstractController::Logger`'s `logger`
(`packages/activesupport/src/benchmarkable.ts`,
`packages/actionpack/src/abstract-controller/logger.ts`) types each level for a
`string` only. trails#8821 widened `fatal` alone, to remove a double cast in
`logError`; `debug`, `info`, `warn` and `error` still reject the block form, so
the next ported body that calls `logger.info { ... }` or `logger.debug { ... }`
through a controller's logger needs a cast.

## Acceptance criteria

- `BenchmarkLogger`'s `debug`, `info`, `warn` and `error` accept
  `string | (() => string)`, matching `fatal`.
- Any call-site cast added only to reach a level's block form through
  `BenchmarkLogger` is removed (`grep -rn "as unknown as { \(debug\|info\|warn\|error\)("`
  under `packages/actionpack/src` and `packages/actionview/src`).
- `pnpm typecheck` is green.
