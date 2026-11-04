---
title: "ruby-compat-last-status-per-async-context"
status: done
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9694
claim: "2026-11-04T00:08:40Z"
assignee: "ruby-compat-last-status-per-async-context"
blocked-by: null
closed-reason: null
---

## Context

`Process.last_status` is per thread in Ruby (`vendor/ruby/v3.3.11/process.c:681-685`), and the JSDoc on `Process.lastStatus` in `packages/ruby-compat/src/process.ts:228-240` says trails keeps it per async context, but `rbLastStatusSet` writes one module-global `let lastStatus` (`:358-368`). `Previewer#capture` (`packages/activestorage/src/previewer.ts`) reads it after `await IO.popen`, so a second popen finishing in the same microtask window can overwrite it. `AsyncContext` offers only `run`, with no `enterWith`.

## Acceptance criteria

- Two concurrent `IO.popen` calls each read their own `$?`, with a test.
- The `Process.lastStatus` JSDoc and the code agree.
