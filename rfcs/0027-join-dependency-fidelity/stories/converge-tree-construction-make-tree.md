---
title: "Converge tree construction to Rails' build-once make_tree/walk_tree"
status: draft
updated: 2026-06-12
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["audit-join-dependency-rails-mapping"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Replace the incremental `addAssociation`/`addNestedAssociation`
mutation model and its `_treeNodesByPath` path registry +
`_snapshotTree`/`_restoreTree` machinery with Rails' build-once construction:
`make_tree`/`walk_tree` produce the hash tree, the constructor builds the full
`JoinAssociation` tree from it once. The TS statics `makeTree`/`walkTree`
already exist — the work is making them the only construction path.

## Acceptance criteria

- [ ] JoinDependency is constructed once from a make_tree-style spec; `_treeNodesByPath`, `_snapshotTree`, and `_restoreTree` are deleted.
- [ ] All join/eager-load/includes tests pass unchanged (names untouched).
- [ ] Diff under the 500 LOC ceiling.
