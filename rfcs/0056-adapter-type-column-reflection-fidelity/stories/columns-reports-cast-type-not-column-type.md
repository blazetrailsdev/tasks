---
title: "columns() reports the decorated cast-type class name, not the column's own type"
status: ready
updated: 2026-07-22
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reviewing #5033 (`serialize-encrypts-decorator-ordering`).

`columns()` in `packages/activerecord/src/reflection.ts:2389` builds its
`ColumnReflection` list from the _attribute definition cast type_:

```ts
Array.from(modelClass._attributeDefinitions.entries()).map(
  ([name, def]) => new ColumnReflection(name, def.type.constructor.name, def.defaultValue),
);
```

Rails' `columns` is simply the database column objects
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:432-434`):

```ruby
def columns
  @columns ||= columns_hash.values.freeze
end
```

Rails columns therefore carry `sql_type` / `type` sourced from the schema and
never reflect attribute-level decoration. trails reports a cast-type _class
name_ instead, so for a decorated column (`serialize`, `encrypts`,
`normalizes`, enum) `columns()` reports the decorated wrapper class rather than
the column's own type.

This is pre-existing and was NOT introduced or changed by #5033 — that PR left
the `def.type` assignment byte-identical and only changed what
`_defaultAttributes` _seeds_ from. It is filed here because the review of #5033
established the divergence concretely.

Note `def.type` remains legitimately decorated for other readers — notably the
encryption idempotence guard at
`packages/activerecord/src/encryption/encryptable-record.ts:311`, which is
load-bearing (see #5033 PR body). So the fix is to change what `columns()`
reads, NOT to undecorate `def.type`.

## Acceptance criteria

- `columns()` sources from `columnsHash` (the reflected column objects), mirroring
  `model_schema.rb:432-434`, rather than from `_attributeDefinitions[].type`.
- A decorated column (`serialize` + `encrypts`, e.g.
  `EncryptedBookWithSerializedFirstBinary#logo`) reports the column's own type,
  not the decorated wrapper class name.
- `def.type` is left decorated; the encryption idempotence guard at
  `encryptable-record.ts:311` keeps working (no unbounded PendingDecorator growth).
- Existing `columns()` / `contentColumns()` callers (10 import sites) audited for
  the shape change.
- Passes on sqlite + CI PG/MySQL(MariaDB).
