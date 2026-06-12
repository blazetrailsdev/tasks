---
title: "Audit: map every TS JoinDependency member to its Rails counterpart"
status: draft
updated: 2026-06-12
rfc: "0000-join-dependency-fidelity"
cluster: join-dependency
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

First, gating story of the RFC. Produce a method-by-method and
field-by-field mapping of `associations/join-dependency.ts` (the
`JoinDependency`, `Aliases`, and `JoinLeaf` members) to
`activerecord/lib/active_record/associations/join_dependency.rb`, classifying
each as: faithful port / renamed equivalent / port-only-load-bearing /
port-only-vestigial. For port-only members (`_treeNodesByPath`,
`_snapshotTree`/`_restoreTree`, `_arelTablesByIndex`,
`setReferences`/`rebindTableReferences`, `addAssociationSpec`/`_walkSpec`/
`eagerSpecToTree`), document why they exist and whether Rails' shape can
absorb their responsibility. Write the target design into the RFC's Design
section and resolve its open questions, including the stop-or-go call on
stories 2–5.

## Acceptance criteria

- [ ] Mapping table committed to the RFC (or a linked audit report) covering every public and private member of the three classes.
- [ ] Each port-only member has a written verdict: absorbable into Rails' shape, must stay (with reason), or vestigial (deletable).
- [ ] RFC Design section updated with the target shape; stop-or-go decision recorded for stories 2–5.
- [ ] No production code changes (spike/audit story — done when closed).
