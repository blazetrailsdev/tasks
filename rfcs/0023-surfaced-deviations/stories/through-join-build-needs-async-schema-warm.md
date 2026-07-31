---
title: "Through join-row build needs an async schema warm before construction"
status: draft
updated: 2026-07-31
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Through join-row build needs an async schema warm before construction

## Context

Surfaced by `route-through-collection-writes-onto-association-insert-record`
(PR #5751).

`save_through_record` (`has_many_through_association.rb:78-83`) calls
`build_through_record`, which constructs the join row synchronously. Ruby
reflects a model's columns lazily on first attribute access, so this is free
there. trails' reflection is async, so a join model whose columns have not been
reflected yet raises `UnknownAttributeError` the moment the FK is assigned.

This is reachable today: the HABTM "alternate database" test
(`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`,
`"alternate database"`) uses a join model on a secondary connection that nothing
has reflected by the time the push runs. PR #5751 added an inline
`await throughKlass.ensureSchemaLoaded()` at the top of `saveThroughRecord`
(`packages/activerecord/src/associations/has-many-through-association.ts`) to
unblock it. That is a trails-only wait with no Rails counterpart.

The deviation is contained and justified at the call site, but it is a symptom
of a wider seam: any _synchronous_ record construction reached from an async
association path has the same exposure, and each site fixes it locally. Worth a
look at whether the warm belongs at a single chokepoint (association
construction, or `build_record`) rather than per-call-site.

## Acceptance criteria

- [ ] Audit the sync-construction sites reachable from async association writes
      that assume a reflected schema (`build_through_record`, `buildRecord`,
      `build_habtm_through_record`, the nested-attributes build path).
- [ ] Decide between one chokepoint warm and the current per-site waits, and
      record the decision.
- [ ] If a chokepoint is chosen, the `saveThroughRecord` inline
      `ensureSchemaLoaded` collapses into it.
- [ ] The HABTM "alternate database" test stays green either way.
