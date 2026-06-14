---
title: "Converge instantiateFromRows/_constructRecursive to Rails' instantiate/construct"
status: in-progress
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-join-constraints-references"]
deps-rfc: []
est-loc: 450
priority: null
pr: 3272
claim: "2026-06-14T18:06:34Z"
assignee: "converge-instantiate-construct"
blocked-by: null
---

## Context

Converge row instantiation to Rails' shape: `instantiate(result_set,
strict_loading_value)` grouping rows by the base keys, `construct` walking
node children against `column_aliases`, `construct_model` building each
record. The TS `instantiateFromRows` + `_constructRecursive` +
`applyColumnAliases` trio should match method-for-method so future Rails
fixes port line-wise. Closes out the RFC; after this story the file should
hold no methods without a Rails counterpart (audit-verified).

## Acceptance criteria

- [x] Instantiation methods correspond one-to-one with Rails' instantiate/construct/construct_model.
- [x] Eager-load instantiation tests (incl. STI and duplicate-row cases) pass unchanged.
- [x] File holds no port-only members except those the audit verdicted must-stay.
- [x] Diff under the 500 LOC ceiling.
