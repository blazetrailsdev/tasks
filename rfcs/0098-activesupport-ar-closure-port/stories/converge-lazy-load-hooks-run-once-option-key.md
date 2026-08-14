---
title: "Rename LazyLoadHooks' `once` option key to Rails' `run_once`"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6531
claim: "2026-08-14T17:15:04Z"
assignee: "call-args-tool-dispatched-identifier-in-argument-position"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `with_execution_control` / `execute_hook` in #6526.

`packages/activesupport/src/lazy-load-hooks.ts` spells Rails' `:run_once` option
key as `once`. Rails
(`vendor/rails/activesupport/lib/active_support/lazy_load_hooks.rb:59` for the
`on_load(name, options = {}, &block)` signature and `:92`, where `execute_hook`
reads `options[:run_once]`) uses `run_once`, so the trails key is a rename with
no language justification — `runOnce` is a legal TS property name.

The reason it did not converge in that PR is that the key is load-bearing at
call sites outside activesupport:

- `packages/activerecord/src/trailtie.ts:155,182,193,211,220,264`
- `packages/trailties/src/engine.ts` and the trailties tests

so the flip is a cross-package rename rather than a one-file edit.

## Acceptance criteria

- `HookOptions.once` is renamed to `runOnce`, matching `options[:run_once]`.
- Every call site above passes `{ runOnce: true }`; no `once` spelling remains.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative, `pnpm parity:api:calls:args` clean.
