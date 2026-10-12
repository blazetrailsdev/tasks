---
title: "trails-tsc: serialized columns and default-typed named primary keys get the wrong type"
status: draft
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two column shapes whose type `trails-tsc` gets wrong from the schema alone,
both measured on trailmap:

1. **A serialized column is typed as its storage column.** `Rfc` declares
   `this.serialize(column, { coder: JsonArray })` for three `text` columns.
   The schema says `text`, so the virtualizer emits `string | null`; the
   attribute actually reads as whatever the coder loads (`string[]`).
   `readThisCall` (`src/type-virtualization/walker.ts`) does not look at
   `serialize` at all. Rails: `serialize` replaces the attribute's type with a
   `Type::Serialized` wrapping the coder
   (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/serialization.rb`),
   so the column's SQL type no longer describes what the reader returns.
2. **A named primary key with the default type is `unknown`.**
   `schema-ts-parser.ts` records a default-typed primary key as `bigint`, which
   `ATTRIBUTE_TYPE_MAP` (`src/type-virtualization/type-registry.ts`) does not
   map (it has `big_integer`), so `tsTypeFor` answers `unknown`. For `id` this
   never shows, because the virtualizer skips `id` and `Base` declares it.
   Since trails#8825 a `{ primaryKey: "code" }` table surfaces `code`, typed
   `unknown`.

## Acceptance criteria

- A column named in a static-block `this.serialize("<col>", …)` call is not
  given its schema type: it is typed `unknown`, so a wrong `string | null` is
  never asserted, and a hand-written `declare` remains the way to say what the
  coder returns. (Inferring the coder's return type is out of scope.)
- A primary key column the parser records with the default type is typed
  `PrimaryKeyValue`, as foreign key columns already are.
- Tests in `virtualize.trails.test.ts` for both.
