---
title: "materialize-declares-generator-fk-primarykeyvalue-gap"
status: claimed
updated: 2026-07-04
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-04T16:34:29Z"
assignee: "materialize-declares-generator-fk-primarykeyvalue-gap"
blocked-by: null
---

## Context

`materialize-model-declares.ts` emits FK column declares typed as
`number | null` (e.g. `declare club_id: number | null`), but test code
assigns another model's `.id` accessor to that FK, e.g.
`membership.club_id = club2.id` in
`packages/activerecord/src/associations/has-one-through-associations.test.ts`
(tests "reassigning has one through" ~line 1235 and one near ~line 1682).
`.id` returns the `PrimaryKeyValue` union (which includes `undefined`), so the
baked declare fails `pnpm typecheck`:

```text
TS2322: Type 'PrimaryKeyValue' is not assignable to type 'number | null'.
  Type 'undefined' is not assignable to type 'number | null'.
```

Pre-bake the FK had no declared type so the assignment type-checked; the
generator made it stricter and now legitimate code fails. Same TS2322 family
as the deferred files in `materialize-declares-nested-generator-gaps` (PR
4115). Discovered in `materialize-declares-nested-remaining-bakes-followup`,
which baked the other clean small files and skipped this one.

## Acceptance criteria

- [ ] Generator-emitted FK declares accommodate assignment from a model `.id`
      (`PrimaryKeyValue`) accessor, OR the generator widens/casts appropriately
      so baked FK declares typecheck-green against real test assignments.
- [ ] `has-one-through-associations.test.ts` (+252 generated) bakes
      typecheck-green and its suite passes.
