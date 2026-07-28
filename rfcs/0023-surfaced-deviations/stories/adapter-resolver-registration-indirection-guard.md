---
title: "Adapter-resolver registration indirection throws a non-Rails Error"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseConfig#validateBang`, `#adapterClass` and `#newConnection`
(`packages/activerecord/src/database-configurations/database-config.ts`) each
guard on a module-level resolver slot and throw a plain
`Error("Adapter class resolver not registered — import ConnectionHandler (or
connection-handling) first")`. This error has no Rails counterpart: it exists
only because `database-config.ts` cannot statically import
`connection-adapters/*` without re-entering `database-configurations.ts`
before `HashConfig` finishes extending `DatabaseConfig`, so
`abstract/connection-handler.ts` registers the resolvers at module scope via
`_setAdapterClassResolver`.

Raised during PR #5515 review. It is NOT reachable from
`establishConnection` — calling that requires importing `ConnectionHandler`,
whose module scope does the registration — so no Rails caller can observe a
non-Rails error class. It IS reachable on a leaf import; verified:

```console
$ node --input-type=module -e '
  const { DatabaseConfig } = await import("./dist/database-configurations/database-config.js");
  new DatabaseConfig("e","primary",{adapter:"sqlite3"}).validateBang()'
THREW: Adapter class resolver not registered — ...
```

The registration indirection is the real deviation; the error is its symptom.

## Acceptance criteria

- [ ] Determine whether the circular-import constraint still holds, or whether
      the cycle can be broken (e.g. moving the registry to a leaf module that
      neither side re-enters).
- [ ] If it can: delete the indirection and the three guards, importing the
      resolver directly as Rails does with `ConnectionAdapters.resolve`.
- [ ] If it cannot: record why at `_setAdapterClassResolver`, and confirm the
      guard cannot fire on any path a Rails caller reaches.
