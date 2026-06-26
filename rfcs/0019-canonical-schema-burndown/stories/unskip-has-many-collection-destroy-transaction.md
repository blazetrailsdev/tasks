---
title: "Unskip has-many transaction-when-deleting-persisted test"
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

`associations/has-many-associations.test.ts` test
`transaction when deleting persisted` is `it.skip` because
`CollectionProxy#destroy` lacks Rails' transaction wrapper (impl story
collection-proxy-destroy-transaction). Once that ships, un-skip and verify.

## Acceptance criteria

- [ ] Remove `it.skip` → `it` for `transaction when deleting persisted`.
- [ ] Test passes on sqlite (reload returns both clients after the rolled-back
      destroy batch).
