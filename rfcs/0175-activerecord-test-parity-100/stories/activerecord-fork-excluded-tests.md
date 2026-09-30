---
title: "activerecord: the 15 fork()-based tests (blocked: Node has no process fork)"
status: blocked
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Runtime shortcoming, not ratified in CLAUDE.md: Node has no fork() that copies the parent heap (child_process.fork starts a fresh process), so per-pid state after a fork cannot be reproduced. Needs a CLAUDE.md ratification decision or a fork-emulation design."
closed-reason: null
---

## Context

These Rails tests `fork` the Ruby process and assert per-pid state (statement caches, pool reaping,
connection handlers across a fork):

- `reload_models_test.rb` — (whole file)
  reason: Tests class reloading via ActiveSupport::Dependencies / Zeitwerk in a forked process. No Node.js equivalent; ES modules are cached for the process lifetime.
- `query_cache_test.rb` — "query cache with forked processes"; "query cache across threads"; "query caching is local to the current thread"; "query cache is enabled in threads with shared connection"; "query cache is cleared for all thread when a connection is shared"; "threads use the same connection"
  reason: GVL / Ruby Thread + fork() semantics — per-thread / cross-process query-cache visibility cannot translate to single-threaded Node.js.
- `reaper_test.rb` — "connection pool starts reaper in fork"
  reason: GVL / Ruby fork() semantics — process forking has no Node.js equivalent.
- `connection_adapters/connection_handler_test.rb` — "connection pool per pid"; "forked child doesnt mangle parent connection"; "forked child recovers from disconnected parent"; "retrieve connection pool copies schema cache from ancestor pool"; "pool from any process for uses most recent spec"
  reason: Ruby fork() + Marshal — process forking and binary serialization have no Node.js equivalent.
- `adapters/sqlite3/statement_pool_test.rb` — "cache is per pid"
  reason: Forks a child process and asserts the statement cache is keyed per pid (statement_pool_test.rb:6-18, guarded by Process.respond_to?(:fork)). Process forking has no Node.js equivalent.
- `adapters/postgresql/statement_pool_test.rb` — "cache is per pid"
  reason: Forks a child process and asserts the statement cache is keyed per pid (statement_pool_test.rb:27-40, guarded by Process.respond_to?(:fork)). Process forking has no Node.js equivalent.

Node's `child_process.fork` starts a fresh process running a module; it does not copy the parent's heap,
so "the child sees the parent's pool, then discards it" cannot be expressed. The Rails behaviour under
test (`ActiveSupport::ForkTracker` hooks discarding pools) is still portable and testable by invoking the
fork hooks directly.

## Acceptance criteria

- [ ] The fork-tracker hooks (`ActiveSupport::ForkTracker.after_fork`, `discard_pools!`) are exercised by trails-sibling tests, and each Rails case stays excluded with this story named as its blocker.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
