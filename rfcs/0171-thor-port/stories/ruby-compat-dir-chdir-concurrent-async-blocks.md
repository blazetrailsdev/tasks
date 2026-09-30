---
title: "ruby-compat: Dir.chdir raises on interleaved async chdir blocks (chdir_thread)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: []
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

## Context

Ruby's `chdir_path` (`vendor/ruby/v3.3.11/dir.c:1080-1107`) tracks the open `Dir.chdir` blocks in
`chdir_blocking` / `chdir_thread` (`dir.c:1044-1076`). A block chdir from another thread while one is
open raises `RuntimeError` "conflicting chdir during another chdir block". A nested chdir on the
same thread is legal, and `chdir_restore` pops the directories in LIFO order.

trails' `Dir.chdir` (`packages/ruby-compat/src/dir.ts`, trails#8297) ports the counter and the
warning arm. It drops the thread check, because JS has one thread. An async block, however, can
interleave with another async block started from the same context. Two overlapping
`Dir.chdir(a, async () => …)` blocks then restore out of order, and the second block's `oldPath`
is the first block's directory. That is the concurrent case Ruby rejects between threads.

## Acceptance criteria

- [ ] An async `Dir.chdir` block that starts while another block's promise is still pending, from
      a sibling context rather than inside that block, raises `RuntimeError` "conflicting chdir
      during another chdir block", as `dir.c:1083-1084` does for another thread.
      Tell nesting apart from interleaving with the same `IsolatedExecutionState` /
      `withExecutionContext` ownership that ruby-compat's `synchronize` uses (`monitor.ts`).
- [ ] A truly nested block keeps working, and restore stays LIFO.
- [ ] A `.trails.test.ts` case covers two overlapping async blocks.
