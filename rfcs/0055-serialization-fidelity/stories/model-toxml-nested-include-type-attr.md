---
title: "model-toxml-nested-include-type-attr"
status: done
updated: 2026-07-07
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 15
pr: 4710
claim: "2026-07-06T23:53:54Z"
assignee: "model-toxml-nested-include-type-attr"
blocked-by: null
closed-reason: null
---

## Context

PR #4574 (story `model-toxml-type-attr-adapter-dependent`) made
`ActiveModel::Model#toXml` derive the XML `type=` attribute from each
top-level attribute's cast type instead of the JS runtime type of the value,
so a bigint `id` serializes as `type="integer"` on every adapter
(SQLite/PG/MariaDB) rather than dropping the type on PG/MariaDB where the id
comes back as a JS BigInt/string.

That fix is **top-level only**. `Model#_hashToXml`
(`packages/activemodel/src/model.ts`) computes the cast-type map once for the
receiver model's own `serializableHash`, and its recursive calls for nested
plain-object hashes (the `typeof value === "object" && !Array.isArray(value)`
branch) and for array `<item>` sub-hashes pass no `typeMap` (default `{}`). So
`toXml({ include: "comments" })` where `comments.id` is a bigint still loses
`type="integer"` on PG/MariaDB one level down — the same adapter-dependent
deviation, just nested.

The nested hashes produced by `serializableHash`'s `include:` path are plain
objects that no longer carry the associated record's model class, so deriving
their cast types requires threading the nested model's type info (its class /
`typeForAttribute`) through serialization rather than only passing a flat hash.

Rails builds a per-record serializer for each included association, each
carrying its own column-type table, which is why nested `type=` attributes are
adapter-stable there.

## Acceptance criteria

- `toXml({ include: ... })` derives the nested `type=` attribute from the
  associated model's cast/column type, so a nested bigint `id` (or other
  numeric column) serializes as `type="integer"` on SQLite/PG/MariaDB alike.
- Array-item sub-hashes (collection includes) likewise carry cast-derived
  `type=` attributes.
- A regression test exercises a nested `include` with a bigint id materialized
  as a string/BigInt (mirroring PG/MariaDB) asserting the full
  `<id type="integer">…</id>` tag.
- No api:compare / test:compare regression.
