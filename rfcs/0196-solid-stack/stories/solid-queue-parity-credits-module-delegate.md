---
title: "parity:api credits solid_queue.rb's delegated on_start / on_stop / on_exit"
status: draft
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# parity:api credits `delegate.call(SolidQueue, "onStart", "onStop", "onExit", { to: "Supervisor" })` as solid_queue.rb's on_start / on_stop / on_exit

## Context

`vendor/solid_queue/v1.7.2/lib/solid_queue.rb:57` is `delegate :on_start, :on_stop, :on_exit, to: Supervisor` inside `module SolidQueue`, which `extend self`s (`solid_queue.rb:24`), so the three are SolidQueue singleton methods. `packages/solid-queue/lib/solid-queue.ts` ports it as the one call `delegate.call(SolidQueue, "onStart", "onStop", "onExit", { to: "Supervisor" })` at the Rails position (story `solid-queue-on-start-stop-via-delegate`, trails#9918), and it works at run time (`test/integration/lifecycle-hooks.test.ts`).

`pnpm parity:api --package solid-queue` still lists `on_start`, `on_stop` and `on_exit` as missing on `solid_queue.rb`. `readPrototypeDelegateCall` (`scripts/api-compare/extract-ts-api.ts`, the `delegate.call(PlainModule, …)` arm) records a plain-object receiver's delegated names as instance readers (`instanceReader: true`), while the Ruby side records `extend self` module members, so the pair never matches. `fork_boot_timeout` / `fork_boot_timeout=` on the same file are owned by `solid-queue-fork-mode-unported-register`; `deprecator` by `solid-queue-configuration-checks-and-cli-v1-7-2`.

## Acceptance criteria

- The extractor credits a `delegate.call(<plain-object module>, …)` at file top level as members of that module in the same kind the Ruby extractor gives an `extend self` module's `delegate`, with a fixture in the extractor tests.
- `solid_queue.rb`'s `on_start`, `on_stop`, `on_exit` read as matched; no TS source changes.
