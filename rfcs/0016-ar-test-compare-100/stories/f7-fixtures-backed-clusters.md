---
title: "F-7 — fixtures-backed clusters"
status: claimed
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: clusters
deps: ["i1-schema-dumper-columnspec-u3"]
deps-rfc: []
est-loc: 200
pr: null
claim: "2026-06-10T12:01:40Z"
assignee: "f7-fixtures-backed-clusters"
blocked-by: null
---

## Context

`adapter_test.rb` (51 skips) in sub-clusters: **fixture (~20)** — needs
accounts/posts/subscribers/authors/Event/Book fixtures in `adapter.test.ts`;
**schema (~6)** — exception-translation, remove-index wrong-column-name;
**comment (17)** — gated on I-1 (`columnSpec`); adapter-mysql/pg/transactions
sub-clusters → Phase 3 / F-4.
`has_one_through_associations_test.rb` (11) fixture-gated.

## Acceptance criteria

- [ ] fixture + schema sub-clusters (~26) un-skipped first.
- [ ] comment cluster (17) un-skipped after I-1 lands.
- [ ] `has_one_through_associations_test.rb` fixture skips (~11) un-skipped.

## Notes

Ours: `adapter.test.ts`, `associations/has-one-through-associations.test.ts`.
Rails: `test/cases/adapter_test.rb`,
`test/cases/associations/has_one_through_associations_test.rb`.
