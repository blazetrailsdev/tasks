---
title: "Composite-PK key columns dropped under partial_inserts=true"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3783
claim: "2026-06-21T12:22:42Z"
assignee: "partial-inserts-composite-pk-key-retention"
blocked-by: null
---

## Context

Surfaced auditing the AR-test partial_inserts ambient (RFC 0023
ar-test-suite-partial-inserts-ambient-divergence). When the suite runs with
Rails' test ambient `partial_inserts = true`, a composite-PK model whose key
columns are user-assigned (not auto-increment) drops those columns from the
INSERT, so the row is written with a missing key and find/destroy by that key
fails (`RecordNotFound`).

Root cause: `callbacks.ts` (~265-271) builds the reinstate skip-set from ALL
primary-key columns:

```ts
const _pk = ctor.primaryKey;
const _pkSet = new Set(Array.isArray(_pk) ? _pk : [_pk]);
this._dirty.reinstateNewRecordChanges(this._attributes, ...snapshot, _pkSet);
```

So `reinstateNewRecordChanges` never marks the user-assigned composite-PK
columns dirty, and `attributesForCreate` (partialInserts branch, using
`changedAttributeNamesToSave`) omits them. Verified fix: only skip a PK column
whose in-memory value is null (the auto-populated key, written post-insert):

```ts
const _pkSet = new Set(
  (Array.isArray(_pk) ? _pk : [_pk]).filter((n) => this._readAttribute?.(n) == null),
);
```

Tests that fail under the Rails ambient (pass once fixed), all in
`packages/activerecord/src/persistence.test.ts`:

- "delete accepts an array of composite-PK tuples"
- "update on composite PK treats a tuple as a single id"
- "destroy on composite PK treats a tuple as a single id"

This is currently masked because the harness runs `partial_inserts = false`
(load_defaults 7.0); the fix is a prerequisite for flipping the ambient to
match Rails' test suite.

## Acceptance criteria

- [ ] `reinstateNewRecordChanges` retains user-assigned (non-null) composite-PK
      columns in the dirty set so partial inserts write them.
- [ ] The three persistence.test.ts composite-PK tests pass with
      `partial_inserts = true`.
- [ ] No regression with `partial_inserts = false` (single auto-increment PK).
