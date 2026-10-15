---
title: "trails-tsc: a synthesized attribute writer is typed unknown"
status: ready
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A column `trails-tsc` synthesizes is emitted as an accessor pair on a merged
interface (`synthesizeDeclares`' `emit`,
`packages/activerecord-cli/src/type-virtualization/synthesize.ts`):

```ts
get archived(): boolean;
set archived(value: unknown);
```

`attributeLine` sets only `readerType`, so the writer falls back to
`l.attribute.writerType ?? "unknown"`. Only singular associations pass a
`writerType`. The result: `repo.archived = "yes"` and
`story.priority = { any: "thing" }` compile under `trails-tsc`, where the
hand-written `declare archived: boolean` they replace rejected both. Measured
on trailmap: deleting its 69 schema-covered declares silently drops assignment
checking on every one of those columns.

`unknown` is not arbitrary — a writer casts, so `record.count = "3"` is legal
at runtime — but "anything at all" is wider than what the type's cast accepts,
and it is a regression against the declare the tool tells users to delete.

## Acceptance criteria

- A synthesized attribute writer accepts the reader type plus the inputs that
  attribute type's cast documents (for example `number | string` for an
  integer, `boolean | string | number` for a boolean), and `null` when the
  column is nullable. The widening per Rails type lives beside
  `ATTRIBUTE_TYPE_MAP` in `type-registry.ts`, one entry per type, with a
  type the registry does not know staying `unknown`.
- An enum-narrowed attribute's writer accepts its labels and mapped values.
- `virtualize.trails.test.ts` covers a typed writer, a nullable one and an
  enum one; `packages/activerecord/virtualized-dx-tests` gains an assignment
  that must fail to compile.
