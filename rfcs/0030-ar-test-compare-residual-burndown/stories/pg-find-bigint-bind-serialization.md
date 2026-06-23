---
title: "PG bigserial: find(BigInt) bind serialization throws under flip"
status: draft
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while validating `pg-bigserial-assertion-sweep-tail` (#4029) under a
locally-applied bigserial flip (`schema-creation.ts` `typeToSql` `primary_key`
→ `"bigserial primary key"`). With the flip, default-PK `id` deserializes
int8 → JS `BigInt`. The assertion-sweep PRs converged the _test_ assertions,
but `persistence.test.ts > destroy` fails with a real **implementation** error,
not an assertion mismatch:

```text
PersistenceTest > destroy
  → Do not know how to serialize a BigInt
```

Repro: `packages/activerecord/src/persistence.test.ts:1608` —
`Topic.find((topic as any).id)` where `topic.id` is `1n`. The `find(BigInt)`
path JSON-serializes the bind value somewhere (statement-cache key, query log,
or error formatting) and a raw `JSON.stringify(1n)` throws
`TypeError: Do not know how to serialize a BigInt`.

This is a flip-blocker: it breaks on the PG lane the moment
`pg-bigserial-createtable-dumper-flip` (#3966) lands, and is out of scope for
the assertion sweeps (it is not an `expect(...)` value mismatch).

## Acceptance criteria

- [ ] `find(BigInt)` (and any other BigInt-valued bind) no longer throws
      "Do not know how to serialize a BigInt" on the PG lane under bigserial.
- [ ] Locate the `JSON.stringify`-of-bind site and make it BigInt-safe
      (match Rails: PK binds are just integers; a BigInt id must serialize as
      its decimal string for cache keys / logging).
- [ ] `persistence.test.ts > destroy` green under a locally-applied bigserial
      flip; green on all three lanes without it.
- [ ] Do NOT touch the deserializer; fix the serialization/cache-key path only.
