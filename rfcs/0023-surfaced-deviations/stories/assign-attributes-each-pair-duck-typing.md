---
title: "assignAttributes guard should reject non-each_pair objects (Date/Time), not just non-object/array"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 4529
claim: "2026-07-04T00:43:12Z"
assignee: "assign-attributes-each-pair-duck-typing"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during `instance-update-nil-raises-argumenterror` (PR #4524).

Rails' `ActiveModel::AttributeAssignment#assign_attributes`
(vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:29-30)
guards with `respond_to?(:each_pair)` — so a `Date`, `Time`, custom `Struct`,
or any non-Hash-like object raises `ArgumentError`. Only Hash and things that
duck-type `each_pair` (e.g. `ActionController::Parameters`) pass.

trails' shared guard `assertHashAttributes`
(packages/activemodel/src/attribute-assignment.ts) approximates this with
"any non-null, non-array object", which is broader: a `Date` instance
duck-types past the guard and then no-ops via `Object.keys(date) → {}`
instead of raising `ArgumentError`. The gap is documented inline on
`assertHashAttributes` but not yet closed.

## Acceptance criteria

- [ ] `assertHashAttributes` rejects non-plain objects (Date/Time/Map/Set/
      class instances without hash semantics) the way Rails rejects anything
      not responding to `each_pair`, while still accepting plain objects and
      permitted params-style objects (`permitted?`/`toH`).
- [ ] All three call sites (Model#assignAttributes, activemodel
      assignAttributes, AR update/update!/assignAttributes) inherit the
      tightened check via the shared helper.
- [ ] Add a test passing a `Date` (or similar) that asserts `ArgumentError`.
- [ ] Remove the deferred-gap NOTE comment on `assertHashAttributes`.
