---
title: "Converge alias handling to the AliasTracker + Aliases pair"
status: draft
updated: 2026-06-12
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-tree-construction-make-tree"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Drop the `_arelTablesByIndex` map, `_aliases: AliasMap[]` array, and
manual `_baseTableIndex`/`_nextTableIndex` counters in favor of Rails' model:
`AliasTracker` (which `associations/alias-tracker.ts` already ports, see
PR #3145) owns table aliasing during construction, and the `Aliases` value object
owns column-alias lookup for instantiation.

## Acceptance criteria

- [ ] Table aliasing flows only through AliasTracker; column aliases only through Aliases; the index-keyed maps and counters are deleted.
- [ ] Sibling/self-join alias tests (#3145 coverage) pass unchanged.
- [ ] Diff under the 500 LOC ceiling.
