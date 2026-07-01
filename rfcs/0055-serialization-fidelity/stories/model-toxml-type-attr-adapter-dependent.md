---
title: "Model#toXml type= attribute is JS-runtime-typed, not column-typed (PG/MariaDB BigInt ids drop type=integer)"
status: ready
updated: 2026-06-30
rfc: "0055-serialization-fidelity"
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

`ActiveModel::Model#toXml` / `_hashToXml`
(`packages/activemodel/src/model.ts`) infers the XML `type=` attribute from the
**JS runtime type** of each serialized value (`typeof value === "number"` →
`type="integer"`, `typeof value === "boolean"` → `type="boolean"`, etc.), not
from the column's declared cast type.

This diverges from Rails `ActiveModel::Serializers::Xml`, which derives the
`type=` attribute from the attribute's column/cast type via
`ActiveSupport::XmlMini::TYPE_NAMES` and the serializable hash's type info, so an
integer column always serializes as `type="integer"` regardless of how the
adapter materializes the value.

Surfaced by `array-to-xml-collection-serializer` (PR #4304): on PostgreSQL and
MariaDB, `id` (a bigint) comes back as a JS `BigInt`/`string` rather than a
`number`, so `_hashToXml` skips the integer branch and emits a bare
`<id>1</id>` instead of `<id type="integer">1</id>`. The same value serializes
_with_ the type attribute on SQLite (JS `number`). The PR's collection-serializer
tests had to match the id tag adapter-agnostically
(`packages/activerecord/src/relation/delegation.test.ts`,
`packages/activerecord/src/relations.test.ts`) to stay green across adapters,
masking the underlying deviation.

## Acceptance criteria

- `Model#toXml` derives the `type=` attribute from the attribute's cast/column
  type (mirroring Rails `XmlMini` type-name mapping), not from the JS runtime
  type of the value, so an integer column serializes as `type="integer"` on
  every adapter (SQLite/PG/MariaDB) including BigInt/string-materialized ids.
- Booleans, decimals, dates/times, and binaries map to the Rails `XmlMini`
  type names consistently regardless of JS runtime representation.
- The collection-serializer tests can assert the full `<id type="integer">…`
  tag without an adapter-agnostic regex workaround.
- No api:compare / test:compare regression.
