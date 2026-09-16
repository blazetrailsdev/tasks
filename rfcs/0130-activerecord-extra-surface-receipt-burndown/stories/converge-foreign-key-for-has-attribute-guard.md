---
title: "Converge Association#foreign_key_for? onto a bare _has_attribute? send"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `foreign_key` onto a method in trails#7829.

Rails' `foreign_key_for?`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:370-373`)
is two lines with no guard:

```ruby
def foreign_key_for?(record)
  foreign_key = Array(reflection.foreign_key)
  foreign_key.all? { |key| record._has_attribute?(key) }
end
```

Trails' `Association#isForeignKeyFor`
(`packages/activerecord/src/associations/association.ts`, the `isForeignKeyFor`
method) reads `_hasAttribute` off the record through an `any` cast and wraps the
call in `typeof hasAttr === "function" ? hasAttr.call(record, String(key)) : false`.
Rails has no such guard: a record without `_has_attribute?` raises `NoMethodError`.
The guard also makes the body read as a call to `_hasAttribute` rather than a
direct send, which is the shape the call gate mis-reads (a `typeof x.m ===
"function"` test registers as a call to `m`).

The `options.foreignKey` fallback and the `key == null` guard that used to sit
beside it were already removed in trails#7829.

## Acceptance criteria

- `isForeignKeyFor` calls `record._hasAttribute(key)` directly on every key, with
  no `typeof` guard and no `any` cast, mirroring `association.rb:370-373`.
- `Array(reflection.foreign_key)` uses the ruby-compat `Array()` analogue if one
  exists, else the existing `Array.isArray` ladder.
- `pnpm parity:api:calls` and `:args` gain no rows; the association suite stays
  green.
