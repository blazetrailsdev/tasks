---
title: "Support async-only SQLite drivers in synchronous adapter getters (encoding, etc.)"
status: in-progress
updated: 2026-06-14
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3286
claim: "2026-06-14T19:45:11Z"
assignee: "async-only-sqlite-sync-getters"
blocked-by: null
---

## Context

Surfaced while implementing `async-sqlite-pool-sync-checkout` (PR #3261). That
story made the **async** query/DDL entry points transparently complete a
deferred async-only open via `ensureConnected()`. But `AbstractSQLite3Adapter`
still has a few **synchronous** members that touch `this.driver` directly and
cannot `await`:

- `get encoding()` (`sqlite3-adapter.ts` ~line 1061) — calls
  `this.driver.pragma("encoding")` synchronously and indexes `[0]`. For an
  async-only driver this returns a `Promise`, not an array, so the getter is
  broken regardless of connection state.
- Other sync members reading the handle: `get active()`, `get raw()`, and the
  sync `isOpen()` checks. `active`/`raw` already null-guard with `?.` so they
  degrade gracefully, but `encoding` does not.

This was deliberately left out of #3261 (scope was the pool-checkout → first
_query_ path; a sync getter on an async driver is a separate, pre-existing
limitation).

## Acceptance criteria

- Decide the contract for sync getters under an async-only, not-yet-open
  driver: either (a) provide an async counterpart (`encodingAsync()` / cache the
  encoding at connect time so the sync getter reads a memoized value), or
  (b) document + throw a clear error rather than returning a `Promise` cast as
  an array.
- `encoding` returns a correct value for async-only drivers (likely via a value
  memoized during `configureConnection()`/`completeAsyncConnect()`, mirroring
  how `_databaseVersion` is pre-warmed in `connect`/`connectAsync`).
- Test coverage for `encoding` (and any other affected sync getter) against the
  async-only stub driver used in `sqlite-adapter.test.ts`.
- Check Rails parity: Rails' `SQLite3Adapter#encoding` reads
  `@raw_connection.encoding` synchronously; document how the async-only port
  reconciles with that.
