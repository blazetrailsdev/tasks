---
title: "Converge 'merging an empty hash into a relation' test to merge {} not a Relation"
status: done
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 4567
claim: "2026-07-04T19:47:07Z"
assignee: "converge-merge-empty-hash-test"
blocked-by: null
closed-reason: null
---

## Context

Rails `relation_test.rb:160-162` "merging an empty hash into a relation" asserts
`Relation.new(FakeKlass).merge({}).where_clause == Relation::WhereClause.empty` —
i.e. it merges an **empty hash** (`{}`) through `HashMerger`/`buildOther` and
checks the where clause stays empty. trails' like-named test
(`packages/activerecord/src/relation.test.ts`) instead merges a **Relation**
(`base.merge(CanonPost.all())`) and only asserts the SQL contains `SELECT`, so
it does not actually exercise the empty-hash `HashMerger` path the Rails test
targets.

Now that `HashMerger` routes an empty hash through `buildOther()` →
`this.relation._newRelation()` → `Merger` (PR #4561), the trails test can and
should mirror Rails: merge `{}` and assert the where clause is unchanged/empty.

Surfaced by PR #4561 (merge-hash-value-methods-key-validation).

## Acceptance criteria

- [ ] Converge "merging an empty hash into a relation" to merge an empty hash
      (`{}`) rather than a Relation, asserting the merged where clause is empty
      (mirroring `relation_test.rb:160-162`).
- [ ] Do NOT rename the test.
- [ ] No regression in the surrounding merge suite.
