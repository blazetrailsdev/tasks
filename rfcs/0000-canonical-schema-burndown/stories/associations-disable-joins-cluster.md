---
title: "disable-joins association family → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-collection-cluster"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the disable-joins association files (RFC §Rollout phase 3). Depends on
`associations-collection-cluster` for shared canonical association models.

Files (remove each from the exclude JSON as it lands):

- `associations/disable-joins-association-scope.test.ts`
- `associations/disable-joins-composite-key.test.ts`
- `associations/disable-joins-composite-nested.test.ts`
- `associations/disable-joins-nested-through.test.ts`
- `associations/disable-joins-polymorphic-nonid-pk.test.ts`
- `associations/disable-joins-routing-widening.test.ts`
- `associations/cp-count-disable-joins-through.test.ts`

Rails counterpart: the disable-joins cases scattered across the association
suites.

> `associations/has-many-through-disable-joins-associations.test.ts` is **not** in
> this cluster — it is blocked on framework gaps and owned by its own story,
> [hmt-disable-joins-conversion](hmt-disable-joins-conversion.md), so the seven
> files above stay cleanly claimable.

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.
