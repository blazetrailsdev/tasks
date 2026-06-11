---
title: "association-scope-alias-tracker.test.ts → canonical (self-ref off synthetic at_users)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the blocked `associations-scope-cache-cluster`.
`associations/association-scope-alias-tracker.test.ts` exercises the internal
`AliasTracker` repeat-visit aliasing via a self-referential `at_users` table
(`hasMany children` + `hasMany grandchildren through children`). No dedicated
Rails file.

Blocker: `at_users` is synthetic. To ride canonical, re-express the
self-referential chain on an existing canonical self-referential table —
candidates: `nodes` (has `node_id`), `trees`, or a canonical model that already
declares a self-join — so the same bare-then-aliased repeat-visit branch in
`getChain`/`aliasedTableFor` is exercised. Verify the chosen table actually
triggers the repeat-visit alias path before porting. `eslint-disable` is not
acceptable.

## Acceptance criteria

- [ ] Rides a canonical self-referential table/model with no `at_users` and no
      `eslint-disable`.
- [ ] AliasTracker repeat-visit / thunk-invocation assertions preserved; test
      names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
