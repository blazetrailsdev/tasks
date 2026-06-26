---
title: "Unskip AsyncHasManyAssociationsTest async-load-has-many test"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`associations/has-many-associations.test.ts` test `async load has many`
(AsyncHasManyAssociationsTest) is `it.skip` pending impl story
assoc-async-load-target-shares-proxy-state. Once that ships, un-skip and verify.

## Acceptance criteria

- [ ] Remove `it.skip` → `it` for `async load has many`.
- [ ] Test passes on sqlite (size 3, clients[2] reachable under assertNoQueries).
