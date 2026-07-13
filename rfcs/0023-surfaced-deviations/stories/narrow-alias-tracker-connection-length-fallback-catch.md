---
title: "Narrow JoinDependency alias-length try/catch to no-connection only (Rails raises)"
status: claimed
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-13T18:38:23Z"
assignee: "narrow-alias-tracker-connection-length-fallback-catch"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#_baseTableAliasLength`
(`packages/activerecord/src/associations/join-dependency.ts:203-215`, added in
PR #4819) wraps the connection resolution in a blanket `try/catch` that swallows
**all** errors and falls back to the default alias cap (64):

```ts
private _baseTableAliasLength(): number | undefined {
  try {
    const connection =
      threadedConnectionFor(this._baseModel) ?? (this._baseModel as any).connection;
    return typeof connection?.tableAliasLength === "function"
      ? connection.tableAliasLength()
      : undefined;
  } catch {
    return undefined;
  }
}
```

Rails always builds the tracker inside `pool.with_connection`
(`vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb:24`),
which **raises** if no connection resolves — it never silently falls back to a
default alias length. The catch was added intentionally ("construction never
fails on account of alias sizing") and is consistent with `AliasTracker.create`'s
existing fallback-on-non-function behavior, but it is a genuine deviation: a
real connection error (not just "no connection established") is swallowed and
the join silently caps aliases at 64 instead of the connection's true value.

Codex flagged this on PR #4819 as a non-blocking looser-than-Rails fallback.

## Acceptance criteria

- [ ] Narrow the catch so only the "no connection established" case falls back
      to the default; genuine connection/adapter errors propagate (matching
      Rails' `pool.with_connection` raise semantics).
- [ ] `_baseTableAliasLength` still returns `undefined` (→ default cap) when no
      connection is established, so JoinDependency construction in
      connectionless test contexts keeps working.
- [ ] Test both branches: an established MySQL(-stub) connection threads 256; a
      genuine adapter error surfaces instead of being swallowed.
