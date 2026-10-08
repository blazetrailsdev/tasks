---
title: "render treats a plain array as a collection, as Rails does"
status: draft
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`collectionFromObject` (`packages/actionview/src/renderer/renderer.ts:134-143`)
treats an object as a collection only if it has a `toAry` function. A plain
JavaScript `Array` has none, so `render({ partial: [a, b] })`, and so
`render(records)` with an array of records, falls through to
`ObjectRenderer#renderObjectDerivePartial` and raises

    '[...]' is not an ActiveModel-compatible object. It must implement #to_partial_path.

Seen while writing the record-partial test in trails#8670
(`packages/actionview/src/renderer/partial-renderer.trails.test.ts`), which had
to wrap its array as `{ toAry: () => [...] }`.

Rails: `actionview/lib/action_view/renderer/renderer.rb:103-105`

    def collection_from_object(object)
      object if object.respond_to?(:to_ary)
    end

`Array` responds to `to_ary`, so in Rails an array is a collection. The
converged shape is to ask through the Ruby-shaped predicate the rest of the
renderer uses (`rbObjRespondTo(object, "toAry")` from `@blazetrails/ruby-compat`,
if it answers true for an `Array`; otherwise `Array.isArray(object) ||`) and
return the array itself.

## Acceptance criteria

- `render({ partial: [recordA, recordB] })` renders each record's derived
  partial, as a relation does today.
- An empty array renders as an empty collection (Rails returns `nil` from
  `render` for one), not as an object.
- The test in `partial-renderer.trails.test.ts` passes a plain array.
