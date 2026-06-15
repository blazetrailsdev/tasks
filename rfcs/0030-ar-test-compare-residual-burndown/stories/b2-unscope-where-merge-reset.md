---
title: "merge of unscope(where) clears where clause"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Rails `test_unscope_merging`
is ported but skipped ("unscope merging") in
`packages/activerecord/src/scoping/default-scoping.test.ts`.

Merging an `unscope("where")` relation does not clear the accumulated where
clause: `Developer.where({name:"Jamis"}).merge(Developer.unscope("where"))`
should leave `whereClause` empty, but it stays populated. Rails' WhereClause
merge treats the unscoped side as resetting predicates.

## Acceptance criteria

- [ ] After merging an `unscope("where")` relation, `_whereClause.isEmpty()` is true; a later `.where(...)` repopulates it.
- [ ] Un-skip "unscope merging" in default-scoping.test.ts; it passes on sqlite.
