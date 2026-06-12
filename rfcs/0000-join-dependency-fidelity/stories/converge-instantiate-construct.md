---
title: "Converge instantiateFromRows/_constructRecursive to Rails' instantiate/construct"
status: draft
updated: 2026-06-12
rfc: "0000-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-join-constraints-references"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
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

- [ ] Instantiation methods correspond one-to-one with Rails' instantiate/construct/construct_model.
- [ ] Eager-load instantiation tests (incl. STI and duplicate-row cases) pass unchanged.
- [ ] File holds no port-only members except those the audit verdicted must-stay.
- [ ] Diff under the 500 LOC ceiling.
