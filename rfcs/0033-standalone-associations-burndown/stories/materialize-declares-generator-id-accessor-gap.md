---
title: "Generator: stop emitting declare id that collides with Base#id accessor (TS2610)"
status: ready
updated: 2026-06-26
rfc: "0033-standalone-associations-burndown"
cluster: null
deps:
  - association-scope-test-canonical
  - timestamp-test-cluster
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Discovered while baking nested-class declares (PR #4119,
materialize-declares-nested-remaining-bakes). The generator
`packages/activerecord/scripts/materialize-model-declares.ts` synthesizes a
`declare id: number;` member for any nested test-model class that calls
`this.attribute("id", "integer")`. That collides with `Base`'s `id`
**accessor** (getter/setter), producing TS2610:

'id' is defined as an accessor in class 'Base', but is overridden here in
'<Class>' as an instance property.

Verified on `src/timestamp.test.ts` (5 classes) and
`src/associations/association-scope.test.ts` (19 classes). This gap blocks
most of the remaining files listed in
`materialize-declares-nested-remaining-bakes` — only the two files with no
`id`-declaring nested classes (transaction-callbacks.test.ts,
test-fixtures.ts) could be baked.

The seven files baked in PR #4036 happened to contain no nested class that
declares `id`, so the gap was not surfaced until now.

## Acceptance criteria

- [ ] Generator no longer emits a `declare id` member that collides with
      `Base`'s `id` accessor (e.g. skip `id` / primary-key columns already
      provided by `Base`, or emit in an accessor-compatible form). Decide
      against the Rails/trails `Base#id` accessor definition.
- [ ] Re-baking `timestamp.test.ts` and
      `associations/association-scope.test.ts` produces TS2610-free output;
      `pnpm typecheck` green.
- [ ] No phantom canonical columns (out-of-MODELS_DIR no-schema-merge path
      preserved).
