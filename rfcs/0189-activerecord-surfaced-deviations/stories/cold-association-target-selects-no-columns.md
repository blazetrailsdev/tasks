---
title: "A has_many read on a never-reflected target selects no columns (SELECT FROM)"
status: draft
updated: 2026-11-09
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in trailmap (#131). trailmap still has to warm every model with
`loadSchema()` at boot (`lib/model-schemas.ts` `loadModelSchemas`), even though
`enum-raises-undeclared-type-on-an-unreflected-cold-model` is done. Without the
warm-up, trailmap's `test/models/schema-loading.test.ts` fails on trails a7270c9:

    const rfc = await Rfc.findBy({ id: "0136-trailmap" });
    await rfc.stories.toArray();   // Story never touched directly in this worker
    // SqliteError: near "FROM": syntax error
    // SELECT FROM "stories" WHERE "stories"."rfc_id" = ?

A has_many read whose target class was never reflected builds its projection
from an empty column list. The same shape hits ActiveStorage's `Blob` on attach
("can't write unknown attribute `key`").

Expected (Rails): the association scope is `SELECT "stories".*`. Column
reflection happens lazily on first use (`load_schema!` from `columns_hash`), and
nothing requires a warm-up.

## Acceptance criteria

- An activerecord test: a has_many read is the first touch of a cold target, and it returns rows.
- Creating a cold model through an association (`attach`, `create`) assigns attributes without UnknownAttribute.
- trailmap can then delete `loadModelSchemas` and its callers (trailmap story `declare-the-tasks-database-in-config-database` acceptance 4).
