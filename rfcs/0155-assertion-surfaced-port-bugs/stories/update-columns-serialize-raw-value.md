---
title: "update_columns serializes the raw value like Rails"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8022
claim: "2026-09-25T16:51:41Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

Rails `Persistence#update_columns` (`vendor/rails/activerecord/lib/active_record/persistence.rb:616-624`)
writes the RAW value into memory (`@attributes.write_cast_value(k, v)`) and hands the raw
value to `_update_record`, whose bind serializes it through the column type.
`packages/activerecord/src/persistence.ts` `updateColumns` (after trails#7850) writes the raw value
into memory but still serializes `attrType.cast(value)` for the database, because serializing
the raw value exposed two gaps:

- `ActiveModel::Type::Integer#serialize` returns `nil` for a non-numeric string
  (`vendor/rails/activemodel/lib/active_model/type/integer.rb`, `serialize` guard on
  `non_numeric_string?`); trails' SQLite integer type raises `RangeError: not a number is out of range`.
- Serializing a raw `Temporal.Instant` through the time type throws (`time.isUtc is not a function`).

## Acceptance criteria

- `updateColumns` serializes the raw value (`SerializeCastValue.serialize(type, value)`), matching Rails.
- Integer `serialize` returns `null` for non-numeric strings instead of raising; the time type
  serializes the values `update_column` accepts.
- `persistence.test.ts` and `autosave-association.test.ts` stay green.
