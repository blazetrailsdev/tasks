---
title: "autoloadGet waits for an in-flight require"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/zeitwerk/src/core-ext/kernel.ts` `autoloadGet` skips `require` once `cref.set` has cleared the autoload, but `onFileAutoloaded` and `onDirAutoloaded` are still inside `constAdded` / `onNamespaceLoaded`. Ruby blocks that thread until the require ends (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:23-41`, `loader/callbacks.rb:53-68`). So `Promise.all([loadFile("m/a.ts"), loadFile("m/x.ts")])` with an explicit `m.ts` can raise `NameError`. Also a waiter in `require` re-raises the first caller's error, where Ruby's second thread retries.

## Acceptance criteria

- `autoloadGet` waits for an in-flight `require` of the constant even after `cref.set`.
- A waiter retries after a failed load, as Ruby's second thread does.
- Tests pin both with a concurrent `loadFile` on an explicit namespace.
