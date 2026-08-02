---
title: "Narrow the stubbed-DDL recorder's getter fallback so it cannot swallow real errors"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5850
claim: "2026-08-02T01:36:52Z"
assignee: "guard-recorder-getter-fallback-swallows-real-errors"
blocked-by: null
closed-reason: null
---

## Context

PR #5849 made the stubbed-DDL guard's recorder evaluate getters with the
recording view as receiver, so the `schemaCreation` renderer is built off the
proxy and its reads are pinned. Getters backed by a private field brand-check
their receiver and throw on a proxy, so the recorder falls back:

```ts
// packages/activerecord/src/support/stubbed-ddl-methods.test.ts
try {
  value = Reflect.get(target, prop, self);
} catch {
  value = Reflect.get(target, prop, target);
}
```

The bare `catch` cannot tell a private-field brand-check `TypeError` from a
genuine error thrown by a getter body. A getter that starts throwing for a real
reason is silently re-evaluated on the real adapter, and the trace goes quietly
shallower for that member instead of failing — the exact drift mode the guard's
staleness rule exists to prevent.

## Acceptance criteria

- Narrow the fallback so only the private-field brand-check path takes it
  (e.g. match the `TypeError` shape, or pre-compute the set of brand-checked
  getters once and route those directly), and let any other throw propagate.
- The renderer-boundary floor assertions still pass on the sqlite lane.
