---
title: "Converge alias handling to the AliasTracker + Aliases pair"
status: done
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-tree-construction-make-tree"]
deps-rfc: []
est-loc: 400
priority: null
pr: 3238
claim: "2026-06-14T02:18:35Z"
assignee: "converge-alias-tracking"
blocked-by: null
---

## Context

Drop the `_arelTablesByIndex` map, `_aliases: AliasMap[]` array, and
manual `_baseTableIndex`/`_nextTableIndex` counters in favor of Rails' model:
`AliasTracker` (which `associations/alias-tracker.ts` already ports, see
PR #3145) owns table aliasing during construction, and the `Aliases` value object
owns column-alias lookup for instantiation.

## Acceptance criteria

- [x] Table aliasing flows only through AliasTracker; column aliases only through Aliases; the index-keyed maps and counters are deleted. (Residual: the non-through self-join collision branch still emits `t{tableIndex}` as the SQL alias — tracked by converge-collision-alias-naming.)
- [x] Sibling/self-join alias tests (#3145 coverage) pass unchanged.
- [x] Diff under the 500 LOC ceiling.
