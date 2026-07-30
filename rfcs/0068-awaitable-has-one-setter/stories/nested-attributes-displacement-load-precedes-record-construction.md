---
title: "Nested-attributes displacement SELECT is issued before build_record, not after"
status: done
updated: 2026-07-30
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5642
claim: "2026-07-30T14:20:20Z"
assignee: "nested-attributes-displacement-load-precedes-record-construction"
blocked-by: null
closed-reason: null
---

## Context

PR #5456 made the nested-attributes writer issue Rails' leading `load_target`
for an unloaded has*one (`HasOneAssociation#detachDisplacedForSyncBuild`,
`packages/activerecord/src/associations/has-one-association.ts`). It is called
from `assignNestedAttributesForOneToOneAssociation`
(`packages/activerecord/src/nested-attributes.ts`) \_before*
`assoc.build(assignable)`.

Rails' order is the reverse: `SingularAssociation#build` is `record =
build_record(attributes, &block); set_new_record(record)`
(`vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:29-33`),
and only `set_new_record` -> `replace(record, false)` reaches `load_target`
(`has_one_association.rb:59-62`). So in Rails a build that raises (a bad
attribute) never issues the displacement SELECT.

trails cannot simply move the call after `build`: the load is gated on
`needsTargetLoadForBuild()` (Rails' `find_target?`), and `build` marks the
association loaded, so the decision is no longer observable post-build. The
deviation is documented at the call site in nested-attributes.ts.

The residual window is narrow — `assertNestedAttributesAreKnown` already raises
earlier for unknown-attribute errors on this path — but it is a real ordering
divergence, and the sibling direct-build path pins the Rails order with
`"raises from the record construction before issuing the displacement query"`
in `has-one-sync-build-displacement.trails.test.ts`.

## Acceptance criteria

- [ ] The nested-attributes writer issues the displacement SELECT only after the
      record is constructed, matching `build_record` -> `set_new_record` ->
      `load_target`, e.g. by capturing the `find_target?` decision before the
      build and issuing the query after it.
- [ ] A build that raises on this path issues no displacement query and detaches
      no row (regression test, verified failing on the pre-fix baseline).
- [ ] The call-site deviation note in `nested-attributes.ts` is removed once the
      order converges.
