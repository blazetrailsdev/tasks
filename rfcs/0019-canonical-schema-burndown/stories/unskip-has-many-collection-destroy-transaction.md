---
title: "Unskip has-many transaction-when-deleting-persisted test"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps:
  - collection-proxy-destroy-transaction
deps-rfc: []
est-loc: 10
priority: 3
pr: 4225
claim: "2026-06-28T16:41:57Z"
assignee: "unskip-has-many-collection-destroy-transaction"
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
