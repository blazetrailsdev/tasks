---
title: "Converge Type::Date#type_cast_for_schema to the Rails one-liner"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6799
claim: "2026-08-21T00:17:06Z"
assignee: "converge-date-type-cast-for-schema-to-rails"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Date#type_cast_for_schema`
(`vendor/rails/activemodel/lib/active_model/type/date.rb:34-36`) is:

```ruby
def type_cast_for_schema(value)
  value.to_fs(:db).inspect
end
```

It takes the value it is given — the schema dumper passes an already-cast
default — and never re-casts. trails' port
(`packages/activemodel/src/type/date.ts:40-44`) instead opens with
`const cast = this.cast(value);` and adds a `null` / `DateInfinity` /
`DateNegativeInfinity` arm returning the string `"null"`, neither of which
Rails has. The infinity arm is also Rails-wrong: the PG infinity spellings
belong to `PostgreSQL::OID::Date#type_cast_for_schema`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/date.rb`),
which answers `"::Float::INFINITY"` / `"-::Float::INFINITY"` — the shape the
`DateTime` sibling already has at
`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts:82-86`.

Surfaced while porting `Helpers::TimeValue#type_cast_for_schema` (PR #6797),
which mirrors the same one-line body without a re-cast.

## Acceptance criteria

- [ ] `DateType.typeCastForSchema` is `value.to_fs(:db).inspect` — no
      `this.cast()`, no `"null"` arm — mirroring date.rb:34-36.
- [ ] The infinity spellings live on the PG OID `Date` subclass, mirroring
      `postgresql/oid/date.rb`, as the `DateTime` sibling already does.
- [ ] `pnpm parity:api` delta non-negative; `parity:api:extra` does not grow.
