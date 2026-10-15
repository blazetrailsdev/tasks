---
title: "trails-tsc: synthesize the member an aliasAttribute call defines"
status: done
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: trails#8954
claim: "2026-10-15T20:59:39Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

`this.aliasAttribute("prNumber", "pr_number")` works at runtime
(`packages/activerecord/src/attribute-methods.ts`, `aliasAttribute`) and the
alias is honoured by readers, writers, `new`/`create`/`update`, hash `where`,
hash `order`, `pluck`, `pick`, `select`, `findBy`, `insertAll`/`upsertAll`
(keys, `updateOnly` and `uniqueBy`) and `updateAll` — verified by a runtime
probe against the vendored build at trails `58e3c64148`.

The virtualizer does not know the call exists: `readThisCall`
(`packages/activerecord-cli/src/type-virtualization/walker.ts`) handles
`attribute`, the four associations, `scope` and `enum`, and returns `null` for
everything else. So `record.prNumber` is TS2339 under `trails-tsc` unless the
alias is ALSO hand-declared, which is the hand-written `declare` the tool
exists to remove.

This is the Rails-faithful, per-attribute way to give a column a different
name in the host language, and it is worth typing on its own merits whatever
is decided about a model-wide attribute-name transform.

## Acceptance criteria

- `this.aliasAttribute("<new>", "<old>")` with two string literals in a static
  block synthesizes `<new>` with the reader and writer type of `<old>`, where
  `<old>` is a schema column, a `this.attribute(...)` call, or a hand-declared
  member. An enum-narrowed attribute keeps its narrowed type under the alias.
- An alias whose target is none of those synthesizes nothing (the runtime
  raises for it once the schema loads; the type must not promise more).
- An existing member named `<new>` wins, as for every other synthesized line.
- Tests in `virtualize.trails.test.ts` for each case.
