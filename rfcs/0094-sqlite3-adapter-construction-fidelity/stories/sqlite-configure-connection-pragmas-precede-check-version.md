---
title: "SQLite configure_connection runs pragmas before check_version on the sync-driver path"
status: draft
updated: 2026-08-08
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#configure_connection` (`sqlite3_adapter.rb:820-841`)
runs, in order: the timeout/retries config checks, then `super` — i.e.
`check_version` (`abstract_adapter.rb:1212-1214`) — and only then the pragmas
(`:837-841`). `check_version` raises synchronously and reaches the caller.

trails cannot hold both halves of that at once, because #6226 (RFC 0072
`make-version-gated-predicates-async`) made `checkVersion` async so
`database_version` can fetch on demand:

- the async-driver branch awaits `super` before the pragmas, matching Rails;
- the **sync-driver branch runs the pragmas first and returns the check's
  promise afterwards**. Awaiting first would defer pragma application past the
  constructor's fire-and-forget call site
  (`sqlite3-adapter.ts`, `if (!this._asyncConnectPending) void this.configureConnection();`),
  which regressed "applies a valid numeric pragma on construction" and
  "converts boolean false to 0 for pragma" in
  `adapters/sqlite3/sqlite3-adapter.trails.test.ts`.

Second, related half: that constructor call site `void`s the returned promise,
so a too-old-SQLite rejection there becomes an unhandled rejection rather than
an error out of the constructor, where Rails raises. The pool path
(`attemptConfigureConnection`) does propagate correctly — verified in #6226 —
so only the constructor path is affected.

## Converged shape

`configure_connection` runs `check_version` before the pragmas on every driver
path, and a too-old version reaches the caller on the constructor path too.
Likely requires the constructor to stop configuring via fire-and-forget — e.g.
routing sync-driver setup through the same explicit connect/verify path the
async drivers use — so the version check has somewhere to propagate to.

## Acceptance criteria

- [ ] The sync-driver branch runs `check_version` before the pragmas, matching
      `sqlite3_adapter.rb:835-838`.
- [ ] A too-old SQLite surfaces as a thrown error on the constructor path, not
      an unhandled rejection.
- [ ] The construction-time pragma tests in
      `adapters/sqlite3/sqlite3-adapter.trails.test.ts` still pass (they pin
      real behavior: an adapter handed out with `foreign_keys` off is a bug).
- [ ] The call-site comment explaining the ordering deviation is removed with it.
