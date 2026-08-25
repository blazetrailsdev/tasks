---
title: "converge-reloader-onto-execution-wrapper"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6532
claim: "2026-08-14T17:22:10Z"
assignee: "converge-isolated-execution-state-delete-returns-value"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Reloader` is `class Reloader < ExecutionWrapper`
(`vendor/rails/activesupport/lib/active_support/reloader.rb:8`), but
`packages/activesupport/src/reloader.ts` declares a bare `class Reloader` that
ports only the `:prepare` chain (`toPrepare`, `prepareBang`). Its file comment
said the superclass was unported; that is no longer true — PR #6529 ported
`ActiveSupport::ExecutionWrapper` to
`packages/activesupport/src/execution-wrapper.ts` (15/16 on
`pnpm parity:api --package activesupport --missing`) and
`ActiveSupport::Executor` to `packages/activesupport/src/executor.ts`.

`pnpm parity:api --package activesupport --missing` reports `reloader.rb` well
short of complete: `check!`, `reload!`, `wrap`, `run!`, `complete!`,
`toRunLoad`/`toCompleteUnload` and the `:class_unload` callbacks are all
missing, and the inheritance edge to `ExecutionWrapper` is absent.

## Acceptance criteria

1. `Reloader` extends `ExecutionWrapper` (`reloader.rb:8`), inheriting `wrap`,
   `run!`, `complete!` and the `:run` / `:complete` chains rather than
   re-declaring any of them.
2. The `:class_unload` callbacks and `check!` / `reload!` / `executor` are
   ported, or the ones left out are named with the Rails `file:line` and the
   specific blocker (`Dependencies::Interlock` is not ported).
3. `pnpm parity:api --package activesupport --missing` shows `reloader.rb`
   improved, with the inheritance edge matched.
4. `reloader.test.ts` / `reloader.trails.test.ts` stay green; enroll whatever
   of `reloader_test.rb` the newly-ported members cover.
5. The `converge-reloader-onto-execution-wrapper` reference in
   `packages/activesupport/src/reloader.ts`'s file comment is removed.
