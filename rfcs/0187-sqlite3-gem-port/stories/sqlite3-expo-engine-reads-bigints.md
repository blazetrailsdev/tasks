---
title: "sqlite3: the expo-sqlite engine honors setReadBigInts"
status: in-progress
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: ["sqlite3"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10613
claim: "2026-11-23T00:24:08Z"
assignee: "sqlite3-expo-engine-reads-bigints"
blocked-by: null
closed-reason: null
---

## Context

RFC 0187 Q3 (resolved 2026-11-21): the read-bigints flag is engine-private state the adapter
toggles through one receipted method (`Statement#setReadBigInts`,
`packages/sqlite3/lib/statement.ts`). The expo-sqlite engine's toggle is a no-op
(`packages/sqlite3/lib/engine/expo-sqlite.ts:151`, `setReadBigInts: () => {}`), so on expo an
INTEGER column past 2^53 reads as a lossy JS number, where the gem answers an exact Ruby Integer
(`vendor/sqlite3/v2.6.0/ext/sqlite3/statement.c`, `sqlite3_column_int64` → `LL2NUM`).

## Acceptance criteria

- The expo engine holds the flag and, when set, answers an INTEGER column as a `bigint`
  (or, if expo-sqlite cannot read int64 exactly, the story is blocked on upstream with the
  expo API cited).
- A test on the expo engine reads a value above `Number.MAX_SAFE_INTEGER` exactly with the flag on.
